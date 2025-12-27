
import React, { useState, useRef, useEffect } from 'react';
import { 
  parseGithubUrl, fetchRepoDetails, fetchRepoStructure, 
  fetchFileContent, fetchRepoIssues 
} from './services/githubService';
import { 
  analyzeRepository, explainCode, chatWithRepo, 
  getMarketInsights, generateSpeech 
} from './services/geminiService';
import { GithubRepo, FileNode, AnalysisResult, ChatMessage, AppTab, MarketInsight } from './types';
import FileTree from './components/FileTree';
import Loader from './components/Loader';
import ScoreCard from './components/ScoreCard';
import { 
  Search, Github, MessageSquare, Code, Layout, 
  TrendingUp, Shield, Send, X, Globe, Activity, 
  Volume2, Share2, ExternalLink
} from 'lucide-react';

// Audio decoding helpers for Gemini TTS raw PCM data
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('intelligence');
  
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [structure, setStructure] = useState<FileNode[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [market, setMarket] = useState<MarketInsight | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileExplanation, setFileExplanation] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseGithubUrl(url);
    if (!parsed) { setError('Invalid URL'); return; }

    setLoading(true); setError(null); setRepo(null); setAnalysis(null); setMarket(null);

    try {
      const details = await fetchRepoDetails(parsed.owner, parsed.repo);
      const [tree, issueList] = await Promise.all([
        fetchRepoStructure(parsed.owner, parsed.repo, details.defaultBranch),
        fetchRepoIssues(parsed.owner, parsed.repo)
      ]);
      
      setRepo(details); setStructure(tree); setIssues(issueList);

      let readme = '';
      try { readme = await fetchFileContent(parsed.owner, parsed.repo, 'README.md'); } catch {}

      const res = await analyzeRepository(JSON.stringify(details), JSON.stringify(tree.slice(0, 30)), readme);
      setAnalysis(res);

      const mkt = await getMarketInsights(details.repo, res.techStack);
      setMarket(mkt);

    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAudioExplain = async () => {
    if (!fileExplanation || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const base64 = await generateSpeech(fileExplanation);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioData = decodeBase64(base64);
      const audioBuffer = await decodeAudioData(audioData, audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch { setIsSpeaking(false); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !repo || !analysis) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput(''); setChatLoading(true);
    try {
      const context = `Repo: ${repo.repo}. Tech: ${analysis.techStack.join(', ')}`;
      const response = await chatWithRepo(chatHistory, userMsg.text, context);
      setChatHistory(prev => [...prev, { role: 'model', text: response, timestamp: Date.now() }]);
    } finally { setChatLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300">
      <nav className="border-b border-slate-800 bg-[#020617]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1700px] mx-auto px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">GM</div>
            <div>
               <span className="text-white font-black tracking-tight text-xl block leading-none">GitMind<span className="text-indigo-500">PRO</span></span>
               <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Enterprise Analytics</span>
            </div>
          </div>
          
          <form onSubmit={handleImport} className="flex-grow max-w-2xl mx-12 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-white outline-none"
              placeholder="Paste GitHub Repository URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
               <Share2 className="w-4 h-4" /> Share Report
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
               <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xs font-bold text-white">PRO</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1700px] mx-auto p-8">
        {loading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center">
            <Loader message="Deploying Gemini Strategy Brain..." />
          </div>
        ) : repo && analysis ? (
          <div className="grid grid-cols-12 gap-8">
            
            {/* Sidebar Explorer */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
               <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-white font-bold flex items-center gap-2"><Layout className="w-4 h-4 text-indigo-400" /> Structure</h3>
                     <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-md font-mono">{repo.defaultBranch}</span>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <FileTree nodes={structure} onSelectFile={(node) => { setSelectedFile(node); setActiveTab('intelligence'); }} selectedPath={selectedFile?.path} />
                  </div>
               </div>
            </div>

            {/* Central Intelligence Hub */}
            <div className="col-span-12 lg:col-span-6 space-y-6">
               {/* Custom Tab Navigation */}
               <div className="flex gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
                  {[
                    { id: 'intelligence', label: 'Intelligence', icon: Shield },
                    { id: 'blueprint', label: 'Blueprint', icon: Activity },
                    { id: 'market', label: 'Market', icon: Globe },
                    { id: 'pulse', label: 'Pulse', icon: TrendingUp }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as AppTab)}
                      className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  ))}
               </div>

               {activeTab === 'intelligence' && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ScoreCard scores={analysis.scorecard} />
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                       <h2 className="text-2xl font-black text-white mb-4">Executive Summary</h2>
                       <p className="text-slate-400 leading-relaxed text-lg mb-8">{analysis.summary}</p>
                       <div className="grid grid-cols-2 gap-8">
                          <div>
                             <h4 className="text-[10px] uppercase tracking-widest font-black text-indigo-400 mb-4">Strategic Roadmap</h4>
                             <div className="space-y-3">
                                {analysis.roadmap.map((r, i) => (
                                  <div key={i} className="flex gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                     <span className="text-xl font-black text-indigo-500/20">{i+1}</span>
                                     <p className="text-sm text-slate-300">{r}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-[10px] uppercase tracking-widest font-black text-purple-400 mb-4">Key Tech Stack</h4>
                                <div className="flex flex-wrap gap-2">
                                   {analysis.techStack.map(t => <span key={t} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 border border-slate-700">{t}</span>)}
                                </div>
                             </div>
                             <div>
                                <h4 className="text-[10px] uppercase tracking-widest font-black text-emerald-400 mb-4">Key Innovation</h4>
                                <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">{analysis.architectureSuggestion}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {selectedFile && (
                      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl">
                         <div className="bg-slate-800/50 px-8 py-5 flex justify-between items-center border-b border-slate-800">
                            <div className="flex items-center gap-4">
                               <div className="p-2 bg-indigo-500/10 rounded-lg"><Code className="w-5 h-5 text-indigo-400" /></div>
                               <span className="mono text-sm text-white font-bold">{selectedFile.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <button 
                                 onClick={handleAudioExplain}
                                 className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                               >
                                 <Volume2 className="w-4 h-4" />
                               </button>
                               <button onClick={() => setSelectedFile(null)} className="p-2 bg-slate-800 text-slate-500 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                         </div>
                         <div className="p-8">
                            {fileLoading ? <Loader message="Analyzing source..." /> : (
                              <div className="space-y-8">
                                 <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
                                    <h5 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Logic Breakdown</h5>
                                    <p className="text-slate-300 text-sm leading-relaxed">{fileExplanation}</p>
                                 </div>
                                 <pre className="bg-[#010409] p-8 rounded-2xl overflow-x-auto mono text-xs text-slate-500 border border-slate-800/50 leading-loose max-h-[500px]">
                                    <code>{fileContent}</code>
                                 </pre>
                              </div>
                            )}
                         </div>
                      </div>
                    )}
                 </div>
               )}

               {activeTab === 'blueprint' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between mb-8">
                       <h2 className="text-2xl font-black text-white">System Blueprint</h2>
                       <button className="text-xs text-indigo-400 font-bold hover:underline">Export SVG</button>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-10 flex items-center justify-center border border-slate-800 min-h-[500px] relative overflow-hidden">
                       <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                       <pre className="text-indigo-400 text-xs font-mono bg-slate-950 p-6 rounded-xl border border-indigo-500/20 shadow-2xl">
                          {analysis.mermaidDiagram}
                       </pre>
                    </div>
                    <p className="mt-6 text-xs text-slate-500 text-center italic">Gemini generated structural visualization based on file parsing.</p>
                 </div>
               )}

               {activeTab === 'market' && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden">
                       <div className="relative z-10">
                          <h2 className="text-4xl font-black mb-4 tracking-tighter">Ecosystem Pulse</h2>
                          <p className="text-indigo-100 max-w-lg">Using Google Search to ground the analysis in real-world market trends and external resources.</p>
                       </div>
                       <Globe className="absolute -right-10 -bottom-10 w-64 h-64 text-indigo-500/30" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                          <h3 className="text-white font-bold mb-6">Trending in {analysis.techStack[0]}</h3>
                          <div className="space-y-4">
                             {market?.trendingTopics.map(topic => (
                               <div key={topic} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl">
                                  <span className="text-sm font-bold text-slate-300">#{topic}</span>
                                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                          <h3 className="text-white font-bold mb-6">Strategic Grounding</h3>
                          <div className="space-y-3">
                             {market?.externalResources.map((res, i) => (
                               <a key={i} href={res.uri} target="_blank" className="flex items-center justify-between p-3 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-xl transition-all group">
                                  <span className="text-xs font-medium text-slate-400 truncate pr-4 group-hover:text-indigo-300">{res.title}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                               </a>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === 'pulse' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                       <h2 className="text-2xl font-black text-white">Project Health Dashboard</h2>
                       <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black border border-emerald-500/20">LIVE</div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                       <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                          <div className="text-3xl font-black text-white mb-1">94</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Reliability Score</div>
                       </div>
                       <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                          <div className="text-3xl font-black text-white mb-1">{issues.length}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Issues</div>
                       </div>
                       <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                          <div className="text-3xl font-black text-white mb-1">12%</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Churn Rate</div>
                       </div>
                    </div>
                    <h3 className="text-white font-bold mb-4">Critical Issue Summary</h3>
                    <div className="space-y-3">
                       {issues.map((issue: any) => (
                         <div key={issue.id} className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50"></div>
                               <span className="text-sm font-medium text-slate-300 truncate max-w-md">{issue.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">#{issue.number}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* AI Brain / Chat Sidebar */}
            <div className="col-span-12 lg:col-span-3">
               <div className="bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col h-[calc(100vh-160px)] sticky top-28 overflow-hidden backdrop-blur-md">
                  <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                    <div>
                       <h3 className="text-white font-bold text-sm">Repo Brain</h3>
                       <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Expert Contextual Mode</span>
                    </div>
                    <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    </div>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-12 px-4 opacity-50">
                        <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">🧩</div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"I've mapped the entire architecture. Ask me about implementation details or logic flow."</p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-xl ${
                          msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700">
                          <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleChat} className="p-6 border-t border-slate-800 bg-slate-900/80">
                    <div className="relative">
                      <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-5 pr-12 py-4 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                        placeholder="Ask architecture questions..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 p-2 transition-transform active:scale-90">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
               </div>
            </div>

          </div>
        ) : (
          /* Premium Splash Screen */
          <div className="max-w-6xl mx-auto py-32 text-center">
             <div className="mb-12 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase">Powered by Gemini 3.0 Pro & Flash</span>
             </div>
             <h1 className="text-8xl font-black text-white mb-8 tracking-tighter leading-[0.85] bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                The Future of <br/> Code Intelligence.
             </h1>
             <p className="text-slate-500 text-xl max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
                Connect your GitHub ecosystem. Let our AI deconstruct architecture, analyze market positioning, and narrate your source code in real-time.
             </p>
             
             <div className="flex justify-center gap-6">
                <button 
                  onClick={() => document.querySelector('input')?.focus()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-12 rounded-3xl transition-all shadow-2xl shadow-indigo-500/40 text-lg active:scale-95"
                >
                  Get Started
                </button>
                <button className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-black py-5 px-12 rounded-3xl transition-all text-lg flex items-center gap-3">
                  <Github className="w-6 h-6" /> Enterprise Auth
                </button>
             </div>

             <div className="mt-40 grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Market Grounding', icon: Globe, val: 'Google Search' },
                  { label: 'Audible Code', icon: Volume2, val: 'Gemini TTS' },
                  { label: 'Architecture', icon: Activity, val: 'Blueprints' },
                  { label: 'Strategy', icon: Shield, val: 'CTO Insights' }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800/50 hover:bg-slate-900/50 transition-all text-left">
                     <item.icon className="w-10 h-10 text-indigo-500 mb-6" />
                     <div className="text-[10px] uppercase tracking-widest font-black text-slate-600 mb-1">{item.val}</div>
                     <div className="text-lg font-black text-white">{item.label}</div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
      
      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-8 py-4 rounded-3xl font-black shadow-2xl animate-in slide-in-from-bottom-10 flex items-center gap-4">
           <Shield className="w-5 h-5" />
           {error}
           <button onClick={() => setError(null)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}
    </div>
  );
};

export default App;
