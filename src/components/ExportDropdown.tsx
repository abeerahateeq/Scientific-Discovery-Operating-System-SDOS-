import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  ChevronDown, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  FileCheck, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export interface ExportOption {
  format: 'csv' | 'json' | 'md' | 'pdf' | 'sps' | 'modal';
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface ExportDropdownProps {
  id?: string;
  label?: string;
  onExport: (format: 'csv' | 'json' | 'md' | 'pdf' | 'sps' | 'modal') => void;
  className?: string;
  includeSps?: boolean;
}

export default function ExportDropdown({
  id = 'export-output-dropdown',
  label = 'Export Output',
  onExport,
  className = '',
  includeSps = false
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportOptions: ExportOption[] = [
    {
      format: 'csv',
      label: 'CSV Spreadsheet (.csv)',
      sublabel: 'Statistical case matrices and summary headers',
      icon: FileSpreadsheet,
      badge: 'Data Matrix'
    },
    {
      format: 'json',
      label: 'JSON Data Package (.json)',
      sublabel: 'Full structured AST, variable dictionary & results',
      icon: FileCode,
      badge: 'Raw AST'
    },
    {
      format: 'md',
      label: 'Markdown Manuscript (.md)',
      sublabel: 'Formatted tables, APA statements & methodology',
      icon: FileText,
      badge: 'Formatted'
    },
    {
      format: 'pdf',
      label: 'Printable PDF Report (.pdf)',
      sublabel: 'Publication-ready styled document via print preview',
      icon: FileCheck,
      badge: 'Ready'
    },
    ...(includeSps ? [{
      format: 'sps' as const,
      label: 'SPSS Syntax Script (.sps)',
      sublabel: 'Native IBM SPSS command scripts & variable labels',
      icon: FileCode,
      badge: 'SPSS .sps'
    }] : []),
    {
      format: 'modal',
      label: 'Full Export & Template Suite',
      sublabel: 'APA, Nature, IEEE layouts with schema validation',
      icon: Layers,
      badge: 'Live Preview'
    }
  ];

  return (
    <div id={id} className={`relative inline-flex ${className}`} ref={dropdownRef}>
      {/* Primary Action Button */}
      <button
        type="button"
        onClick={() => onExport('modal')}
        className="px-3 py-1.5 rounded-l-lg bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all border border-emerald-500/40 border-r-0 cursor-pointer shadow-sm"
        title="Open Full Export Studio with Live Preview & Validation"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>{label}</span>
      </button>

      {/* Dropdown Chevron Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-1.5 py-1.5 rounded-r-lg bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center hover:text-white"
        title="Select Export Format (CSV, JSON, Markdown, PDF, SPS)"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-emerald-300' : 'text-emerald-400'}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1.5 w-72 bg-[#0C0F17] border border-emerald-500/40 rounded-xl shadow-2xl z-50 p-1.5 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1 text-[9.5px] font-mono text-emerald-400/90 font-bold uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
            <span>Select Export Format</span>
            <Sparkles className="w-3 h-3 text-emerald-400" />
          </div>

          <div className="flex flex-col gap-0.5 mt-0.5">
            {exportOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.format}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onExport(opt.format);
                  }}
                  className="p-2 rounded-lg hover:bg-emerald-950/40 hover:border-emerald-500/30 border border-transparent text-left flex items-start gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="p-1 rounded bg-slate-900 border border-slate-800 group-hover:border-emerald-500/50 text-slate-300 group-hover:text-emerald-300 shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-mono font-bold text-slate-200 group-hover:text-white truncate">
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 border border-emerald-500/20 shrink-0">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-sans line-clamp-1 mt-0.5">
                      {opt.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
