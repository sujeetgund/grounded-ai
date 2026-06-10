import React from "react";
import Link from "next/link";
import {
  PiChatCircleTextDuotone as MessageSquare,
  PiDotsThreeVerticalBold as MoreVertical,
  PiLightningFill as Activity,
  PiTrendUpBold,
} from "react-icons/pi";
import { MdFolderCopy as Folder } from "react-icons/md";
import { IoDocuments as FileText } from "react-icons/io5";

import { DashboardHeader, NewCollectionModalButton } from "./_components/client-components";

type Collection = {
  id: string;
  name: string;
  description: string;
  docCount: number;
  lastUpdated: string;
  color?: string;
  groundingScore: number;
  created_at: string;
};

// Next.js config to ensure dynamic rendering so it always fetches fresh data
export const dynamic = 'force-dynamic';

async function getCollections(): Promise<Collection[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const res = await fetch(`${backendUrl}/collections`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const collections = await getCollections();
  
  const stats = [
    {
      label: "Total Collections",
      value: collections.length.toString(),
      icon: <Folder className="w-6 h-6 text-brand-primary" />,
      trend: "+1 this week",
    },
    {
      label: "Documents Processed",
      value: collections.reduce((acc, col) => acc + col.docCount, 0).toString(),
      icon: <FileText className="w-6 h-6 text-brand-primary" />,
      trend: "+0 this week",
    },
    {
      label: "Agent Queries Run",
      value: "0",
      icon: <Activity className="w-6 h-6 text-brand-primary" />,
      trend: "+0 this week",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-canvas-soft font-sans flex flex-col">
      <DashboardHeader />

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-8 flex flex-col gap-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mt-4">
          <div>
            <h2 className="font-display font-black text-4xl text-brand-ink mb-2">
              Welcome back, Sujeet.
            </h2>
            <p className="text-brand-body text-lg">
              Your agents have processed {stats[1].value} documents. Last active 2 hours ago.
            </p>
          </div>

          <NewCollectionModalButton />
        </div>

        {/* Command Center Stats Bar */}
        <div className="bg-brand-ink text-brand-canvas rounded-[2rem] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0 mt-2 mb-4">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary rounded-full blur-[120px] opacity-[0.15] -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-primary rounded-full blur-[100px] opacity-10 -ml-20 -mb-20 pointer-events-none"></div>
          
          {stats.map((stat, idx) => (
            <div key={idx} className={`flex flex-col relative z-10 w-full md:w-1/3 ${idx !== 0 ? 'md:pl-12 md:border-l border-brand-canvas/10 pt-6 md:pt-0 border-t md:border-t-0 border-brand-canvas/5' : 'md:pr-4'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-canvas/10 flex items-center justify-center text-brand-primary border border-brand-canvas/5">
                  {stat.icon}
                </div>
                <span className="text-brand-canvas/60 text-xs font-semibold uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
              
              <div className="flex items-end gap-4 mt-1">
                <span className="font-display font-black text-5xl tracking-tight leading-none text-white">
                  {stat.value}
                </span>
              </div>
              
              <div className="mt-5 flex items-center gap-1.5 text-brand-primary font-bold text-xs bg-brand-primary/10 w-fit px-3 py-1.5 rounded-full border border-brand-primary/20 shadow-[0_0_15px_rgba(205,248,118,0.05)]">
                <PiTrendUpBold className="w-3.5 h-3.5" />
                {stat.trend}
              </div>
            </div>
          ))}
        </div>

        <hr className="border-brand-canvas-soft border-t-2" />

        {/* Collections Section */}
        <div className="flex flex-col gap-6 mb-20">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-2xl text-brand-ink">
              Your Collections
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-brand-mute text-sm font-semibold">
                View:
              </span>
              <button className="bg-brand-canvas-soft text-brand-ink font-semibold px-4 py-1.5 rounded-lg text-sm hover:bg-brand-mute/10 transition-colors">
                Grid
              </button>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="border-2 border-dashed border-brand-canvas-soft rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-brand-canvas-soft/30 max-w-2xl mx-auto w-full my-8">
              <div className="w-16 h-16 bg-brand-canvas rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-brand-canvas-soft">
                <Folder className="w-8 h-8 text-brand-primary" />
              </div>
              <h4 className="font-display font-bold text-2xl text-brand-ink mb-2">Create your first collection</h4>
              <p className="text-brand-mute max-w-sm mb-8">Upload your documents and start chatting with a fully grounded AI agent in seconds.</p>
              <NewCollectionModalButton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((col) => {
                const isHigh = col.groundingScore >= 85;
                const isMed = col.groundingScore >= 70 && col.groundingScore < 85;
                const scoreColor = isHigh ? 'text-brand-positive bg-brand-positive/10' : isMed ? 'text-brand-warning bg-brand-warning/10' : 'text-brand-negative bg-brand-negative/10';
                const initial = col.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const color = col.color || "bg-brand-primary";

                // Format the created_at date
                const date = new Date(col.created_at);
                const timeAgo = date.toLocaleDateString();

                return (
                  <div
                    key={col.id}
                    className="bg-brand-canvas rounded-3xl p-6 shadow-sm border border-brand-canvas-soft hover:border-brand-primary hover:shadow-md transition-all h-full flex flex-col group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div
                        className={`w-12 h-12 rounded-full ${color} bg-opacity-20 flex items-center justify-center border border-brand-canvas-soft shadow-sm`}
                      >
                        <span className={`font-display font-black text-lg ${color.includes("brand-primary") ? "text-brand-primary" : color.replace("bg-", "text-")}`}
                          style={{ color: !color.includes("brand") ? color.replace("bg-[", "").replace("]", "") : undefined }}>
                          {initial}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {col.groundingScore > 0 && (
                          <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${scoreColor}`}>
                            <span className="text-[7px]">⬤</span> {col.groundingScore}% grounded
                          </div>
                        )}
                        <button className="text-brand-mute hover:text-brand-ink p-1 rounded-full hover:bg-brand-canvas-soft transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <Link href={`/collections/${col.id}`} className="font-display font-bold text-xl text-brand-ink mb-2 hover:text-brand-primary transition-colors inline-block w-fit">
                      {col.name}
                    </Link>
                    <p className="text-brand-body text-sm line-clamp-2 flex-grow mb-6">
                      {col.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-brand-canvas-soft mt-auto">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-brand-mute text-xs font-semibold">
                          <FileText className="w-4 h-4" />
                          {col.docCount} Docs
                        </div>
                        <div className="text-brand-mute text-[10px] font-semibold uppercase tracking-wider">
                          Updated {timeAgo}
                        </div>
                      </div>
                      
                      <Link 
                        href={`/collections/${col.id}/chat`}
                        className="bg-brand-canvas-soft text-brand-ink hover:bg-brand-primary hover:text-brand-on-primary text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        Chat <span className="font-serif ml-0.5">→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
