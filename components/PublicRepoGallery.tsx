import { ArrowRight, Star, GitFork, TrendingUp, Zap } from 'lucide-react';

export interface GalleryRepo {
  owner: string;
  repo: string;
  description: string;
  stars: string;
  forks: string;
  language: string;
  category: string;
  avgScore: number;
  scorecard: { maintenance: number; documentation: number; innovation: number; security: number };
  techStack: string[];
}

const GALLERY_REPOS: GalleryRepo[] = [
  {
    owner: 'vercel', repo: 'next.js',
    description: 'The React Framework for the Web — SSR, SSG, file-based routing.',
    stars: '126k', forks: '27k', language: 'TypeScript', category: 'Framework',
    avgScore: 9.2,
    scorecard: { maintenance: 9.5, documentation: 9.0, innovation: 9.5, security: 8.8 },
    techStack: ['TypeScript', 'React', 'Node.js', 'Rust'],
  },
  {
    owner: 'facebook', repo: 'react',
    description: 'The library for web and native user interfaces.',
    stars: '228k', forks: '46k', language: 'JavaScript', category: 'UI Library',
    avgScore: 9.5,
    scorecard: { maintenance: 9.8, documentation: 9.5, innovation: 9.8, security: 9.0 },
    techStack: ['JavaScript', 'TypeScript', 'C++', 'Flow'],
  },
  {
    owner: 'tiangolo', repo: 'fastapi',
    description: 'FastAPI framework, high performance, easy to learn, fast to code.',
    stars: '77k', forks: '6.7k', language: 'Python', category: 'API Framework',
    avgScore: 9.1,
    scorecard: { maintenance: 9.0, documentation: 9.8, innovation: 9.0, security: 8.7 },
    techStack: ['Python', 'Pydantic', 'Starlette', 'OpenAPI'],
  },
  {
    owner: 'django', repo: 'django',
    description: 'The Web framework for perfectionists with deadlines.',
    stars: '81k', forks: '32k', language: 'Python', category: 'Web Framework',
    avgScore: 9.3,
    scorecard: { maintenance: 9.5, documentation: 9.5, innovation: 8.5, security: 9.8 },
    techStack: ['Python', 'PostgreSQL', 'SQLite', 'Redis'],
  },
  {
    owner: 'supabase', repo: 'supabase',
    description: 'The open source Firebase alternative with Postgres.',
    stars: '73k', forks: '7k', language: 'TypeScript', category: 'BaaS',
    avgScore: 8.9,
    scorecard: { maintenance: 9.0, documentation: 8.5, innovation: 9.5, security: 8.7 },
    techStack: ['TypeScript', 'PostgreSQL', 'Go', 'Elixir'],
  },
  {
    owner: 'microsoft', repo: 'vscode',
    description: 'Visual Studio Code — code editor redefined and optimized for building web and cloud applications.',
    stars: '165k', forks: '30k', language: 'TypeScript', category: 'Developer Tool',
    avgScore: 9.4,
    scorecard: { maintenance: 9.5, documentation: 9.0, innovation: 9.5, security: 9.5 },
    techStack: ['TypeScript', 'Electron', 'Node.js', 'CSS'],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Framework: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  'UI Library': 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  'API Framework': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'Web Framework': 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  BaaS: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Developer Tool': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

const scoreColor = (s: number): string => {
  if (s >= 9) return 'text-emerald-400';
  if (s >= 7.5) return 'text-amber-400';
  return 'text-rose-400';
};

interface Props {
  onAnalyze: (url: string) => void;
}

export default function PublicRepoGallery({ onAnalyze }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-black text-white">Popular Repos Gallery</h2>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              Live Scores
            </span>
          </div>
          <p className="text-xs text-slate-500">Click any repo to run a full AI analysis — see what top OSS looks like under the hood</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GALLERY_REPOS.map(repo => {
          const catColor = CATEGORY_COLORS[repo.category] || 'text-slate-400 bg-slate-800 border-slate-700';
          return (
            <div
              key={`${repo.owner}/${repo.repo}`}
              className="group bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition-all hover:bg-slate-900/80 cursor-pointer"
              onClick={() => onAnalyze(`https://github.com/${repo.owner}/${repo.repo}`)}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-slate-500 font-mono">{repo.owner}/</span>
                  </div>
                  <h3 className="text-sm font-black text-white truncate group-hover:text-indigo-300 transition-colors">
                    {repo.repo}
                  </h3>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-xl font-black ${scoreColor(repo.avgScore)}`}>{repo.avgScore}</span>
                  <span className="text-[8px] text-slate-600 uppercase tracking-widest">/10</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">{repo.description}</p>

              {/* Category + language */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${catColor}`}>
                  {repo.category}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400">
                  {repo.language}
                </span>
              </div>

              {/* Mini scorecard bars */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {Object.entries(repo.scorecard).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${(val / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-600 uppercase">{key.slice(0, 4)}</span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Star className="w-3 h-3" /> {repo.stars}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <GitFork className="w-3 h-3" /> {repo.forks}
                  </div>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors group-hover:gap-2">
                  <Zap className="w-3 h-3" /> Analyze <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-600 text-center">
        Click any card to run a live AI analysis · Scores are AI-estimated baselines
      </p>
    </div>
  );
}
