import React, { useState } from "react";
import { History, Sparkles, BookOpen, Bookmark, Download, Trash2, CheckCircle2, RefreshCw, Clock, Filter, ShieldCheck } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "ingest" | "hypothesis" | "bookmark" | "export" | "delete" | "phase" | "sync";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: any;
}

interface RecentActivityViewProps {
  activities: ActivityItem[];
  onClearHistory?: () => void;
}

export default function RecentActivityView({ activities, onClearHistory }: RecentActivityViewProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = activities.filter((act) => {
    if (filterType === "all") return true;
    return act.type === filterType;
  });

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "ingest":
        return <BookOpen className="w-3.5 h-3.5 text-sky-400" />;
      case "hypothesis":
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case "bookmark":
        return <Bookmark className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />;
      case "export":
        return <Download className="w-3.5 h-3.5 text-emerald-400" />;
      case "delete":
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case "phase":
        return <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />;
      case "sync":
        return <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: ActivityItem["type"]) => {
    switch (type) {
      case "ingest":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "hypothesis":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "bookmark":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-500/40";
      case "export":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "delete":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "phase":
        return "bg-violet-500/20 text-violet-300 border-violet-500/40";
      case "sync":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full bg-[#0A0B0D] text-slate-200 p-1">
      {/* Header bar */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">
              Recent Activity & Audit Timeline
            </h2>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Chronological log of paper ingests, hypothesis syntheses, export backups, and bookmarks
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#07080A] border border-slate-800 rounded-lg p-1 text-[10px] font-mono">
            <Filter className="w-3 h-3 text-slate-500 ml-1" />
            <button
              onClick={() => setFilterType("all")}
              className={`px-2 py-0.5 rounded ${filterType === "all" ? "bg-sky-500/20 text-sky-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("hypothesis")}
              className={`px-2 py-0.5 rounded ${filterType === "hypothesis" ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Hypotheses
            </button>
            <button
              onClick={() => setFilterType("ingest")}
              className={`px-2 py-0.5 rounded ${filterType === "ingest" ? "bg-sky-500/20 text-sky-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Ingest
            </button>
            <button
              onClick={() => setFilterType("export")}
              className={`px-2 py-0.5 rounded ${filterType === "export" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Exports
            </button>
            <button
              onClick={() => setFilterType("bookmark")}
              className={`px-2 py-0.5 rounded ${filterType === "bookmark" ? "bg-yellow-500/20 text-yellow-200 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Bookmarks
            </button>
          </div>
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="flex-1 bg-[#0F1115] border border-slate-800 rounded-xl p-4 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 text-slate-500 font-mono text-[11px] border border-dashed border-slate-800/80 rounded-lg">
            <Clock className="w-8 h-8 text-slate-600 mb-2" />
            <p>No activity records match the selected filter category.</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-800/80 ml-4 pl-6 flex flex-col gap-4 py-2">
            {filtered.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline node icon dot */}
                <div className="absolute -left-[35px] top-0.5 p-1 rounded-full bg-[#0D0F16] border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getIcon(item.type)}
                </div>

                <div className="bg-[#07080A] hover:bg-[#16181D]/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3 transition-all flex flex-col gap-1 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8.5px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${getTypeBadge(item.type)}`}>
                        {item.type}
                      </span>
                      <h4 className="text-[12px] font-bold text-slate-200 font-sans">{item.title}</h4>
                    </div>
                    <span className="text-[9.5px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-0.5">
                    {item.description}
                  </p>

                  {item.user && (
                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 mt-1 pt-1.5 border-t border-slate-900">
                      <ShieldCheck className="w-3 h-3 text-sky-400" />
                      <span>Initiated by: {item.user}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
