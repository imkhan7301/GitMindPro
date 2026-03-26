/**
 * Vercel serverless: handles GitHub App installation callback.
 * After a user installs the GitMind Pro GitHub App, GitHub redirects
 * here with `installation_id` and `setup_action`.
 */
export default function handler(req, res) {
  const { installation_id, setup_action } = req.query;

  if (!installation_id) {
    return res.status(400).json({ error: 'Missing installation_id' });
  }

  // For now, redirect the user back to the app with a success flag.
  // In a future iteration we can persist the installation_id to Supabase
  // so we can use the GitHub App's enhanced API scopes.
  const redirectUrl = new URL(process.env.VITE_APP_URL || 'https://gitmindpro.vercel.app');
  redirectUrl.searchParams.set('github_app_installed', '1');
  redirectUrl.searchParams.set('installation_id', String(installation_id));
  redirectUrl.searchParams.set('setup_action', String(setup_action || 'install'));

  return res.redirect(302, redirectUrl.toString());
}
