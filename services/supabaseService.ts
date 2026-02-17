import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AnalysisResult } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  analysis: AnalysisResult;
}): Promise<void> => {
  const supabase = getClient();

  const { error } = await supabase.from('analyses').insert({
    user_id: params.userId,
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
