import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  HelpCircle, 
  RefreshCw, 
  Code, 
  ExternalLink,
  Zap,
  Info,
  Layers
} from 'lucide-react';

export type ScientificStandard = 'jats_xml' | 'bibtex' | 'ris' | 'apa7' | 'crossref';

export interface ValidationIssue {
  id: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  standard: ScientificStandard;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface ValidationResult {
  standard: ScientificStandard;
  standardName: string;
  isValid: boolean;
  score: number; // 0 to 100
  issues: ValidationIssue[];
  validatedAt: string;
  complianceLevel: 'Strict Compliance' | 'Acceptable with Warnings' | 'Non-Compliant';
}

interface FormatValidatorProps {
  data: {
    title?: string;
    author?: string;
    domain?: string;
    hypotheses?: any[];
    stats?: any;
    apaStatement?: string;
    doi?: string;
    journal?: string;
    year?: number | string;
    abstract?: string;
  };
  onValidationComplete?: (result: ValidationResult) => void;
  onAutoFix?: (fixedData: any) => void;
  className?: string;
  compact?: boolean;
}

export function validateScientificData(data: any, standard: ScientificStandard): ValidationResult {
  const issues: ValidationIssue[] = [];
  let deductions = 0;

  const title = (data?.title || '').trim();
  const author = (data?.author || '').trim();
  const year = data?.year || new Date().getFullYear();
  const domain = data?.domain || 'Scientific Discovery';
  const hypotheses = data?.hypotheses || [];
  const apaStatement = data?.apaStatement || data?.statisticalFindings?.apaStatement || '';

  switch (standard) {
    case 'jats_xml': {
      // NISO Z39.96 JATS XML Requirements
      if (!title || title.length < 5) {
        issues.push({
          id: 'jats-title-missing',
          field: '<article-title>',
          severity: 'error',
          message: 'Missing or too short <article-title> required by NISO Z39.96 JATS standard.',
          standard: 'jats_xml',
          suggestion: 'Provide a complete descriptive title for the discovery dataset.',
          autoFixable: true
        });
        deductions += 30;
      }

      if (!author) {
        issues.push({
          id: 'jats-contrib-missing',
          field: '<contrib-group>',
          severity: 'error',
          message: 'Missing author / researcher metadata in <contrib> tag.',
          standard: 'jats_xml',
          suggestion: 'Specify lead investigator name.',
          autoFixable: true
        });
        deductions += 25;
      }

      if (!data?.abstract && hypotheses.length === 0) {
        issues.push({
          id: 'jats-abstract-missing',
          field: '<abstract>',
          severity: 'warning',
          message: 'No executive abstract or structured hypothesis list present for <body> section.',
          standard: 'jats_xml',
          suggestion: 'Include at least one testable hypothesis or summary abstract.'
        });
        deductions += 15;
      }

      if (!data?.doi && !title.includes('doi:')) {
        issues.push({
          id: 'jats-doi-recommended',
          field: '<article-id pub-id-type="doi">',
          severity: 'info',
          message: 'DOI identifier is recommended for CrossRef / JATS indexing.',
          standard: 'jats_xml',
          suggestion: 'Auto-generate a 10.1000/synapse mock DOI prefix.',
          autoFixable: true
        });
        deductions += 5;
      }
      break;
    }

    case 'bibtex': {
      // BibTeX standard requirements (@article, author, title, year, journal)
      if (!title) {
        issues.push({
          id: 'bib-title',
          field: 'title = {...}',
          severity: 'error',
          message: 'BibTeX entry must contain a non-empty title field.',
          standard: 'bibtex',
          autoFixable: true
        });
        deductions += 35;
      }

      if (!author) {
        issues.push({
          id: 'bib-author',
          field: 'author = {...}',
          severity: 'error',
          message: 'Author field missing in BibTeX format (format: "LastName, FirstName" or "FirstName LastName").',
          standard: 'bibtex',
          autoFixable: true
        });
        deductions += 30;
      }

      if (!year) {
        issues.push({
          id: 'bib-year',
          field: 'year = {...}',
          severity: 'warning',
          message: 'Publication year missing in BibTeX citation record.',
          standard: 'bibtex',
          autoFixable: true
        });
        deductions += 10;
      }
      break;
    }

    case 'ris': {
      // RIS Standard (TY -, TI -, AU -, PY -, ER -)
      if (!title) {
        issues.push({
          id: 'ris-ti',
          field: 'TI  -',
          severity: 'error',
          message: 'RIS record missing required Title line (TI  -)',
          standard: 'ris'
        });
        deductions += 35;
      }

      if (!author) {
        issues.push({
          id: 'ris-au',
          field: 'AU  -',
          severity: 'error',
          message: 'RIS record missing primary Author tag (AU  -)',
          standard: 'ris'
        });
        deductions += 30;
      }
      break;
    }

    case 'apa7': {
      // APA 7th Edition rules
      if (apaStatement && !apaStatement.match(/[tpFrz]\s*\(\s*\d+(\.\d+)?\s*\)\s*=\s*-?\d+(\.\d+)?/i) && !apaStatement.match(/p\s*[<=]\s*\.?\d+/i)) {
        issues.push({
          id: 'apa-stat-format',
          field: 'Statistical Statement',
          severity: 'warning',
          message: 'Statistical statement does not strictly follow APA 7th notation (e.g., t(df) = X.XX, p = .XXX, d = X.XX).',
          standard: 'apa7',
          suggestion: 'Ensure exact degrees of freedom and italicized statistic symbols (t, F, p, r, d).'
        });
        deductions += 15;
      }

      if (title && title === title.toUpperCase()) {
        issues.push({
          id: 'apa-title-case',
          field: 'Title Capitalization',
          severity: 'warning',
          message: 'APA 7th mandates Title Case capitalization rather than ALL-CAPS.',
          standard: 'apa7',
          suggestion: 'Convert all-caps title to Title Case.',
          autoFixable: true
        });
        deductions += 10;
      }
      break;
    }

    case 'crossref': {
      if (!title) deductions += 40;
      if (!author) deductions += 30;
      break;
    }
  }

  const score = Math.max(0, 100 - deductions);
  const standardNames: Record<ScientificStandard, string> = {
    jats_xml: 'NISO JATS XML (Z39.96)',
    bibtex: 'BibTeX Academic Citation (LaTeX)',
    ris: 'RIS Research Information Systems',
    apa7: 'APA 7th Edition Behavioral Standards',
    crossref: 'CrossRef Metadata Schema (4.4.2)'
  };

  const complianceLevel = score >= 90 
    ? 'Strict Compliance' 
    : score >= 65 
      ? 'Acceptable with Warnings' 
      : 'Non-Compliant';

  return {
    standard,
    standardName: standardNames[standard],
    isValid: score >= 65,
    score,
    issues,
    validatedAt: new Date().toLocaleTimeString(),
    complianceLevel
  };
}

export default function FormatValidator({
  data,
  onValidationComplete,
  onAutoFix,
  className = '',
  compact = false
}: FormatValidatorProps) {
  const [activeStandard, setActiveStandard] = useState<ScientificStandard>('jats_xml');

  const validationResult = useMemo(() => {
    const res = validateScientificData(data, activeStandard);
    if (onValidationComplete) {
      onValidationComplete(res);
    }
    return res;
  }, [data, activeStandard, onValidationComplete]);

  const handleApplyAutoFix = () => {
    if (!onAutoFix) return;
    const fixedData = { ...data };
    
    // Auto-fix title
    if (!fixedData.title || fixedData.title.length < 5) {
      fixedData.title = 'Synapse OS Autonomous Scientific Hypothesis Dossier';
    } else if (fixedData.title === fixedData.title.toUpperCase()) {
      fixedData.title = fixedData.title
        .toLowerCase()
        .replace(/(?:^|\s)\w/g, (match: string) => match.toUpperCase());
    }

    // Auto-fix author
    if (!fixedData.author) {
      fixedData.author = 'Scholar Researcher';
    }

    // Auto-fix year
    if (!fixedData.year) {
      fixedData.year = new Date().getFullYear();
    }

    // Auto-fix DOI
    if (!fixedData.doi) {
      fixedData.doi = `10.1000/synapse.${Date.now().toString().slice(-6)}`;
    }

    onAutoFix(fixedData);
  };

  if (compact) {
    return (
      <div className={`p-2 bg-[#0B0D13] border border-slate-800 rounded-lg flex items-center justify-between gap-2 text-[10px] font-mono ${className}`}>
        <div className="flex items-center gap-1.5">
          {validationResult.score >= 90 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : validationResult.score >= 65 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          )}
          <span className="text-slate-300 font-bold">{validationResult.standardName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
            validationResult.score >= 90 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {validationResult.score}% Valid
          </span>
          {validationResult.issues.some(i => i.autoFixable) && (
            <button
              onClick={handleApplyAutoFix}
              className="px-1.5 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded text-[9px] font-bold cursor-pointer"
            >
              Auto-Fix
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#0A0D14] border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3 ${className}`}>
      {/* Standard Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Scientific Format Validator
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold ${
                validationResult.score >= 90 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : validationResult.score >= 65 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {validationResult.score}% Conformance • {validationResult.complianceLevel}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Audits metadata & structural integrity prior to export against international schemas.
            </p>
          </div>
        </div>

        {/* Standards Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['jats_xml', 'bibtex', 'ris', 'apa7'] as ScientificStandard[]).map((std) => (
            <button
              key={std}
              onClick={() => setActiveStandard(std)}
              className={`px-2 py-1 rounded-md text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                activeStandard === std
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {std === 'jats_xml' ? 'JATS XML' : std === 'bibtex' ? 'BibTeX' : std === 'ris' ? 'RIS' : 'APA 7th'}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Issues / Clean Status */}
      {validationResult.issues.length === 0 ? (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-300 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All scientific standard schema checks passed perfectly! Ready for verified export.</span>
          </div>
          <span className="text-[10px] text-emerald-400/80">100% Score</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>Detected Structural Observations ({validationResult.issues.length}):</span>
            {validationResult.issues.some(i => i.autoFixable) && (
              <button
                onClick={handleApplyAutoFix}
                className="px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded text-[9.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Zap className="w-3 h-3 text-sky-400" />
                <span>Auto-Repair All Fixable Tags</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {validationResult.issues.map((issue) => (
              <div 
                key={issue.id} 
                className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${
                  issue.severity === 'error' 
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' 
                    : issue.severity === 'warning' 
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {issue.severity === 'error' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                ) : issue.severity === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] bg-black/40 px-1 py-0.5 rounded border border-white/10">
                      {issue.field}
                    </span>
                    <span className="text-[10.5px] font-sans font-medium">{issue.message}</span>
                  </div>
                  {issue.suggestion && (
                    <p className="text-[9.5px] text-slate-400 font-sans mt-0.5">
                      Suggestion: {issue.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
