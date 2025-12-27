
import React from 'react';
import { Scorecard } from '../types';

interface ScoreCardProps {
  scores: Scorecard;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ scores }) => {
  const metrics = [
    { label: 'Maintenance', value: scores.maintenance, color: 'bg-emerald-500' },
    { label: 'Documentation', value: scores.documentation, color: 'bg-blue-500' },
    { label: 'Innovation', value: scores.innovation, color: 'bg-purple-500' },
    { label: 'Security', value: scores.security, color: 'bg-rose-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{m.label}</div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-white">{m.value}%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full ${m.color} transition-all duration-1000`} 
              style={{ width: `${m.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScoreCard;
