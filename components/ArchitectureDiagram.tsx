import { useEffect, useRef, useState } from 'react';
import { GitBranch, Copy, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

export interface ArchitectureDiagramResult {
  mermaidSyntax: string;
  description: string;
  componentCount: number;
}

interface Props {
  diagram: ArchitectureDiagramResult | null;
  loading: boolean;
  onGenerate: () => void;
  repoName: string;
}

export default function ArchitectureDiagram({ diagram, loading, onGenerate, repoName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!diagram?.mermaidSyntax) { setSvg(null); return; }

    let cancelled = false;
    setRenderError(null);

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#4f46e5',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#6366f1',
            lineColor: '#475569',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a',
            background: '#0f172a',
            mainBkg: '#1e293b',
            nodeBorder: '#334155',
            clusterBkg: '#1e293b',
            titleColor: '#e2e8f0',
            edgeLabelBackground: '#1e293b',
          },
        });
        const id = `arch-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, diagram.mermaidSyntax);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) {
          setRenderError('Could not render diagram. View the Mermaid source below.');
          setSvg(null);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [diagram?.mermaidSyntax]);

  const handleCopy = () => {
    if (!diagram?.mermaidSyntax) return;
    navigator.clipboard.writeText(diagram.mermaidSyntax).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">AI Architecture Diagram</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {diagram ? `${diagram.componentCount} components · Mermaid flowchart` : 'Gemini-powered component & dependency map'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {diagram && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all"
              title="Copy Mermaid source (paste into mermaid.live or any agent)"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Mermaid'}
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              loading
                ? 'bg-violet-500/20 text-violet-400 cursor-not-allowed'
                : diagram
                ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {loading ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
            ) : diagram ? (
              <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Generate Diagram</>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center">
              <GitBranch className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-400">Gemini is mapping {repoName}...</p>
            <p className="text-xs text-slate-600">Analyzing component relationships and data flows</p>
          </div>
        )}

        {!loading && !diagram && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-60">
            <GitBranch className="w-12 h-12 text-slate-700" />
            <p className="text-sm font-bold text-slate-500">Click &quot;Generate Diagram&quot; to create an AI architecture map</p>
            <p className="text-xs text-slate-600">Works best after running the full analysis</p>
          </div>
        )}

        {!loading && diagram && (
          <div className="space-y-4">
            {/* Description */}
            {diagram.description && (
              <p className="text-sm text-slate-400 border-l-2 border-violet-500/40 pl-3">{diagram.description}</p>
            )}

            {/* SVG Render */}
            {svg && !renderError && (
              <div
                ref={containerRef}
                className="w-full overflow-auto rounded-2xl bg-slate-950/60 border border-slate-800 p-4"
                style={{ maxHeight: '520px' }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}

            {/* Render error fallback — show raw mermaid */}
            {renderError && (
              <div className="space-y-2">
                <p className="text-xs text-amber-400">{renderError}</p>
                <pre className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto max-h-96 font-mono whitespace-pre-wrap">
                  {diagram.mermaidSyntax}
                </pre>
                <p className="text-[10px] text-slate-600">Paste the Mermaid source at <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">mermaid.live</a> or into any agent for visual rendering.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
