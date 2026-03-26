const API_BASE = '';

export async function sendSlackNotification(params: {
  repoName: string;
  score: number;
  summary?: string;
  analysisUrl?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/slack-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch {
    return false;
  }
}
