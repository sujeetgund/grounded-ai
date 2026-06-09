'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  PiCaretLeftBold, 
  PiPlayCircleFill,
  PiShieldCheckDuotone,
  PiTargetDuotone,
  PiListNumbersDuotone,
  PiSpinnerGapBold,
  PiArrowsMergeDuotone,
  PiCaretDownBold,
  PiCaretUpBold,
  PiWarningCircleFill
} from 'react-icons/pi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

type EvalRun = {
  id: string;
  date: string;
  faithfulness: number;
  answerRelevancy: number;
  contextPrecision: number;
  loopTriggerRate: number;
  queriesRun: number;
};

type FailedQuery = {
  id: string;
  query: string;
  score: number;
  metric: string;
  chunks: number;
};

export default function EvalDashboardPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isFailedQueriesOpen, setIsFailedQueriesOpen] = useState(false);
  
  const [runs, setRuns] = useState<EvalRun[]>([
    { id: 'run-100', date: 'Oct 10', faithfulness: 85, answerRelevancy: 80, contextPrecision: 78, loopTriggerRate: 15, queriesRun: 125 },
    { id: 'run-101', date: 'Oct 17', faithfulness: 90, answerRelevancy: 85, contextPrecision: 82, loopTriggerRate: 18, queriesRun: 140 },
    { id: 'run-102', date: 'Oct 24', faithfulness: 92, answerRelevancy: 88, contextPrecision: 85, loopTriggerRate: 22, queriesRun: 150 },
  ]);

  const baseline = {
    faithfulness: 68,
    answerRelevancy: 72,
    contextPrecision: 55,
    loopTriggerRate: 0
  };

  const failedQueries: FailedQuery[] = [
    { id: 'fq-1', query: "What is the exact penalty for late submission of the compliance form?", score: 62, metric: "Faithfulness", chunks: 3 },
    { id: 'fq-2', query: "Can you summarize the Q3 earnings report specifically for the APAC region?", score: 68, metric: "Answer Relevancy", chunks: 5 },
    { id: 'fq-3', query: "How do I configure the secondary fallback routing in the API gateway?", score: 55, metric: "Context Precision", chunks: 2 },
  ];

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setTimeout(() => {
      setRuns([...runs, {
        id: `run-103`,
        date: 'Oct 31',
        faithfulness: 94,
        answerRelevancy: 91,
        contextPrecision: 88,
        loopTriggerRate: 24,
        queriesRun: 155
      }]);
      setIsRunning(false);
    }, 3000);
  };

  const latestRun = runs[runs.length - 1];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-brand-positive';
    if (score >= 70) return 'text-brand-warning';
    return 'text-brand-negative';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-brand-positive-pale';
    if (score >= 70) return 'bg-brand-warning/20';
    return 'bg-brand-negative/20';
  };

  const calculateDelta = (current: number, base: number) => {
    const diff = current - base;
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  return (
    <div className="min-h-screen bg-brand-canvas-soft font-sans flex flex-col">
      {/* Header NavBar */}
      <header className="bg-brand-canvas px-8 py-4 flex items-center justify-between border-b border-brand-canvas-soft">
        <div className="flex items-center gap-4">
          <Link href="/collections/123" className="w-10 h-10 rounded-full bg-brand-canvas-soft flex items-center justify-center hover:bg-brand-primary-pale transition-colors">
            <PiCaretLeftBold className="w-5 h-5 text-brand-ink" />
          </Link>
          <div>
            <h1 className="font-display font-black text-2xl text-brand-ink leading-none">Product Strategy</h1>
            <span className="text-xs text-brand-mute font-semibold uppercase tracking-wider">Evaluation Dashboard</span>
          </div>
        </div>
        
        <button 
          onClick={handleRunBenchmark}
          disabled={isRunning}
          className="bg-brand-primary text-brand-on-primary hover:bg-brand-primary-active disabled:opacity-50 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          {isRunning ? <PiSpinnerGapBold className="w-5 h-5 animate-spin" /> : <PiPlayCircleFill className="w-5 h-5" />}
          {isRunning ? 'Running Eval...' : 'Run Benchmark'}
        </button>
      </header>

      <main className="grow max-w-6xl w-full mx-auto p-8 flex flex-col gap-8 overflow-y-auto">
        
        {/* Baseline Comparison Header */}
        <div className="bg-brand-ink text-brand-canvas rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
          
          <div className="flex flex-col gap-2 relative z-10 max-w-lg">
            <span className="text-brand-primary font-bold tracking-widest uppercase text-xs">Performance Impact</span>
            <h2 className="font-display font-black text-3xl">GroundedAI vs Naive RAG</h2>
            <p className="text-brand-canvas/70 leading-relaxed text-sm">
              By utilizing the corrective agentic loop and intelligent chunk ranking, GroundedAI significantly outperforms standard vector-search baselines.
            </p>
          </div>

          <div className="flex gap-4 mt-6 md:mt-0 relative z-10 w-full md:w-auto">
            <div className="flex flex-col items-center p-5 bg-brand-canvas/10 rounded-2xl border border-brand-canvas/10 flex-1 md:flex-none">
              <span className="text-brand-canvas/60 text-xs font-semibold uppercase tracking-wider mb-2">Faithfulness</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">{latestRun.faithfulness}%</span>
                <span className="text-brand-positive font-bold text-sm mb-1 bg-brand-positive/20 px-2 py-0.5 rounded-full">{calculateDelta(latestRun.faithfulness, baseline.faithfulness)}%</span>
              </div>
            </div>
            <div className="flex flex-col items-center p-5 bg-brand-canvas/10 rounded-2xl border border-brand-canvas/10 flex-1 md:flex-none">
              <span className="text-brand-canvas/60 text-xs font-semibold uppercase tracking-wider mb-2">Ans. Relevancy</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">{latestRun.answerRelevancy}%</span>
                <span className="text-brand-positive font-bold text-sm mb-1 bg-brand-positive/20 px-2 py-0.5 rounded-full">{calculateDelta(latestRun.answerRelevancy, baseline.answerRelevancy)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-brand-canvas rounded-2xl p-5 shadow-sm border border-brand-canvas-soft flex flex-col gap-1 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 blur-xl ${getScoreBg(latestRun.faithfulness)} opacity-50`}></div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <PiShieldCheckDuotone className="w-5 h-5 text-brand-ink" />
              <div className="text-brand-ink font-bold text-sm">Faithfulness</div>
            </div>
            <span className={`font-display font-black text-4xl relative z-10 ${getScoreColor(latestRun.faithfulness)}`}>
              {latestRun.faithfulness}%
            </span>
            <p className="text-brand-mute font-medium text-xs mt-1 relative z-10">Factuality against context documents.</p>
          </div>

          <div className="bg-brand-canvas rounded-2xl p-5 shadow-sm border border-brand-canvas-soft flex flex-col gap-1 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 blur-xl ${getScoreBg(latestRun.answerRelevancy)} opacity-50`}></div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <PiTargetDuotone className="w-5 h-5 text-brand-ink" />
              <div className="text-brand-ink font-bold text-sm">Answer Relevancy</div>
            </div>
            <span className={`font-display font-black text-4xl relative z-10 ${getScoreColor(latestRun.answerRelevancy)}`}>
              {latestRun.answerRelevancy}%
            </span>
            <p className="text-brand-mute font-medium text-xs mt-1 relative z-10">Directness of answer to the query.</p>
          </div>

          <div className="bg-brand-canvas rounded-2xl p-5 shadow-sm border border-brand-canvas-soft flex flex-col gap-1 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 blur-xl ${getScoreBg(latestRun.contextPrecision)} opacity-50`}></div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <PiListNumbersDuotone className="w-5 h-5 text-brand-ink" />
              <div className="text-brand-ink font-bold text-sm">Context Precision</div>
            </div>
            <span className={`font-display font-black text-4xl relative z-10 ${getScoreColor(latestRun.contextPrecision)}`}>
              {latestRun.contextPrecision}%
            </span>
            <p className="text-brand-mute font-medium text-xs mt-1 relative z-10">Quality of document chunk ranking.</p>
          </div>

          <div className="bg-brand-canvas rounded-2xl p-5 shadow-sm border border-brand-canvas-soft flex flex-col gap-1 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 blur-xl bg-brand-primary-pale opacity-50`}></div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <PiArrowsMergeDuotone className="w-5 h-5 text-brand-ink" />
              <div className="text-brand-ink font-bold text-sm">Corrective Loop Triggered</div>
            </div>
            <span className={`font-display font-black text-4xl relative z-10 text-brand-primary`}>
              {latestRun.loopTriggerRate}%
            </span>
            <p className="text-brand-mute font-medium text-xs mt-1 relative z-10">Agent self-corrected poor retrievals.</p>
          </div>
        </div>

        {/* History Line Chart */}
        <div className="bg-brand-canvas rounded-3xl p-8 shadow-sm border border-brand-canvas-soft">
          <h3 className="font-display font-bold text-xl text-brand-ink mb-6">Evaluation Score Trends</h3>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runs} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8b8f97', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8b8f97', fontWeight: 500 }} domain={[50, 100]} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '12px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '2px 0' }}
                  labelStyle={{ fontSize: '12px', color: '#8b8f97', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <Line type="monotone" dataKey="faithfulness" name="Faithfulness" stroke="#10b981" strokeWidth={3} dot={{ r: 5, strokeWidth: 0, fill: '#10b981' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="answerRelevancy" name="Answer Relevancy" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="contextPrecision" name="Context Precision" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, strokeWidth: 0, fill: '#8b5cf6' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failed Queries Section */}
        <div className="bg-brand-canvas rounded-3xl shadow-sm border border-brand-canvas-soft overflow-hidden mb-12">
          <button 
            onClick={() => setIsFailedQueriesOpen(!isFailedQueriesOpen)}
            className="w-full px-8 py-5 flex items-center justify-between bg-brand-canvas hover:bg-brand-canvas-soft transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-negative/10 flex items-center justify-center">
                <PiWarningCircleFill className="w-6 h-6 text-brand-negative" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-brand-ink leading-tight">Failed Queries Tracking</h3>
                <span className="text-xs text-brand-mute font-semibold uppercase tracking-wider">Queries scoring below 70% threshold</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-canvas-soft flex items-center justify-center">
              {isFailedQueriesOpen ? <PiCaretUpBold className="w-4 h-4 text-brand-ink" /> : <PiCaretDownBold className="w-4 h-4 text-brand-ink" />}
            </div>
          </button>
          
          {isFailedQueriesOpen && (
            <div className="px-8 pb-6 pt-2 bg-brand-canvas border-t border-brand-canvas-soft">
              <div className="grid grid-cols-12 gap-4 py-4 border-b border-brand-canvas-soft text-xs font-bold text-brand-mute uppercase tracking-wider">
                <div className="col-span-6">Query Text</div>
                <div className="col-span-3">Failing Metric</div>
                <div className="col-span-3 text-right">Retrieved Chunks</div>
              </div>
              
              <div className="flex flex-col">
                {failedQueries.map((fq, idx) => (
                  <div key={fq.id} className={`grid grid-cols-12 gap-4 py-5 items-center ${idx !== failedQueries.length - 1 ? 'border-b border-brand-canvas-soft border-dashed' : ''}`}>
                    <div className="col-span-6 text-sm font-semibold text-brand-ink pr-4 leading-relaxed">"{fq.query}"</div>
                    <div className="col-span-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold bg-brand-negative/10 ${getScoreColor(fq.score)}`}>
                        {fq.score}% {fq.metric}
                      </span>
                    </div>
                    <div className="col-span-3 text-right text-sm text-brand-mute font-bold">
                      {fq.chunks} chunks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
