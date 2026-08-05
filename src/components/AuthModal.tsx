import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Bell,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut,
  updateProfile,
  UserProfile,
  db
} from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

export default function AuthModal({ isOpen, onClose, userProfile }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [briefingTime, setBriefingTime] = useState(userProfile?.morningBriefingTime || '08:00');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCred.user, { displayName });
        }
        setSuccessMsg("Account created successfully! Welcome to Synapse OS.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Signed in successfully!");
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const demoEmail = "scholar@synapse-os.org";
    const demoPass = "scholar2026";
    try {
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        setSuccessMsg("Signed in as Dr. Vance (Synapse Scholar Account)! Progress synced to cloud.");
      } catch (signInErr: any) {
        // If demo account doesn't exist yet, create it
        const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        await updateProfile(cred.user, { displayName: "Dr. Alexander Vance" });
        setSuccessMsg("Created & signed in as Dr. Vance! Cloud persistence enabled.");
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Quick sign-in error:", err);
      setError(err.message || "Failed to complete quick sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      const code = err?.code;
      if (code === 'auth/unauthorized-domain') {
        setError(`Google OAuth popup is restricted in preview iframes. Use Email Sign-Up or '1-Click Scholar Login' below for instant cloud sync.`);
      } else if (code === 'auth/operation-not-allowed') {
        setError("Google Sign-In requires configuration in Firebase Console. Use Email Sign-Up or '1-Click Scholar Login' below.");
      } else if (code === 'auth/popup-blocked') {
        setError("Popup was blocked by your browser. Please allow popups or use '1-Click Scholar Login'.");
      } else if (code === 'auth/popup-closed-by-user') {
        setError("Google sign-in popup was closed. Please try Email Sign-Up or '1-Click Scholar Login'.");
      } else {
        setError("Google OAuth is restricted inside sandboxed preview windows. Please use '1-Click Scholar Login' or Email Sign-Up below.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/admin-restricted-operation') {
        setSuccessMsg("Logged in as Guest Scholar (Local Mode). For cloud sync across devices, please register with Email or Google.");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(err.message || "Failed to log in as guest.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setSuccessMsg("Signed out successfully.");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        morningBriefingTime: briefingTime
      });
      setSuccessMsg("Preferences updated successfully.");
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError("Failed to update preferences.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D0F14] border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl relative p-6 text-slate-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {userProfile && !userProfile.isAnonymous ? "Researcher Account Profile" : isSignUp ? "Create Scholar Account" : "Scholar Authentication"}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Synapse OS Cloud Multi-User Storage & Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGGED IN VIEW */}
        {userProfile && !userProfile.isAnonymous ? (
          <div className="space-y-5">
            <div className="p-4 bg-[#07080A] border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-lg">
                  {userProfile.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{userProfile.displayName}</div>
                  <div className="text-xs text-slate-400 font-mono">{userProfile.email}</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Cloud Firestore User Storage Active
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <label className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Morning Briefing Delivery Schedule
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={briefingTime}
                    onChange={(e) => setBriefingTime(e.target.value)}
                    className="bg-[#0A0B0E] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-sky-500 outline-none flex-1"
                  />
                  <button
                    onClick={handleSavePreferences}
                    disabled={loading}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out of Synapse OS
            </button>
          </div>
        ) : (
          /* NOT LOGGED IN / GUEST VIEW */
          <div className="space-y-4">
            {/* Quick Action & OAuth buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-950/60"
              >
                <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
                1-Click Scholar Account (Instant Cloud Sync)
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google Login
                </button>

                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  Guest Session
                </button>
              </div>
            </div>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-[10px] text-slate-500 font-mono uppercase">or email login</span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Full Name / Academic Alias</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Dr. Alexander Vance"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[#07080A] border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Institutional Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="scholar@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#07080A] border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#07080A] border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-950/50 mt-2"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Processing..." : isSignUp ? "Register Account" : "Sign In"}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-sky-400 font-mono underline transition-colors"
              >
                {isSignUp ? "Already registered? Sign in instead" : "Need an account? Create scholar profile"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
