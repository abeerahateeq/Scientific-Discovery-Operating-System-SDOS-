// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught UI error caught by ErrorBoundary:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0B0D] text-slate-200 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-[#0F1115] border border-rose-500/30 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">System Exception Guarded</h2>
              <p className="text-xs text-slate-400 font-mono">
                A rendering anomaly was safely contained by Synapse OS.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-[#07080A] border border-slate-800 rounded p-3 text-left font-mono text-[10px] text-rose-300 max-h-32 overflow-y-auto leading-relaxed">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-950/30"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Workspace State
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
