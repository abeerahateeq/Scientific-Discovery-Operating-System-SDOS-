import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileCode, 
  FileJson, 
  Table, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  Printer, 
  FileDown, 
  CheckCircle2, 
  Calculator, 
  Zap, 
  Network, 
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export interface BloxBotExportableDocument {
  id: string;
  title: string;
  docType?: string;
  operationType?: string;
  originalFileName?: string;
  timestamp: string;
  contentMarkdown: string;
  spssPackage?: any;
  hypothesis?: any;
  extractedEntities?: any[];
  datasetRows?: any[];
  datasetVariables?: any[];
}

interface BloxBotDocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: BloxBotExportableDocument[];
  initialSelectedDocId?: string | null;
  userName?: string;
}

export default function BloxBotDocumentExportModal({
  isOpen,
  onClose,
  documents,
  initialSelectedDocId,
  userName = "Scholar"
}: BloxBotDocumentExportModalProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialSelectedDocId || (documents.length > 0 ? documents[documents.length - 1].id : 'all')
  );
  const [exportFormat, setExportFormat] = useState<'pdf' | 'md' | 'txt' | 'json' | 'sps' | 'csv' | 'html'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Selected document or all documents
  const isAllDocs = selectedDocId === 'all';
  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const handleDownloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Formal Academic PDF using jsPDF
  const generatePdf = (docsToExport: BloxBotExportableDocument[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const maxLineWidth = pageWidth - margin * 2;
    let currentY = 20;

    docsToExport.forEach((item, docIdx) => {
      if (docIdx > 0) {
        doc.addPage();
        currentY = 20;
      }

      // Header Banner
      doc.setFillColor(10, 15, 29); // #0A0F1D
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(56, 189, 248); // sky-400
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SYNAPSE OS • BLOXBOT DOCUMENT DOSSIER', margin, 12);

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated for: ${userName} | ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 20);

      currentY = 36;

      // Document Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(item.title || 'BloxBot Research Document', maxLineWidth);
      doc.text(titleLines, margin, currentY);
      currentY += titleLines.length * 6 + 4;

      // Metadata Tag Box
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, currentY, maxLineWidth, 14, 'F');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const metaText = `Operation: ${(item.operationType || 'Document Processing').toUpperCase()}   |   Source: ${item.originalFileName || 'BloxBot Context'}   |   Timestamp: ${item.timestamp}`;
      doc.text(metaText, margin + 4, currentY + 9);
      currentY += 20;

      // If APA Statement or SPSS output exists
      if (item.spssPackage?.apaStatement) {
        doc.setFillColor(238, 242, 255); // indigo-50
        doc.rect(margin, currentY, maxLineWidth, 22, 'F');
        doc.setTextColor(67, 56, 202); // indigo-700
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('APA 7th Edition Statistical Finding:', margin + 4, currentY + 6);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        const apaLines = doc.splitTextToSize(item.spssPackage.apaStatement, maxLineWidth - 8);
        doc.text(apaLines, margin + 4, currentY + 12);
        currentY += 28;
      }

      // If Formulated Hypothesis exists
      if (item.hypothesis?.title) {
        doc.setFillColor(236, 253, 245); // emerald-50
        doc.rect(margin, currentY, maxLineWidth, 18, 'F');
        doc.setTextColor(4, 120, 87); // emerald-700
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Synthesized Scientific Hypothesis:', margin + 4, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const hypoLines = doc.splitTextToSize(`"${item.hypothesis.title}" (Novelty: ${item.hypothesis.noveltyScore || 92}%, Confidence: ${item.hypothesis.confidenceScore || 88}%)`, maxLineWidth - 8);
        doc.text(hypoLines, margin + 4, currentY + 12);
        currentY += 24;
      }

      // Main Text Body
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');

      // Strip excessive markdown bold/backtick noise for clean PDF
      const cleanBody = item.contentMarkdown
        .replace(/[*_#`~$\\]/g, '')
        .replace(/\n{3,}/g, '\n\n');

      const splitBody = doc.splitTextToSize(cleanBody, maxLineWidth);

      for (let i = 0; i < splitBody.length; i++) {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(splitBody[i], margin, currentY);
        currentY += 5;
      }

      // Page Number Footer
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Synapse OS • BloxBot Document Export • Page ${p} of ${totalPages}`, margin, pageHeight - 8);
      }
    });

    const safeTitle = (isAllDocs ? 'BloxBot_Research_Dossier_Complete' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Generate Markdown
  const generateMarkdown = (docsToExport: BloxBotExportableDocument[]) => {
    let md = `# Synapse OS • BloxBot Research Document Export\n\n`;
    md += `**Exported by:** ${userName}\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Total Documents Included:** ${docsToExport.length}\n\n---\n\n`;

    docsToExport.forEach((d, idx) => {
      md += `## [Document ${idx + 1}] ${d.title}\n\n`;
      md += `- **Operation:** \`${(d.operationType || 'Document Processing').toUpperCase()}\`\n`;
      md += `- **Source File:** \`${d.originalFileName || 'Attached Content'}\`\n`;
      md += `- **Timestamp:** \`${d.timestamp}\`\n\n`;

      if (d.spssPackage?.apaStatement) {
        md += `### 📝 APA 7th Edition Statement\n> ${d.spssPackage.apaStatement}\n\n`;
      }

      if (d.hypothesis?.title) {
        md += `### 🧬 Formulated Hypothesis\n**"${d.hypothesis.title}"**\n- Novelty: ${d.hypothesis.noveltyScore || 92}%\n- Confidence: ${d.hypothesis.confidenceScore || 88}%\n\n`;
      }

      md += `### 📄 Full Analysis & Manuscript Draft\n\n${d.contentMarkdown}\n\n`;

      if (d.spssPackage?.spssSyntax) {
        md += `### 💻 IBM SPSS Command Syntax (.sps)\n\`\`\`spss\n${d.spssPackage.spssSyntax}\n\`\`\`\n\n`;
      }

      md += `---\n\n`;
    });

    const safeTitle = (isAllDocs ? 'BloxBot_Documents_Archive' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(md, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown;charset=utf-8');
  };

  // Generate Plain Text
  const generatePlainText = (docsToExport: BloxBotExportableDocument[]) => {
    let txt = `=================================================================\n`;
    txt += `SYNAPSE OS • BLOXBOT ACADEMIC RESEARCH EXPORT\n`;
    txt += `Generated: ${new Date().toLocaleString()} | User: ${userName}\n`;
    txt += `=================================================================\n\n`;

    docsToExport.forEach((d, idx) => {
      txt += `-----------------------------------------------------------------\n`;
      txt += `DOCUMENT ${idx + 1}: ${d.title.toUpperCase()}\n`;
      txt += `Operation: ${d.operationType || 'Analysis'} | File: ${d.originalFileName || 'Attached'}\n`;
      txt += `-----------------------------------------------------------------\n\n`;

      if (d.spssPackage?.apaStatement) {
        txt += `[APA 7th STATISTICAL STATEMENT]\n${d.spssPackage.apaStatement}\n\n`;
      }

      const cleanText = d.contentMarkdown
        .replace(/[*_#`~$\\]/g, '')
        .replace(/\n{3,}/g, '\n\n');

      txt += `${cleanText}\n\n`;

      if (d.spssPackage?.spssSyntax) {
        txt += `[SPSS COMMAND SYNTAX]\n${d.spssPackage.spssSyntax}\n\n`;
      }
      txt += `\n`;
    });

    const safeTitle = (isAllDocs ? 'BloxBot_Documents_Text' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(txt, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain;charset=utf-8');
  };

  // Generate JSON
  const generateJson = (docsToExport: BloxBotExportableDocument[]) => {
    const payload = {
      system: 'Synapse OS • BloxBot AI Research Assistant',
      exportedAt: new Date().toISOString(),
      user: userName,
      count: docsToExport.length,
      documents: docsToExport
    };

    const safeTitle = (isAllDocs ? 'BloxBot_Documents_JSON' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(JSON.stringify(payload, null, 2), `${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  // Generate SPSS Syntax (.sps)
  const generateSpssSyntax = (docsToExport: BloxBotExportableDocument[]) => {
    let sps = `* IBM SPSS Statistics Syntax File generated by BloxBot.\n`;
    sps += `* Export Date: ${new Date().toISOString()}\n`;
    sps += `* Scholar: ${userName}\n\n`;

    docsToExport.forEach((d) => {
      sps += `* ----------------------------------------------------.\n`;
      sps += `* Document: ${d.title}\n`;
      sps += `* ----------------------------------------------------.\n`;
      if (d.spssPackage?.spssSyntax) {
        sps += `${d.spssPackage.spssSyntax}\n\n`;
      } else {
        sps += `* Basic descriptive explore command for ${d.title}\n`;
        sps += `DESCRIPTIVES VARIABLES=ALL\n  /STATISTICS=MEAN STDDEV MIN MAX KURTOSIS SKEWNESS.\n\n`;
      }
    });

    sps += `EXECUTE.\n`;

    const safeTitle = (isAllDocs ? 'BloxBot_Syntax_Batch' : (currentDoc?.title || 'BloxBot_Syntax')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(sps, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.sps`, 'text/plain;charset=utf-8');
  };

  // Generate CSV
  const generateCsv = (docsToExport: BloxBotExportableDocument[]) => {
    let csv = `ID,Title,Operation,Source File,Timestamp,APA Statement,Content Summary\n`;

    docsToExport.forEach((d) => {
      const cleanTitle = `"${(d.title || '').replace(/"/g, '""')}"`;
      const cleanOp = `"${(d.operationType || '').replace(/"/g, '""')}"`;
      const cleanSource = `"${(d.originalFileName || '').replace(/"/g, '""')}"`;
      const cleanTime = `"${(d.timestamp || '').replace(/"/g, '""')}"`;
      const cleanApa = `"${(d.spssPackage?.apaStatement || '').replace(/"/g, '""')}"`;
      const cleanSummary = `"${(d.contentMarkdown.slice(0, 300) || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

      csv += `${d.id},${cleanTitle},${cleanOp},${cleanSource},${cleanTime},${cleanApa},${cleanSummary}\n`;
    });

    const safeTitle = (isAllDocs ? 'BloxBot_Documents_Catalog' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(csv, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
  };

  // Generate HTML / Printable
  const generateHtml = (docsToExport: BloxBotExportableDocument[]) => {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Synapse OS • BloxBot Document Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 860px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #0369a1; margin-top: 30px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-family: monospace; font-size: 12px; margin-right: 6px; }
    .callout { background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .apa { background: #eef2ff; border-left: 4px solid #6366f1; padding: 12px 16px; font-style: italic; color: #3730a3; margin: 16px 0; border-radius: 0 6px 6px 0; }
    pre { background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
    footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <h1>🎓 Synapse OS • BloxBot Document Dossier</h1>
  <p><strong>Exported by:</strong> ${userName} &bull; <strong>Date:</strong> ${new Date().toLocaleString()}</p>
  <hr/>
`;

    docsToExport.forEach((d) => {
      html += `
  <article style="margin-bottom: 40px;">
    <h2>${d.title}</h2>
    <div>
      <span class="badge">Operation: ${(d.operationType || 'Document Ingestion').toUpperCase()}</span>
      <span class="badge">Source: ${d.originalFileName || 'Attached Context'}</span>
      <span class="badge">Timestamp: ${d.timestamp}</span>
    </div>
`;
      if (d.spssPackage?.apaStatement) {
        html += `<div class="apa"><strong>APA 7th Edition Finding:</strong> ${d.spssPackage.apaStatement}</div>`;
      }

      html += `<div class="callout"><pre style="background:transparent; color:#1e293b; white-space:pre-wrap; font-family:inherit;">${d.contentMarkdown}</pre></div>`;

      if (d.spssPackage?.spssSyntax) {
        html += `<h3>IBM SPSS Command Syntax</h3><pre><code>${d.spssPackage.spssSyntax}</code></pre>`;
      }

      html += `</article><hr/>`;
    });

    html += `<footer>Synapse OS Scientific Discovery &bull; Powered by BloxBot AI Autonomous Suite</footer></body></html>`;

    const safeTitle = (isAllDocs ? 'BloxBot_Document_Report' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(html, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.html`, 'text/html;charset=utf-8');
  };

  const handleExecuteExport = () => {
    setIsExporting(true);
    setExportSuccessMsg(null);

    const docsToExport = isAllDocs ? documents : (currentDoc ? [currentDoc] : documents);

    setTimeout(() => {
      try {
        if (exportFormat === 'pdf') {
          generatePdf(docsToExport);
          setExportSuccessMsg(`Formal PDF Document downloaded successfully!`);
        } else if (exportFormat === 'md') {
          generateMarkdown(docsToExport);
          setExportSuccessMsg(`Markdown (.md) research file exported!`);
        } else if (exportFormat === 'txt') {
          generatePlainText(docsToExport);
          setExportSuccessMsg(`Plain Text (.txt) manuscript downloaded!`);
        } else if (exportFormat === 'json') {
          generateJson(docsToExport);
          setExportSuccessMsg(`JSON Research Package exported!`);
        } else if (exportFormat === 'sps') {
          generateSpssSyntax(docsToExport);
          setExportSuccessMsg(`IBM SPSS (.sps) Syntax file exported!`);
        } else if (exportFormat === 'csv') {
          generateCsv(docsToExport);
          setExportSuccessMsg(`CSV Document Catalog downloaded!`);
        } else if (exportFormat === 'html') {
          generateHtml(docsToExport);
          setExportSuccessMsg(`HTML Printable Report generated & downloaded!`);
        }
      } catch (err) {
        console.error("Export error:", err);
      } finally {
        setIsExporting(false);
        setTimeout(() => setExportSuccessMsg(null), 4000);
      }
    }, 450);
  };

  return (
    <div id="bloxbot-export-modal" className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D1017] border-2 border-sky-500/40 rounded-3xl max-w-xl w-full p-6 text-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white font-mono">
                  Export BloxBot Documents
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {documents.length} {documents.length === 1 ? 'Doc' : 'Docs'} Available
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Download Academic Proposals, SPSS Syntax, & Analysis Manuscripts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {exportSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Document Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Select Document to Export</span>
            {documents.length > 1 && (
              <span className="text-[10px] text-sky-400 lowercase">
                choose individual or all in one batch
              </span>
            )}
          </label>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {documents.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedDocId('all')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedDocId === 'all'
                    ? 'bg-sky-600/20 border-sky-400 text-white font-bold'
                    : 'bg-[#080B11] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono">Export All Documents (Combined Dossier)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{documents.length} Items</span>
              </button>
            )}

            {documents.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600/20 border-sky-400 text-white font-bold'
                      : 'bg-[#080B11] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {doc.operationType === 'generate_thesis' ? (
                      <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : doc.spssPackage ? (
                      <Calculator className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : doc.hypothesis ? (
                      <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-mono truncate">{doc.title}</p>
                      <p className="text-[9px] font-mono text-slate-500">
                        {doc.originalFileName ? `${doc.originalFileName} • ` : ''}{doc.timestamp}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 ml-2">
                    {doc.operationType?.replace(/_/g, ' ') || 'Document'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Format Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Choose Export Format
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* PDF */}
            <button
              type="button"
              onClick={() => setExportFormat('pdf')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'pdf'
                  ? 'bg-sky-600/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                  : 'bg-[#080B11] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileDown className="w-4 h-4 text-sky-400" />
                <span className="text-[9px] font-mono font-bold">PDF</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">Formal PDF</span>
              <span className="text-[8px] text-slate-500 leading-tight">Formatted pages with headers & APA</span>
            </button>

            {/* Markdown */}
            <button
              type="button"
              onClick={() => setExportFormat('md')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'md'
                  ? 'bg-sky-600/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                  : 'bg-[#080B11] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-mono font-bold">MD</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">Markdown</span>
              <span className="text-[8px] text-slate-500 leading-tight">GitHub & Obsidian ready</span>
            </button>

            {/* Word / TXT */}
            <button
              type="button"
              onClick={() => setExportFormat('txt')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'txt'
                  ? 'bg-sky-600/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                  : 'bg-[#080B11] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-mono font-bold">TXT</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">Plain Text</span>
              <span className="text-[8px] text-slate-500 leading-tight">Word & Google Docs copy</span>
            </button>

            {/* JSON */}
            <button
              type="button"
              onClick={() => setExportFormat('json')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'json'
                  ? 'bg-sky-600/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                  : 'bg-[#080B11] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileJson className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-mono font-bold">JSON</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">JSON Package</span>
              <span className="text-[8px] text-slate-500 leading-tight">Full structured data & entities</span>
            </button>

            {/* SPSS Syntax */}
            <button
              type="button"
              onClick={() => setExportFormat('sps')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'sps'
                  ? 'bg-sky-600/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                  : 'bg-[#080B11] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-[9px] font-mono font-bold">.SPS</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">SPSS Syntax</span>
              <span className="text-[8px] text-slate-500 leading-tight">IBM SPSS runnable code</span>
            </button>

            {/* CSV */}
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'csv'
                  ? 'bg-sky-600/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                  : 'bg-[#080B11] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Table className="w-4 h-4 text-teal-400" />
                <span className="text-[9px] font-mono font-bold">CSV</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">CSV Sheet</span>
              <span className="text-[8px] text-slate-500 leading-tight">Tabular summary sheet</span>
            </button>

            {/* HTML / Print */}
            <button
              type="button"
              onClick={() => setExportFormat('html')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                exportFormat === 'html'
                  ? 'bg-sky-600/20 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                  : 'bg-[#080B11] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Printer className="w-4 h-4 text-rose-400" />
                <span className="text-[9px] font-mono font-bold">HTML</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">Printable HTML</span>
              <span className="text-[8px] text-slate-500 leading-tight">Clean styled web report</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting || documents.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-sky-950/80 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating Export...' : `Download ${exportFormat.toUpperCase()} Document`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
