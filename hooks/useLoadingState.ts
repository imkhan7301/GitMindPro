import { useState, useCallback, useEffect, useRef } from 'react';

export interface LoadingState {
  loading: boolean;
  progress: number;
  stage: string;
  tipIndex: number;
}

const LOADING_TIPS = [
  { icon: "🚀", text: "Pro tip: Click any file in the tree to get an instant AI explanation!" },
  { icon: "🔥", text: "Fun fact: The 'Hot Zones' section shows files changed most in the last 7 days." },
  { icon: "👥", text: "Did you know? GitMind identifies code owners so you know who to ask!" },
  { icon: "💡", text: "Time saver: Check 'Common Tasks' for copy-paste setup commands!" },
  { icon: "🎯", text: "Pro move: Start with the 'Critical Files' section - they're ranked by importance!" },
  { icon: "⚡", text: "Speed tip: Large repos (10k+ files) take 60-80 seconds. Small ones? 30-40 seconds!" },
  { icon: "🧠", text: "Behind the scenes: Our AI reads your entire codebase, not just the README!" },
  { icon: "📊", text: "Fun fact: We analyze your tech stack, dependencies, AND recent commit patterns!" },
  { icon: "🎨", text: "Pro tip: Hover over any box to see interactive animations - we made it extra smooth!" },
  { icon: "🤖", text: "AI magic: Ask the Copilot 'Who built the auth system?' and get instant answers!" },
  { icon: "📚", text: "Did you know? Your onboarding guide is 100% personalized to THIS specific repo!" },
  { icon: "☕", text: "Perfect time for coffee! ☕ AI analysis is worth the wait, promise!" },
  { icon: "🎭", text: "Fun fact: We analyze both the code AND the team dynamics!" },
  { icon: "🔍", text: "Behind the scenes: Scanning for test frameworks, CI/CD configs, and more!" },
  { icon: "💪", text: "Pro tip: After loading, try asking 'What's actively being developed right now?'" },
];

export function useLoadingState() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [tipIndex, setTipIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Rotate tips every 4 seconds during loading
  useEffect(() => {
    if (!loading) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTipIndex(prev => (prev + 1) % LOADING_TIPS.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loading]);

  const finishLoading = useCallback((delayMs = 400) => {
    setProgress(100);
    setStage('Complete!');
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, delayMs);
  }, []);

  return {
    loading,
    setLoading,
    progress,
    setProgress,
    stage,
    setStage,
    tipIndex,
    currentTip: LOADING_TIPS[tipIndex],
    tips: LOADING_TIPS,
    finishLoading,
  };
}
