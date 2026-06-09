'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PiFileTextDuotone as FileText,
  PiChatCircleTextDuotone as MessageSquare,
  PiMagnifyingGlassDuotone as Search,
  PiGearDuotone as Settings,
  PiCaretLeftBold as ChevronLeft,
  PiInfoDuotone as Info,
  PiCheckCircleFill as CheckCircle2,
  PiXCircleFill as XCircle,
  PiWarningCircleFill as AlertCircle,
  PiPaperPlaneRightFill as Send,
  PiSpinnerGapBold as Loader2,
  PiArrowSquareOutDuotone as ExternalLink,
  PiBookOpenDuotone as BookOpen
} from 'react-icons/pi';
import Link from 'next/link';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Source = { type: 'doc' | 'web'; name: string; page?: string; url?: string; };
type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  groundingScore?: number;
  sources?: Source[];
  isFallback?: boolean;
  isLoading?: boolean;
  isStreaming?: boolean;
};
type Trace = {
  id: number;
  step: string;
  status: 'success' | 'warning' | 'error' | 'loading';
  time?: string;
  detail?: string;
};

export default function ChatPage() {
  const [isTraceOpen, setIsTraceOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const documents = [
    { id: '1', name: 'Q3_Financial_Report.pdf', type: 'doc' },
    { id: '2', name: 'User_Research_2023.pdf', type: 'doc' },
    { id: '3', name: 'Architecture_RFC.md', type: 'doc' },
    { id: '4', name: 'Security_Audit.pdf', type: 'doc' },
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'user',
      content: 'What were our key findings from the Q3 user research regarding onboarding drop-offs?',
    },
    {
      id: 2,
      role: 'assistant',
      content: 'Based on the Q3 User Research, the primary reason for onboarding drop-offs was the complexity of the identity verification step [1]. Specifically, 42% of users abandoned the flow when asked to upload a secondary form of ID [1].',
      groundingScore: 94,
      sources: [
        { type: 'doc', name: 'User_Research_2023.pdf', page: 'p. 14' }
      ]
    }
  ]);

  const [traces, setTraces] = useState<Trace[]>([
    { id: 1, step: 'Query received', status: 'success', time: '0.01s' },
    { id: 2, step: 'Retriever → 4 chunks fetched', status: 'success', time: '0.8s' },
    { id: 3, step: 'Relevance Grader → 4 relevant', status: 'success', time: '1.2s' },
    { id: 4, step: 'Answer Generated', status: 'success', time: '2.4s' },
    { id: 5, step: 'Hallucination Check → 94% grounded', status: 'success', time: '1.1s' },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isGenerating) return;
    
    const userMsg: Message = { id: Date.now(), role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsGenerating(true);
    setIsTraceOpen(true);
    setTraces([]);
    
    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isLoading: true }]);

    // Simulation Sequence
    const steps = [
      { step: 'Query received', delay: 200, status: 'success', time: '0.02s' },
      { step: 'Retriever fetching chunks...', delay: 800, status: 'loading' },
      { step: 'Retriever → 3 chunks fetched', delay: 1400, status: 'success', time: '0.6s', replace: true },
      { step: 'Relevance Grader evaluating...', delay: 1800, status: 'loading' },
      { 
        step: 'Relevance Grader → 0 relevant', 
        delay: 2400, 
        status: 'warning', 
        time: '0.8s', 
        replace: true,
        detail: 'The retrieved document chunks lacked sufficient context to answer the query accurately.'
      },
      { 
        step: 'CRAG Loop: Web Fallback', 
        delay: 2800, 
        status: 'success', 
        time: '1.2s',
        detail: 'Agent autonomously searched external domains to fill the knowledge gap.'
      },
      { step: 'Answer generation...', delay: 3200, status: 'loading' }
    ];

    steps.forEach((s) => {
       setTimeout(() => {
          setTraces(prev => {
             if (s.replace) {
                 const newTraces = [...prev];
                 newTraces[newTraces.length - 1] = { 
                   id: Date.now(), 
                   step: s.step, 
                   status: s.status as any, 
                   time: s.time,
                   detail: s.detail
                 };
                 return newTraces;
             }
             return [...prev, { 
               id: Date.now(), 
               step: s.step, 
               status: s.status as any, 
               time: s.time,
               detail: s.detail
             }];
          });
       }, s.delay);
    });

    const streamStart = 3800;
    const finalAnswer = `I couldn't find the exact information in your collection docs, but according to web sources, the standard requires Level 2 Presentation Attack Detection (PAD) which defends against complex artifacts like 3D curved paper masks and silicone masks [1].

Here is a quick breakdown of PAD levels:

| PAD Level | Attack Types Detected | Example Artifacts |
| :--- | :--- | :--- |
| **Level 1** | Simple 2D | Printed photos, screens |
| **Level 2** | Complex 2D / Simple 3D | Video playback, curved paper masks |
| **Level 3** | Complex 3D | Silicone masks, detailed 3D models |

To implement this securely, ensure you follow these **core principles**:
* **Liveness Detection**: Require users to perform an action (e.g., blink or smile).
* **Texture Analysis**: Detect non-skin surfaces like paper or silicone.

You can initiate the PAD verification using our standard \`verifyLiveness\` endpoint:
\`\`\`typescript
const response = await api.post('/v1/verify', {
  sessionId: "sess_123",
  padLevel: 2,
  streamedVideo: true
});
\`\`\`
Let me know if you need more details on how these are implemented in our architecture!`;
    
    setTimeout(() => {
      setTraces(prev => {
        const newTraces = [...prev];
        newTraces[newTraces.length - 1] = { id: Date.now(), step: 'Answer Generated', status: 'success', time: '1.9s' };
        return newTraces;
      });
      
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isLoading: false } : m));
      
      let words = finalAnswer.split(' ');
      let currentWordIdx = 0;
      let currentText = '';
      
      const streamInterval = setInterval(() => {
         const chunkLength = Math.floor(Math.random() * 3) + 1;
         const chunk = words.slice(currentWordIdx, currentWordIdx + chunkLength).join(' ');
         
         if (chunk) {
           currentText += (currentWordIdx === 0 ? '' : ' ') + chunk;
         }
         currentWordIdx += chunkLength;

         setMessages(prev => prev.map(m => {
            if (m.id === assistantId) {
               return { ...m, content: currentText, isStreaming: true };
            }
            return m;
         }));

         if (currentWordIdx >= words.length) {
            clearInterval(streamInterval);
            setMessages(prev => prev.map(m => {
               if (m.id === assistantId) {
                  return { 
                    ...m, 
                    content: finalAnswer, 
                    isStreaming: false,
                    groundingScore: 72, 
                    isFallback: true, 
                    sources: [
                      { type: 'web', name: 'Biometric Security Guide', url: 'https://example.com', page: 'example.com' }
                    ] 
                  };
               }
               return m;
            }));
            setTraces(prev => [...prev, { id: Date.now(), step: 'Hallucination Check → 72% grounded', status: 'warning', time: '0.9s' }]);
            setIsGenerating(false);
         }
      }, 50);
    }, streamStart);
  };

  return (
    <TooltipProvider delay={200}>
      <div className="h-screen w-full bg-brand-canvas-soft flex overflow-hidden font-sans">
      
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col p-6 gap-6 h-full overflow-y-auto">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 rounded-full bg-brand-canvas flex items-center justify-center shadow-sm hover:bg-brand-primary-pale transition-colors">
            <ChevronLeft className="w-5 h-5 text-brand-ink" />
          </Link>
          <h2 className="font-display font-black text-2xl text-brand-ink tracking-tight">GroundedAI</h2>
        </div>
        
        <div className="bg-brand-canvas rounded-xl p-5 shadow-sm flex flex-col gap-4 border-none flex-grow">
          <div>
            <h3 className="text-brand-mute text-xs font-semibold uppercase tracking-wider mb-1">Collection</h3>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg text-brand-ink">Product Strategy</span>
              <Settings className="w-4 h-4 text-brand-mute cursor-pointer" />
            </div>
          </div>
          
          <hr className="border-brand-canvas-soft" />
          
          <div className="flex flex-col gap-2 flex-grow">
            <h3 className="text-brand-mute text-xs font-semibold uppercase tracking-wider mb-2">Documents ({documents.length})</h3>
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 p-2 hover:bg-brand-canvas-soft rounded-lg cursor-pointer transition-colors">
                <FileText className="w-5 h-5 text-brand-ink flex-shrink-0 mt-0.5" />
                <span className="text-sm text-brand-ink font-medium leading-snug truncate">{doc.name}</span>
              </div>
            ))}
          </div>

          <button className="w-full bg-brand-canvas-soft hover:bg-brand-primary-pale text-brand-ink font-semibold py-3 px-4 rounded-xl transition-colors text-sm">
            + Upload Document
          </button>
        </div>
      </div>

      {/* Center Chat Area */}
      <div className="flex-grow flex flex-col p-6 pl-0">
        <div className="bg-brand-canvas rounded-xl shadow-sm flex flex-col h-full relative overflow-hidden">
          
          <div className="h-16 border-b border-brand-canvas-soft flex items-center px-6 justify-between flex-shrink-0 z-10 bg-brand-canvas">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-brand-primary" />
              <h3 className="font-display font-bold text-xl text-brand-ink">Chat with Collection</h3>
            </div>
            
            <button 
              onClick={() => setIsTraceOpen(!isTraceOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                isTraceOpen ? 'bg-brand-primary-pale text-brand-positive-deep' : 'bg-brand-canvas-soft text-brand-ink hover:bg-brand-primary-pale'
              }`}
            >
              <Info className="w-4 h-4" />
              {isTraceOpen ? 'Hide Agent Trace' : 'Show Agent Trace'}
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-8 pb-32">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                
                {msg.role === 'user' && (
                  <div className="bg-brand-primary-pale text-brand-ink px-6 py-4 rounded-2xl rounded-tr-sm">
                    <p className="text-[15px] font-medium leading-relaxed">{msg.content}</p>
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-brand-ink flex items-center justify-center">
                        <span className="text-brand-primary text-xs font-bold">AI</span>
                      </div>
                      
                      {msg.isLoading && (
                        <div className="flex items-center gap-2 text-brand-mute text-sm font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing sources...
                        </div>
                      )}
                      
                      {msg.groundingScore && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          msg.groundingScore > 90 ? 'bg-brand-positive-pale text-brand-positive-deep' : 
                          msg.groundingScore > 70 ? 'bg-brand-warning/20 text-brand-warning-deep' : 
                          'bg-brand-negative/10 text-brand-negative'
                        }`}>
                          {msg.groundingScore > 90 ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                           msg.groundingScore > 70 ? <AlertCircle className="w-3.5 h-3.5" /> : 
                           <XCircle className="w-3.5 h-3.5" />}
                          {msg.groundingScore}% Grounded
                        </div>
                      )}
                      
                      {msg.isFallback && (
                         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-canvas-soft text-brand-mute">
                           <Search className="w-3.5 h-3.5" />
                           Web Fallback
                         </div>
                      )}
                    </div>
                    
                    {!msg.isLoading && (
                      <div className="text-brand-body text-[15px] leading-relaxed relative">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, href, children, ...props }) => {
                              if (href?.startsWith('#cite-')) {
                                const sourceIdx = parseInt(href.replace('#cite-', ''), 10) - 1;
                                const source = msg.sources && msg.sources[sourceIdx] ? msg.sources[sourceIdx] : null;

                                return (
                                  <Tooltip key={sourceIdx}>
                                    <TooltipTrigger className="inline-block mx-0.5 align-middle -top-[1px] relative cursor-default">
                                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-canvas-soft border border-brand-mute/20 text-[10px] font-bold text-brand-ink cursor-pointer hover:bg-brand-primary hover:text-brand-on-primary hover:border-brand-primary transition-colors">
                                        {children}
                                      </span>
                                    </TooltipTrigger>
                                    {source && (
                                      <TooltipContent side="top" sideOffset={6} className="bg-brand-ink text-brand-canvas text-xs px-3 py-2 rounded-xl shadow-xl flex flex-col gap-0.5 w-max max-w-[220px] border-none pointer-events-none">
                                        <span className="font-bold truncate leading-tight">{source.name}</span>
                                        {source.page && <span className="text-brand-canvas/70 font-medium text-[10px] mt-0.5">{source.type === 'doc' ? 'Page' : 'Source'} • {source.page}</span>}
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                );
                              }
                              return <a href={href} className="text-brand-primary hover:underline font-semibold" {...props}>{children}</a>;
                            },
                            table: ({node, ...props}) => <div className="overflow-x-auto my-5 border border-brand-canvas-soft rounded-xl shadow-sm"><table className="w-full text-left border-collapse text-sm" {...props} /></div>,
                            th: ({node, ...props}) => <th className="border-b border-brand-canvas-soft bg-brand-canvas-soft/40 px-4 py-3 font-semibold text-brand-ink" {...props} />,
                            td: ({node, ...props}) => <td className="border-b border-brand-canvas-soft px-4 py-3 text-brand-ink" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1.5" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-brand-ink" {...props} />,
                            code: ({node, className, children, ...props}: any) => {
                              const isInline = !className?.includes('language-');
                              return isInline ? (
                                <code className="bg-brand-canvas-soft px-1.5 py-0.5 rounded-md text-brand-ink font-mono text-[13px]" {...props}>{children}</code>
                              ) : (
                                <pre className="bg-[#1c1c1c] text-brand-canvas p-4 rounded-xl overflow-x-auto font-mono text-[13px] my-4 shadow-sm border border-[#2a2a2a]"><code className={className} {...props}>{children}</code></pre>
                              );
                            }
                          }}
                        >
                          {msg.content.replace(/\[(\d+)\]/g, '[$1](#cite-$1)')}
                        </ReactMarkdown>
                        {msg.isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-brand-primary animate-pulse align-middle rounded-[1px] relative -top-0.5"></span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-canvas via-brand-canvas to-transparent pt-12">
            <form onSubmit={handleSubmit} className="relative flex items-center bg-brand-canvas-soft rounded-2xl p-2 pr-2 shadow-sm border border-transparent focus-within:border-brand-primary focus-within:bg-brand-canvas transition-all">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isGenerating}
                placeholder={isGenerating ? "Agent is thinking..." : "Ask a question about your documents..."}
                className="flex-grow bg-transparent border-none outline-none text-brand-ink px-4 py-3 text-[15px] placeholder:text-brand-mute disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isGenerating || !query.trim()}
                className="bg-brand-primary text-brand-on-primary p-3.5 rounded-xl hover:bg-brand-primary-active disabled:opacity-50 disabled:hover:bg-brand-primary transition-colors flex items-center justify-center flex-shrink-0"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 ml-1 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
              </button>
            </form>
            <div className="text-center mt-3 text-xs text-brand-mute">
              GroundedAI can make mistakes. Always verify the source attribution.
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Agent Trace */}
      {isTraceOpen && (
        <div className="w-80 flex-shrink-0 flex flex-col p-6 pl-0 h-full overflow-y-auto transition-all duration-300 transform translate-x-0">
          <div className="bg-brand-ink rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden text-brand-primary">
            
            <div className="flex items-center gap-3 mb-6">
              <Loader2 className={`w-5 h-5 text-brand-primary ${isGenerating ? 'animate-spin' : ''}`} />
              <h3 className="font-display font-bold text-xl text-brand-canvas">Agent Trace</h3>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-5">
              {traces.length === 0 && !isGenerating && (
                 <div className="text-brand-mute text-sm text-center mt-10">
                    No active traces. Ask a question to see the agent reasoning.
                 </div>
              )}
              {traces.map((trace, idx) => (
                <div key={trace.id} className="flex gap-4 relative">
                  {idx < traces.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-10px] w-px bg-brand-primary/20 z-0"></div>
                  )}
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-[3px] border-brand-ink mt-0.5 ${
                    trace.status === 'success' ? 'bg-brand-primary' : 
                    trace.status === 'warning' ? 'bg-brand-warning' : 
                    trace.status === 'loading' ? 'bg-brand-primary/20' : 'bg-brand-negative'
                  }`}>
                    {trace.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-ink" />}
                    {trace.status === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-brand-ink" />}
                    {trace.status === 'loading' && <Loader2 className="w-3 h-3 text-brand-primary animate-spin" />}
                  </div>
                  
                  <div className="flex flex-col pb-4">
                    <span className={`text-sm font-semibold ${trace.status === 'loading' ? 'text-brand-mute' : 'text-brand-canvas'}`}>
                      {trace.step}
                    </span>
                    {trace.time && <span className="text-brand-primary/70 text-xs mt-0.5">{trace.time}</span>}
                    {trace.detail && (
                      <div className="mt-2 p-3 bg-brand-primary/10 border border-brand-primary/10 rounded-xl text-brand-primary/90 text-[13px] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                        {trace.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
