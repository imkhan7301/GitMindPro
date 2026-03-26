import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AnalysisResult, PRReviewResult, SavedAnalysis, SavedPRReview, Scorecard, Workspace, WorkspaceInvitation, WorkspaceMember, ExpertProfile, ConsultationRequest, ConsultationServiceType } from '../types';

// Fallback values are anon/public and keep auth working if a deployment misses env injection.
const fallbackSupabaseUrl = 'https://kkdgrbixapjlpynuulie.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZGdyYml4YXBqbHB5bnV1bGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTI2OTEsImV4cCI6MjA4NjYyODY5MX0.ciQ8xgd2jyAD-n1laZ9YM0QRjLPxgzyqQXjUT6G5osw';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || fallbackSupabaseUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || fallbackSupabaseAnonKey;

let client: SupabaseClient | null = null;

const isConfigured = (): boolean => Boolean(supabaseUrl && supabaseAnonKey);

const getClient = (): SupabaseClient => {
  if (!isConfigured()) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  if (!client) {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return client;
};

export const isAuthConfigured = (): boolean => isConfigured();

export const signInWithGitHub = async (): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    throw new Error(`GitHub sign-in failed: ${error.message}`);
  }
};

export const signOutAuth = async (): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Sign-out failed: ${error.message}`);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = getClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`Failed to fetch session user: ${error.message}`);
  }
  return data.user ?? null;
};

export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  const supabase = getClient();
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
};

export const ensureUserProfile = async (user: User): Promise<void> => {
  const supabase = getClient();
  const githubLogin = (user.user_metadata?.user_name || user.user_metadata?.preferred_username || null) as string | null;
  const fullName = (user.user_metadata?.full_name || user.user_metadata?.name || null) as string | null;
  const avatarUrl = (user.user_metadata?.avatar_url || null) as string | null;

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      github_login: githubLogin,
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(`Failed to sync profile: ${error.message}`);
  }
};

const slugifyWorkspace = (name: string): string => (
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
);

const buildUniqueSlug = (name: string): string => {
  const base = slugifyWorkspace(name) || 'workspace';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
};

export const ensurePersonalWorkspace = async (user: User): Promise<string> => {
  const supabase = getClient();

  const { data: existingMemberships, error: selectError } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations!inner(id, is_personal, created_by)')
    .eq('user_id', user.id);

  if (selectError) {
    throw new Error(`Failed to load workspaces: ${selectError.message}`);
  }

  const personalOrg = (existingMemberships || []).find((row: any) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    return org?.is_personal === true;
  });

  if (personalOrg?.organization_id) {
    return personalOrg.organization_id as string;
  }

  const personalName = user.user_metadata?.user_name
    ? `${user.user_metadata.user_name}'s Workspace`
    : `${user.email?.split('@')[0] || 'My'} Workspace`;

  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: personalName,
      slug: buildUniqueSlug(personalName),
      created_by: user.id,
      is_personal: true,
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (orgError || !orgData?.id) {
    throw new Error(`Failed to create personal workspace: ${orgError?.message || 'unknown error'}`);
  }

  const { error: membershipError } = await supabase.from('organization_memberships').insert({
    organization_id: orgData.id,
    user_id: user.id,
    role: 'owner'
  });

  if (membershipError) {
    throw new Error(`Failed to create membership: ${membershipError.message}`);
  }

  return orgData.id as string;
};

export const listUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('organization_memberships')
    .select('role, organizations!inner(id, name, slug, is_personal, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true, foreignTable: 'organizations' });

  if (error) {
    throw new Error(`Failed to load workspaces: ${error.message}`);
  }

  const rows = (data || []) as any[];
  return rows
    .map((row) => {
      const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      if (!org?.id) return null;
      return {
        id: org.id as string,
        name: org.name as string,
        slug: org.slug as string,
        role: row.role as Workspace['role'],
        isPersonal: Boolean(org.is_personal)
      };
    })
    .filter(Boolean) as Workspace[];
};

export const createWorkspace = async (user: User, name: string): Promise<Workspace> => {
  const supabase = getClient();
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Workspace name is required.');
  }

  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: cleanName,
      slug: buildUniqueSlug(cleanName),
      created_by: user.id,
      is_personal: false,
      updated_at: new Date().toISOString()
    })
    .select('id, name, slug, is_personal')
    .single();

  if (orgError || !orgData?.id) {
    throw new Error(`Failed to create workspace: ${orgError?.message || 'unknown error'}`);
  }

  const { error: membershipError } = await supabase.from('organization_memberships').insert({
    organization_id: orgData.id,
    user_id: user.id,
    role: 'owner'
  });

  if (membershipError) {
    throw new Error(`Failed to add workspace owner: ${membershipError.message}`);
  }

  return {
    id: orgData.id as string,
    name: orgData.name as string,
    slug: orgData.slug as string,
    role: 'owner',
    isPersonal: Boolean(orgData.is_personal)
  };
};

export const listWorkspaceMembers = async (organizationId: string): Promise<WorkspaceMember[]> => {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('organization_memberships')
    .select('role, profiles!inner(id, email, github_login, full_name)')
    .eq('organization_id', organizationId)
    .order('role', { ascending: true });

  if (error) {
    throw new Error(`Failed to load workspace members: ${error.message}`);
  }

  return ((data || []) as any[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: profile.id as string,
      email: (profile.email ?? null) as string | null,
      githubLogin: (profile.github_login ?? null) as string | null,
      fullName: (profile.full_name ?? null) as string | null,
      role: row.role as WorkspaceMember['role']
    };
  });
};

export const createWorkspaceInvitation = async (params: {
  organizationId: string;
  invitedEmail: string;
  role: 'admin' | 'member';
  createdBy: string;
}): Promise<WorkspaceInvitation> => {
  const supabase = getClient();
  const cleanEmail = params.invitedEmail.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Invite email is required.');
  }

  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      organization_id: params.organizationId,
      invited_email: cleanEmail,
      role: params.role,
      created_by: params.createdBy
    })
    .select('id, organization_id, invited_email, role, token, expires_at')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create invitation: ${error?.message || 'unknown error'}`);
  }

  return {
    id: data.id as string,
    organizationId: data.organization_id as string,
    invitedEmail: data.invited_email as string,
    role: data.role as WorkspaceInvitation['role'],
    token: data.token as string,
    expiresAt: data.expires_at as string
  };
};

export const acceptWorkspaceInvitation = async (user: User, token: string): Promise<string> => {
  const supabase = getClient();
  const cleanToken = token.trim().toLowerCase();
  if (!cleanToken) {
    throw new Error('Invite code is required.');
  }

  const { data: invite, error: inviteError } = await supabase
    .from('workspace_invitations')
    .select('id, organization_id, invited_email, role, accepted_at, expires_at')
    .eq('token', cleanToken)
    .single();

  if (inviteError || !invite) {
    throw new Error('Invite code not found or not accessible for your account.');
  }

  if (invite.accepted_at) {
    throw new Error('This invite has already been used.');
  }

  if (new Date(invite.expires_at as string).getTime() < Date.now()) {
    throw new Error('This invite has expired.');
  }

  if ((invite.invited_email as string).toLowerCase() !== (user.email || '').toLowerCase()) {
    throw new Error('This invite was created for a different email address.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('organization_id', invite.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Failed to check membership: ${membershipError.message}`);
  }

  if (!membership) {
    const { error: insertError } = await supabase.from('organization_memberships').insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role
    });

    if (insertError) {
      throw new Error(`Failed to join workspace: ${insertError.message}`);
    }
  }

  const { error: acceptError } = await supabase
    .from('workspace_invitations')
    .update({
      accepted_by: user.id,
      accepted_at: new Date().toISOString()
    })
    .eq('id', invite.id);

  if (acceptError) {
    throw new Error(`Failed to mark invite as accepted: ${acceptError.message}`);
  }

  return invite.organization_id as string;
};

export const getDailyAnalysisCount = async (userId: string): Promise<number> => {
  const supabase = getClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString());

  if (error) {
    throw new Error(`Failed to check daily usage: ${error.message}`);
  }

  return count ?? 0;
};

export const canAnalyzeToday = async (
  userId: string,
  dailyLimit: number = 3
): Promise<{ allowed: boolean; usedToday: number; limit: number }> => {
  const usedToday = await getDailyAnalysisCount(userId);
  return {
    allowed: usedToday < dailyLimit,
    usedToday,
    limit: dailyLimit
  };
};

export const saveAnalysisRecord = async (params: {
  userId: string;
  organizationId?: string | null;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  analysis: AnalysisResult;
}): Promise<void> => {
  const supabase = getClient();

  const { error } = await supabase.from('analyses').insert({
    user_id: params.userId,
    organization_id: params.organizationId ?? null,
    repo_owner: params.repoOwner,
    repo_name: params.repoName,
    repo_url: params.repoUrl,
    summary: params.analysis.summary,
    tech_stack: params.analysis.techStack,
    scorecard: params.analysis.scorecard,
    raw_analysis: params.analysis
  });

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`);
  }
};

export const getGitHubOrganizations = async (accessToken: string): Promise<Array<{ login: string; avatar_url: string }>> => {
  try {
    const response = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub orgs: ${response.statusText}`);
    }

    return (await response.json()) as Array<{ login: string; avatar_url: string }>;
  } catch (err) {
    console.error('GitHub org fetch failed:', err);
    return [];
  }
};

export const getAnalysisHistory = async (params: {
  userId: string;
  organizationId?: string | null;
  limit?: number;
}): Promise<SavedAnalysis[]> => {
  const supabase = getClient();
  const pageSize = params.limit ?? 20;

  let query = supabase
    .from('analyses')
    .select('id, repo_owner, repo_name, repo_url, summary, tech_stack, scorecard, created_at')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (params.organizationId) {
    query = query.eq('organization_id', params.organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load analysis history: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    repoOwner: row.repo_owner as string,
    repoName: row.repo_name as string,
    repoUrl: row.repo_url as string,
    summary: (row.summary ?? '') as string,
    techStack: (row.tech_stack ?? []) as string[],
    scorecard: row.scorecard as SavedAnalysis['scorecard'],
    createdAt: row.created_at as string,
  }));
};

/** Fetch a single analysis row with full raw_analysis for rehydration. */
export const getAnalysisRaw = async (analysisId: string): Promise<{ rawAnalysis: AnalysisResult; repoUrl: string } | null> => {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('analyses')
    .select('raw_analysis, repo_url')
    .eq('id', analysisId)
    .single();

  if (error || !data?.raw_analysis) return null;
  return { rawAnalysis: data.raw_analysis as unknown as AnalysisResult, repoUrl: data.repo_url as string };
};

export const savePRReview = async (params: {
  userId: string;
  organizationId?: string | null;
  repoOwner: string;
  repoName: string;
  prNumber: number;
  prTitle: string;
  fileCount: number;
  review: PRReviewResult;
}): Promise<void> => {
  const supabase = getClient();

  const { error } = await supabase.from('pr_reviews').insert({
    user_id: params.userId,
    organization_id: params.organizationId ?? null,
    repo_owner: params.repoOwner,
    repo_name: params.repoName,
    pr_number: params.prNumber,
    pr_title: params.prTitle,
    file_count: params.fileCount,
    risk_level: params.review.riskLevel,
    review_result: params.review
  });

  if (error) {
    throw new Error(`Failed to save PR review: ${error.message}`);
  }
};

export const getPRReviewHistory = async (params: {
  userId: string;
  organizationId?: string | null;
  limit?: number;
}): Promise<SavedPRReview[]> => {
  const supabase = getClient();
  const pageSize = params.limit ?? 20;

  let query = supabase
    .from('pr_reviews')
    .select('id, repo_owner, repo_name, pr_number, pr_title, file_count, risk_level, created_at')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (params.organizationId) {
    query = query.eq('organization_id', params.organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load PR review history: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    repoOwner: row.repo_owner as string,
    repoName: row.repo_name as string,
    prNumber: row.pr_number as number,
    prTitle: row.pr_title as string,
    fileCount: row.file_count as number,
    riskLevel: row.risk_level as SavedPRReview['riskLevel'],
    createdAt: row.created_at as string,
  }));
};

export interface SubscriptionRow {
  plan: 'free' | 'pro' | 'team';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
}

export async function getUserSubscription(userId: string): Promise<SubscriptionRow | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as SubscriptionRow;
}

// --- Shareable analysis links ---

export const toggleAnalysisPublic = async (analysisId: string, isPublic: boolean): Promise<string | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('analyses')
    .update({ is_public: isPublic })
    .eq('id', analysisId)
    .select('share_token')
    .single();

  if (error) throw new Error(`Failed to update share status: ${error.message}`);
  return isPublic ? (data?.share_token as string) || null : null;
};

export const getPublicAnalysis = async (shareToken: string): Promise<{
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  summary: string;
  techStack: string[];
  scorecard: Scorecard;
  rawAnalysis: AnalysisResult;
  createdAt: string;
} | null> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('repo_owner, repo_name, repo_url, summary, tech_stack, scorecard, raw_analysis, created_at')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .single();

  if (error || !data) return null;
  return {
    repoOwner: data.repo_owner as string,
    repoName: data.repo_name as string,
    repoUrl: data.repo_url as string,
    summary: (data.summary ?? '') as string,
    techStack: (data.tech_stack ?? []) as string[],
    scorecard: data.scorecard as Scorecard,
    rawAnalysis: data.raw_analysis as AnalysisResult,
    createdAt: data.created_at as string,
  };
};

export const saveAnalysisRecordReturningId = async (params: {
  userId: string;
  organizationId?: string | null;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  analysis: AnalysisResult;
}): Promise<{ id: string; shareToken: string }> => {
  const supabase = getClient();

  const { data, error } = await supabase.from('analyses').insert({
    user_id: params.userId,
    organization_id: params.organizationId ?? null,
    repo_owner: params.repoOwner,
    repo_name: params.repoName,
    repo_url: params.repoUrl,
    summary: params.analysis.summary,
    tech_stack: params.analysis.techStack,
    scorecard: params.analysis.scorecard,
    raw_analysis: params.analysis,
  }).select('id, share_token').single();

  if (error || !data) throw new Error(`Failed to save analysis: ${error?.message || 'Unknown error'}`);
  return { id: String(data.id), shareToken: data.share_token as string };
};

// ─── Referral System ─────────────────────────────────────────────────

export const getOrCreateReferralCode = async (userId: string): Promise<string> => {
  const supabase = getClient();

  // Check if user already has a referral code (where no one has redeemed it yet — the "template" row)
  const { data: existing } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_id', userId)
    .limit(1)
    .single();

  if (existing?.referral_code) return existing.referral_code;

  // Create new referral row
  const { data, error } = await supabase
    .from('referrals')
    .insert({ referrer_id: userId })
    .select('referral_code')
    .single();

  if (error || !data) throw new Error(`Failed to create referral code: ${error?.message || 'Unknown error'}`);
  return data.referral_code as string;
};

export const getReferralStats = async (userId: string): Promise<{ count: number; daysEarned: number }> => {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('referrals')
    .select('id, bonus_days, redeemed_at')
    .eq('referrer_id', userId)
    .not('referred_user_id', 'is', null);

  if (error) return { count: 0, daysEarned: 0 };
  const redeemed = (data || []).filter((r: { redeemed_at: string | null }) => r.redeemed_at);
  return {
    count: redeemed.length,
    daysEarned: redeemed.reduce((sum: number, r: { bonus_days: number }) => sum + (r.bonus_days || 7), 0),
  };
};

// ─── Expert Marketplace ──────────────────────────────────────────

const mapExpertRow = (row: Record<string, unknown>): ExpertProfile => ({
  id: row.id as string,
  userId: row.user_id as string,
  headline: (row.headline ?? '') as string,
  bio: (row.bio ?? '') as string,
  skills: (row.skills ?? []) as string[],
  hourlyRate: (row.hourly_rate ?? 0) as number,
  currency: (row.currency ?? 'USD') as string,
  availability: (row.availability ?? 'available') as ExpertProfile['availability'],
  yearsExperience: (row.years_experience ?? 0) as number,
  githubUrl: row.github_url as string | null,
  linkedinUrl: row.linkedin_url as string | null,
  websiteUrl: row.website_url as string | null,
  portfolioRepos: (row.portfolio_repos ?? []) as string[],
  totalReviews: (row.total_reviews ?? 0) as number,
  avgRating: Number(row.avg_rating ?? 0),
  isFeatured: Boolean(row.is_featured),
  isVisible: Boolean(row.is_visible),
  createdAt: row.created_at as string,
  displayName: (row as Record<string, unknown>).profiles
    ? ((row as Record<string, Record<string, unknown>>).profiles?.full_name as string | undefined) || ((row as Record<string, Record<string, unknown>>).profiles?.github_login as string | undefined)
    : undefined,
  avatarUrl: (row as Record<string, unknown>).profiles
    ? (row as Record<string, Record<string, unknown>>).profiles?.avatar_url as string | undefined
    : undefined,
  githubLogin: (row as Record<string, unknown>).profiles
    ? (row as Record<string, Record<string, unknown>>).profiles?.github_login as string | undefined
    : undefined,
});

/** Get or create the current user's expert profile. */
export const getMyExpertProfile = async (userId: string): Promise<ExpertProfile | null> => {
  const supabase = getClient();
  const { data } = await supabase
    .from('expert_profiles')
    .select('*, profiles(full_name, avatar_url, github_login)')
    .eq('user_id', userId)
    .single();
  return data ? mapExpertRow(data as Record<string, unknown>) : null;
};

/** Create or update expert profile. */
export const upsertExpertProfile = async (userId: string, fields: {
  headline: string;
  bio: string;
  skills: string[];
  hourlyRate: number;
  yearsExperience: number;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  portfolioRepos?: string[];
  availability?: ExpertProfile['availability'];
  isVisible?: boolean;
}): Promise<ExpertProfile> => {
  const supabase = getClient();
  const payload = {
    user_id: userId,
    headline: fields.headline,
    bio: fields.bio,
    skills: fields.skills,
    hourly_rate: fields.hourlyRate,
    years_experience: fields.yearsExperience,
    github_url: fields.githubUrl || null,
    linkedin_url: fields.linkedinUrl || null,
    website_url: fields.websiteUrl || null,
    portfolio_repos: fields.portfolioRepos || [],
    availability: fields.availability || 'available',
    is_visible: fields.isVisible !== false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('expert_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*, profiles(full_name, avatar_url, github_login)')
    .single();

  if (error || !data) throw new Error(`Failed to save expert profile: ${error?.message}`);
  return mapExpertRow(data as Record<string, unknown>);
};

/** Browse the expert directory. */
export const listExperts = async (params?: {
  skill?: string;
  limit?: number;
}): Promise<ExpertProfile[]> => {
  const supabase = getClient();
  let query = supabase
    .from('expert_profiles')
    .select('*, profiles(full_name, avatar_url, github_login)')
    .eq('is_visible', true)
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(params?.limit ?? 50);

  if (params?.skill) {
    query = query.contains('skills', [params.skill]);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list experts: ${error.message}`);
  return (data || []).map((r: unknown) => mapExpertRow(r as Record<string, unknown>));
};

/** Send a consultation request to an expert. */
export const createConsultationRequest = async (params: {
  requesterId: string;
  expertId: string;
  repoUrl?: string;
  analysisId?: string;
  serviceType: ConsultationServiceType;
  message: string;
  budgetCents?: number;
}): Promise<ConsultationRequest> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('consultation_requests')
    .insert({
      requester_id: params.requesterId,
      expert_id: params.expertId,
      repo_url: params.repoUrl || null,
      analysis_id: params.analysisId ? Number(params.analysisId) : null,
      service_type: params.serviceType,
      message: params.message,
      budget_cents: params.budgetCents || null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create consultation request: ${error?.message}`);
  return {
    id: data.id,
    requesterId: data.requester_id,
    expertId: data.expert_id,
    repoUrl: data.repo_url,
    analysisId: data.analysis_id ? String(data.analysis_id) : null,
    serviceType: data.service_type,
    message: data.message,
    budgetCents: data.budget_cents,
    status: data.status,
    expertResponse: data.expert_response,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/** Get consultation requests for current user (as requester or expert). */
export const getMyConsultations = async (userId: string): Promise<ConsultationRequest[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('consultation_requests')
    .select('*')
    .or(`requester_id.eq.${userId},expert_id.in.(select id from expert_profiles where user_id = '${userId}')`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to load consultations: ${error.message}`);
  return (data || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    requesterId: d.requester_id as string,
    expertId: d.expert_id as string,
    repoUrl: d.repo_url as string | null,
    analysisId: d.analysis_id ? String(d.analysis_id) : null,
    serviceType: d.service_type as ConsultationServiceType,
    message: d.message as string,
    budgetCents: d.budget_cents as number | null,
    status: d.status as ConsultationRequest['status'],
    expertResponse: d.expert_response as string | null,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }));
};

/** Expert responds to a consultation request. */
export const respondToConsultation = async (consultationId: string, response: string, accept: boolean): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase
    .from('consultation_requests')
    .update({
      expert_response: response,
      status: accept ? 'accepted' : 'declined',
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultationId);

  if (error) throw new Error(`Failed to respond: ${error.message}`);
};

// ============================================================
// Watched Repos (scheduled analysis)
// ============================================================

export const watchRepo = async (userId: string, repoOwner: string, repoName: string, organizationId?: string | null): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase
    .from('watched_repos')
    .upsert({
      user_id: userId,
      repo_owner: repoOwner,
      repo_name: repoName,
      organization_id: organizationId || null,
      active: true,
    }, { onConflict: 'user_id,repo_owner,repo_name' });
  if (error) throw new Error(`Watch repo failed: ${error.message}`);
};

export const unwatchRepo = async (userId: string, repoOwner: string, repoName: string): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase
    .from('watched_repos')
    .delete()
    .eq('user_id', userId)
    .eq('repo_owner', repoOwner)
    .eq('repo_name', repoName);
  if (error) throw new Error(`Unwatch repo failed: ${error.message}`);
};

export interface WatchedRepo {
  id: string;
  repo_owner: string;
  repo_name: string;
  organization_id: string | null;
  active: boolean;
  created_at: string;
}

export const getWatchedRepos = async (userId: string): Promise<WatchedRepo[]> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('watched_repos')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Fetch watched repos failed: ${error.message}`);
  return (data || []) as WatchedRepo[];
};

// ============================================================
// User Preferences
// ============================================================

export interface UserPreferences {
  email_digest: boolean;
  slack_notifications: boolean;
  digest_frequency: 'daily' | 'weekly' | 'never';
}

export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Fetch preferences failed: ${error.message}`);
  return data || { email_digest: true, slack_notifications: true, digest_frequency: 'weekly' };
};

export const updateUserPreferences = async (userId: string, prefs: Partial<UserPreferences>): Promise<void> => {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...prefs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) throw new Error(`Update preferences failed: ${error.message}`);
};
