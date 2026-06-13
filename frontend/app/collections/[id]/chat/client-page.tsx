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

export default function ChatClientPage({ collection }: { collection: any }) {
  const [isTraceOpen, setIsTraceOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const documents = collection?.documents || [];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am your GroundedAI agent. Ask me anything about the documents in this collection.',
    }
  ]);

  const [traces, setTraces] = useState<Trace[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isGenerating) return;
    
    const userMsg: Message = { id: Date.now(), role: 'user', content: query };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setQuery('');
    setIsGenerating(true);
    setIsTraceOpen(true);
    setTraces([]);
    
    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isLoading: true }]);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/collections/${collection.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // sse_starlette uses \r\n to separate lines, and \r\n\r\n to separate events.
        // We'll split by \n\n or \r\n\r\n depending on the exact wire format.
        // A safer way is to split by double newline.
        const parts = buffer.split(/(?:\r?\n){2,}/);
        
        // The last part might be incomplete, keep it in the buffer
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          
          const lines = part.split(/\r?\n/);
          let currentEvent = 'message';
          let dataStr = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr += line.substring(5).trim();
            }
          }

          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'trace') {
                setTraces(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  step: data.node || data.status,
                  status: data.status?.includes('✗') || data.status?.includes('failed') ? 'warning' : 'success',
                  detail: data.status,
                  time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })
                }]);
              } else if (currentEvent === 'message') {
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantId) {
                    return {
                      ...m,
                      content: data.content,
                      isLoading: false,
                      groundingScore: data.is_grounded ? 98 : 45,
                      isFallback: data.is_fallback || false,
                      sources: data.sources || []
                    };
                  }
                  return m;
                }));
                setIsGenerating(false);
              } else if (currentEvent === 'error') {
                setIsGenerating(false);
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantId) return { ...m, content: `Error: ${data.detail}`, isLoading: false };
                  return m;
                }));
              }
            } catch (e) {
              console.error("Failed to parse SSE data", e, "Data string:", dataStr);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setMessages(prev => prev.map(m => {
        if (m.id === assistantId) return { ...m, content: 'Sorry, I encountered an error.', isLoading: false };
        return m;
      }));
    }
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
            {documents.map((doc: { id: string, filename: string }) => (
              <div key={doc.id} className="flex items-start gap-3 p-2 hover:bg-brand-canvas-soft rounded-lg cursor-pointer transition-colors">
                <FileText className="w-5 h-5 text-brand-ink flex-shrink-0 mt-0.5" />
                <span className="text-sm text-brand-ink font-medium leading-snug truncate">{doc.filename}</span>
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
