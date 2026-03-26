import { useState } from 'react';
import { Scissors, Copy, CheckCircle2, Zap, Package, BookOpen, Cpu } from 'lucide-react';

export interface CodeExtraction {
  functionName: string;
  plainEnglish: string;
  businessLogic: string;
  extractedCode: string;
  dependencies: string[];
  usedIn: string[];
  isReusable: boolean;
  refactoringTip: string;
}

interface Props {
  fileName: string;
  fileContent: string;
  onExtract: (fileName: string, fileContent: string, query: string) => Promise<CodeExtraction>;
  loading?: boolean;
}

const QUICK_QUERIES = [
  'Extract the main business logic',
  'Find all exported functions',
  'Extract authentication/auth logic',
  'Extract API calls and data fetching',
  'Extract validation logic',
];

export default function CodeExtractor({ fileName, fileContent, onExtract, loading: externalLoading }: Props) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CodeExtraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleExtract = async (q?: string) => {
    const finalQuery = q || query.trim();
    if (!finalQuery || !fileContent) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await onExtract(fileName, fileContent, finalQuery);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(key);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  const isLoading = loading || externalLoading;

  return (
    <div className="mt-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-indigo-500/20">
        <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center">
          <Scissors className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white">Code Intelligence Extractor</h4>
          <p className="text-[10px] text-slate-500">Extract logic, dependencies, and business rules from {fileName}</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Quick queries */}
        <div className="flex flex-wrap gap-2">
          {QUICK_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); handleExtract(q); }}
              disabled={isLoading}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/15 transition-all disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Custom query */}
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleExtract()}
            placeholder="Or describe what to extract... e.g. 'the payment processing function'"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-700 outline-none focus:border-indigo-500/40"
          />
          <button
            onClick={() => handleExtract()}
            disabled={isLoading || !query.trim()}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isLoading || !query.trim() ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Extracting...' : 'Extract'}
          </button>
        </div>

        {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}

        {/* Result */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* Function name + reusability badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-black text-white">{result.functionName}</span>
              {result.isReusable && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  ✓ Reusable
                </span>
              )}
            </div>

            {/* Plain English */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Plain English</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result.plainEnglish}</p>
            </div>

            {/* Business Logic */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Business Logic</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result.businessLogic}</p>
            </div>

            {/* Extracted Code */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Extracted Code</span>
                <button
                  onClick={() => handleCopy(result.extractedCode, 'code')}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  {copiedSection === 'code' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSection === 'code' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 text-xs text-indigo-300 font-mono overflow-x-auto max-h-64">
                <code>{result.extractedCode}</code>
              </pre>
            </div>

            {/* Dependencies + Used In */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Dependencies</span>
                </div>
                {result.dependencies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.dependencies.map(d => (
                      <span key={d} className="text-[10px] font-mono px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300">{d}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">No external dependencies</p>
                )}
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Scissors className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Used In</span>
                </div>
                {result.usedIn.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.usedIn.map(f => (
                      <span key={f} className="text-[10px] font-mono px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300">{f}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">Not referenced elsewhere</p>
                )}
              </div>
            </div>

            {/* Refactoring tip */}
            {result.refactoringTip && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300">{result.refactoringTip}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
