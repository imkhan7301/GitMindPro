import React, { useState } from 'react';
import { Sparkles, ArrowRight, Github, Search, BarChart3, CheckCircle2, Rocket } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (repoUrl?: string) => void;
  onSignIn: () => void;
  isAuthEnabled: boolean;
  isSignedIn: boolean;
}

const EXAMPLE_REPOS = [
  { name: 'facebook/react', desc: 'The library for web interfaces' },
  { name: 'vercel/next.js', desc: 'Full-stack React framework' },
  { name: 'denoland/deno', desc: 'JavaScript runtime built on V8' },
  { name: 'supabase/supabase', desc: 'Open source Firebase alternative' },
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onSignIn, isAuthEnabled, isSignedIn }) => {
  const [step, setStep] = useState(0);
  const [repoUrl, setRepoUrl] = useState('');

  const handleFinish = () => {
    localStorage.setItem('gitmind.onboarded', '1');
    onComplete(repoUrl || undefined);
  };

  const handleSkip = () => {
    localStorage.setItem('gitmind.onboarded', '1');
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-500' : i < step ? 'w-4 bg-indigo-500/50' : 'w-4 bg-slate-700'}`} />
          ))}
        </div>

        <div className="p-8">
          {step === 0 && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 mx-auto bg-indigo-500/15 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Welcome to GitMindPro</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  AI-powered code intelligence that helps you understand any GitHub repository in under 2 minutes.
                  Architecture, security, ownership, onboarding — all in one place.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Search, label: 'Analyze' },
                  { icon: BarChart3, label: 'Score' },
                  { icon: Rocket, label: 'Ship' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
                    <Icon className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-300 font-bold">{label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-indigo-500/15 rounded-2xl flex items-center justify-center mb-4">
                  <Github className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  {isSignedIn ? 'Pick a Repo' : 'Connect GitHub'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {isSignedIn
                    ? 'Paste a GitHub URL or try one of these popular repos.'
                    : 'Sign in to save analyses, track history, and unlock Pro features. Or skip ahead and try it free.'}
                </p>
              </div>

              {isSignedIn ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <div className="text-xs text-slate-500 mb-1">Or try a popular project:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAMPLE_REPOS.map(r => (
                      <button
                        key={r.name}
                        onClick={() => setRepoUrl(`https://github.com/${r.name}`)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                          repoUrl === `https://github.com/${r.name}`
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold">{r.name}</div>
                        <div className="text-slate-500 mt-0.5">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {isAuthEnabled && (
                    <button
                      onClick={onSignIn}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Github className="w-4 h-4" /> Sign in with GitHub
                    </button>
                  )}
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3 text-slate-400 hover:text-white font-bold rounded-xl transition-all text-xs"
                  >
                    Skip — try it free first
                  </button>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {repoUrl ? 'Continue' : 'Next'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 mx-auto bg-emerald-500/15 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">You&apos;re Ready!</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Here&apos;s what you can do:
                </p>
              </div>
              <div className="text-left space-y-3">
                {[
                  'Paste any GitHub URL and get a full AI analysis',
                  'View architecture blueprints and code ownership maps',
                  'Run deep security audits with remediation plans',
                  'Compare repos side by side with AI scoring',
                  'Export reports as PDF or Markdown',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleFinish}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {repoUrl ? 'Analyze My First Repo' : 'Start Exploring'} <Rocket className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Skip link */}
          <button onClick={handleSkip} className="w-full mt-4 text-xs text-slate-600 hover:text-slate-400 transition-all text-center">
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
