import React from 'react';
import { Rocket, Shield, Cpu, Users, Code } from 'lucide-react';

export type VibeMode = 'new-dev' | 'frontend' | 'security' | 'ai-agent' | 'manager';

interface VibeModeConfig {
  id: VibeMode;
  label: string;
  emoji: string;
  description: string;
  focusTip: string;
  highlights: string[];
  color: string;
  borderColor: string;
  textColor: string;
  icon: React.ElementType;
}

const MODES: VibeModeConfig[] = [
  {
    id: 'new-dev',
    label: 'New Dev',
    emoji: '🚀',
    description: 'Onboard fast',
    focusTip: 'Start with the Getting Started tab → Learning Path → Critical Files. Use the AI Copilot to ask "Where should I start contributing?"',
    highlights: ['Getting Started', 'Learning Path', 'Who To Ask', 'Hot Zones'],
    color: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/40',
    textColor: 'text-indigo-400',
    icon: Rocket,
  },
  {
    id: 'frontend',
    label: 'Vibecoder',
    emoji: '⚡',
    description: 'Ship UI fast',
    focusTip: 'Focus on Architecture → Tech Stack tab. Ask Copilot "What UI frameworks and component patterns does this project use?"',
    highlights: ['Architecture', 'Tech Stack', 'Hot Zones', 'File Tree'],
    color: 'bg-amber-500/10',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    icon: Code,
  },
  {
    id: 'security',
    label: 'Security',
    emoji: '🛡️',
    description: 'Audit & harden',
    focusTip: 'Go directly to Security tab → run CVE Scanner → check Tech Debt. Ask Copilot "What are the top security risks in this codebase?"',
    highlights: ['Security', 'CVE Scanner', 'Tech Debt', 'Audit'],
    color: 'bg-rose-500/10',
    borderColor: 'border-rose-500/40',
    textColor: 'text-rose-400',
    icon: Shield,
  },
  {
    id: 'ai-agent',
    label: 'AI Agent',
    emoji: '🤖',
    description: 'Agent context',
    focusTip: 'Export JSON for agents → use Architecture Diagram for context mapping. Ask Copilot "Give me a structured overview I can feed to an AI agent."',
    highlights: ['Export JSON', 'Architecture Diagram', 'Summary', 'Tech Stack'],
    color: 'bg-violet-500/10',
    borderColor: 'border-violet-500/40',
    textColor: 'text-violet-400',
    icon: Cpu,
  },
  {
    id: 'manager',
    label: 'Manager',
    emoji: '📊',
    description: 'Team insights',
    focusTip: 'Check Team & Issues tab → Health Dashboard → Tech Debt costs. Ask Copilot "Give me an executive summary of this repository\'s health."',
    highlights: ['Team & Issues', 'Health Dashboard', 'Tech Debt $', 'Scorecard'],
    color: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    icon: Users,
  },
];

interface Props {
  value: VibeMode;
  onChange: (v: VibeMode) => void;
}

export default function VibeModeSelector({ value, onChange }: Props) {
  const active = MODES.find(m => m.id === value) || MODES[0];

  return (
    <div className="mb-6">
      {/* Role selector pills */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mr-1">Vibe Mode:</span>
        {MODES.map(mode => {
          const isActive = mode.id === value;
          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                isActive
                  ? `${mode.color} ${mode.borderColor} ${mode.textColor}`
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={mode.description}
            >
              <span>{mode.emoji}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Focus tip banner */}
      <div className={`flex items-start gap-3 p-3 rounded-xl border ${active.color} ${active.borderColor}`}>
        <active.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active.textColor}`} />
        <div className="min-w-0">
          <span className={`text-[10px] font-black uppercase tracking-widest ${active.textColor}`}>{active.emoji} {active.label} Focus — </span>
          <span className="text-[11px] text-slate-400">{active.focusTip}</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {active.highlights.map(h => (
              <span key={h} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${active.color} ${active.textColor}`}>
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { MODES };
