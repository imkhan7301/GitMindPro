
import React from 'react';
import { Scorecard } from '../types';

interface ScoreCardProps {
  scores: Scorecard;
}

const GRADE = (avg: number) => avg >= 8.5 ? 'A' : avg >= 7 ? 'B' : avg >= 5.5 ? 'C' : avg >= 4 ? 'D' : 'F';
const GRADE_COLOR: Record<string, string> = {
  A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
  B: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40',
  C: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/40',
  F: 'text-red-400 bg-red-500/10 border-red-500/40',
};
const BAR_COLOR = (v: number) =>
  v >= 8 ? 'bg-emerald-500' : v >= 6 ? 'bg-cyan-500' : v >= 4 ? 'bg-yellow-500' : 'bg-red-500';

const ScoreCard: React.FC<ScoreCardProps> = ({ scores }) => {
  const metrics = [
    { label: 'Maintenance', value: scores.maintenance },
    { label: 'Docs', value: scores.documentation },
    { label: 'Innovation', value: scores.innovation },
    { label: 'Security', value: scores.security },
  ];

  const avg = (scores.maintenance + scores.documentation + scores.innovation + scores.security) / 4;
  const grade = GRADE(avg);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Grade badge */}
      <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 shrink-0 ${GRADE_COLOR[grade]}`}>
        <span className="text-2xl font-black leading-none">{grade}</span>
        <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">grade</span>
      </div>

      {/* Score bars */}
      <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 w-16 shrink-0">{m.label}</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${BAR_COLOR(m.value)}`}
                style={{ width: `${m.value * 10}%` }}
              />
            </div>
            <span className="text-xs font-black text-white w-8 text-right shrink-0">{m.value}<span className="text-slate-600 font-normal">/10</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreCard;
