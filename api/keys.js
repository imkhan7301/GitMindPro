import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel serverless: API key management.
 * POST   /api/keys — create a new API key (requires Supabase auth token)
 * GET    /api/keys — list user's API keys
 * DELETE /api/keys?id=<uuid> — revoke an API key
 */

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getUserFromAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function generateApiKey() {
  const raw = crypto.randomBytes(32).toString('hex');
  const key = `gmp_${raw}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = `gmp_${raw.slice(0, 8)}...`;
  return { key, hash, prefix };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await getUserFromAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized — pass your Supabase auth token as Bearer token' });
  }

  const supabase = getSupabase();

  if (req.method === 'POST') {
    const { name, scopes } = req.body || {};
    const { key, hash, prefix } = generateApiKey();

    const { error } = await supabase.from('api_keys').insert({
      user_id: user.id,
      name: name || 'Default',
      key_hash: hash,
      key_prefix: prefix,
      scopes: scopes || ['analyze', 'read'],
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Return the raw key ONCE — it's never stored in plaintext
    return res.status(201).json({
      key,
      prefix,
      name: name || 'Default',
      scopes: scopes || ['analyze', 'read'],
      message: 'Save this key — it won\'t be shown again.',
    });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, last_used_at, created_at, revoked')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ keys: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing key id' });

    const { error } = await supabase
      .from('api_keys')
      .update({ revoked: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ revoked: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
