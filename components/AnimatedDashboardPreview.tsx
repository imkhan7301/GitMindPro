import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, ShieldCheck, BookOpen, Zap, Wrench } from 'lucide-react';

type Stage = 'input' | 'loading' | 'results';

const SCORES = { maintenance: 92, documentation: 78, innovation: 95, security: 84 };
const TECHS = ['Next.js', 'TypeScript', 'React', 'Tailwind', 'Prisma'];
const CYCLE_MS = 6400;

const BAR_COLORS: Record<string, string> = {
  maintenance: 'bg-emerald-500',
  documentation: 'bg-cyan-500',
  innovation: 'bg-violet-500',
  security: 'bg-indigo-500',
};

const CAT_ICONS: Record<string, React.ElementType> = {
  maintenance: Wrench,
  documentation: BookOpen,
  innovation: Zap,
  security: ShieldCheck,
};

function ScoreBar({ cat, target, active }: { cat: string; target: number; active: boolean }) {
  const Icon = CAT_ICONS[cat];
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-3 h-3 text-slate-500 shrink-0" />
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 w-[72px] shrink-0">{cat}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ease-out ${BAR_COLORS[cat]}`}
          style={{
            width: active ? `${target}%` : '0%',
            transitionDuration: active ? '1.2s' : '0s',
          }}
        />
      </div>
      <span className="text-[10px] font-black text-white w-6 text-right">{active ? target : 0}</span>
    </div>
  );
}

export default function AnimatedDashboardPreview() {
  const [stage, setStage] = useState<Stage>('input');
  const [typed, setTyped] = useState('');
  const [barsActive, setBarsActive] = useState(false);
  const [pillsVisible, setPillsVisible] = useState(false);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const TARGET_TEXT = 'vercel/next.js';

  const addTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    allTimers.current.push(t);
    return t;
  };

  const runCycle = () => {
    // Stage 1 input — type the repo
    setStage('input');
    setTyped('');
    setBarsActive(false);
    setPillsVisible(false);

    let i = 0;
    const typeNext = () => {
      i++;
      setTyped(TARGET_TEXT.slice(0, i));
      if (i < TARGET_TEXT.length) {
        addTimer(typeNext, 55 + Math.random() * 40);
      } else {
        // Stage 2 loading
        addTimer(() => setStage('loading'), 350);
        addTimer(() => {
          // Stage 3 results
          setStage('results');
          addTimer(() => setBarsActive(true), 200);
          addTimer(() => setPillsVisible(true), 900);
        }, 1800);
      }
    };
    addTimer(typeNext, 200);

    cycleRef.current = addTimer(runCycle, CYCLE_MS);
  };

  useEffect(() => {
    runCycle();
    return () => { allTimers.current.forEach(clearTimeout); allTimers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Live Demo</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
          From URL to Insight in{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            seconds
          </span>
        </h2>
        <p className="text-slate-400 text-sm">Paste any public GitHub repo. Get a full AI code intelligence report.</p>
      </div>

      {/* Mock Browser Window */}
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl shadow-indigo-500/10 bg-slate-900">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <div className="flex-1 mx-3 h-5 bg-slate-700/60 rounded-md flex items-center px-3">
            <span className="text-[9px] text-slate-500 font-mono">gitmindpro.com</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px] relative">
          {/* Input stage */}
          <div
            className={`absolute inset-6 transition-all duration-500 ${
              stage === 'input' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full gap-5">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1.5 text-center">Analyze any public GitHub repo</p>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 min-w-[320px]">
                  <span className="text-slate-600 text-sm font-mono">github.com/</span>
                  <span className="text-white text-sm font-mono">
                    {typed}
                    <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                  </span>
                </div>
              </div>
              <div className="w-32 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Loading stage */}
          <div
            className={`absolute inset-6 transition-all duration-500 ${
              stage === 'loading' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">AI Analyzing…</p>
                <p className="text-xs text-slate-500">Reading 47,000 lines across 312 files</p>
              </div>
              <div className="flex gap-1.5">
                {['Architecture', 'Security', 'Docs', 'Innovation'].map((label, i) => (
                  <span
                    key={label}
                    className="text-[9px] px-2 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-500 font-bold"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Results stage */}
          <div
            className={`absolute inset-6 transition-all duration-500 ${
              stage === 'results' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
            }`}
          >
            <div className="h-full flex flex-col gap-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold">vercel /</p>
                  <p className="text-base font-black text-white">next.js</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-emerald-400 font-black text-xl">A</span>
                  </div>
                  <p className="text-[8px] text-slate-600 font-bold mt-0.5">OVERALL</p>
                </div>
              </div>

              {/* Score bars */}
              <div className="space-y-2">
                {(Object.entries(SCORES) as [string, number][]).map(([cat, score]) => (
                  <ScoreBar key={cat} cat={cat} target={score} active={barsActive} />
                ))}
              </div>

              {/* Tech pills */}
              <div className="flex flex-wrap gap-1.5">
                {pillsVisible && TECHS.map((t, i) => (
                  <span
                    key={t}
                    className="text-[9px] font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400"
                    style={{
                      animation: `fadeInPill 0.4s ease-out ${i * 100}ms both`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInPill {
          from { opacity: 0; transform: translateY(6px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
