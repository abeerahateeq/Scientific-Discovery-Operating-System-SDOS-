import React, { useState, useRef } from "react";
import { ScientificPaper } from "../types";
import { classifyTopicDomain } from "../config/domainTemplates";
import { 
  FileText, 
  Plus, 
  Database, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  RefreshCw, 
  Upload, 
  Terminal, 
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Trash2,
  Search,
  X
} from "lucide-react";

interface LiteratureIngestProps {
  papers: ScientificPaper[];
  onIngest: (paper: {
    title: string;
    authors: string;
    journal: string;
    year: number;
    abstract: string;
  }) => Promise<void>;
  isIngesting: boolean;
  onUploadSuccess?: () => Promise<void>;
  onDeletePaper?: (paperId: string) => Promise<void>;
  onClearAllPapers?: () => Promise<void>;
}

export default function LiteratureIngest({
  papers,
  onIngest,
  isIngesting,
  onUploadSuccess,
  onDeletePaper,
  onClearAllPapers
}: LiteratureIngestProps) {
  const [ingestMode, setIngestMode] = useState<"pdf" | "manual" | "csv">("pdf");
  
  // Literature Repository Search & Deletion State
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [paperToDeleteConfirm, setPaperToDeleteConfirm] = useState<ScientificPaper | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  
  // Manual Ingest State
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [journal, setJournal] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [abstract, setAbstract] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Load auto-saved draft on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("sdos_lit_ingest_autosave");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.abstract) {
          setTitle(parsed.title || "");
          setAuthors(parsed.authors || "");
          setJournal(parsed.journal || "");
          setYear(parsed.year || new Date().getFullYear().toString());
          setAbstract(parsed.abstract || "");
          setHasRestoredDraft(true);
        }
      } catch (e) {
        console.error("Failed to restore literature ingest auto-save draft", e);
      }
    }
  }, []);

  // Save changes to localStorage
  React.useEffect(() => {
    if (title || authors || journal || abstract) {
      localStorage.setItem("sdos_lit_ingest_autosave", JSON.stringify({
        title,
        authors,
        journal,
        year,
        abstract
      }));
    }
  }, [title, authors, journal, year, abstract]);

  // PDF Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLogs, setUploadLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [newlyUploadedId, setNewlyUploadedId] = useState<string | null>(null);

  // Bulk CSV Import State
  interface CsvRecord {
    title: string;
    authors: string;
    journal: string;
    year: number;
    abstract: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    error?: string;
  }
  const [csvRecords, setCsvRecords] = useState<CsvRecord[]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvDragOver, setCsvDragOver] = useState(false);

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !abstract) return;

    setErrorMsg("");
    setSuccessMsg("");

    const domainCheck = classifyTopicDomain(title + " " + abstract);
    if (!domainCheck.isAllowedDomain || domainCheck.isSupported === false) {
      setErrorMsg("Domain not supported: Please provide a relevant document.");
      return;
    }

    try {
      await onIngest({
        title,
        authors,
        journal,
        year: parseInt(year) || new Date().getFullYear(),
        abstract
      });

      // Clear form & auto-save draft
      setTitle("");
      setAuthors("");
      setJournal("");
      setYear(new Date().getFullYear().toString());
      setAbstract("");
      setHasRestoredDraft(false);
      localStorage.removeItem("sdos_lit_ingest_autosave");

      setSuccessMsg("Document ingested successfully! Running AI Knowledge Extraction...");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Domain not supported")) {
        setErrorMsg("Domain not supported: Please provide a relevant document.");
      } else {
        setErrorMsg(err.message || "Failed to ingest paper.");
      }
    }
  };

  const fillSamplePaper = () => {
    setTitle("Quantitative Microplastic and Nanoplastic Abundance in Coastal Sediments via Automated µFTIR");
    setAuthors("Dr. Evelyn Vance, Prof. L. Garrison");
    setJournal("Environmental Science & Technology");
    setYear("2026");
    setAbstract("Quantitative analysis of secondary microplastics (1 µm – 5 mm) and weathered nanoplastics in benthic marine sediments. Using focal plane array µFTIR spectroscopy and pyrolysis-GC-MS, we evaluated particle abundance, polymer degradation, and heavy metal adsorption kinetics across coastal estuaries.");
  };

  // Document Upload Handlers (PDF & Word DOCX/DOC)
  const handleDocumentUpload = async (file: File) => {
    if (!file || isUploading) return;
    
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const isSupported = ["pdf", "docx", "doc", "txt"].includes(fileExt) || 
      file.type === "application/pdf" || 
      file.type.includes("word") || 
      file.type.includes("officedocument") ||
      file.type.includes("text");

    if (!isSupported) {
      setErrorMsg("Invalid file type. Supported formats: Adobe PDF (.pdf), Microsoft Word (.docx, .doc), and Text (.txt).");
      return;
    }

    // Reset DOM file input element value immediately
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    // Clear manual form draft and local storage to prevent cross-document contamination
    setTitle("");
    setAuthors("");
    setJournal("");
    setYear(new Date().getFullYear().toString());
    setAbstract("");
    setHasRestoredDraft(false);
    localStorage.removeItem("sdos_lit_ingest_autosave");

    const formatLabel = fileExt === "docx" || fileExt === "doc" ? "Word DOCX/DOC" : "PDF";
    setUploadLogs([
      "Resetting initial file ingestion buffer for new document processing...",
      `Connecting to ${formatLabel} Extraction Pipeline for file "${file.name}"...`
    ]);

    const formData = new FormData();
    formData.append("document", file);

    try {
      const response = await fetch("/api/papers/upload-document", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Extraction pipeline returned an unrecoverable failure status.");
      }

      if (data.logs && Array.isArray(data.logs)) {
        setUploadLogs(data.logs);
      } else {
        setUploadLogs(prev => [...prev, "Completing metadata structuring...", "Linking bibliography references to graph index..."]);
      }

      const domainName = data.paper?.domain || "Custom Domain";
      if (data.unmatchedNotice) {
        setSuccessMsg(`"${data.paper.title}" ingested successfully! Dynamically classified as "${domainName}" (No quantum fallback applied).`);
      } else {
        setSuccessMsg(`"${data.paper.title}" successfully ingested and indexed into [${domainName}].`);
      }

      if (data.paper && data.paper.id) {
        setNewlyUploadedId(data.paper.id);
      }
      
      // Clear manual form draft so user isn't confused by old form inputs
      setTitle("");
      setAuthors("");
      setJournal("");
      setYear(new Date().getFullYear().toString());
      setAbstract("");
      setHasRestoredDraft(false);
      localStorage.removeItem("sdos_lit_ingest_autosave");

      if (onUploadSuccess) {
        await onUploadSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to complete document ingestion pipeline.");
      setUploadLogs(prev => [...prev, "CRITICAL ERROR: Document extraction failed."]);
    } finally {
      setIsUploading(false);
    }
  };

  // CSV Ingestion & Parsing Mechanics
  const parseCsvContent = (text: string): CsvRecord[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Parse headers
    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const titleIdx = headers.findIndex(h => h.includes("title"));
    const authorsIdx = headers.findIndex(h => h.includes("author") || h.includes("authors"));
    const journalIdx = headers.findIndex(h => h.includes("journal"));
    const yearIdx = headers.findIndex(h => h.includes("year"));
    const abstractIdx = headers.findIndex(h => h.includes("abstract") || h.includes("desc"));

    const records: CsvRecord[] = [];

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCsvLine(line);
      if (cols.length < 2) continue;

      const titleVal = titleIdx !== -1 && cols[titleIdx] ? cols[titleIdx] : "";
      const abstractVal = abstractIdx !== -1 && cols[abstractIdx] ? cols[abstractIdx] : "";
      
      if (!titleVal || !abstractVal) continue;

      records.push({
        title: titleVal,
        authors: authorsIdx !== -1 && cols[authorsIdx] ? cols[authorsIdx] : "Unknown Author",
        journal: journalIdx !== -1 && cols[journalIdx] ? cols[journalIdx] : "Unpublished Research",
        year: yearIdx !== -1 ? (parseInt(cols[yearIdx]) || 2026) : 2026,
        abstract: abstractVal,
        status: "pending",
        progress: 0
      });
    }

    return records;
  };

  const handleCsvFileUpload = async (file: File) => {
    if (!file) return;
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = "";
    }
    setErrorMsg("");
    setSuccessMsg("");
    setCsvRecords([]); // Reset batch record buffer for new upload session
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCsvContent(text);
        if (parsed.length === 0) {
          throw new Error("No valid bibliography records containing both 'title' and 'abstract' headers found in CSV file.");
        }
        setCsvRecords(parsed);
        setSuccessMsg(`Successfully parsed ${parsed.length} scientific records from CSV bibliography.`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to parse CSV layout.");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read CSV file.");
    };
    reader.readAsText(file);
  };

  const handleProcessCsv = async () => {
    if (csvRecords.length === 0 || isProcessingCsv) return;
    setIsProcessingCsv(true);
    setErrorMsg("");
    setSuccessMsg("");

    for (let idx = 0; idx < csvRecords.length; idx++) {
      if (csvRecords[idx].status === "completed") continue;

      setCsvRecords(prev => {
        const updated = [...prev];
        updated[idx].status = "processing";
        updated[idx].progress = 10;
        return updated;
      });

      // Staged progress step mock
      for (let p = 25; p <= 85; p += 20) {
        await new Promise(resolve => setTimeout(resolve, 250));
        setCsvRecords(prev => {
          const updated = [...prev];
          if (updated[idx].status === "processing") {
            updated[idx].progress = p;
          }
          return updated;
        });
      }

      try {
        await onIngest({
          title: csvRecords[idx].title,
          authors: csvRecords[idx].authors,
          journal: csvRecords[idx].journal,
          year: csvRecords[idx].year,
          abstract: csvRecords[idx].abstract
        });

        setCsvRecords(prev => {
          const updated = [...prev];
          updated[idx].status = "completed";
          updated[idx].progress = 100;
          return updated;
        });
      } catch (err: any) {
        console.error("Bulk ingestion step error:", err);
        setCsvRecords(prev => {
          const updated = [...prev];
          updated[idx].status = "failed";
          updated[idx].progress = 100;
          updated[idx].error = err.message || "Extraction failed";
          return updated;
        });
      }
    }

    setIsProcessingCsv(false);
    setSuccessMsg("Bulk ingestion pipeline fully completed!");
    if (onUploadSuccess) {
      await onUploadSuccess();
    }
  };

  const handleLoadSampleCsv = () => {
    setSuccessMsg("");
    setErrorMsg("");
    const samples: CsvRecord[] = [
      {
        title: "Localized Spin-Glass Isomorphism in High-Dimensional Protein States",
        authors: "Dr. Evelyn Vance, Prof. Alan Turing Jr.",
        journal: "Biophysical Physics Letters",
        year: 2026,
        abstract: "Macromolecular folding pathways are notoriously complex and exhibit spin-glass thermodynamic states. This study models 3D protein fold configurations as planar stabilizer codes. We prove mathematical stabilizer boundaries represent energetic phase transition zones.",
        status: "pending",
        progress: 0
      },
      {
        title: "Dose-Dependent MicroRNA Stabilization Dynamics of Amyloid Precursor Cleavage",
        authors: "Dr. Sarah Lin-Mendoza, Prof. Arthur Pendelton",
        journal: "Journal of Neurodegenerative Pathways",
        year: 2025,
        abstract: "Inhibiting Gene X expression blocks the hyperphosphorylation of amyloid precursor proteins. Here we characterize microRNA triggers that stabilize Protein A conformations under sub-nanomolar therapeutic dosage without triggering cortical microglia apoptosis.",
        status: "pending",
        progress: 0
      },
      {
        title: "Topological Error-Correcting Manifolds for Membraneless Cellular Assemblies",
        authors: "Prof. Kenneth Takahashi, Dr. Elizabeth Vance",
        journal: "Advanced Macromolecules and Biostructures",
        year: 2026,
        abstract: "Cellular assemblies exhibit phase separation boundaries. By applying topological stabilizer codes from quantum error-correction, we simulate self-assembling macromolecular lattices. Results demonstrate a 45% reduction in computational phase prediction error.",
        status: "pending",
        progress: 0
      }
    ];
    setCsvRecords(samples);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDocumentUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="literature-ingest-workspace" className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full text-[11px]">
      {/* Paper Ingestion Console */}
      <div id="ingestion-console" className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-3 h-fit">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Database className="text-emerald-400 w-4 h-4" />
            <h2 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Document Ingestion</h2>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#07080A] border border-slate-850 p-1 rounded">
          <button
            onClick={() => { setDragOver(false); setIngestMode("pdf"); }}
            className={`py-1 rounded text-[9.5px] uppercase font-bold tracking-wide transition-all ${
              ingestMode === "pdf"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            PDF / Word
          </button>
          <button
            onClick={() => { setDragOver(false); setIngestMode("manual"); }}
            className={`py-1 rounded text-[9.5px] uppercase font-bold tracking-wide transition-all ${
              ingestMode === "manual"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => { setDragOver(false); setIngestMode("csv"); }}
            className={`py-1 rounded text-[9.5px] uppercase font-bold tracking-wide transition-all ${
              ingestMode === "csv"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Bulk CSV
          </button>
        </div>

        {/* Status Messaging */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded p-2.5 text-[10px] flex items-start gap-1.5 font-sans leading-snug">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wide text-[9px] mb-0.5">Pipeline Success</span>
              {successMsg}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded p-2.5 text-[10px] flex items-start gap-1.5 font-sans leading-snug">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wide text-[9px] mb-0.5">Ingest Failed</span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* MODE A: Document (PDF / Word) Upload Pipeline */}
        {ingestMode === "pdf" && (
          <div className="flex flex-col gap-3">
            <p className="text-slate-500 font-sans leading-relaxed text-[10px]">
              Upload scientific papers in <strong>PDF</strong> or <strong>Word Document (.docx / .doc)</strong> format. Our multi-engine pipeline parses structural body text, extracts bibliographies, and dynamically classifies domains.
            </p>

            {/* Drag and Drop Box */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => {
                if (!isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 transition-all ${
                isUploading
                  ? "border-emerald-500/50 bg-emerald-500/10 cursor-not-allowed"
                  : dragOver
                  ? "border-emerald-400 bg-emerald-500/5 cursor-pointer"
                  : "border-slate-800 bg-[#07080A] hover:border-slate-700 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  e.target.value = ""; // Immediately reset file input value
                  if (selectedFile && !isUploading) {
                    handleDocumentUpload(selectedFile);
                  }
                }}
                className="hidden"
              />
              <div className="p-2 rounded-full bg-slate-900 border border-slate-850">
                <Upload className={`w-5 h-5 ${isUploading ? "text-emerald-400 animate-bounce" : "text-slate-500"}`} />
              </div>
              <div className="text-center flex flex-col gap-0.5">
                <span className="text-slate-300 font-bold">Drag & Drop PDF or Word (.docx) here</span>
                <span className="text-slate-500 text-[10px] font-sans">Supports .pdf, .docx, .doc, .txt files</span>
              </div>
            </div>

            {/* Pipeline Stage Logs Console */}
            {uploadLogs.length > 0 && (
              <div className="border border-slate-800 rounded bg-slate-950 p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Parsing Console Log</span>
                </div>
                <div className="max-h-[140px] overflow-y-auto font-mono text-[9.5px] text-slate-400 flex flex-col gap-1 pr-1">
                  {uploadLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1 leading-normal">
                      <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{log}</span>
                    </div>
                  ))}
                  {isUploading && (
                    <div className="flex items-center gap-1.5 text-emerald-400 italic mt-1 font-sans">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Synthesizing metadata and linkages...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE B: Manual Form Ingest */}
        {ingestMode === "manual" && (
          <form onSubmit={handleSubmitManual} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-sans text-[10px]">Manual abstract or metadata parsing mode.</p>
              <button
                type="button"
                onClick={fillSamplePaper}
                className="text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded px-1.5 py-0.5 uppercase tracking-wide font-bold"
              >
                Use Sample
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Paper Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Synaptic Stabilization of Protein A..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#07080A] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Authors</label>
                <input
                  type="text"
                  placeholder="e.g. L. Chen, S. Mori"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  className="w-full bg-[#07080A] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Pub Year</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-[#07080A] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Journal / Conference</label>
              <input
                type="text"
                placeholder="e.g. In Silico Biophysics"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="w-full bg-[#07080A] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Abstract / Full Text</label>
              <textarea
                required
                rows={4}
                placeholder="Paste abstract or research paragraph here. Our AI engine will extract scientific entities and compile them into the knowledge graph..."
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                className="w-full bg-[#07080A] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-none text-[10px]"
              />
            </div>

            <button
              type="submit"
              disabled={isIngesting || !title || !abstract}
              className="w-full flex items-center justify-center gap-2 bg-[#0ea5e9] hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all text-white font-bold py-2 rounded text-[11px] uppercase tracking-wider cursor-pointer"
            >
              {isIngesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Ingesting...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Ingest & Run AI Extraction
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE C: Bulk CSV Bibliography Ingestion */}
        {ingestMode === "csv" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 font-sans leading-relaxed text-[10px]">
                Import raw bibliography CSV datasets containing multiple literature records at once.
              </p>
              <button
                type="button"
                onClick={handleLoadSampleCsv}
                className="text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded px-1.5 py-0.5 uppercase tracking-wide font-bold shrink-0"
              >
                Load Sample
              </button>
            </div>

            {/* Drag and Drop CSV Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true); }}
              onDragLeave={() => setCsvDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setCsvDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleCsvFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => csvFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
                csvDragOver
                  ? "border-emerald-400 bg-emerald-500/5"
                  : "border-slate-800 bg-[#07080A] hover:border-slate-700"
              }`}
            >
              <input
                ref={csvFileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleCsvFileUpload(e.target.files[0])}
                className="hidden"
              />
              <div className="p-2 rounded-full bg-slate-900 border border-slate-850">
                <Upload className={`w-5 h-5 ${isProcessingCsv ? "text-emerald-400 animate-bounce" : "text-slate-500"}`} />
              </div>
              <div className="text-center flex flex-col gap-0.5">
                <span className="text-slate-300 font-bold">Drag & Drop CSV here</span>
                <span className="text-slate-600 text-[10px] font-sans">Must contain title and abstract headers</span>
              </div>
            </div>

            {/* Parsed List with Progress Bars */}
            {csvRecords.length > 0 && (
              <div className="flex flex-col gap-2 border border-slate-800 rounded bg-[#07080A] p-2.5 max-h-[220px] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-850 pb-1 mb-1">
                  <span className="font-mono text-[8.5px] text-slate-500 uppercase select-none">
                    Queue: {csvRecords.length} Records
                  </span>
                  <button
                    onClick={() => setCsvRecords([])}
                    className="text-[8px] text-rose-400 hover:text-rose-300 uppercase font-mono tracking-wider font-bold cursor-pointer"
                  >
                    Clear List
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {csvRecords.map((rec, i) => (
                    <div key={i} className="flex flex-col gap-1 text-[10px] border-b border-slate-900/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-300 font-bold leading-tight font-sans line-clamp-1 select-all">
                          {rec.title}
                        </span>
                        
                        {rec.status === "pending" && (
                          <span className="text-[8px] font-mono text-slate-500 bg-slate-900 px-1 py-0.2 rounded uppercase shrink-0">
                            Pending
                          </span>
                        )}
                        {rec.status === "processing" && (
                          <span className="text-[8px] font-mono text-sky-400 bg-sky-500/10 px-1 py-0.2 rounded uppercase shrink-0 animate-pulse flex items-center gap-0.5">
                            <RefreshCw className="w-2 h-2 animate-spin" />
                            Extracting
                          </span>
                        )}
                        {rec.status === "completed" && (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded uppercase shrink-0 font-bold">
                            Success
                          </span>
                        )}
                        {rec.status === "failed" && (
                          <span className="text-[8px] font-mono text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded uppercase shrink-0 font-bold" title={rec.error}>
                            Failed
                          </span>
                        )}
                      </div>

                      {/* Progress Bar Container */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-950 border border-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              rec.status === "failed" 
                                ? "bg-rose-500" 
                                : rec.status === "completed" 
                                  ? "bg-emerald-500" 
                                  : "bg-sky-500"
                            }`}
                            style={{ width: `${rec.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[8px] text-slate-500 w-6 text-right select-none">
                          {rec.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action */}
            {csvRecords.length > 0 && (
              <button
                type="button"
                onClick={handleProcessCsv}
                disabled={isProcessingCsv}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all text-white font-bold py-2 rounded text-[11px] uppercase tracking-wider cursor-pointer mt-1"
              >
                {isProcessingCsv ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing Bulk Extraction...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Process Bulk Ingest
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ingested Literature Database Shelf */}
      <div id="literature-database-shelf" className="lg:col-span-2 bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-3 overflow-y-auto max-h-[500px] lg:max-h-full">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="text-slate-400 w-4 h-4" />
            <h2 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Indexed Research Repository</h2>
          </div>
          <div className="flex items-center gap-2">
            {papers.length > 0 && onClearAllPapers && (
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(true)}
                className="text-[9px] font-mono font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                title="Remove all uploaded literature from repository"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All ({papers.length})</span>
              </button>
            )}
            <span className="bg-[#07080A] border border-slate-800 text-slate-400 font-mono text-[9px] px-1.5 py-0.2 rounded uppercase">
              {papers.length} Records
            </span>
          </div>
        </div>

        {/* Filter / Search input for repository */}
        {papers.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search uploaded papers by title, author, or keyword..."
              value={repoSearchQuery}
              onChange={(e) => setRepoSearchQuery(e.target.value)}
              className="w-full bg-[#07080A] border border-slate-800 rounded pl-8 pr-7 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 font-sans"
            />
            {repoSearchQuery && (
              <button
                onClick={() => setRepoSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Paper Cards List */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {papers.filter((p) => {
            if (!repoSearchQuery.trim()) return true;
            const q = repoSearchQuery.toLowerCase();
            return (
              p.title.toLowerCase().includes(q) ||
              (p.authors && p.authors.toLowerCase().includes(q)) ||
              (p.journal && p.journal.toLowerCase().includes(q)) ||
              (p.abstract && p.abstract.toLowerCase().includes(q))
            );
          }).length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800/80 rounded-lg bg-[#07080A] flex flex-col items-center justify-center gap-2 text-slate-500">
              <BookOpen className="w-8 h-8 text-slate-600 mb-1" />
              <p className="text-xs font-semibold text-slate-400 font-sans">
                {repoSearchQuery ? `No papers match "${repoSearchQuery}"` : "No papers in research repository"}
              </p>
              <p className="text-[10px] font-sans max-w-sm">
                Upload PDFs, enter manual abstracts, or import CSV datasets using the controls on the left to index literature.
              </p>
            </div>
          ) : (
            [...papers].sort((a, b) => {
              if (a.id === newlyUploadedId) return -1;
              if (b.id === newlyUploadedId) return 1;
              return new Date(b.ingestedDate || 0).getTime() - new Date(a.ingestedDate || 0).getTime();
            }).filter((p) => {
              if (!repoSearchQuery.trim()) return true;
              const q = repoSearchQuery.toLowerCase();
              return (
                p.title.toLowerCase().includes(q) ||
                (p.authors && p.authors.toLowerCase().includes(q)) ||
                (p.journal && p.journal.toLowerCase().includes(q)) ||
                (p.abstract && p.abstract.toLowerCase().includes(q))
              );
            }).map((paper) => (
              <div
                key={paper.id}
                className={paper.id === newlyUploadedId 
                  ? "bg-[#0B1713] border-2 border-emerald-500/80 rounded p-3 transition-all flex flex-col gap-2.5 group relative shadow-lg shadow-emerald-950/50" 
                  : "bg-[#07080A] hover:bg-[#16181D] border border-slate-800/80 rounded p-3 transition-all flex flex-col gap-2.5 group relative"}
              >
                {paper.id === newlyUploadedId && (
                  <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded -mt-0.5 mb-1 uppercase tracking-wider">
                    <span>Active Ingested Document (Uploaded)</span>
                    <span>Just Uploaded</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 flex-1">
                    <h3 className="text-slate-200 font-bold text-[11px] group-hover:text-emerald-400 transition-colors font-sans leading-snug">
                      {paper.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-sans">
                      {paper.authors} &bull; <span className="italic">{paper.journal}</span> ({paper.year})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded uppercase">
                      {paper.domain || classifyTopicDomain(paper.title + " " + paper.abstract).domainName}
                    </span>

                    {paper.status === "analyzed" ? (
                      <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded uppercase">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Indexed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded uppercase animate-pulse">
                        <Clock className="w-2.5 h-2.5" />
                        Analyzing
                      </span>
                    )}

                    {onDeletePaper && (
                      <button
                        type="button"
                        onClick={() => setPaperToDeleteConfirm(paper)}
                        disabled={deletingId === paper.id}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded transition-all cursor-pointer"
                        title="Delete this paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                  {paper.abstract}
                </p>

                {/* References citations parsed list */}
                {paper.references && paper.references.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-slate-800/60 pt-2 font-mono text-[9px] text-slate-500">
                    <span className="uppercase font-bold tracking-wide text-slate-600 mb-0.5">Parsed References ({paper.references.length}):</span>
                    <div className="max-h-[80px] overflow-y-auto flex flex-col gap-1 pr-1 font-sans">
                      {paper.references.map((ref, idx) => (
                        <div key={idx} className="flex gap-1 items-start text-slate-400">
                          <span className="text-slate-600">[{idx + 1}]</span>
                          <span>
                            <span className="font-semibold text-slate-300">"{ref.title}"</span> &bull; {ref.authors} ({ref.year || "unknown"})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Entities Badges */}
                {paper.entitiesExtracted && paper.entitiesExtracted.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 border-t border-slate-800/60 pt-2">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mr-1">Extracted Entities:</span>
                    {paper.entitiesExtracted.map((ent, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono text-slate-300 bg-[#16181D] border border-slate-800 px-1.5 py-0.2 rounded"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal: Delete Single Paper */}
      {paperToDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0F1115] border border-rose-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Confirm Literature Deletion</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase">PERMANENT ACTION</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Are you sure you want to remove <strong className="text-white">"{paperToDeleteConfirm.title}"</strong> from your Indexed Research Repository?
            </p>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPaperToDeleteConfirm(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!onDeletePaper || !paperToDeleteConfirm) return;
                  setDeletingId(paperToDeleteConfirm.id);
                  try {
                    await onDeletePaper(paperToDeleteConfirm.id);
                  } catch (e) {
                    console.error("Delete paper error:", e);
                  } finally {
                    setDeletingId(null);
                    setPaperToDeleteConfirm(null);
                  }
                }}
                disabled={deletingId === paperToDeleteConfirm.id}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950 cursor-pointer flex items-center gap-1.5"
              >
                {deletingId === paperToDeleteConfirm.id ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3" />
                    Delete Paper
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Papers */}
      {showConfirmClearAll && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0F1115] border border-rose-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Clear Entire Repository</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase">PERMANENT ACTION</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Are you sure you want to delete all <strong className="text-white">{papers.length} literature records</strong>? This will clear all uploaded papers and extracted bibliography metadata from your workspace index.
            </p>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!onClearAllPapers) return;
                  setIsClearingAll(true);
                  try {
                    await onClearAllPapers();
                  } catch (e) {
                    console.error("Clear all papers error:", e);
                  } finally {
                    setIsClearingAll(false);
                    setShowConfirmClearAll(false);
                  }
                }}
                disabled={isClearingAll}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950 cursor-pointer flex items-center gap-1.5"
              >
                {isClearingAll ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Clearing Repository...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3" />
                    Clear All Papers
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
