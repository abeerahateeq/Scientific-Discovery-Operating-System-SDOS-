import React, { useState } from 'react';
import { SpssAnalysisPackage } from '../../types';
import { Download, FileText, FileSpreadsheet, FileCode, CheckCircle2, Copy, X, Check } from 'lucide-react';

interface SpssExportModalProps {
  analysisPackage: SpssAnalysisPackage;
  isOpen: boolean;
  onClose: () => void;
}

export default function SpssExportModal({
  analysisPackage,
  isOpen,
  onClose
}: SpssExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'sps' | 'apa'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate JSON Report
  const generateJsonReport = () => {
    const reportData = {
      exportType: 'SDOS_SPSS_Statistical_Report',
      version: '2026.4',
      generatedAt: new Date().toISOString(),
      protocol: {
        id: analysisPackage.id,
        title: analysisPackage.title,
        domain: analysisPackage.domain,
        hypothesisTitle: analysisPackage.hypothesisTitle,
        analysisType: analysisPackage.analysisType,
      },
      results: {
        testStatistic: analysisPackage.outputSummary.testStatistic,
        pValue: analysisPackage.outputSummary.pValue,
        significance: analysisPackage.outputSummary.significanceFormatted,
        effectSize: analysisPackage.outputSummary.effectSize,
        confidenceInterval: analysisPackage.outputSummary.confidenceInterval,
        apa7thStatement: analysisPackage.outputSummary.apaFormatString,
        interpretation: analysisPackage.outputSummary.interpretation,
        recommendation: analysisPackage.outputSummary.recommendation,
        tables: analysisPackage.outputSummary.tables,
      },
      variableDictionary: analysisPackage.dataset.variables,
      datasetRowsCount: analysisPackage.dataset.rows.length,
      datasetPreview: analysisPackage.dataset.rows.slice(0, 10),
      spssCommandSyntax: analysisPackage.spssSyntaxScript,
    };
    return JSON.stringify(reportData, null, 2);
  };

  // Generate CSV Report (Includes Summary + All Data Rows)
  const generateCsvReport = () => {
    const vars = analysisPackage.dataset.variables;
    const rows = analysisPackage.dataset.rows;

    let csv = '';
    // Section 1: Statistical Analysis Summary Header
    csv += `# IBM SPSS STATISTICAL ANALYSIS REPORT\n`;
    csv += `# Protocol: "${analysisPackage.title.replace(/"/g, '""')}"\n`;
    csv += `# Domain: "${analysisPackage.domain.replace(/"/g, '""')}"\n`;
    csv += `# Analysis Type: ${analysisPackage.analysisType}\n`;
    csv += `# Test Statistic: ${analysisPackage.outputSummary.testStatistic}\n`;
    csv += `# Significance: ${analysisPackage.outputSummary.significanceFormatted}\n`;
    csv += `# Effect Size: ${analysisPackage.outputSummary.effectSize}\n`;
    csv += `# APA 7th Statement: "${analysisPackage.outputSummary.apaFormatString.replace(/"/g, '""')}"\n`;
    csv += `# Date Generated: ${new Date().toISOString()}\n\n`;

    // Section 2: Variable Dictionary
    csv += `# VARIABLE DICTIONARY\n`;
    csv += `Variable_Name,Variable_Label,Data_Type,Measurement_Scale,Decimals\n`;
    vars.forEach((v) => {
      csv += `"${v.name}","${(v.label || v.name).replace(/"/g, '""')}","${v.type}","${v.measure}",${v.decimals ?? 0}\n`;
    });
    csv += `\n`;

    // Section 3: Dataset Rows
    csv += `# DATASET CASES MATRIX (N=${rows.length})\n`;
    csv += `Case_Index,${vars.map((v) => `"${v.name}"`).join(',')}\n`;
    rows.forEach((r, idx) => {
      const vals = vars.map((v) => {
        const val = r[v.name] !== undefined ? r[v.name] : r[v.label];
        if (val === undefined || val === null) return '';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val;
      });
      csv += `${idx + 1},${vals.join(',')}\n`;
    });

    return csv;
  };

  // Generate APA Markdown Report
  const generateApaReport = () => {
    return `# 📊 APA 7th Edition Statistical Discovery Report
**Protocol:** ${analysisPackage.title}  
**Scientific Domain:** ${analysisPackage.domain}  
**Hypothesis:** ${analysisPackage.hypothesisTitle || 'Target Empirical Investigation'}  
**Procedure:** ${analysisPackage.analysisType.replace(/_/g, ' ')}  
**Generated Date:** ${new Date().toLocaleDateString()}  

---

## 📝 APA 7th Edition Manuscript Statement
> "${analysisPackage.outputSummary.apaFormatString}"

## 🔢 Inferential Test Metrics
- **Test Statistic:** \`${analysisPackage.outputSummary.testStatistic}\`
- **Significance Level:** \`${analysisPackage.outputSummary.significanceFormatted}\` (p = ${analysisPackage.outputSummary.pValue})
- **Effect Size:** \`${analysisPackage.outputSummary.effectSize}\`
- **Confidence Interval:** \`${analysisPackage.outputSummary.confidenceInterval}\`

## 💡 Methodological Interpretation
${analysisPackage.outputSummary.interpretation}

## 🚀 Actionable Research Recommendation
${analysisPackage.outputSummary.recommendation}

---

## 💻 IBM SPSS® Syntax (.sps)
\`\`\`spss
${analysisPackage.spssSyntaxScript}
\`\`\`
`;
  };

  const getExportContent = () => {
    switch (exportFormat) {
      case 'json':
        return generateJsonReport();
      case 'csv':
        return generateCsvReport();
      case 'apa':
        return generateApaReport();
      case 'sps':
        return analysisPackage.spssSyntaxScript;
    }
  };

  const handleDownload = () => {
    const content = getExportContent();
    let mimeType = 'application/json';
    let fileExt = 'json';

    if (exportFormat === 'csv') {
      mimeType = 'text/csv;charset=utf-8;';
      fileExt = 'csv';
    } else if (exportFormat === 'sps') {
      mimeType = 'text/plain;charset=utf-8;';
      fileExt = 'sps';
    } else if (exportFormat === 'apa') {
      mimeType = 'text/markdown;charset=utf-8;';
      fileExt = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysisPackage.id || 'SPSS_Analysis'}_Report.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F1115] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fadeIn">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Export SPSS Analysis Output
              </h2>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Download structured results, variable schema, and protocol configurations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Format Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setExportFormat('json')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'json'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-[#07080A] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileCode className="w-4 h-4 text-indigo-400" />
                {exportFormat === 'json' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <span className="font-mono text-xs font-bold text-slate-200 mt-1">JSON Report</span>
              <span className="text-[9.5px] text-slate-500 leading-tight">Full metadata & nested tables</span>
            </button>

            <button
              onClick={() => setExportFormat('csv')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'csv'
                  ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-[#07080A] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                {exportFormat === 'csv' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="font-mono text-xs font-bold text-slate-200 mt-1">CSV Report</span>
              <span className="text-[9.5px] text-slate-500 leading-tight">Summary + All Data Rows</span>
            </button>

            <button
              onClick={() => setExportFormat('apa')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'apa'
                  ? 'bg-amber-600/20 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-[#07080A] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileText className="w-4 h-4 text-amber-400" />
                {exportFormat === 'apa' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <span className="font-mono text-xs font-bold text-slate-200 mt-1">APA 7th (.md)</span>
              <span className="text-[9.5px] text-slate-500 leading-tight">Manuscript text & stats</span>
            </button>

            <button
              onClick={() => setExportFormat('sps')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'sps'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-[#07080A] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileCode className="w-4 h-4 text-purple-400" />
                {exportFormat === 'sps' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <span className="font-mono text-xs font-bold text-slate-200 mt-1">SPSS .SPS</span>
              <span className="text-[9.5px] text-slate-500 leading-tight">Executable SPSS script</span>
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Preview Generated File:</span>
              <span>Format: {exportFormat.toUpperCase()}</span>
            </div>
            <pre className="bg-[#050608] border border-slate-800 rounded-xl p-3.5 font-mono text-[10.5px] text-slate-300 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {getExportContent()}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Content'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-mono text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(99,102,241,0.5)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {exportFormat.toUpperCase()} File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
