
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, ConnectionLineType, useReactFlow, ReactFlowProvider } from 'reactflow';
import { GoogleGenAI, Modality } from '@google/genai';
import { parseGithubUrl, fetchRepoDetails, fetchRepoStructure, fetchFileContent } from './services/githubService';
import { analyzeRepository, chatWithRepo, generateSpeech, getMarketPulse, synthesizeLabTask, explainCode, analyzeVisualPrototype, generateBoardroomQA, generateVisionVideo, performDeepAudit } from './services/geminiService';
import { GithubRepo, FileNode, AnalysisResult, ChatMessage, AppTab, MarketPulse, VisualAuditResult, TerminalLog, DeepAudit } from './types';
import FileTree from './components/FileTree';
import Loader from './components/Loader';
import ScoreCard from './components/ScoreCard';
import { Search, Github, MessageSquare, Code, Layout, TrendingUp, Shield, Send, X, Globe, Activity, Volume2, Cloud, Zap, FlaskConical, ExternalLink, Sparkles, Terminal, Rocket, PlayCircle, Server, Download, Upload, Eye, Mic, MicOff, ChevronUp, ChevronDown, Video, MapPin, Users, Waves, Camera, BrainCircuit } from 'lucide-react';

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

// Internal component to handle fitView properly
const BlueprintGraph: React.FC<{ nodes: any[], edges: any[], onNodesChange: any, onEdgesChange: any }> = ({ nodes, edges, onNodesChange, onEdgesChange }) => {
  const { fitView } = useReactFlow();
  
  useEffect(() => {
    const timer = setTimeout(() => fitView(), 200);
    return () => clearTimeout(timer);
  }, [nodes, fitView]);

  return (
    <ReactFlow 
      nodes={nodes} 
      edges={edges} 
      onNodesChange={onNodesChange} 
      onEdgesChange={onEdgesChange} 
      fitView
      connectionLineType={ConnectionLineType.SmoothStep}
    >
      <Background color="#1e1b4b" gap={20} />
      <Controls />
      <MiniMap nodeColor="#4338ca" maskColor="rgba(2, 6, 23, 0.7)" />
    </ReactFlow>
  );
};

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('intelligence');
  
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [structure, setStructure] = useState<FileNode[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [pulse, setPulse] = useState<MarketPulse | null>(null);
  const [deepAudit, setDeepAudit] = useState<DeepAudit | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileExplanation, setFileExplanation] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  
  const [labResult, setLabResult] = useState<string | null>(null);
  const [labLoading, setLabLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [visionVideo, setVisionVideo] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [liveActive, setLiveActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const sessionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    setTerminalLogs(prev => [...prev, { id: Math.random().toString(36), timestamp: Date.now(), type, message }].slice(-50));
  }, []);

  useEffect(() => {
    if (analysis) {
      setNodes(analysis.flowNodes || []);
      setEdges(analysis.flowEdges || []);
    }
  }, [analysis, setNodes, setEdges]);

  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (node.type === 'tree') return;
    setSelectedFile(node);
    setFileLoading(true);
    setFileExplanation(null);
    setLabResult(null);
    addLog(`Accessing file: ${node.path}`, 'info');
    
    try {
      if (!repo) return;
      const content = await fetchFileContent(repo.owner, repo.repo, node.path);
      setFileContent(content);
      const explanation = await explainCode(node.name, content);
      setFileExplanation(explanation);
      addLog(`File analysis synthesized for ${node.name}`, 'ai');
    } catch (err: any) {
      addLog(`Failed to fetch/analyze file: ${err.message}`, 'error');
    } finally {
      setFileLoading(false);
    }
  }, [repo, addLog]);

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseGithubUrl(url);
    if (!parsed) { setError('Invalid GitHub URL'); return; }

    setLoading(true); setError(null); setRepo(null); setAnalysis(null);
    addLog(`Initiating injection: ${url}`, 'info');
    try {
      const details = await fetchRepoDetails(parsed.owner, parsed.repo);
      const tree = await fetchRepoStructure(parsed.owner, parsed.repo, details.defaultBranch);
      setRepo(details); setStructure(tree);

      let readme = '';
      try { readme = await fetchFileContent(parsed.owner, parsed.repo, 'README.md'); } catch {}

      const res = await analyzeRepository(JSON.stringify(details), JSON.stringify(tree.slice(0, 40)), readme);
      setAnalysis(res);
      addLog('Ecosystem DNA Synthesized.', 'ai');

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const glPulse = await getMarketPulse(details.repo, res.techStack, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPulse(glPulse);
      }, async () => {
        const glPulse = await getMarketPulse(details.repo, res.techStack);
        setPulse(glPulse);
      });

    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const runAudit = async () => {
    if (!repo || !analysis) return;
    setAuditLoading(true);
    setActiveTab('audit');
    addLog('Initiating Deep Reasoning Security Audit (Thinking Mode)...', 'ai');
    try {
      let readme = '';
      try { readme = await fetchFileContent(repo.owner, repo.repo, 'README.md'); } catch {}
      const res = await performDeepAudit(repo.repo, analysis.techStack, readme);
      setDeepAudit(res);
      addLog('Neural reasoning complete. Strategic vulnerabilities identified.', 'success');
    } catch (err) {
      addLog(`Audit engine failure: ${err}`, 'error');
    } finally { setAuditLoading(false); }
  };

  const handleBoardroomQA = async () => {
    if (!analysis?.qaScript || isSpeaking) return;
    setIsSpeaking(true);
    addLog('Initiating multi-speaker boardroom simulation...', 'ai');
    try {
      const base64 = await generateBoardroomQA(analysis.qaScript);
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64), audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch { setIsSpeaking(false); }
  };

  const handleLabTask = async (task: 'refactor' | 'test') => {
    if (!selectedFile || !fileContent) return;
    setLabLoading(true);
    addLog(`Initiating Lab Task: ${task} on ${selectedFile.name}`, 'ai');
    try {
      const result = await synthesizeLabTask(task, selectedFile.name, fileContent);
      setLabResult(result);
      setActiveTab('lab');
    } catch (err) {
      addLog(`Lab synthesis failure: ${err}`, 'error');
    } finally {
      setLabLoading(false);
    }
  };

  const startLiveBriefing = async () => {
    if (liveActive) {
      if (sessionRef.current) sessionRef.current.close();
      setLiveActive(false);
      setCameraActive(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: cameraActive });
      if (cameraActive && videoRef.current) videoRef.current.srcObject = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveActive(true);
            addLog('Neural Link Online. Multimodal stream active.', 'success');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: blob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            if (cameraActive && videoRef.current && canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              const interval = setInterval(() => {
                if (!liveActive || !videoRef.current) { clearInterval(interval); return; }
                ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
                const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } }));
              }, 1000);
            }
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
              sources.add(source);
            }
          },
          onclose: () => setLiveActive(false),
          onerror: (e) => addLog(`System error: ${e}`, 'error')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the badass CTO of GitMind. You see and hear everything the user shows you. Be sharp and technical.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { addLog(`Briefing initialization failed: ${err}`, 'error'); }
  };

  const handleGenerateVideo = async () => {
    if (!analysis) return;
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) { await (window as any).aistudio.openSelectKey(); }
      setVideoLoading(true);
      const videoUrl = await generateVisionVideo(analysis.summary);
      setVisionVideo(videoUrl);
      setActiveTab('vision');
    } catch (err) { addLog(`Render engine failure: ${err}`, 'error'); } finally { setVideoLoading(false); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !repo || !analysis) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput(''); setChatLoading(true);
    try {
      const response = await chatWithRepo(chatHistory, userMsg.text, repo.repo);
      setChatHistory(prev => [...prev, { role: 'model', text: response, timestamp: Date.now() }]);
    } finally { setChatLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-slate-800 bg-[#020617]/95 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1900px] mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-2xl text-2xl neural-pulse cursor-pointer" onClick={() => window.location.reload()}>GM</div>
            <div className="hidden lg:block">
               <span className="text-white font-extrabold tracking-tighter text-3xl block leading-none">GitMind<span className="text-indigo-500">PRO</span></span>
               <span className="text-[10px] text-slate-500 uppercase tracking-[0.5em] font-black mt-1">Foundational Intelligence v3.5</span>
            </div>
          </div>
          
          <form onSubmit={handleImport} className="flex-grow max-w-xl mx-12 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 transition-colors" />
            <input className="w-full bg-slate-900 border border-slate-800 rounded-3xl pl-16 pr-6 py-5 text-lg text-white outline-none placeholder:text-slate-600 shadow-2xl" placeholder="Inject GitHub URL..." value={url} onChange={(e) => setUrl(e.target.value)} />
          </form>

          <div className="flex items-center gap-4">
            {analysis && (
              <>
                <div className="flex bg-slate-900 rounded-2xl border border-slate-800 p-1">
                   <button onClick={() => setCameraActive(!cameraActive)} className={`p-3 rounded-xl transition-all ${cameraActive ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                      <Camera className="w-4 h-4" />
                   </button>
                   <button onClick={startLiveBriefing} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${liveActive ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                      {liveActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {liveActive ? 'Online' : 'Briefing'}
                   </button>
                </div>
                <button onClick={handleBoardroomQA} className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSpeaking ? 'bg-indigo-600 text-white animate-pulse shadow-lg shadow-indigo-500/30' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                   <Users className="w-4 h-4" /> Boardroom Q&A
                </button>
                <button onClick={runAudit} disabled={auditLoading} className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-900 border border-slate-800 text-amber-400 hover:text-white transition-all`}>
                  <BrainCircuit className="w-4 h-4" /> Deep Audit
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-12 pb-48">
        {loading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center space-y-8">
            <Loader message="Synthesizing Ecosystem DNA..." />
          </div>
        ) : repo && analysis ? (
          <div className="grid grid-cols-12 gap-12">
            
            <div className="col-span-12 xl:col-span-3 space-y-10">
               <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                  <h3 className="text-white font-black flex items-center gap-4 text-xl mb-10"><Layout className="w-6 h-6 text-indigo-400" /> Engineering</h3>
                  <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    <FileTree nodes={structure} onSelectFile={handleFileSelect} selectedPath={selectedFile?.path} />
                  </div>
                  {liveActive && cameraActive && (
                    <div className="mt-8 rounded-2xl overflow-hidden border border-rose-500/30 bg-black aspect-video relative">
                       <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
                       <canvas ref={canvasRef} className="hidden" width="320" height="240" />
                       <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-rose-600 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">Live Vision</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="col-span-12 xl:col-span-6 space-y-10">
               <div className="flex flex-wrap gap-2 p-2 bg-slate-900/50 border border-slate-800 rounded-[2rem] w-fit shadow-2xl">
                  {[
                    { id: 'intelligence', label: 'Command', icon: Shield },
                    { id: 'blueprint', label: 'Architect', icon: Activity },
                    { id: 'audit', label: 'Deep Scan', icon: BrainCircuit },
                    { id: 'vision', label: 'Vision', icon: Video },
                    { id: 'lab', label: 'Lab', icon: FlaskConical },
                    { id: 'cloud', label: 'Cloud', icon: Server },
                    { id: 'market', label: 'Pulse', icon: Globe }
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as AppTab)} className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] text-[9px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                      <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  ))}
               </div>

               {activeTab === 'intelligence' && (
                 <div className="space-y-10 animate-in fade-in duration-700">
                    <ScoreCard scores={analysis.scorecard} />
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
                       <h2 className="text-4xl font-black text-white tracking-tighter mb-8">Executive Thesis</h2>
                       <p className="text-slate-300 leading-loose text-2xl mb-12 font-medium opacity-90">{analysis.summary}</p>
                    </div>
                    {selectedFile && (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in fade-in duration-500">
                         <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-white flex items-center gap-3"><Code className="w-6 h-6 text-indigo-400" /> {selectedFile.name}</h3>
                            <div className="flex gap-4">
                               <button onClick={() => handleLabTask('refactor')} className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-[10px] font-black uppercase rounded-xl transition-all">Refactor</button>
                               <button onClick={() => handleLabTask('test')} className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-[10px] font-black uppercase rounded-xl transition-all">Generate Tests</button>
                            </div>
                         </div>
                         {fileLoading ? <Loader message="Analyzing implementation..." /> : (
                           <div className="space-y-6">
                              <p className="text-slate-400 leading-relaxed italic">{fileExplanation}</p>
                              <pre className="p-6 bg-black/40 rounded-2xl overflow-x-auto text-[10px] text-indigo-300 border border-slate-800">
                                <code>{fileContent}</code>
                              </pre>
                           </div>
                         )}
                      </div>
                    )}
                 </div>
               )}

               {activeTab === 'blueprint' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-0 shadow-2xl h-[700px] relative overflow-hidden flex flex-col">
                    <div className="p-12 pb-6 flex items-center justify-between">
                       <h2 className="text-3xl font-black text-white tracking-tighter">Dynamic Architecture</h2>
                       <button onClick={() => window.dispatchEvent(new Event('resize'))} className="text-[10px] font-black uppercase bg-slate-800 px-4 py-2 rounded-lg hover:text-indigo-400 transition-colors">Reset Layout</button>
                    </div>
                    <div className="blueprint-grid flex-grow relative bg-slate-950/50">
                       <ReactFlowProvider>
                          <BlueprintGraph nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
                       </ReactFlowProvider>
                    </div>
                 </div>
               )}

               {activeTab === 'audit' && (
                 <div className="bg-slate-900 border-2 border-amber-500/20 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px]">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4">
                       <BrainCircuit className="w-8 h-8 text-amber-500" /> Strategic Audit Analysis
                    </h2>
                    {auditLoading ? (
                       <div className="flex-grow flex flex-col items-center justify-center space-y-8 h-[400px]">
                          <div className="w-24 h-24 border-8 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                          <p className="text-xl font-black text-amber-500 animate-pulse uppercase tracking-[0.4em]">CTO Thinking...</p>
                       </div>
                    ) : deepAudit ? (
                       <div className="space-y-12">
                          <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-slate-800">
                             <h4 className="text-[10px] font-black uppercase text-amber-400 mb-6 tracking-widest">Internal Reasoning Log</h4>
                             <p className="text-slate-400 leading-loose italic">{deepAudit.reasoning}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem]">
                                <h4 className="text-[10px] font-black uppercase text-rose-500 mb-6 tracking-widest">Logic Vulnerabilities</h4>
                                <ul className="space-y-4">
                                   {deepAudit.vulnerabilities.map((v, i) => (
                                      <li key={i} className="text-sm text-slate-300 flex gap-3"><Zap className="w-4 h-4 text-rose-500 shrink-0" /> {v}</li>
                                   ))}
                                </ul>
                             </div>
                             <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem]">
                                <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-widest">Architectural Moat</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{deepAudit.architecturalDebt}</p>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="flex-grow flex flex-col items-center justify-center opacity-30 h-[400px]">
                          <BrainCircuit className="w-24 h-24 mb-8 text-slate-700" />
                          <button onClick={runAudit} className="px-8 py-4 bg-amber-600/20 border border-amber-500/30 text-amber-400 font-black rounded-2xl">Trigger Deep Reasoning</button>
                       </div>
                    )}
                 </div>
               )}

               {activeTab === 'lab' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px]">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4"><FlaskConical className="w-8 h-8 text-indigo-400" /> Engineering Lab</h2>
                    {labLoading ? <Loader message="Synthesizing changes..." /> : labResult ? (
                       <div className="space-y-8">
                          <pre className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 overflow-x-auto text-xs text-indigo-400"><code>{labResult}</code></pre>
                          <button onClick={() => setLabResult(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Clear Lab Output</button>
                       </div>
                    ) : (
                       <div className="flex-grow flex flex-col items-center justify-center opacity-30 h-[400px] text-center">
                          <Rocket className="w-20 h-20 mb-8 text-slate-700" />
                          <p className="text-lg font-black uppercase tracking-widest text-slate-600">Select a file from the explorer to begin synthesis.</p>
                       </div>
                    )}
                 </div>
               )}

               {activeTab === 'cloud' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px]">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4"><Server className="w-8 h-8 text-emerald-400" /> Cloud Architecture</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {analysis.cloudArchitecture.map((plan, i) => (
                          <div key={i} className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-xl">
                             <div className="flex justify-between items-start mb-6">
                                <h4 className="text-lg font-black text-white">{plan.serviceName}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${plan.complexity === 'Low' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{plan.complexity}</span>
                             </div>
                             <p className="text-xs text-slate-400 leading-relaxed mb-6">{plan.reasoning}</p>
                             <div className="text-[10px] font-black uppercase text-emerald-500 mb-2">{plan.platform}</div>
                             <pre className="p-4 bg-black/40 rounded-xl text-[10px] text-emerald-300 border border-slate-800 overflow-x-auto"><code>{plan.configSnippet}</code></pre>
                          </div>
                       ))}
                    </div>
                 </div>
               )}

               {activeTab === 'vision' && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px]">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4"><Sparkles className="w-8 h-8 text-purple-400" /> Cinematic Vision</h2>
                    {videoLoading ? <Loader message="Rendering Neural Reality..." /> : visionVideo ? <video src={visionVideo} controls autoPlay loop className="w-full aspect-video rounded-[2.5rem] border border-slate-800 shadow-2xl" /> : (
                       <div className="text-center opacity-30 py-40">
                          <Video className="w-20 h-20 mx-auto mb-8" />
                          <button onClick={handleGenerateVideo} className="px-8 py-4 bg-purple-600 text-white font-black rounded-2xl">Initialize Synthesis</button>
                       </div>
                    )}
                 </div>
               )}

               {activeTab === 'market' && pulse && (
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 min-h-[600px]">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-12 flex items-center gap-4"><Globe className="w-8 h-8 text-indigo-400" /> Ecosystem Pulse</h2>
                    <div className="space-y-10">
                       <p className="text-slate-300 leading-relaxed">{pulse.sentiment}</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                             <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-widest flex items-center gap-2"><MapPin className="w-4 h-4" /> Strategic Locations</h4>
                             <ul className="space-y-4">
                                {pulse.locations?.map((loc, i) => (
                                   <li key={i} className="group">
                                      <a href={loc.uri} target="_blank" rel="noreferrer" className="text-sm font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-2">
                                         {loc.name} <ExternalLink className="w-3 h-3" />
                                      </a>
                                      <p className="text-[10px] text-slate-500 mt-1">{loc.snippet}</p>
                                   </li>
                                ))}
                             </ul>
                          </div>
                          <div>
                             <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-widest flex items-center gap-2"><Activity className="w-4 h-4" /> Resources & Intel</h4>
                             <ul className="space-y-4">
                                {pulse.resources.map((res, i) => (
                                   <li key={i}>
                                      <a href={res.uri} target="_blank" rel="noreferrer" className="text-sm text-slate-300 hover:text-indigo-400 transition-colors flex items-center gap-2">
                                         {res.title} <ExternalLink className="w-3 h-3" />
                                      </a>
                                   </li>
                                ))}
                             </ul>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="col-span-12 xl:col-span-3">
               <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] flex flex-col h-[calc(100vh-250px)] sticky top-36 overflow-hidden backdrop-blur-3xl shadow-2xl">
                  <div className="p-10 border-b border-slate-800 bg-slate-900/80"><h3 className="text-white font-black text-xl tracking-tighter">Command Center</h3></div>
                  <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-6 rounded-[1.5rem] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-200'}`}>{msg.text}</div>
                      </div>
                    ))}
                    {chatLoading && <div className="text-[10px] font-black text-indigo-500 animate-pulse px-6">Thinking...</div>}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleChat} className="p-10 border-t border-slate-800 bg-slate-900/80">
                    <div className="relative"><input className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-6 pr-16 py-5 text-sm outline-none" placeholder="Inquire..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} /><button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 p-3"><Send className="w-6 h-6" /></button></div>
                  </form>
               </div>
            </div>

          </div>
        ) : (
          <div className="max-w-6xl mx-auto py-56 text-center">
             <h1 className="text-[12rem] font-black text-white mb-16 tracking-tighter leading-[0.7] bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">Neural <br/> Architecture.</h1>
             <p className="text-slate-500 text-3xl max-w-5xl mx-auto mb-28 font-medium leading-relaxed">Experience your repository through deep reasoning and real-time vision.</p>
             <button onClick={() => document.querySelector('input')?.focus()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 px-20 rounded-[2.5rem] transition-all shadow-2xl shadow-indigo-500/50 text-2xl">Initialize Scan</button>
          </div>
        )}
      </main>

      <div className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 transition-all duration-500 z-[100] ${isTerminalOpen ? 'h-[400px]' : 'h-14'}`}>
         <div className="h-14 flex items-center justify-between px-10 border-b border-slate-800 cursor-pointer" onClick={() => setIsTerminalOpen(!isTerminalOpen)}>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]"><Terminal className="w-4 h-4 text-indigo-500" /><span className="text-white">Autonomous Ecosystem Log</span></div>
            {isTerminalOpen ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronUp className="w-5 h-5 text-slate-500" />}
         </div>
         <div className="p-10 h-[340px] overflow-y-auto mono text-xs space-y-3 custom-scrollbar bg-black/40">
            {terminalLogs.map(log => (
               <div key={log.id} className="flex gap-6 items-start">
                  <span className="text-slate-700 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-black uppercase text-[8px] px-2 py-0.5 rounded shrink-0 ${log.type === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>{log.type}</span>
                  <span className="text-slate-400">{log.message}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default App;
