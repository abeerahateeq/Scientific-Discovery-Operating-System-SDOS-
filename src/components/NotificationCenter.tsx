import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Sun, 
  Sparkles, 
  Check, 
  Trash2, 
  ChevronRight,
  Zap,
  Award
} from 'lucide-react';
import { UserNotification, db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface NotificationCenterProps {
  notifications: UserNotification[];
  onOpenBriefing: () => void;
  onSelectNotificationAction?: (notification: UserNotification) => void;
}

export default function NotificationCenter({ 
  notifications, 
  onOpenBriefing,
  onSelectNotificationAction 
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const docRef = doc(db, 'userNotifications', id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        const docRef = doc(db, 'userNotifications', n.id);
        await updateDoc(docRef, { read: true });
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const docRef = doc(db, 'userNotifications', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleNotificationClick = (n: UserNotification) => {
    if (!n.read) {
      const docRef = doc(db, 'userNotifications', n.id);
      updateDoc(docRef, { read: true }).catch(() => {});
    }

    if (n.type === 'morning_briefing') {
      onOpenBriefing();
    } else if (onSelectNotificationAction) {
      onSelectNotificationAction(n);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
        title="Process & Morning Briefing Notifications"
      >
        <Bell className="w-4 h-4 text-sky-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-rose-950/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0E1015] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-[#08090C] border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                System Notifications ({notifications.length})
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-700 mb-2" />
                <div>No process notifications yet</div>
                <div className="text-[10px] text-slate-600">Notifications appear here when AI runs complete or morning briefings are synthesized.</div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    !n.read ? 'bg-sky-950/20 hover:bg-sky-950/40' : 'bg-[#0E1015] hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'morning_briefing' ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Sun className="w-3.5 h-3.5" />
                        </div>
                      ) : n.type === 'process_done' ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="text-[9px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="p-1 rounded text-slate-500 hover:text-sky-400 hover:bg-slate-800"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
