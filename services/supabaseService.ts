import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AnalysisResult, PRReviewResult, SavedAnalysis, SavedPRReview, Workspace, WorkspaceInvitation, WorkspaceMember } from '../types';

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
