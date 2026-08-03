import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  MessageSquare, 
  LifeBuoy, 
  SendHorizontal, 
  CheckCircle2, 
  Compass, 
  ChevronRight, 
  HelpCircle,
  AlertCircle,
  ShieldAlert,
  Zap,
  BookOpen,
  Network,
  Cpu,
  Layers,
  Award
} from 'lucide-react';
import { UserProfile } from '../lib/firebase';

interface RobloxGuideBotProps {
  currentTab: string;
  onNavigateTab?: (tab: any) => void;
  userProfile?: UserProfile | null;
  onTriggerNotification?: (title: string, message: string, type?: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bloxbot';
  text: string;
  timestamp: string;
  canNotifyTeam?: boolean;
}

export default function RobloxGuideBot({
  currentTab,
  onNavigateTab,
  userProfile,
  onTriggerNotification
}: RobloxGuideBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'bloxbot',
      text: "👋 Bleep Bloop! Welcome to Synapse OS! I am **BloxBot**, your gamified Roblox research assistant (LVL 99). Ask me anything about Knowledge Graphs, Evolutionary Tournaments, Paper Ingest, or Grants! If I ever get stuck, you can notify our dev team directly! 🚀",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      canNotifyTeam: true
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Team Notification Modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyCategory, setNotifyCategory] = useState('Feature Request / App Query');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  // Avatar emotion state: 'happy' | 'excited' | 'thinking' | 'explaining'
  const [emotion, setEmotion] = useState<'happy' | 'excited' | 'thinking' | 'explaining'>('happy');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleAsk = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);
    setEmotion('thinking');

    try {
      const res = await fetch('/api/guide/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, currentTab })
      });
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bloxbot',
        text: data.answer || "Bleep bloop! I've analyzed your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        canNotifyTeam: data.canNotifyTeam ?? true
      };

      setMessages(prev => [...prev, botMsg]);
      setEmotion(data.emotion || 'happy');
    } catch (err) {
      console.error("BloxBot Ask error:", err);
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bloxbot',
        text: "⚡ My blocky antenna hit a network glitch! But don't worry—you can click **'Notify Team'** below to ask our engineering team directly!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        canNotifyTeam: true
      };
      setMessages(prev => [...prev, errorMsg]);
      setEmotion('explaining');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTeamNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyMessage.trim()) return;

    setNotifyLoading(true);
    setNotifySuccess(null);

    try {
      const res = await fetch('/api/guide/notify-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: userProfile?.email || 'scholar@synapse-os.org',
          userName: userProfile?.displayName || 'Guest Scholar',
          category: notifyCategory,
          message: notifyMessage
        })
      });
      const data = await res.json();

      if (data.success) {
        setNotifySuccess(data.message);
        setNotifyMessage('');
        
        // Trigger system notification
        if (onTriggerNotification) {
          onTriggerNotification(
            "Support Ticket Created",
            `Ticket ${data.ticketId}: Sent to Synapse OS engineering team!`,
            "system"
          );
        }

        // Append to chat
        const ticketBotMsg: ChatMessage = {
          id: `bot_ticket_${Date.now()}`,
          sender: 'bloxbot',
          text: `🎉 **Ticket Logged Successfully!** Reference ID: \`${data.ticketId}\`. Our core team has been notified and will review your message!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, ticketBotMsg]);

        setTimeout(() => {
          setShowNotifyModal(false);
          setNotifySuccess(null);
        }, 2200);
      }
    } catch (err) {
      console.error("Notify team error:", err);
    } finally {
      setNotifyLoading(false);
    }
  };

  return (
    <>
      {/* FLOATING ROBLOX MASCOT AVATAR TRIGGER (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
        {/* Cute Speech Bubble Hint when collapsed */}
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="mb-2 bg-[#12151E] border border-sky-500/40 text-slate-200 text-[11px] font-mono px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer hover:border-sky-400 hover:scale-105 transition-all group animate-bounce"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span>Hey Scholar! Ask <b>BloxBot</b> or take a tour! 🎮</span>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}

        {/* Roblox Blocky Character Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-1.5 rounded-2xl bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-600 border-2 border-sky-400/80 shadow-2xl shadow-sky-950/80 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Open Roblox BloxBot Assistant"
        >
          {/* Roblox Character Block Visual */}
          <div className="relative w-12 h-12 bg-[#0D111A] rounded-xl border border-sky-400/50 flex flex-col items-center justify-center overflow-hidden">
            
            {/* Antenna block */}
            <div className="absolute top-0.5 w-2 h-1 bg-amber-400 rounded-sm animate-pulse"></div>

            {/* Blocky Face / Visor */}
            <div className="w-9 h-6 bg-slate-950 rounded border border-sky-500/60 flex items-center justify-center gap-1.5 mt-1 shadow-inner">
              {emotion === 'thinking' ? (
                <div className="text-[10px] font-mono text-amber-400 animate-pulse font-bold">...</div>
              ) : emotion === 'excited' ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-2 bg-sky-400 rounded-sm"></div>
                  <div className="w-1.5 h-2 bg-sky-400 rounded-sm"></div>
                </div>
              )}
            </div>

            {/* Blocky Emblem Shirt */}
            <div className="w-8 h-2.5 bg-sky-600 rounded-b-sm mt-0.5 flex items-center justify-center text-[7px] font-extrabold text-white font-mono tracking-tighter">
              ROBLOX
            </div>
          </div>

          {/* Level 99 Badge */}
          <span className="absolute -top-2 -left-2 bg-amber-500 text-slate-950 text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded-full border border-amber-300 shadow">
            LVL 99
          </span>
        </button>
      </div>

      {/* CHAT INTERACTIVE DRAWER / POPUP */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-h-[580px] h-[80vh] bg-[#0A0C11] border-2 border-sky-500/40 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#0E121B] via-[#121826] to-[#0E121B] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* BloxBot Avatar Icon */}
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/50 flex flex-col items-center justify-center relative shrink-0">
                <div className="w-6 h-4 bg-slate-950 rounded border border-sky-400 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                </div>
                <div className="w-5 h-1 bg-amber-400 rounded-full mt-0.5"></div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">
                    BloxBot Mascot Guide
                  </h3>
                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                    LVL 99
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Synapse OS Gamified AI Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowNotifyModal(true)}
                className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                title="Directly send a support ticket to engineering team"
              >
                <LifeBuoy className="w-3 h-3 text-rose-400" />
                <span>Notify Team</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Quick Tour Chips */}
          <div className="p-2.5 bg-[#07090D] border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 no-scrollbar">
            <button
              onClick={() => handleAsk("Give me a quick tour of all features in Synapse OS!")}
              className="shrink-0 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <Compass className="w-3 h-3 text-sky-400" /> App Tour
            </button>
            <button
              onClick={() => handleAsk("How does the Evolutionary Tournament for hypotheses work?")}
              className="shrink-0 px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <Cpu className="w-3 h-3 text-purple-400" /> Tournament
            </button>
            <button
              onClick={() => handleAsk("How do I use Knowledge Graph and predict missing links?")}
              className="shrink-0 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <Network className="w-3 h-3 text-emerald-400" /> Graph Links
            </button>
            <button
              onClick={() => handleAsk("How do I ingest research papers and PDFs?")}
              className="shrink-0 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-amber-400" /> Ingest PDF
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3.5 bg-[#090B10]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-slate-500">
                  <span>{msg.sender === 'user' ? 'You (Scholar)' : 'BloxBot Guide'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-[#121622] text-slate-200 border border-slate-800 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* Fallback / Notify Team action chip */}
                  {msg.sender === 'bloxbot' && msg.canNotifyTeam && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Didn't find what you need?</span>
                      <button
                        onClick={() => {
                          setNotifyMessage(`Question regarding: "${msg.text.slice(0, 60)}..."`);
                          setShowNotifyModal(true);
                        }}
                        className="text-rose-400 hover:text-rose-300 underline font-bold flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" /> Notify Team
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-[#121622] border border-slate-800 rounded-2xl max-w-[80%]">
                <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-sky-300 font-mono animate-pulse">
                  BloxBot is synthesizing guide response...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[#0B0D13] border-t border-slate-800/80 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask BloxBot basic or complex questions..."
              className="flex-1 bg-[#050609] border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-sans"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* NOTIFY TEAM MODAL */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D0F16] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Notify Synapse OS Team</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Direct developer ticket & inquiry channel
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNotifyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifySuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{notifySuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendTeamNotification} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Inquiry Category</label>
                <select
                  value={notifyCategory}
                  onChange={(e) => setNotifyCategory(e.target.value)}
                  className="w-full bg-[#07090E] border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                >
                  <option value="Feature Request / App Query">Feature Request / App Functionality Query</option>
                  <option value="Unresolved Question">Unresolved BloxBot Question</option>
                  <option value="Bug Report">Technical Issue / Bug Report</option>
                  <option value="Data / Grant Request">Custom Data / Grant Integration</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Your Message / Unanswered Question</label>
                <textarea
                  required
                  rows={4}
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="Describe what you were trying to do or what question BloxBot couldn't answer..."
                  className="w-full bg-[#07090E] border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400">
                Logged user: <span className="text-white font-bold">{userProfile?.email || "Guest Scholar"}</span>. A reference ticket ID will be generated upon submission.
              </div>

              <button
                type="submit"
                disabled={notifyLoading || !notifyMessage.trim()}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
              >
                <Send className="w-4 h-4" />
                {notifyLoading ? "Submitting Ticket..." : "Submit Ticket to Dev Team"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
