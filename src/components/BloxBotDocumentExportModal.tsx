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

// Clean text for jsPDF which only supports WinAnsi / ASCII
function sanitizeForPdf(text: string): string {
  if (!text) return '';
  return text
    // Replace smart quotes and typographic punctuation
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F]/g, ' ')
    // Replace Greek letters commonly used in statistics
    .replace(/\u03B1/g, 'alpha')
    .replace(/\u03B2/g, 'beta')
    .replace(/\u03B3/g, 'gamma')
    .replace(/\u03B4/g, 'delta')
    .replace(/\u03B5/g, 'epsilon')
    .replace(/\u03B7/g, 'eta')
    .replace(/\u03B8/g, 'theta')
    .replace(/\u03BB/g, 'lambda')
    .replace(/\u03BC/g, 'mu')
    .replace(/\u03C0/g, 'pi')
    .replace(/\u03C1/g, 'rho')
    .replace(/\u03C3/g, 'sigma')
    .replace(/\u03C4/g, 'tau')
    .replace(/\u03C7/g, 'chi')
    .replace(/\u03C9/g, 'omega')
    .replace(/\u0394/g, 'Delta')
    .replace(/\u03A3/g, 'Sigma')
    // Replace mathematical & scientific symbols
    .replace(/\u2122/g, '(TM)')
    .replace(/\u00AE/g, '(R)')
    .replace(/\u00A9/g, '(C)')
    .replace(/\u2248/g, '~=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u2260/g, '!=')
    .replace(/\u00B1/g, '+/-')
    .replace(/\u00D7/g, 'x')
    .replace(/\u00F7/g, '/')
    .replace(/\u2192|\u279C|\u27A1/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2194/g, '<->')
    .replace(/\u221E/g, 'inf')
    .replace(/\u00B2/g, '^2')
    .replace(/\u00B3/g, '^3')
    .replace(/\u00B9/g, '^1')
    .replace(/\u2070/g, '^0')
    .replace(/\u2074/g, '^4')
    .replace(/\u2075/g, '^5')
    .replace(/\u2081/g, '_1')
    .replace(/\u2082/g, '_2')
    .replace(/\u2083/g, '_3')
    // Remove all emojis and non-standard UTF-16 surrogates/emojis
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF\uE000-\uF8FF\u200D\uFE0F]/g, '')
    // Fallback: keep standard printable ASCII and standard newlines/tabs
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    // Clean multiple consecutive spaces on the same line
    .replace(/[ \t]{2,}/g, ' ');
}

// Convert simple markdown string to clean HTML
function markdownToHtml(md: string): string {
  if (!md) return '';
  
  // Escape HTML tags first
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```lang ... ```)
  html = html.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<div class="code-block"><div class="code-header">${lang ? lang.toUpperCase() : 'CODE'}</div><pre><code>${code.trim()}</code></pre></div>`;
  });

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and Italics
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered Lists (- or *)
  html = html.replace(/^[\*\-] (.*$)/gim, '<ul><li>$1</li></ul>');
  // Combine adjacent <ul> tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Ordered Lists (1. )
  html = html.replace(/^(\d+)\. (.*$)/gim, '<ol><li>$2</li></ol>');
  // Combine adjacent <ol> tags
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  // Markdown Tables (| ... |)
  const lines = html.split('\n');
  let inTable = false;
  let tableRows: string[] = [];
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if separator line
      if (/^\|[-:\s|]+\|$/.test(line)) {
        continue;
      }
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      if (!inTable) {
        inTable = true;
        tableRows = [];
        tableRows.push(`<tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr>`);
      } else {
        tableRows.push(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
      }
    } else {
      if (inTable) {
        inTable = false;
        processedLines.push(`<div class="table-container"><table class="data-table"><tbody>${tableRows.join('')}</tbody></table></div>`);
        tableRows = [];
      }
      processedLines.push(lines[i]);
    }
  }
  if (inTable) {
    processedLines.push(`<div class="table-container"><table class="data-table"><tbody>${tableRows.join('')}</tbody></table></div>`);
  }

  html = processedLines.join('\n');

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  // Clean empty paragraphs around tags
  html = html.replace(/<p>\s*<(h[1-3]|ul|ol|blockquote|div|table)/g, '<$1');
  html = html.replace(/<\/(h[1-3]|ul|ol|blockquote|div|table)>\s*<\/p>/g, '</$1>');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
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

  // Generate High-Fidelity Structured Academic PDF using jsPDF
  const generatePdf = (docsToExport: BloxBotExportableDocument[]) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = pageHeight - 18;
    let currentY = 20;

    const checkPageBreak = (neededHeight: number = 8) => {
      if (currentY + neededHeight > bottomLimit) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    docsToExport.forEach((item, docIdx) => {
      if (docIdx > 0) {
        doc.addPage();
        currentY = 20;
      }

      // Top Modern Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 26, 'F');

      // Banner accent strip
      doc.setFillColor(14, 165, 233); // sky-500
      doc.rect(0, 25, pageWidth, 1.2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SYNAPSE OS - BLOXBOT RESEARCH DOSSIER', margin, 11);

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const safeUserName = sanitizeForPdf(userName);
      doc.text(`Scholar: ${safeUserName}  |  Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 19);

      currentY = 34;

      // Document Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const safeTitle = sanitizeForPdf(item.title || 'BloxBot Research Document');
      const titleLines = doc.splitTextToSize(safeTitle, contentWidth);
      doc.text(titleLines, margin, currentY);
      currentY += titleLines.length * 6 + 3;

      // Metadata Info Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');
      
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const safeOp = sanitizeForPdf(item.operationType || 'Document Analysis').toUpperCase();
      const safeSource = sanitizeForPdf(item.originalFileName || 'Attached Document');
      const metaText = `Operation: ${safeOp}   |   Source: ${safeSource}   |   Time: ${sanitizeForPdf(item.timestamp)}`;
      doc.text(metaText, margin + 4, currentY + 7.5);
      currentY += 17;

      // APA 7th Edition Statistical Finding Callout Box
      if (item.spssPackage?.apaStatement) {
        checkPageBreak(25);
        const safeApa = sanitizeForPdf(item.spssPackage.apaStatement);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        const apaLines = doc.splitTextToSize(safeApa, contentWidth - 10);
        const boxHeight = apaLines.length * 4.5 + 11;

        doc.setFillColor(238, 242, 255); // indigo-50
        doc.setDrawColor(199, 210, 254); // indigo-200
        doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

        // Left accent bar
        doc.setFillColor(99, 102, 241); // indigo-500
        doc.rect(margin, currentY, 2.5, boxHeight, 'F');

        doc.setTextColor(67, 56, 202); // indigo-700
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('APA 7th Edition Statistical Finding:', margin + 6, currentY + 5.5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(apaLines, margin + 6, currentY + 10.5);
        currentY += boxHeight + 5;
      }

      // Formulated Hypothesis Callout Box
      if (item.hypothesis?.title) {
        checkPageBreak(20);
        const safeHypo = sanitizeForPdf(item.hypothesis.title);
        const hypoSub = `Novelty Score: ${item.hypothesis.noveltyScore || 92}%   |   Confidence: ${item.hypothesis.confidenceScore || 88}%`;
        
        doc.setFillColor(236, 253, 245); // emerald-50
        doc.setDrawColor(167, 243, 208); // emerald-200
        doc.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'FD');

        doc.setFillColor(16, 185, 129); // emerald-500
        doc.rect(margin, currentY, 2.5, 16, 'F');

        doc.setTextColor(6, 95, 70); // emerald-800
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Formulated Scientific Hypothesis:', margin + 6, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`"${safeHypo}" (${hypoSub})`, margin + 6, currentY + 11);
        currentY += 21;
      }

      // Structured Markdown Section Parser
      const rawMarkdown = item.contentMarkdown || '';
      const lines = rawMarkdown.split('\n');

      let inCodeBlock = false;
      let codeBlockContent: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        // Code block toggle
        if (trimmed.startsWith('```')) {
          if (inCodeBlock) {
            // Flush code block
            inCodeBlock = false;
            if (codeBlockContent.length > 0) {
              const codeText = codeBlockContent.join('\n');
              const safeCode = sanitizeForPdf(codeText);
              doc.setFont('courier', 'normal');
              doc.setFontSize(7.5);
              const splitCode = doc.splitTextToSize(safeCode, contentWidth - 8);
              const codeBoxHeight = splitCode.length * 3.8 + 6;

              checkPageBreak(codeBoxHeight);
              doc.setFillColor(15, 23, 42); // slate-900
              doc.roundedRect(margin, currentY, contentWidth, codeBoxHeight, 1.5, 1.5, 'F');

              doc.setTextColor(226, 232, 240); // slate-200
              doc.text(splitCode, margin + 4, currentY + 4.5);
              currentY += codeBoxHeight + 4;
              codeBlockContent = [];
            }
          } else {
            inCodeBlock = true;
            codeBlockContent = [];
          }
          continue;
        }

        if (inCodeBlock) {
          codeBlockContent.push(rawLine);
          continue;
        }

        // Empty line
        if (!trimmed) {
          currentY += 2.5;
          continue;
        }

        // H1 Heading (# Heading)
        if (trimmed.startsWith('# ')) {
          checkPageBreak(14);
          const headingText = sanitizeForPdf(trimmed.replace(/^#\s+/, ''));
          doc.setTextColor(15, 23, 42); // slate-900
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          currentY += 4;
          doc.text(headingText, margin, currentY);
          currentY += 2;
          // Sub-divider line
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, currentY, margin + contentWidth, currentY);
          currentY += 5;
          continue;
        }

        // H2 Heading (## Heading)
        if (trimmed.startsWith('## ')) {
          checkPageBreak(12);
          const headingText = sanitizeForPdf(trimmed.replace(/^##\s+/, ''));
          doc.setTextColor(30, 41, 59); // slate-800
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          currentY += 3.5;
          doc.text(headingText, margin, currentY);
          currentY += 4.5;
          continue;
        }

        // H3 Heading (### Heading)
        if (trimmed.startsWith('### ')) {
          checkPageBreak(10);
          const headingText = sanitizeForPdf(trimmed.replace(/^###\s+/, ''));
          doc.setTextColor(71, 85, 105); // slate-600
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          currentY += 2.5;
          doc.text(headingText, margin, currentY);
          currentY += 4;
          continue;
        }

        // Blockquote (> text)
        if (trimmed.startsWith('>')) {
          const quoteText = sanitizeForPdf(trimmed.replace(/^>\s*/, ''));
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'italic');
          const splitQuote = doc.splitTextToSize(quoteText, contentWidth - 10);
          const quoteHeight = splitQuote.length * 4.5 + 4;

          checkPageBreak(quoteHeight);
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(margin, currentY, contentWidth, quoteHeight, 1, 1, 'FD');

          doc.setFillColor(56, 189, 248);
          doc.rect(margin, currentY, 2, quoteHeight, 'F');

          doc.setTextColor(51, 65, 85);
          doc.text(splitQuote, margin + 5, currentY + 4);
          currentY += quoteHeight + 3;
          continue;
        }

        // Bullet list item (- ... or * ...)
        if (/^[-*•]\s+/.test(trimmed)) {
          const bulletBody = sanitizeForPdf(trimmed.replace(/^[-*•]\s+/, ''));
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85); // slate-700

          const splitBullet = doc.splitTextToSize(bulletBody, contentWidth - 8);
          checkPageBreak(splitBullet.length * 4.2 + 2);

          // Draw custom bullet circle
          doc.setFillColor(14, 165, 233); // sky-500
          doc.circle(margin + 2, currentY - 1, 0.8, 'F');

          doc.text(splitBullet, margin + 6, currentY);
          currentY += splitBullet.length * 4.2 + 1.5;
          continue;
        }

        // Numbered list item (1. ...)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const numPrefix = `${numMatch[1]}.`;
          const numBody = sanitizeForPdf(numMatch[2]);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);

          const splitNum = doc.splitTextToSize(numBody, contentWidth - 8);
          checkPageBreak(splitNum.length * 4.2 + 2);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(14, 165, 233);
          doc.text(numPrefix, margin, currentY);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(splitNum, margin + 6, currentY);
          currentY += splitNum.length * 4.2 + 1.5;
          continue;
        }

        // Standard Paragraph text
        const safePara = sanitizeForPdf(trimmed);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        const splitPara = doc.splitTextToSize(safePara, contentWidth);
        checkPageBreak(splitPara.length * 4.2 + 2);
        doc.text(splitPara, margin, currentY);
        currentY += splitPara.length * 4.2 + 2;
      }

      // If SPSS Syntax exists, append a syntax block
      if (item.spssPackage?.spssSyntax) {
        checkPageBreak(30);
        currentY += 4;
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text('IBM SPSS Command Syntax (.sps):', margin, currentY);
        currentY += 4.5;

        const safeSyntax = sanitizeForPdf(item.spssPackage.spssSyntax);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        const splitSyntax = doc.splitTextToSize(safeSyntax, contentWidth - 8);
        const syntaxBoxHeight = splitSyntax.length * 3.8 + 6;

        checkPageBreak(syntaxBoxHeight);
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(margin, currentY, contentWidth, syntaxBoxHeight, 1.5, 1.5, 'F');
        doc.setTextColor(226, 232, 240);
        doc.text(splitSyntax, margin + 4, currentY + 4.5);
        currentY += syntaxBoxHeight + 5;
      }
    });

    // Page Number Footers
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Synapse OS • BloxBot Autonomous Research Suite   |   Page ${p} of ${totalPages}`, margin, pageHeight - 7);
    }

    const safeFilenameTitle = (isAllDocs ? 'BloxBot_Research_Dossier_Complete' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeFilenameTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Generate Markdown
  const generateMarkdown = (docsToExport: BloxBotExportableDocument[]) => {
    let md = `---
title: "Synapse OS • BloxBot Autonomous Research Dossier"
author: "${userName}"
date: "${new Date().toISOString()}"
system: "Synapse OS Discovery Engine"
total_documents: ${docsToExport.length}
version: "2.4.0"
---

# 🎓 Synapse OS • BloxBot Master Research Dossier

> **Executive Academic Dossier**  
> **Principal Scholar:** ${userName}  
> **Generated:** ${new Date().toLocaleString()}  
> **Platform:** Synapse OS Multi-Agent Discovery Engine  

---

`;

    if (docsToExport.length > 1) {
      md += `## 📑 Table of Contents\n\n`;
      docsToExport.forEach((d, idx) => {
        const anchor = (d.title || `doc-${idx + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        md += `${idx + 1}. [${d.title}](#${anchor}) — *${d.operationType || 'Analysis'}*\n`;
      });
      md += `\n---\n\n`;
    }

    docsToExport.forEach((d, idx) => {
      md += `## Document ${idx + 1}: ${d.title}\n\n`;
      
      md += `| Attribute | Specification |\n`;
      md += `| :--- | :--- |\n`;
      md += `| **Operation** | \`${(d.operationType || 'Document Processing').toUpperCase()}\` |\n`;
      md += `| **Source File** | \`${d.originalFileName || 'Attached File'}\` |\n`;
      md += `| **Document Type** | \`${d.docType || 'Research Draft'}\` |\n`;
      md += `| **Timestamp** | ${d.timestamp} |\n\n`;

      if (d.spssPackage?.apaStatement) {
        md += `### 📊 APA 7th Edition Statistical Finding\n\n`;
        md += `> **APA 7th Statement:**  \n`;
        md += `> *${d.spssPackage.apaStatement}*\n\n`;
      }

      if (d.hypothesis?.title) {
        md += `### 🧬 Formulated Scientific Hypothesis\n\n`;
        md += `**"${d.hypothesis.title}"**\n\n`;
        md += `- **Novelty Score:** ${d.hypothesis.noveltyScore || 92}%\n`;
        md += `- **Confidence Score:** ${d.hypothesis.confidenceScore || 88}%\n`;
        if (d.hypothesis.feasibility) {
          md += `- **Feasibility Score:** ${d.hypothesis.feasibility}%\n`;
        }
        md += `\n`;
      }

      md += `### 📄 Manuscript Draft & Research Analysis\n\n`;
      md += `${d.contentMarkdown.trim()}\n\n`;

      if (d.spssPackage?.spssSyntax) {
        md += `### 💻 IBM SPSS® Executable Syntax (.sps)\n\n`;
        md += `\`\`\`spss\n`;
        md += `${d.spssPackage.spssSyntax.trim()}\n`;
        md += `\`\`\`\n\n`;
      }

      md += `---\n\n`;
    });

    md += `*End of BloxBot Research Dossier — Synapse OS Scientific Discovery Suite*\n`;

    const safeTitle = (isAllDocs ? 'BloxBot_Research_Dossier_Complete' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(md, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown;charset=utf-8');
  };

  // Generate Plain Text
  const generatePlainText = (docsToExport: BloxBotExportableDocument[]) => {
    let txt = `================================================================================\n`;
    txt += `SYNAPSE OS • BLOXBOT ACADEMIC RESEARCH DOSSIER\n`;
    txt += `================================================================================\n`;
    txt += `Scholar:     ${userName}\n`;
    txt += `Export Date: ${new Date().toLocaleString()}\n`;
    txt += `Platform:    Synapse Scientific Discovery Operating System\n`;
    txt += `Documents:   ${docsToExport.length} Record(s)\n`;
    txt += `================================================================================\n\n`;

    docsToExport.forEach((d, idx) => {
      txt += `--------------------------------------------------------------------------------\n`;
      txt += `DOCUMENT ${idx + 1}: ${(d.title || 'RESEARCH DOCUMENT').toUpperCase()}\n`;
      txt += `--------------------------------------------------------------------------------\n`;
      txt += `Operation:   ${(d.operationType || 'Document Processing').toUpperCase()}\n`;
      txt += `Source File: ${d.originalFileName || 'Attached Document'}\n`;
      txt += `Format:      ${d.docType || 'Manuscript'}\n`;
      txt += `Timestamp:   ${d.timestamp}\n`;
      txt += `--------------------------------------------------------------------------------\n\n`;

      if (d.spssPackage?.apaStatement) {
        txt += `[APA 7th EDITION STATISTICAL FINDING]\n`;
        txt += `--------------------------------------------------------------------------------\n`;
        txt += `${d.spssPackage.apaStatement}\n\n`;
      }

      if (d.hypothesis?.title) {
        txt += `[FORMULATED SCIENTIFIC HYPOTHESIS]\n`;
        txt += `Title:       "${d.hypothesis.title}"\n`;
        txt += `Novelty:     ${d.hypothesis.noveltyScore || 92}%\n`;
        txt += `Confidence:  ${d.hypothesis.confidenceScore || 88}%\n\n`;
      }

      txt += `[MANUSCRIPT & ACADEMIC ANALYSIS]\n`;
      txt += `--------------------------------------------------------------------------------\n`;
      
      const cleanText = d.contentMarkdown
        .replace(/[*_#`~$\\]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      txt += `${cleanText}\n\n`;

      if (d.spssPackage?.spssSyntax) {
        txt += `[IBM SPSS COMMAND SYNTAX (.sps)]\n`;
        txt += `--------------------------------------------------------------------------------\n`;
        txt += `${d.spssPackage.spssSyntax.trim()}\n\n`;
      }

      txt += `\n`;
    });

    txt += `================================================================================\n`;
    txt += `END OF DOSSIER — SYNAPSE OS SCIENTIFIC DISCOVERY SUITE\n`;
    txt += `================================================================================\n`;

    const safeTitle = (isAllDocs ? 'BloxBot_Research_Manuscript' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(txt, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain;charset=utf-8');
  };

  // Generate JSON
  const generateJson = (docsToExport: BloxBotExportableDocument[]) => {
    const formattedDocs = docsToExport.map(d => {
      const words = d.contentMarkdown ? d.contentMarkdown.trim().split(/\s+/).length : 0;
      return {
        id: d.id,
        title: d.title,
        docType: d.docType || 'Manuscript',
        operationType: d.operationType || 'Document Processing',
        originalFileName: d.originalFileName || 'Attached File',
        timestamp: d.timestamp,
        metrics: {
          wordCount: words,
          estimatedReadingTimeMinutes: Math.max(1, Math.round(words / 200))
        },
        statisticalFindings: {
          apaStatement: d.spssPackage?.apaStatement || null,
          spssSyntax: d.spssPackage?.spssSyntax || null
        },
        hypothesis: d.hypothesis ? {
          title: d.hypothesis.title,
          noveltyScore: d.hypothesis.noveltyScore || 92,
          confidenceScore: d.hypothesis.confidenceScore || 88,
          feasibility: d.hypothesis.feasibility || 85
        } : null,
        extractedEntities: d.extractedEntities || [],
        manuscript: {
          markdown: d.contentMarkdown,
          cleanText: d.contentMarkdown.replace(/[*_#`~$\\]/g, '').replace(/\n{3,}/g, '\n\n').trim()
        }
      };
    });

    const payload = {
      $schema: 'https://synapse-os.org/schemas/bloxbot-research-package.v1.json',
      system: 'Synapse OS • BloxBot AI Autonomous Suite',
      version: '2.4.0',
      exportTimestamp: new Date().toISOString(),
      scholar: userName,
      totalDocuments: docsToExport.length,
      documents: formattedDocs
    };

    const safeTitle = (isAllDocs ? 'BloxBot_Research_Package' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(JSON.stringify(payload, null, 2), `${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  // Generate SPSS Syntax (.sps)
  const generateSpssSyntax = (docsToExport: BloxBotExportableDocument[]) => {
    let sps = `* ************************************************************************.\n`;
    sps += `* IBM SPSS STATISTICS COMMAND SYNTAX FILE\n`;
    sps += `* GENERATED BY: Synapse OS • BloxBot Autonomous Research Suite\n`;
    sps += `* SCHOLAR:      ${userName}\n`;
    sps += `* DATE:         ${new Date().toISOString().slice(0, 10)}\n`;
    sps += `* TOTAL BLOCKS: ${docsToExport.length}\n`;
    sps += `* ************************************************************************.\n\n`;

    sps += `SET DECIMAL=DOT.\n`;
    sps += `SET SEED=2026.\n\n`;

    docsToExport.forEach((d, idx) => {
      sps += `* ========================================================================.\n`;
      sps += `* [BLOCK ${idx + 1}] DOCUMENT: ${d.title}\n`;
      sps += `* OPERATION: ${(d.operationType || 'Statistical Analysis').toUpperCase()}\n`;
      sps += `* ========================================================================.\n\n`;

      if (d.spssPackage?.apaStatement) {
        sps += `* [APA 7th Edition Statistical Narrative]:\n`;
        const apaLines = d.spssPackage.apaStatement.split('\n');
        apaLines.forEach((line: string) => {
          sps += `*   ${line}\n`;
        });
        sps += `* .\n\n`;
      }

      if (d.spssPackage?.spssSyntax) {
        sps += `${d.spssPackage.spssSyntax.trim()}\n\n`;
      } else {
        sps += `* Exploratory Data Analysis & Descriptive Profile for ${d.title}:\n`;
        sps += `DESCRIPTIVES VARIABLES=ALL\n  /STATISTICS=MEAN STDDEV MIN MAX KURTOSIS SKEWNESS.\n\n`;
        sps += `EXAMINE VARIABLES=ALL\n  /PLOT BOXPLOT STEMLEAF NPPLOT\n  /COMPARE GROUPS\n  /STATISTICS DESCRIPTIVES\n  /CINTERVAL 95\n  /MISSING LISTWISE\n  /NOTOTAL.\n\n`;
      }
    });

    sps += `EXECUTE.\n`;

    const safeTitle = (isAllDocs ? 'BloxBot_SPSS_Batch_Syntax' : (currentDoc?.title || 'BloxBot_Syntax')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(sps, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.sps`, 'text/plain;charset=utf-8');
  };

  // Generate CSV
  const generateCsv = (docsToExport: BloxBotExportableDocument[]) => {
    // Add UTF-8 BOM for Microsoft Excel / Google Sheets compatibility
    let csv = `\uFEFF`;
    csv += `"Document ID","Document Title","Operation Type","Document Type","Source File","Timestamp","APA 7th Finding","Formulated Hypothesis","Novelty Score (%)","Confidence Score (%)","Word Count","Manuscript Excerpt"\n`;

    docsToExport.forEach((d) => {
      const cleanId = `"${(d.id || '').replace(/"/g, '""')}"`;
      const cleanTitle = `"${(d.title || '').replace(/"/g, '""')}"`;
      const cleanOp = `"${(d.operationType || '').replace(/"/g, '""')}"`;
      const cleanType = `"${(d.docType || 'Manuscript').replace(/"/g, '""')}"`;
      const cleanSource = `"${(d.originalFileName || '').replace(/"/g, '""')}"`;
      const cleanTime = `"${(d.timestamp || '').replace(/"/g, '""')}"`;
      const cleanApa = `"${(d.spssPackage?.apaStatement || '').replace(/"/g, '""')}"`;
      const cleanHypo = `"${(d.hypothesis?.title || '').replace(/"/g, '""')}"`;
      const novScore = d.hypothesis?.noveltyScore || 92;
      const confScore = d.hypothesis?.confidenceScore || 88;
      const wordCount = d.contentMarkdown ? d.contentMarkdown.trim().split(/\s+/).length : 0;
      
      const cleanExcerpt = `"${d.contentMarkdown
        .slice(0, 280)
        .replace(/[*_#`~$\\]/g, '')
        .replace(/"/g, '""')
        .replace(/\n+/g, ' ')
        .trim()}..."`;

      csv += `${cleanId},${cleanTitle},${cleanOp},${cleanType},${cleanSource},${cleanTime},${cleanApa},${cleanHypo},${novScore},${confScore},${wordCount},${cleanExcerpt}\n`;
    });

    const safeTitle = (isAllDocs ? 'BloxBot_Research_Catalog' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
    handleDownloadFile(csv, `${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
  };

  // Generate HTML / Printable
  const generateHtml = (docsToExport: BloxBotExportableDocument[]) => {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synapse OS • BloxBot Master Research Dossier</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --indigo-bg: #eef2ff;
      --indigo-border: #818cf8;
      --indigo-text: #3730a3;
      --emerald-bg: #ecfdf5;
      --emerald-border: #34d399;
      --emerald-text: #065f46;
    }

    * { box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.65;
      color: var(--text);
      background-color: var(--bg);
      margin: 0;
      padding: 40px 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 30px 32px;
      border-radius: 12px;
      margin-bottom: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .header-title {
      font-size: 24px;
      font-weight: 700;
      color: #38bdf8;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .header-sub {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }

    .print-btn {
      position: absolute;
      top: 28px;
      right: 28px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .print-btn:hover {
      background: #0369a1;
    }

    .document-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      page-break-inside: avoid;
    }

    .doc-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border);
    }

    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .badge-primary {
      background: #e0f2fe;
      color: #0369a1;
      border-color: #bae6fd;
    }

    .apa-callout {
      background: var(--indigo-bg);
      border-left: 4px solid var(--indigo-border);
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }

    .apa-callout-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--indigo-text);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .apa-callout-body {
      font-style: italic;
      color: var(--indigo-text);
      font-size: 14px;
      margin: 0;
    }

    .hypo-callout {
      background: var(--emerald-bg);
      border-left: 4px solid var(--emerald-border);
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }

    .hypo-callout-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--emerald-text);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .hypo-callout-body {
      font-weight: 600;
      color: var(--emerald-text);
      font-size: 14px;
      margin: 0 0 6px 0;
    }

    .hypo-metrics {
      font-size: 12px;
      color: #047857;
      display: flex;
      gap: 12px;
    }

    .manuscript-body h1 { font-size: 18px; color: #0f172a; margin-top: 24px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
    .manuscript-body h2 { font-size: 16px; color: #1e293b; margin-top: 20px; }
    .manuscript-body h3 { font-size: 14px; color: #334155; margin-top: 16px; font-weight: 700; }
    .manuscript-body p { font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 14px; }
    .manuscript-body ul, .manuscript-body ol { padding-left: 24px; font-size: 14px; color: #334155; margin-bottom: 16px; }
    .manuscript-body li { margin-bottom: 6px; }
    .manuscript-body blockquote {
      border-left: 3px solid #cbd5e1;
      padding-left: 14px;
      margin: 14px 0;
      color: #475569;
      font-style: italic;
    }

    .inline-code {
      font-family: ui-monospace, monospace;
      font-size: 12px;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .code-block {
      background: #0f172a;
      border-radius: 8px;
      overflow: hidden;
      margin: 18px 0;
    }

    .code-header {
      background: #1e293b;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 14px;
      font-family: ui-monospace, monospace;
    }

    .code-block pre {
      margin: 0;
      padding: 14px 16px;
      overflow-x: auto;
    }

    .code-block code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      color: #f8fafc;
      line-height: 1.5;
    }

    .table-container {
      overflow-x: auto;
      margin: 18px 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table th, .data-table td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .data-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }

    .data-table tr:hover td {
      background: #f8fafc;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .container { max-width: 100%; }
      .header-banner { border-radius: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-btn { display: none; }
      .document-card { border: none; box-shadow: none; padding: 0; margin-bottom: 40px; page-break-after: always; }
      .apa-callout, .hypo-callout, .code-block, .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-banner">
      <h1 class="header-title">SYNAPSE OS &bull; BLOXBOT RESEARCH DOSSIER</h1>
      <p class="header-sub">Scholar: <strong>${userName}</strong> | Date: ${new Date().toLocaleString()} | Documents: ${docsToExport.length} Record(s)</p>
      <button class="print-btn" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save as PDF
      </button>
    </div>
`;

    docsToExport.forEach((d, idx) => {
      const parsedHtmlBody = markdownToHtml(d.contentMarkdown);
      const wordCount = d.contentMarkdown ? d.contentMarkdown.trim().split(/\s+/).length : 0;

      html += `
    <article class="document-card">
      <h2 class="doc-title">${idx + 1}. ${d.title}</h2>
      
      <div class="meta-bar">
        <span class="badge badge-primary">OPERATION: ${(d.operationType || 'Document Processing').toUpperCase()}</span>
        <span class="badge">SOURCE: ${d.originalFileName || 'Attached File'}</span>
        <span class="badge">FORMAT: ${d.docType || 'Manuscript'}</span>
        <span class="badge">TIME: ${d.timestamp}</span>
        <span class="badge">${wordCount} WORDS</span>
      </div>
`;

      if (d.spssPackage?.apaStatement) {
        html += `
      <div class="apa-callout">
        <div class="apa-callout-title">APA 7th Edition Statistical Finding</div>
        <p class="apa-callout-body">${d.spssPackage.apaStatement}</p>
      </div>
`;
      }

      if (d.hypothesis?.title) {
        html += `
      <div class="hypo-callout">
        <div class="hypo-callout-title">Formulated Scientific Hypothesis</div>
        <p class="hypo-callout-body">"${d.hypothesis.title}"</p>
        <div class="hypo-metrics">
          <span><strong>Novelty:</strong> ${d.hypothesis.noveltyScore || 92}%</span>
          <span><strong>Confidence:</strong> ${d.hypothesis.confidenceScore || 88}%</span>
        </div>
      </div>
`;
      }

      html += `
      <div class="manuscript-body">
        ${parsedHtmlBody}
      </div>
`;

      if (d.spssPackage?.spssSyntax) {
        html += `
      <div class="code-block" style="margin-top: 24px;">
        <div class="code-header">IBM SPSS® COMMAND SYNTAX (.sps)</div>
        <pre><code>${d.spssPackage.spssSyntax.trim()}</code></pre>
      </div>
`;
      }

      html += `
    </article>
`;
    });

    html += `
    <div class="footer">
      <p>Generated by Synapse OS Autonomous Discovery Engine &bull; BloxBot Academic Research Suite</p>
    </div>
  </div>
</body>
</html>`;

    const safeTitle = (isAllDocs ? 'BloxBot_Printable_Dossier' : (currentDoc?.title || 'BloxBot_Document')).replace(/[^a-zA-Z0-9_-]/g, '_');
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
