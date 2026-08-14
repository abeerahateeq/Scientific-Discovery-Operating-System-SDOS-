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
  Award,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Calculator,
  RotateCcw,
  FileText,
  Paperclip,
  Upload,
  FileSpreadsheet,
  FileCode,
  Copy,
  CheckCircle,
  BarChart2,
  FileUp,
  Download,
  Trash2,
  GraduationCap
} from 'lucide-react';
import { UserProfile } from '../lib/firebase';
import { ScientificPaper, Hypothesis, SpssAnalysisPackage } from '../types';
import BloxBotDocumentExportModal, { BloxBotExportableDocument } from './BloxBotDocumentExportModal';

interface RobloxGuideBotProps {
  currentTab: string;
  onNavigateTab?: (tab: any) => void;
  userProfile?: UserProfile | null;
  onTriggerNotification?: (title: string, message: string, type?: any) => void;
  papers?: ScientificPaper[];
  onHypothesisGenerated?: (hypo: Hypothesis) => void;
  onApplySpssAnalysis?: (pkg: SpssAnalysisPackage) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bloxbot';
  text: string;
  timestamp: string;
  canNotifyTeam?: boolean;
  isResearchResult?: boolean;
  actionPayload?: any;
  attachedDocName?: string;
  operationType?: string;
  spssPackage?: any;
  hypothesis?: any;
  extractedEntities?: any[];
}

export default function RobloxGuideBot({
  currentTab,
  onNavigateTab,
  userProfile,
  onTriggerNotification,
  papers = [],
  onHypothesisGenerated,
  onApplySpssAnalysis
}: RobloxGuideBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'bloxbot',
      text: "👋 Bleep Bloop! Welcome to Synapse OS! I am **BloxBot**, your gamified Roblox research assistant (LVL 99).\n\n📄 **Document Ingestion Ready!** Click the 📎 **Attach Document** button to upload any research PDF, Word (.docx), CSV, or text file. Select an operation or type custom commands to run **SPSS Statistics, Hypothesis Formulations, Executive Summaries, or Knowledge Graph extractions**! 🚀",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      canNotifyTeam: true
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Document Attachment State
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedDocMeta, setAttachedDocMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string>('spss_analysis');
  const [showOperationPicker, setShowOperationPicker] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input (Speech Recognition) State
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // TTS Voice Narration
  const recognitionRef = useRef<any>(null);

  // Autonomous Research Execution State
  const [isAutoResearching, setIsAutoResearching] = useState(false);
  const [researchProgressStep, setResearchProgressStep] = useState<string>('');

  // Document Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelectedDocId, setExportSelectedDocId] = useState<string | null>(null);
  const [exportedDocuments, setExportedDocuments] = useState<BloxBotExportableDocument[]>([
    {
      id: 'doc_welcome_overview',
      title: 'BloxBot Master Research Dossier & Academic Protocol',
      docType: 'System Protocol',
      operationType: 'System Briefing',
      originalFileName: 'Synapse_OS_BloxBot_Protocol.pdf',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contentMarkdown: `# 🎓 Synapse OS • BloxBot Autonomous Research Suite\n\n## 🚀 System Architecture & Capabilities\nSynapse OS unites 3D Knowledge Graph Navigation, Multi-Agent Hypothesis Evolutionary Tournaments, and the IBM SPSS® Statistical Analysis Suite into a unified discovery engine.\n\n### 📄 Document Processing & Academic Export Features:\n- **Academic Thesis & Dissertation Proposals**: Ingest raw research documents and synthesize comprehensive 5-chapter dissertation drafts with research questions ($RQ_1, RQ_2, RQ_3$), APA 7th statistics, and defense preparation.\n- **IBM SPSS® Statistical Analysis**: Execute parametric and non-parametric hypothesis tests, generate SPSS syntax (.sps), and formulate APA 7th statistical statements.\n- **Evolutionary Hypothesis Synthesis**: Formulate high-novelty scientific hypotheses evaluated across multi-agent tournaments.\n- **Multi-Format Exporting**: Export all documents in Formal PDF, Markdown (.md), Plain Text (.txt), JSON Research Packages, IBM SPSS Syntax (.sps), CSV Catalogs, and HTML Print formats!`
    }
  ]);

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

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-To-Speech (TTS) Voice Narration
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop prior speech
    
    const cleanSpeech = text
      .replace(/[*_#`~$\\]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .slice(0, 350);

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.15; // Cheerful friendly robotic pitch
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or a Chromium browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start voice recognition", e);
      }
    }
  };

  // Handle File Selection
  const handleFileSelect = (file: File) => {
    if (!file) return;
    setAttachedFile(file);
    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeMb = (file.size / 1024 / 1024).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;
    
    let typeLabel = "Document";
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') typeLabel = 'PDF';
    else if (ext === 'docx' || ext === 'doc') typeLabel = 'Word DOCX';
    else if (ext === 'csv' || ext === 'tsv') typeLabel = 'Dataset (CSV)';
    else if (ext === 'txt' || ext === 'md' || ext === 'json') typeLabel = ext.toUpperCase();

    setAttachedDocMeta({
      name: file.name,
      size: sizeStr,
      type: typeLabel
    });
    setShowOperationPicker(true);
    speakText(`Document ${file.name} attached! Select an operation or type your request.`);
  };

  // Remove Attached File
  const handleRemoveFile = () => {
    setAttachedFile(null);
    setAttachedDocMeta(null);
    setShowOperationPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Process Document with Selected Operation
  const handleExecuteDocOperation = async (operationKey: string, customPrompt?: string) => {
    if (!attachedFile && !inputQuery.trim()) return;

    setIsAutoResearching(true);
    setEmotion('thinking');
    setShowOperationPicker(false);

    const fileToProcess = attachedFile;
    const promptToSend = customPrompt !== undefined ? customPrompt : inputQuery;
    const docName = fileToProcess ? fileToProcess.name : "Active Ingested Context";
    const opDisplay = operationKey.replace(/_/g, ' ').toUpperCase();

    // Add user message
    const userMsgText = fileToProcess
      ? `📄 **Attached Document:** \`${fileToProcess.name}\` (${attachedDocMeta?.size || 'Attached'})\n⚡ **Requested BloxBot Operation:** \`${opDisplay}\`${promptToSend ? `\n💬 **Instruction:** "${promptToSend}"` : ''}`
      : `⚡ **Requested BloxBot Operation on Literature:** \`${opDisplay}\`\n💬 **Instruction:** "${promptToSend}"`;

    const userMsg: ChatMessage = {
      id: `usr_doc_${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedDocName: fileToProcess?.name,
      operationType: operationKey
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setAttachedFile(null);
    setAttachedDocMeta(null);

    setResearchProgressStep(`Step 1: Ingesting "${docName}" buffer and mapping variables...`);
    await new Promise(r => setTimeout(r, 450));

    setResearchProgressStep(`Step 2: Executing ${opDisplay} multi-agent reasoning engine...`);
    await new Promise(r => setTimeout(r, 450));

    try {
      const formData = new FormData();
      if (fileToProcess) {
        formData.append("document", fileToProcess);
      }
      formData.append("operation", operationKey);
      formData.append("userPrompt", promptToSend);

      const res = await fetch("/api/guide/process-doc", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setResearchProgressStep(`Step 3: Compiling structured report & SPSS artifacts...`);
      await new Promise(r => setTimeout(r, 400));

      const botMsg: ChatMessage = {
        id: `bot_doc_${Date.now()}`,
        sender: 'bloxbot',
        text: data.answer || "Bleep bloop! Successfully processed document.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachedDocName: data.docName,
        operationType: data.operation,
        spssPackage: data.spssPackage,
        hypothesis: data.hypothesis,
        extractedEntities: data.extractedEntities,
        isResearchResult: true,
        canNotifyTeam: true
      };

      setMessages(prev => [...prev, botMsg]);
      setEmotion(data.emotion || 'happy');
      if (data.speechText) speakText(data.speechText);

      // Add to Exported Documents library
      const newExportDoc: BloxBotExportableDocument = {
        id: `doc_${Date.now()}`,
        title: data.docName ? `${opDisplay}: ${data.docName}` : `BloxBot Analysis Report (${opDisplay})`,
        docType: data.docType || 'Research Document',
        operationType: data.operation || operationKey,
        originalFileName: data.docName || fileToProcess?.name || 'Attached Document',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contentMarkdown: data.answer || '',
        spssPackage: data.spssPackage,
        hypothesis: data.hypothesis,
        extractedEntities: data.extractedEntities
      };
      setExportedDocuments(prev => [newExportDoc, ...prev]);

      // Trigger cross-component updates
      if (data.hypothesis && onHypothesisGenerated) {
        onHypothesisGenerated(data.hypothesis);
      }
      if (data.spssPackage && onApplySpssAnalysis) {
        onApplySpssAnalysis(data.spssPackage);
      }
      if (onTriggerNotification) {
        onTriggerNotification(
          "BloxBot Document Operation Complete",
          `Finished ${opDisplay} on ${docName}!`,
          "system"
        );
      }
    } catch (err: any) {
      console.error("BloxBot Doc Processing error:", err);
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bloxbot',
        text: `⚡ **BloxBot Processing Glitch!** Could not complete ${opDisplay} on "${docName}". You can try again with a cleaner PDF/DOCX or click **'Notify Team'** below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        canNotifyTeam: true
      };
      setMessages(prev => [...prev, errorMsg]);
      setEmotion('explaining');
    } finally {
      setIsAutoResearching(false);
      setResearchProgressStep('');
    }
  };

  // Standard Ask BloxBot
  const handleAsk = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if ((!q.trim() && !attachedFile) || loading || isAutoResearching) return;

    if (attachedFile) {
      // If a file is attached and user hits enter, process it with selected operation or custom query
      handleExecuteDocOperation(selectedOperation || 'custom_query', q);
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

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

      const botMsgText = data.answer || "Bleep bloop! I've analyzed your query.";
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bloxbot',
        text: botMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        canNotifyTeam: data.canNotifyTeam ?? true
      };

      setMessages(prev => [...prev, botMsg]);
      setEmotion(data.emotion || 'happy');
      speakText(botMsgText);
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

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItemId(id);
    setTimeout(() => setCopiedItemId(null), 2000);
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
        
        if (onTriggerNotification) {
          onTriggerNotification(
            "Support Ticket Created",
            `Ticket ${data.ticketId}: Sent to Synapse OS engineering team!`,
            "system"
          );
        }

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

  const operationsList = [
    { key: 'generate_thesis', label: 'Thesis / Dissertation Draft', icon: GraduationCap, desc: 'Full Chapters 1-5, theoretical models, RQs, SPSS analysis plan & defense prep', color: 'amber' },
    { key: 'spss_analysis', label: 'SPSS Statistical Suite', icon: Calculator, desc: 'T-Test, ANOVA, Regression, APA 7th Statement, .sps syntax', color: 'indigo' },
    { key: 'formulate_hypothesis', label: 'Formulate Hypothesis', icon: Zap, desc: 'Synthesize evolutionary scientific hypothesis tournament', color: 'emerald' },
    { key: 'executive_summary', label: 'Executive Summary', icon: FileText, desc: 'Extract key takeaways, background, findings, and horizons', color: 'sky' },
    { key: 'methodology_critique', label: 'Methodology Critique', icon: AlertCircle, desc: 'Evaluate statistical power, validity, biases, & confounds', color: 'amber' },
    { key: 'extract_entities_graph', label: 'Extract Knowledge Graph', icon: Network, desc: 'Extract proteins, genes, and inject 3D graph links', color: 'purple' },
    { key: 'grant_funding_match', label: 'Match Grant Opportunities', icon: Award, desc: 'Identify NSF, NIH, DARPA solicitations & grant fit', color: 'rose' },
    { key: 'experimental_protocol', label: 'Experimental Protocol', icon: Cpu, desc: 'Generate wet-lab/in-silico replication protocol', color: 'cyan' }
  ];

  return (
    <>
      {/* Hidden File Input for Document Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.csv,.tsv,.json,.md,.sps"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* FLOATING ROBLOX MASCOT AVATAR TRIGGER (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
        {/* Cute Speech Bubble Hint when collapsed */}
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="mb-2 bg-[#12151E] border border-sky-500/40 text-slate-200 text-[11px] font-mono px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer hover:border-sky-400 hover:scale-105 transition-all group animate-bounce"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span>🎙️ Ask <b>BloxBot</b> or Add Documents! 📄</span>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}

        {/* Roblox Character Block Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-1.5 rounded-2xl bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-600 border-2 border-sky-400/80 shadow-2xl shadow-sky-950/80 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Open Roblox BloxBot Assistant (Document & Voice Enabled)"
        >
          <div className="relative w-12 h-12 bg-[#0D111A] rounded-xl border border-sky-400/50 flex flex-col items-center justify-center overflow-hidden">
            {/* Antenna block */}
            <div className="absolute top-0.5 w-2 h-1 bg-amber-400 rounded-sm animate-pulse"></div>

            {/* Blocky Face / Visor */}
            <div className="w-9 h-6 bg-slate-950 rounded border border-sky-500/60 flex items-center justify-center gap-1.5 mt-1 shadow-inner">
              {emotion === 'thinking' || isAutoResearching ? (
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
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          className="fixed bottom-20 right-4 sm:right-6 w-[95vw] sm:w-[500px] max-h-[660px] h-[86vh] bg-[#0A0C11] border-2 border-sky-500/40 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* DRAG AND DROP OVERLAY */}
          {isDraggingFile && (
            <div className="absolute inset-0 z-50 bg-sky-950/90 backdrop-blur-sm border-2 border-dashed border-sky-400 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 mb-3 animate-bounce">
                <FileUp className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-1">
                Drop Research Document Here
              </h4>
              <p className="text-xs text-sky-300 font-mono">
                BloxBot supports PDF, Word (.docx), CSV, TSV, TXT, JSON
              </p>
            </div>
          )}
          
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-[#0E121B] via-[#121826] to-[#0E121B] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/50 flex flex-col items-center justify-center relative shrink-0">
                <div className="w-5 h-3.5 bg-slate-950 rounded border border-sky-400 flex items-center justify-center gap-1">
                  <div className="w-1 h-1 bg-sky-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-sky-400 rounded-full"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">
                    BloxBot AI Guide & Research Bot
                  </h3>
                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[8px] font-mono px-1 py-0.2 rounded font-bold">
                    DOCUMENTS ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Autonomous Multi-Operation Pipeline
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Document Export Button */}
              <button
                onClick={() => {
                  setExportSelectedDocId(null);
                  setShowExportModal(true);
                }}
                className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                title="Export BloxBot Documents & Reports (PDF, Word, MD, JSON)"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Export ({exportedDocuments.length})</span>
              </button>

              {/* Voice Narration Audio Toggle */}
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) window.speechSynthesis.cancel();
                }}
                className={`p-1.5 rounded-lg border transition-colors ${
                  voiceEnabled ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-800/80 text-slate-500 border-slate-700'
                }`}
                title={voiceEnabled ? 'Disable Voice Narration' : 'Enable Voice Narration'}
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowNotifyModal(true)}
                className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
              >
                <LifeBuoy className="w-3 h-3 text-rose-400" />
                <span>Notify Team</span>
              </button>

              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="p-2 bg-[#07090D] border-b border-slate-800/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
            >
              <Paperclip className="w-3 h-3 text-sky-400" />
              <span>Add Document</span>
            </button>

            <button
              onClick={() => {
                setExportSelectedDocId(null);
                setShowExportModal(true);
              }}
              className="shrink-0 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
              title="Export all documents and manuscripts"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Export Documents ({exportedDocuments.length})</span>
            </button>
            
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab("spss" as any);
              }}
              className="shrink-0 px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <Calculator className="w-3 h-3 text-indigo-400" /> SPSS Studio
            </button>

            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab("hypotheses" as any);
              }}
              className="shrink-0 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <Zap className="w-3 h-3 text-emerald-400" /> Hypotheses
            </button>

            <button
              onClick={() => handleAsk("How do I generate a full academic thesis or dissertation from my uploaded documents?")}
              className="shrink-0 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <GraduationCap className="w-3 h-3 text-amber-400" /> Thesis Draft
            </button>

            <button
              onClick={() => handleAsk("What document operations can BloxBot perform?")}
              className="shrink-0 px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3 h-3 text-purple-400" /> Operations Guide
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-[#090B10]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-slate-500">
                  <span>{msg.sender === 'user' ? 'You' : 'BloxBot Guide'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.attachedDocName && (
                    <>
                      <span>•</span>
                      <span className="text-sky-400 font-bold">📄 {msg.attachedDocName}</span>
                    </>
                  )}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[94%] shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-[#121622] text-slate-200 border border-slate-800 rounded-tl-none space-y-2.5'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* If SPSS Package Result is present, render interactive SPSS widgets */}
                  {msg.spssPackage && (
                    <div className="mt-2.5 pt-2.5 border-t border-indigo-500/30 bg-indigo-950/20 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-indigo-300 flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-indigo-400" />
                          <span>IBM SPSS Output Generated</span>
                        </span>
                        <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                          {msg.spssPackage.analysisType?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Action buttons for SPSS */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            if (onApplySpssAnalysis && msg.spssPackage) {
                              onApplySpssAnalysis(msg.spssPackage);
                            }
                            if (onNavigateTab) onNavigateTab("spss" as any);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono font-bold rounded-lg flex items-center gap-1 shadow transition-all"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Open in SPSS Studio</span>
                        </button>

                        <button
                          onClick={() => handleCopyText(`apa-${msg.id}`, msg.spssPackage.apaStatement)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono rounded-lg flex items-center gap-1 transition-colors"
                        >
                          {copiedItemId === `apa-${msg.id}` ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy APA 7th</span>
                        </button>

                        {msg.spssPackage.spssSyntax && (
                          <button
                            onClick={() => handleCopyText(`syntax-${msg.id}`, msg.spssPackage.spssSyntax)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono rounded-lg flex items-center gap-1 transition-colors"
                          >
                            {copiedItemId === `syntax-${msg.id}` ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <FileCode className="w-3 h-3" />}
                            <span>Copy .sps Syntax</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If Hypothesis Result, render hypothesis navigation */}
                  {msg.hypothesis && (
                    <div className="mt-2.5 pt-2.5 border-t border-emerald-500/30 bg-emerald-950/20 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-mono font-bold">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Hypothesis Added to Workspace</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab("hypotheses" as any);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold rounded-lg flex items-center gap-1"
                      >
                        <span>View Hypotheses</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* If Graph Result, render graph explorer button */}
                  {msg.extractedEntities && msg.extractedEntities.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-purple-500/30 bg-purple-950/20 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-mono font-bold">
                        <Network className="w-3.5 h-3.5 text-purple-400" />
                        <span>{msg.extractedEntities.length} Nodes Injected into Graph</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab("graph" as any);
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold rounded-lg flex items-center gap-1"
                      >
                        <span>Explore 3D Graph</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* BloxBot Message Action & Export Bar */}
                  {msg.sender === 'bloxbot' && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const existingDoc = exportedDocuments.find(d => d.id === `msg_${msg.id}`);
                            if (!existingDoc) {
                              const dynamicDoc: BloxBotExportableDocument = {
                                id: `msg_${msg.id}`,
                                title: msg.attachedDocName ? `Analysis: ${msg.attachedDocName}` : `BloxBot Intelligence: ${msg.text.slice(0, 35)}...`,
                                docType: 'BloxBot Output',
                                operationType: msg.operationType || 'Research Analysis',
                                originalFileName: msg.attachedDocName || 'BloxBot_Context',
                                timestamp: msg.timestamp,
                                contentMarkdown: msg.text,
                                spssPackage: msg.spssPackage,
                                hypothesis: msg.hypothesis,
                                extractedEntities: msg.extractedEntities
                              };
                              setExportedDocuments(prev => [dynamicDoc, ...prev]);
                            }
                            setExportSelectedDocId(`msg_${msg.id}`);
                            setShowExportModal(true);
                          }}
                          className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Export this response as PDF, Markdown, Word, or JSON"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Export Document</span>
                        </button>

                        <button
                          onClick={() => handleCopyText(`msg-${msg.id}`, msg.text)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedItemId === `msg-${msg.id}` ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>

                      {msg.canNotifyTeam && (
                        <button
                          onClick={() => {
                            setNotifyMessage(`Question regarding: "${msg.text.slice(0, 60)}..."`);
                            setShowNotifyModal(true);
                          }}
                          className="text-rose-400 hover:text-rose-300 underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <AlertCircle className="w-3 h-3" /> Notify Team
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAutoResearching && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex flex-col gap-2 max-w-[94%]">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>BloxBot Autonomous Engine Executing...</span>
                </div>
                <p className="text-[11px] font-mono text-emerald-300 animate-pulse">
                  {researchProgressStep}
                </p>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-[#121622] border border-slate-800 rounded-2xl max-w-[80%]">
                <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-sky-300 font-mono animate-pulse">
                  BloxBot is synthesizing response...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ATTACHED DOCUMENT PREVIEW BAR */}
          {attachedDocMeta && (
            <div className="p-2.5 bg-[#0F1420] border-t border-sky-500/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-white font-bold truncate max-w-[240px]">
                      {attachedDocMeta.name}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400">
                      {attachedDocMeta.type} • {attachedDocMeta.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (attachedDocMeta) {
                        const dynamicDoc: BloxBotExportableDocument = {
                          id: 'attached_current_file',
                          title: `Draft Package: ${attachedDocMeta.name}`,
                          docType: attachedDocMeta.type,
                          operationType: selectedOperation,
                          originalFileName: attachedDocMeta.name,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          contentMarkdown: `# Attached Research Document: ${attachedDocMeta.name}\n- **Format:** ${attachedDocMeta.type}\n- **File Size:** ${attachedDocMeta.size}\n- **Configured Operation:** \`${selectedOperation.replace(/_/g, ' ').toUpperCase()}\`\n\n*Document ingested into Synapse OS BloxBot Workspace.*`
                        };
                        setExportedDocuments(prev => [dynamicDoc, ...prev.filter(d => d.id !== 'attached_current_file')]);
                        setExportSelectedDocId('attached_current_file');
                        setShowExportModal(true);
                      }
                    }}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Export / Download Document Summary"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => setShowOperationPicker(!showOperationPicker)}
                    className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showOperationPicker ? 'Hide Operations' : 'Choose Operation'}</span>
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Operation Picker Matrix */}
              {showOperationPicker && (
                <div className="p-2 bg-[#080A0F] border border-slate-800 rounded-xl grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                  {operationsList.map((op) => {
                    const OpIcon = op.icon;
                    return (
                      <button
                        key={op.key}
                        onClick={() => {
                          setSelectedOperation(op.key);
                          handleExecuteDocOperation(op.key);
                        }}
                        className="p-1.5 rounded-lg bg-[#111622] hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/50 text-left flex items-start gap-1.5 transition-all group"
                      >
                        <OpIcon className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold font-mono text-slate-200 group-hover:text-white truncate">
                            {op.label}
                          </div>
                          <div className="text-[8px] text-slate-400 font-mono line-clamp-1">
                            {op.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Voice Input & Query Footer */}
          <div className="p-3 bg-[#0B0D13] border-t border-slate-800/80 flex items-center gap-2">
            {/* Document Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                attachedFile 
                  ? 'bg-sky-500 text-white border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700'
              }`}
              title="Attach Document (PDF, Word, CSV, TXT)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Microphone Button */}
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
              }`}
              title={isListening ? 'Stop Listening' : 'Click to Speak (Voice Input)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (attachedFile) {
                    handleExecuteDocOperation(selectedOperation || 'custom_query', inputQuery);
                  } else {
                    handleAsk();
                  }
                }
              }}
              placeholder={
                isListening 
                  ? "Listening to your voice..." 
                  : attachedFile 
                    ? "Type custom instruction or press send for SPSS / Analysis..." 
                    : "Speak or type research query, or attach document..."
              }
              className={`flex-1 bg-[#050609] border focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-sans ${
                isListening ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
              }`}
            />
            
            <button
              onClick={() => {
                if (attachedFile) {
                  handleExecuteDocOperation(selectedOperation || 'custom_query', inputQuery);
                } else {
                  handleAsk();
                }
              }}
              disabled={loading || isAutoResearching || (!inputQuery.trim() && !attachedFile)}
              className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md"
              title="Send to BloxBot"
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

      {/* BLOXBOT DOCUMENT EXPORT MODAL */}
      <BloxBotDocumentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        documents={exportedDocuments}
        initialSelectedDocId={exportSelectedDocId}
        userName={userProfile?.displayName || userProfile?.email?.split('@')[0] || "Scholar"}
      />
    </>
  );
}

