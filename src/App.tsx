import React, { useState, useEffect } from "react";
import { 
  ScientificPaper, 
  GraphNode, 
  GraphLink, 
  Hypothesis, 
  DiscoveryResponse,
  Bounty,
  InterdisciplinaryExchangeLog,
  SpssAnalysisPackage
} from "./types";
import KnowledgeGraph from "./components/KnowledgeGraph";
import LiteratureIngest from "./components/LiteratureIngest";
import AgentPipeline from "./components/AgentPipeline";
import HypothesisDetail from "./components/HypothesisDetail";
import GlobalGapDetector from "./components/GlobalGapDetector";
import DiscoveryMarket from "./components/DiscoveryMarket";
import HypothesisCompare from "./components/HypothesisCompare";
import FundingIntelligence from "./components/FundingIntelligence";
import InstitutionalWorkspace from "./components/InstitutionalWorkspace";
import MorningBriefingModal from "./components/MorningBriefingModal";
import ResearchOSWorkspace from "./components/ResearchOSWorkspace";
import UserHeaderControl from "./components/UserHeaderControl";
import RobloxGuideBot from "./components/RobloxGuideBot";
import ExportReportModal from "./components/ExportReportModal";
import ApiKeyModal from "./components/ApiKeyModal";
import RecentActivityView, { ActivityItem } from "./components/RecentActivityView";
import SpssStudio from "./components/SpssStudio";
import { classifyTopicDomain } from "./config/domainTemplates";
import { 
  auth, 
  onAuthStateChanged, 
  signInAnonymously, 
  syncUserProfile, 
  createNotification, 
  saveUserHypothesisToDb, 
  saveUserBriefingToDb, 
  toggleFavoriteHypothesisInDb,
  UserProfile, 
  UserNotification, 
  db, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy 
} from "./lib/firebase";
import { 
  Cpu, 
  Network, 
  BookOpen, 
  Sparkles, 
  Database, 
  HelpCircle,
  FileText,
  Bookmark,
  CheckCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  X,
  Compass,
  Award,
  GitCompare,
  Coins,
  Building2,
  Sun,
  Terminal,
  Download,
  Copy,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  CheckSquare,
  Square,
  History,
  FolderTree,
  Grid,
  Trash2,
  Key,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Layers,
  Calculator
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "graph" | "literature" | "hypotheses" | "gaps" | "market" | "funding" | "institutional" | "research_os" | "activity" | "spss"
  >("dashboard");
  
  // User Auth & Notification state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  // App state
  const [papers, setPapers] = useState<ScientificPaper[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [agentLogs, setAgentLogs] = useState<{ agent: any; message: string; timestamp: string }[]>([]);

  // Bounties & Feedback states
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isCreatingBounty, setIsCreatingBounty] = useState(false);
  const [isLinkingBounty, setIsLinkingBounty] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // Autonomous Overnight Run state & Export Modal
  const [isAutonomousRunning, setIsAutonomousRunning] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [autonomousBriefing, setAutonomousBriefing] = useState<any | null>(null);

  // Selection states for graph discovery
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sourceNode, setSourceNode] = useState<GraphNode | null>(null);
  const [targetNode, setTargetNode] = useState<GraphNode | null>(null);

  // Discovery results
  const [discoveredPath, setDiscoveredPath] = useState<string[]>([]);
  const [discoveredConnections, setDiscoveredConnections] = useState<any[]>([]);
  const [discoveryExplanation, setDiscoveryExplanation] = useState<string>("");
  const [showDiscoveryExplanationCard, setShowDiscoveryExplanationCard] = useState(false);

  // Selected hypothesis detail & Favorites Bookmark list
  const [selectedHypothesis, setSelectedHypothesis] = useState<Hypothesis | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [appliedSpssPackage, setAppliedSpssPackage] = useState<SpssAnalysisPackage | null>(null);

  useEffect(() => {
    const savedFavs = localStorage.getItem("sdos_user_favorites");
    if (savedFavs) {
      try {
        setUserFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    } else if (userProfile?.favoriteHypothesisIds) {
      setUserFavorites(userProfile.favoriteHypothesisIds);
    }
  }, [userProfile?.favoriteHypothesisIds]);

  // Activity Audit History state
  const [activityLogs, setActivityLogs] = useState<ActivityItem[]>([
    {
      id: "act-1",
      type: "hypothesis",
      title: "Synthesized Deep Hypothesis",
      description: "Multi-agent pipeline generated Topological Stabilizer Code hypothesis for protein folding.",
      timestamp: "10 mins ago",
      user: "Discovery Scholar"
    },
    {
      id: "act-2",
      type: "ingest",
      title: "Ingested Scientific Paper",
      description: "Indexed arXiv:2403.09112 - Quantum decoherence bounds in lipid bilayers.",
      timestamp: "25 mins ago",
      user: "Discovery Scholar"
    },
    {
      id: "act-3",
      type: "sync",
      title: "Auto-Sync Poller Active",
      description: "Automated 5-minute background refresh synced graph nodes, papers, and hypotheses.",
      timestamp: "1 hour ago",
      user: "System Poller"
    }
  ]);

  const logActivity = (type: ActivityItem["type"], title: string, description: string) => {
    const newItem: ActivityItem = {
      id: `act-${Date.now()}`,
      type,
      title,
      description,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      user: userProfile?.displayName || userProfile?.email || "Discovery Scholar"
    };
    setActivityLogs((prev) => [newItem, ...prev]);
  };

  const handleToggleBookmark = async (hypothesisId: string) => {
    const isFav = userFavorites.includes(hypothesisId);
    const nextFavs = isFav ? userFavorites.filter(id => id !== hypothesisId) : [...userFavorites, hypothesisId];
    setUserFavorites(nextFavs);
    localStorage.setItem("sdos_user_favorites", JSON.stringify(nextFavs));
    
    if (userProfile?.uid && userProfile.uid !== 'guest_scholar_session' && auth.currentUser) {
      await toggleFavoriteHypothesisInDb(userProfile.uid, hypothesisId, !isFav);
    }

    logActivity("bookmark", isFav ? "Removed Bookmark" : "Bookmarked Hypothesis", isFav ? `Removed hypothesis ${hypothesisId} from favorites.` : `Bookmarked hypothesis ${hypothesisId} to profile.`);

    triggerNotification(
      isFav ? "Removed Bookmark" : "Saved to Favorites",
      isFav ? `Removed hypothesis from user favorites.` : `Bookmarked hypothesis to user profile favorites list in Firestore.`,
      "system"
    );
  };

  // Hypotheses Tab Filtering, Sorting, Cluster View & Batch Actions state
  const [minConfidenceFilter, setMinConfidenceFilter] = useState<number>(0);
  const [hypothesesSearchQuery, setHypothesesSearchQuery] = useState<string>("");
  const [hypothesesSortBy, setHypothesesSortBy] = useState<"newest" | "confidence" | "impact">("newest");
  const [hypothesesViewMode, setHypothesesViewMode] = useState<"list" | "cluster">("list");
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>({});
  const [batchSelectedHypothesisIds, setBatchSelectedHypothesisIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [userHasCustomKey, setUserHasCustomKey] = useState<boolean>(() => !!localStorage.getItem('user_gemini_api_key'));

  const toggleDomainCollapse = (domain: string) => {
    setCollapsedDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  const handleConfirmBatchDelete = async () => {
    const count = batchSelectedHypothesisIds.length;
    if (count === 0) return;

    const remaining = hypotheses.filter((h) => !batchSelectedHypothesisIds.includes(h.id));
    setHypotheses(remaining);

    if (selectedHypothesis && batchSelectedHypothesisIds.includes(selectedHypothesis.id)) {
      setSelectedHypothesis(remaining[0] || null);
    }

    try {
      await fetch("/api/hypotheses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: batchSelectedHypothesisIds })
      });
    } catch (e) {
      console.error("Batch delete error:", e);
    }

    logActivity(
      "delete",
      `Batch Deleted ${count} Hypotheses`,
      `Permanently removed ${count} selected hypotheses from local workspace state and server database.`
    );
    triggerNotification(
      "Batch Deletion Completed",
      `Permanently removed ${count} hypotheses from workspace.`,
      "system"
    );
    setBatchSelectedHypothesisIds([]);
    setShowBatchDeleteModal(false);
  };

  const handleDeleteSingleHypothesis = async (id: string) => {
    try {
      const hypoToDelete = hypotheses.find((h) => h.id === id);
      const title = hypoToDelete?.title || "Hypothesis";

      const res = await fetch(`/api/hypotheses/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setHypotheses((prev) => prev.filter((h) => h.id !== id));
        if (selectedHypothesis?.id === id) {
          const remaining = hypotheses.filter((h) => h.id !== id);
          setSelectedHypothesis(remaining[0] || null);
        }
        logActivity(
          "delete",
          "Deleted Hypothesis",
          `Permanently removed "${title}" from workspace database.`
        );
        triggerNotification(
          "Hypothesis Deleted",
          `Removed "${title}" from research workspace.`,
          "system"
        );
      }
    } catch (err) {
      console.error("Delete hypothesis error:", err);
    }
  };

  const handleResetWorkspace = async (mode: "clear" | "seed" = "clear") => {
    try {
      const res = await fetch("/api/papers/reset-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        await fetchData(); // Refresh all state
        logActivity(
          "delete",
          mode === "seed" ? "Restored Sample Dataset" : "Purged Workspace Data",
          mode === "seed" 
            ? "Restored default scientific sample dataset." 
            : "Purged all papers, graph nodes, and hypotheses for a clean research domain."
        );
        triggerNotification(
          mode === "seed" ? "Sample Data Restored" : "Workspace Purged",
          mode === "seed" 
            ? "Default dataset restored." 
            : "Workspace is now 100% clean for your new research domain.",
          "system"
        );
      }
    } catch (err) {
      console.error("Reset workspace error:", err);
    }
  };

  // Computed filtered and sorted hypotheses list
  const displayedHypotheses = hypotheses
    .filter((hypo) => {
      const confPercent = Math.round(hypo.confidence * 100);
      if (confPercent < minConfidenceFilter) return false;
      if (hypothesesSearchQuery.trim() !== "") {
        const q = hypothesesSearchQuery.toLowerCase();
        const matchTitle = hypo.title.toLowerCase().includes(q);
        const matchDomain = hypo.domain ? hypo.domain.toLowerCase().includes(q) : false;
        const matchDesc = hypo.description ? hypo.description.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchDomain && !matchDesc) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (hypothesesSortBy === "confidence") {
        return b.confidence - a.confidence;
      }
      if (hypothesesSortBy === "impact") {
        return (b.noveltyScore || 0) - (a.noveltyScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Group displayed hypotheses by domain for Cluster View
  const clusteredHypotheses: Record<string, Hypothesis[]> = {};
  displayedHypotheses.forEach((h) => {
    const dom = h.domain || classifyTopicDomain(h.title + " " + (h.query || "")).domainName;
    if (!clusteredHypotheses[dom]) clusteredHypotheses[dom] = [];
    clusteredHypotheses[dom].push(h);
  });

  // Compare Mode State (Tri-Panel Support for Slot A, B, and C)
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareHypoA, setCompareHypoA] = useState<Hypothesis | null>(null);
  const [compareHypoB, setCompareHypoB] = useState<Hypothesis | null>(null);
  const [compareHypoC, setCompareHypoC] = useState<Hypothesis | null>(null);
  const [compareSlot, setCompareSlot] = useState<"A" | "B" | "C">("A");

  // Loading states
  const [isIngesting, setIsIngesting] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isGeneratingHypothesis, setIsGeneratingHypothesis] = useState(false);
  const [isVerifyingHypothesis, setIsVerifyingHypothesis] = useState(false);
  const [isSimulatingExperiment, setIsSimulatingExperiment] = useState(false);

  // Fetch initial datasets
  const fetchData = async () => {
    try {
      const papersRes = await fetch("/api/papers");
      const papersData = await papersRes.json();
      if (Array.isArray(papersData)) setPapers(papersData);

      const graphRes = await fetch("/api/graph");
      const graphData = await graphRes.json();
      if (graphData && Array.isArray(graphData.nodes)) setNodes(graphData.nodes);
      if (graphData && Array.isArray(graphData.links)) setLinks(graphData.links);

      const hypoRes = await fetch("/api/hypotheses");
      const hypoData = await hypoRes.json();
      if (Array.isArray(hypoData)) {
        setHypotheses(hypoData);
        if (hypoData.length > 0 && !selectedHypothesis) {
          setSelectedHypothesis(hypoData[0]);
        }
      }

      const bountiesRes = await fetch("/api/bounties");
      const bountiesData = await bountiesRes.json();
      if (Array.isArray(bountiesData)) setBounties(bountiesData);
    } catch (err) {
      console.error("Error fetching datasets:", err);
    }
  };

  useEffect(() => {
    fetchData();

    // Automated 5-minute polling mechanism (300,000 ms)
    const pollInterval = setInterval(() => {
      fetchData();
      logActivity(
        "sync",
        "Automated 5-Min Workspace Sync",
        "Refreshed knowledge graph nodes, literature papers, and active hypotheses dataset."
      );
    }, 300000);

    return () => clearInterval(pollInterval);
  }, []);

  // Firebase Authentication & Guest Fallback
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await syncUserProfile(user);
        setUserProfile(profile);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          const profile = await syncUserProfile(cred.user);
          setUserProfile(profile);
        } catch (err: any) {
          // If anonymous sign-in is disabled in Firebase console (auth/admin-restricted-operation),
          // fallback gracefully to a guest scholar local profile state
          const localGuest: UserProfile = {
            uid: 'guest_scholar_session',
            email: null,
            displayName: 'Guest Scholar',
            photoURL: null,
            createdAt: new Date().toISOString(),
            isAnonymous: true,
            morningBriefingTime: '08:00',
          };
          setUserProfile(localGuest);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Helper to trigger process complete & briefing notifications locally & in Firestore
  const triggerNotification = async (title: string, message: string, type: UserNotification['type'] = 'process_done', link?: string) => {
    const newNotif: UserNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: userProfile?.uid || 'guest_scholar_session',
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      ...(link ? { link } : {})
    };

    setNotifications(prev => [newNotif, ...prev]);

    if (userProfile?.uid && userProfile.uid !== 'guest_scholar_session' && auth.currentUser) {
      await createNotification(userProfile.uid, title, message, type, link);
    }
  };

  // Firestore Realtime Notification Listener (Only when logged in with active Firebase Auth user)
  useEffect(() => {
    if (!userProfile?.uid || userProfile.uid === 'guest_scholar_session' || !auth.currentUser) return;

    try {
      const q = query(
        collection(db, "userNotifications"),
        where("userId", "==", userProfile.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: UserNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as UserNotification);
        });
        setNotifications(list);
      }, (err) => {
        console.warn("Notifications snapshot listener fallback:", err.message);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore query fallback:", err);
    }
  }, [userProfile?.uid]);

  // Set selected node details in inspector
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const handleSetSource = (node: GraphNode) => {
    setSourceNode(node);
  };

  const handleSetTarget = (node: GraphNode) => {
    setTargetNode(node);
  };

  // Run graph path discovery
  const handleDiscoverRelationships = async () => {
    if (!sourceNode || !targetNode) return;
    setIsDiscovering(true);
    setDiscoveredPath([]);
    setDiscoveredConnections([]);
    setDiscoveryExplanation("");
    setShowDiscoveryExplanationCard(false);

    try {
      const res = await fetch("/api/graph/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: sourceNode.id, targetId: targetNode.id })
      });
      const data = await res.json();
      
      const pathArr = Array.isArray(data.path) ? data.path : [];
      const connArr = Array.isArray(data.connections) ? data.connections : [];
      setDiscoveredPath(pathArr);
      setDiscoveredConnections(connArr);
      setDiscoveryExplanation(data.geminiExplanation || "");
      
      if (pathArr.length > 0) {
        setShowDiscoveryExplanationCard(true);
      } else {
        alert("No indirect pathway found between selected nodes.");
      }
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Ingest paper and extract knowledge
  const handleIngestPaper = async (paper: {
    title: string;
    authors: string;
    journal: string;
    year: number;
    abstract: string;
  }) => {
    setIsIngesting(true);
    try {
      const res = await fetch("/api/papers/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paper)
      });
      const data = await res.json();
      if (data.success) {
        await fetchData(); // Reload graph & papers
      }
    } catch (err) {
      console.error("Ingestion error:", err);
    } finally {
      setIsIngesting(false);
    }
  };

  // Delete paper from indexed repository
  const handleDeletePaper = async (paperId: string) => {
    try {
      const paperToDelete = papers.find(p => p.id === paperId);
      const paperTitle = paperToDelete?.title || "Paper";
      
      const res = await fetch(`/api/papers/${paperId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPapers(prev => prev.filter(p => p.id !== paperId));
        logActivity(
          "delete",
          "Removed Literature Paper",
          `Deleted paper "${paperTitle}" from indexed repository.`
        );
        triggerNotification(
          "Paper Deleted",
          `Successfully removed "${paperTitle}" from research index.`,
          "system"
        );
      }
    } catch (err) {
      console.error("Paper deletion error:", err);
    }
  };

  const handleClearAllPapers = async () => {
    try {
      const count = papers.length;
      const res = await fetch("/api/papers", {
        method: "DELETE"
      });
      if (res.ok) {
        setPapers([]);
        logActivity(
          "delete",
          "Cleared All Literature Papers",
          `Removed all ${count} papers from indexed research repository.`
        );
        triggerNotification(
          "Repository Cleared",
          `Cleared all ${count} papers from literature database.`,
          "system"
        );
      }
    } catch (err) {
      console.error("Clear papers error:", err);
    }
  };

  // Generate Hypothesis via Multi-Agent pipeline
  const handleGenerateHypothesis = async (query: string) => {
    setIsGeneratingHypothesis(true);
    try {
      const res = await fetch("/api/hypotheses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      await fetchData(); // Reload hypotheses and list
      setSelectedHypothesis(data.hypothesis);

      if (userProfile?.uid && data.hypothesis) {
        await saveUserHypothesisToDb(userProfile.uid, data.hypothesis);
        await triggerNotification(
          "AI Process Complete: Hypothesis Formulated",
          `Synthesized "${data.hypothesis.title}" with confidence ${(data.hypothesis.confidence * 100).toFixed(0)}%.`,
          "process_done"
        );
      }
      return data;
    } catch (err) {
      console.error("Hypothesis generation error:", err);
      throw err;
    } finally {
      setIsGeneratingHypothesis(false);
    }
  };

  // Peer review verification
  const handleVerifyHypothesis = async (id: string) => {
    setIsVerifyingHypothesis(true);
    try {
      const res = await fetch("/api/hypotheses/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesisId: id })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setSelectedHypothesis(data.hypothesis);

        if (userProfile?.uid && data.hypothesis) {
          await saveUserHypothesisToDb(userProfile.uid, data.hypothesis);
          await triggerNotification(
            "AI Process Complete: Verification",
            `Hypothesis "${data.hypothesis.title}" successfully verified and critiqued.`,
            "process_done"
          );
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setIsVerifyingHypothesis(false);
    }
  };

  // Experimental Protocol quantitative simulator
  const handleSimulateExperiment = async (id: string) => {
    setIsSimulatingExperiment(true);
    try {
      const res = await fetch("/api/hypotheses/simulate-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesisId: id })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setSelectedHypothesis(data.hypothesis);

        if (userProfile?.uid && data.hypothesis) {
          await saveUserHypothesisToDb(userProfile.uid, data.hypothesis);
          await triggerNotification(
            "AI Process Complete: Experiment Simulator",
            `Generated quantitative protocol for "${data.hypothesis.title}".`,
            "process_done"
          );
        }
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulatingExperiment(false);
    }
  };

  // Advance track-record lifecycle phase with system GNN feedback learning
  const handleAdvancePhase = async (hypothesisId: string, targetPhase: string) => {
    try {
      const res = await fetch("/api/hypotheses/advance-phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesisId, targetPhase })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setSelectedHypothesis(data.hypothesis);
        return data.reasoningAdjustment || null;
      }
    } catch (err) {
      console.error("Error advancing phase:", err);
    }
    return null;
  };

  // Create high-value scientific bounty challenge
  const handleCreateBounty = async (bountyData: Omit<Bounty, "id" | "createdAt" | "status">) => {
    setIsCreatingBounty(true);
    try {
      const res = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bountyData)
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error creating scientific bounty:", err);
    } finally {
      setIsCreatingBounty(false);
    }
  };

  // Link hypothesis to bounty as proof claimant
  const handleLinkHypothesisToBounty = async (bountyId: string, hypothesisId: string) => {
    setIsLinkingBounty(true);
    try {
      const res = await fetch("/api/bounties/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId, hypothesisId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        // Update selected hypothesis if applicable
        if (selectedHypothesis?.id === hypothesisId) {
          setSelectedHypothesis(data.hypothesis);
        }
      }
    } catch (err) {
      console.error("Error linking hypothesis to bounty:", err);
    } finally {
      setIsLinkingBounty(false);
    }
  };

  // Register manual outcome status to global track record
  const handleSaveFeedback = async (id: string, status: "success" | "failure" | "modification", notes: string) => {
    setIsSavingFeedback(true);
    try {
      const res = await fetch(`/api/hypotheses/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setSelectedHypothesis(data.hypothesis);
      }
    } catch (err) {
      console.error("Error saving manual feedback:", err);
    } finally {
      setIsSavingFeedback(false);
    }
  };

  // Trigger Autonomous overnight sweep run
  const handleAutonomousRun = async () => {
    setIsAutonomousRunning(true);
    setAgentLogs(prev => [
      ...prev,
      {
        agent: "Research Coordinator",
        message: "Booting autonomous literature scanner... Triggering deep PubMed sweeps.",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    try {
      const res = await fetch("/api/hypotheses/autonomous-run", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setAutonomousBriefing(data.briefing);
        setSelectedHypothesis(data.newHypothesis);
        setShowBriefingModal(true);

        if (userProfile?.uid) {
          await saveUserBriefingToDb(userProfile.uid, {
            id: `briefing_${Date.now()}`,
            userId: userProfile.uid,
            headline: data.briefing?.headline || "Overnight Scientific Intelligence Sweep",
            summary: data.briefing?.summary || "Mapped new cross-domain gaps and grant matches.",
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            createdAt: new Date().toISOString()
          });

          await triggerNotification(
            "Morning Intelligence Briefing Ready",
            `Overnight sweep complete! Mapped +${data.briefing?.newConnections || 3} links and formulated "${data.newHypothesis?.title}".`,
            "morning_briefing"
          );
        }

        setAgentLogs(prev => [
          ...prev,
          {
            agent: "Research Coordinator",
            message: `Overnight sweep complete! Mapped +${data.briefing.newConnections} links. Formulated high-impact hypothesis: "${data.newHypothesis.title}"`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    } catch (err) {
      console.error("Autonomous run error:", err);
    } finally {
      setIsAutonomousRunning(false);
    }
  };

  return (
    <div id="aether-os-root" className="min-h-screen bg-[#0A0B0D] text-slate-400 flex flex-col font-sans select-none selection:bg-sky-500/30 selection:text-white">
      {/* Operating System Masthead */}
      <header id="os-masthead" className="h-12 bg-[#0F1115] border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-40 text-[11px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-sm">
            Σ
          </div>
          <div>
            <h1 className="text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
              Synapse Scientific Discovery OS
              <span className="px-1.5 py-0.2 bg-slate-850 rounded text-[9px] font-mono text-slate-500">v3.0.0-DISCOVERY</span>
            </h1>
          </div>
        </div>

        {/* Dashboard Analytics Bar & Auth / Notification Controls */}
        <div id="global-stats-bar" className="flex items-center gap-3 sm:gap-5 text-[10px] font-mono text-slate-500">
          <UserHeaderControl
            userProfile={userProfile}
            notifications={notifications}
            onOpenBriefing={() => setShowBriefingModal(true)}
            onSelectNotificationAction={() => setActiveTab("hypotheses")}
          />

          <button
            onClick={() => setShowExportModal(true)}
            className="px-2.5 py-1 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export dashboard statistics and hypothesis summaries to PDF or CSV"
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline uppercase">Export Report</span>
          </button>

          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`px-2.5 py-1 border font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
              userHasCustomKey
                ? "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300"
            }`}
            title="Configure Gemini API Key & Quota Settings (Bring Your Own Key vs Developer Key)"
          >
            <Key className={`w-3 h-3 ${userHasCustomKey ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline uppercase">
              {userHasCustomKey ? "API Key: User Quota" : "API Key Settings"}
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-500 uppercase">GRANT FIT: 92.4%</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-500 uppercase">NEO4J & QDRANT: ONLINE</span>
          </div>
          <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
            <div className="flex flex-col sm:flex-row sm:gap-1.5">
              <span className="text-slate-600">LITERATURE:</span>
              <span className="text-slate-300 font-semibold">{papers.length} Sources</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-1.5">
              <span className="text-slate-600">GRAPH:</span>
              <span className="text-sky-400 font-semibold">{nodes.length} Nodes</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-1.5">
              <span className="text-slate-600">HYPOTHESES:</span>
              <span className="text-amber-500 font-semibold">{hypotheses.length} Synthesized</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main OS Body workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Navigation Rail */}
        <nav id="nav-rail" className="w-full lg:w-56 bg-[#07080A] border-r border-slate-800 flex flex-col justify-between p-3 gap-3 text-[11px] shrink-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest px-2.5 mb-1.5">SYSTEM WORKSPACES</span>
            
            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 pl-2"
                  : "text-slate-400 hover:bg-[#16181D] hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              Agent Dashboard
            </button>

            <button
              id="tab-research-os-btn"
              onClick={() => setActiveTab("research_os")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "research_os"
                  ? "bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-400 pl-2 font-bold"
                  : "text-emerald-300 hover:bg-[#16181D] hover:text-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>AI Research OS</span>
              </div>
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">NEW</span>
            </button>

            <button
              id="tab-funding-btn"
              onClick={() => setActiveTab("funding")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "funding"
                  ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 pl-2 font-bold"
                  : "text-emerald-400/90 hover:bg-[#16181D] hover:text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                Funding Intelligence
              </div>
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 rounded">FA-CDGRF</span>
            </button>

            <button
              id="tab-institutional-btn"
              onClick={() => setActiveTab("institutional")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "institutional"
                  ? "bg-purple-500/10 text-purple-400 border-l-2 border-purple-500 pl-2 font-bold"
                  : "text-purple-300/90 hover:bg-[#16181D] hover:text-purple-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              University Grant Office
            </button>

            <button
              id="tab-graph-btn"
              onClick={() => setActiveTab("graph")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "graph"
                  ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 pl-2"
                  : "text-slate-400 hover:bg-[#16181D] hover:text-slate-200"
              }`}
            >
              <Network className="w-3.5 h-3.5 shrink-0" />
              Interactive Graph
            </button>

            <button
              id="tab-literature-btn"
              onClick={() => setActiveTab("literature")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "literature"
                  ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 pl-2"
                  : "text-slate-400 hover:bg-[#16181D] hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              Literature Ingestion
            </button>

            <button
              id="tab-hypotheses-btn"
              onClick={() => setActiveTab("hypotheses")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "hypotheses"
                  ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 pl-2"
                  : "text-slate-400 hover:bg-[#16181D] hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Synthesized Hypotheses
            </button>

            <button
              id="tab-spss-btn"
              onClick={() => setActiveTab("spss")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "spss"
                  ? "bg-indigo-500/15 text-indigo-300 border-l-2 border-indigo-400 pl-2 font-bold"
                  : "text-indigo-400/90 hover:bg-[#16181D] hover:text-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <span>SPSS Studio</span>
              </div>
              <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">.SPS</span>
            </button>

            <button
              id="tab-gaps-btn"
              onClick={() => setActiveTab("gaps")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "gaps"
                  ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 pl-2"
                  : "text-slate-400 hover:bg-[#16181D] hover:text-slate-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              Global Research Gaps
            </button>

            <button
              id="tab-market-btn"
              onClick={() => setActiveTab("market")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "market"
                  ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 pl-2"
                  : "text-slate-400 hover:bg-[#16181D] hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              Discovery Market
            </button>

            <button
              id="tab-activity-btn"
              onClick={() => setActiveTab("activity")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "activity"
                  ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 pl-2 font-bold"
                  : "text-slate-400 hover:bg-[#16181D] hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              Recent Activity
            </button>
          </div>

          {/* Workspace Domain Reset Panel */}
          <div className="bg-[#0F1115] border border-slate-800 rounded p-2.5 flex flex-col gap-2 text-[10px]">
            <div className="flex items-center justify-between text-slate-300 font-sans font-semibold uppercase tracking-wider text-[9px]">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Domain Canvas</span>
              </div>
              <span className="text-[8px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1 rounded">MULTI-FIELD</span>
            </div>
            <p className="text-[9.5px] text-slate-400 leading-snug">
              Working on AI, Physics, or non-biotech research? Reset sample data for a clean slate.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Purge all papers, graph nodes, and sample hypotheses for a 100% clean research canvas?")) {
                    handleResetWorkspace("clear");
                  }
                }}
                className="flex-1 py-1 px-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-mono text-[8.5px] uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                title="Purge all sample literature and hypotheses"
              >
                <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                <span>Clean Slate</span>
              </button>
              <button
                type="button"
                onClick={() => handleResetWorkspace("seed")}
                className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-mono text-[8.5px] uppercase tracking-wider transition-all cursor-pointer"
                title="Restore default biotechnology sample dataset"
              >
                <span>Sample Data</span>
              </button>
            </div>
          </div>

          {/* Quick-Help / OS System Console */}
          <div className="bg-[#0F1115] border border-slate-800 rounded p-2.5 flex flex-col gap-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-300 font-sans font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3 h-3 text-sky-400 shrink-0" />
              Graph Instructions
            </div>
            <p className="font-sans leading-relaxed text-[10px] text-slate-500">
              1. Open **Interactive Graph**<br/>
              2. Click any scientific node<br/>
              3. Set **Source** and **Target**<br/>
              4. Execute **Relationship Discovery** to build GNN link predictions.
            </p>
          </div>
        </nav>

        {/* Content Panel & Footer Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Pane */}
          <main className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-48px)] lg:max-h-[calc(100vh-48px-160px)] relative bg-[#0A0B0D]">
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-4 h-full">
                <AgentPipeline
                  onGenerate={handleGenerateHypothesis}
                  isGenerating={isGeneratingHypothesis}
                  onSelectHypothesis={(hypo) => {
                    setSelectedHypothesis(hypo);
                    setActiveTab("hypotheses");
                  }}
                  hypotheses={hypotheses}
                  agentLogs={agentLogs}
                  setAgentLogs={setAgentLogs}
                  onRefreshData={fetchData}
                  onAutonomousRun={handleAutonomousRun}
                  isAutonomousRunning={isAutonomousRunning}
                  onOpenExport={() => setShowExportModal(true)}
                />
              </div>
            )}

            {activeTab === "graph" && (
              <div className="relative h-full flex flex-col gap-4">
                <KnowledgeGraph
                  nodes={nodes}
                  links={links}
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                  onSetSource={handleSetSource}
                  onSetTarget={handleSetTarget}
                  sourceNode={sourceNode}
                  targetNode={targetNode}
                  activePath={discoveredPath}
                  onDiscover={handleDiscoverRelationships}
                  isDiscovering={isDiscovering}
                  relationshipSummaryText={discoveryExplanation}
                  discoveredConnections={discoveredConnections}
                />

                {/* Collapsible Slide-up explanation Drawer for discovered paths */}
                {showDiscoveryExplanationCard && (
                  <div id="discovery-explanation-drawer" className="absolute bottom-3 left-3 right-3 bg-[#0F1115]/95 backdrop-blur border border-sky-500/30 rounded-lg p-4 shadow-2xl flex flex-col gap-3 z-20 animate-slide-up text-[11px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="text-sky-400 w-4.5 h-4.5 animate-pulse" />
                        <div>
                          <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wide">
                            Discovered Indirect Path Synthesis & Executive Summary
                          </h3>
                          <p className="text-[9px] font-mono text-slate-500">
                            COMPUTED CHAIN VIA GRAPH NEURAL SYMMETRY
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const fullReport = `# Discovered Indirect Path Synthesis & Executive Summary\n\n**Generated:** ${new Date().toLocaleString()}\n**Path:** ${discoveredPath.join(" -> ")}\n\n## Discovered Chain Connections:\n${discoveredConnections.map(c => `- ${c.source} --[${c.relationship}]--> ${c.target} (Confidence: ${Math.round(c.confidence*100)}%)`).join("\n")}\n\n## Executive Summary & Detailed Analysis:\n${discoveryExplanation}\n`;
                            const blob = new Blob([fullReport], { type: "text/markdown" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `Relationship_Summary_${Date.now()}.md`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Download complete executive summary and node path as Markdown"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Summary (.md)</span>
                        </button>

                        <button
                          onClick={() => {
                            const fullReport = `# Discovered Indirect Path Synthesis & Executive Summary\n\nPath: ${discoveredPath.join(" -> ")}\n\n${discoveryExplanation}\n`;
                            navigator.clipboard.writeText(fullReport);
                            alert("Executive Relationship Summary copied to clipboard!");
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                          title="Copy executive summary"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>

                        <button
                          onClick={() => setShowDiscoveryExplanationCard(false)}
                          className="bg-[#0A0B0D] border border-slate-800 text-slate-400 hover:text-slate-200 p-1 rounded transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Discovered Path Nodes flow visualization */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-300 bg-[#07080A] px-2.5 py-1.5 rounded border border-slate-800 justify-center">
                      {discoveredPath.map((nodeName, idx) => (
                        <React.Fragment key={nodeName}>
                          <span className="font-semibold text-slate-200">{nodeName}</span>
                          {idx < discoveredPath.length - 1 && (
                            <div className="flex flex-col items-center mx-1">
                              <span className="text-[8px] font-mono text-sky-400 font-bold uppercase leading-none">
                                {discoveredConnections[idx]?.relationship}
                              </span>
                              <ArrowRight className="w-3 h-3 text-sky-500 shrink-0" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Detailed explanation markup rendering */}
                    <div className="text-[11px] text-slate-400 leading-relaxed font-sans max-h-32 overflow-y-auto bg-[#07080A]/40 p-3 border border-slate-800 rounded pr-1.5 whitespace-pre-line">
                      {discoveryExplanation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <RecentActivityView
                activities={activityLogs}
              />
            )}

            {activeTab === "research_os" && (
              <ResearchOSWorkspace
                hypotheses={hypotheses}
                papers={papers}
                onSelectHypothesis={(h) => {
                  setSelectedHypothesis(h);
                  setActiveTab("hypotheses");
                }}
              />
            )}

            {activeTab === "literature" && (
              <LiteratureIngest
                papers={papers}
                onIngest={handleIngestPaper}
                isIngesting={isIngesting}
                onUploadSuccess={fetchData}
                onDeletePaper={handleDeletePaper}
                onClearAllPapers={handleClearAllPapers}
              />
            )}

            {activeTab === "funding" && (
              <FundingIntelligence
                hypotheses={hypotheses}
                onSelectHypothesis={(h) => {
                  setSelectedHypothesis(h);
                  setActiveTab("hypotheses");
                }}
              />
            )}

            {activeTab === "institutional" && (
              <InstitutionalWorkspace
                hypotheses={hypotheses}
                onSelectHypothesis={(h) => {
                  setSelectedHypothesis(h);
                  setActiveTab("hypotheses");
                }}
              />
            )}

            {activeTab === "gaps" && (
              <GlobalGapDetector
                onInitiateGapRun={async (query) => {
                  setActiveTab("dashboard");
                  try {
                    await handleGenerateHypothesis(query);
                    setActiveTab("hypotheses");
                  } catch (e) {
                    console.error("Gap synthesis error:", e);
                  }
                }}
                isGenerating={isGeneratingHypothesis}
              />
            )}

            {activeTab === "market" && (
              <DiscoveryMarket
                bounties={bounties}
                hypotheses={hypotheses}
                onCreateBounty={handleCreateBounty}
                onLinkHypothesisToBounty={handleLinkHypothesisToBounty}
                isCreatingBounty={isCreatingBounty}
                isLinking={isLinkingBounty}
              />
            )}

            {activeTab === "spss" && (
              <SpssStudio
                hypotheses={hypotheses}
                papers={papers}
                externalActivePackage={appliedSpssPackage}
              />
            )}

            {activeTab === "hypotheses" && (
              <div id="hypotheses-split-view" className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                {/* Left Column list of hypotheses */}
                <div className="bg-[#0F1115] border border-slate-800 rounded p-3 flex flex-col gap-3 overflow-y-auto max-h-[300px] lg:max-h-full">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="text-slate-400 w-4 h-4" />
                      <h3 className="text-slate-200 font-bold uppercase tracking-wider text-[10px]">Synthesized Hypotheses</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* View Mode Toggle (List vs Cluster) */}
                      <div className="flex items-center bg-[#07080A] border border-slate-800 rounded p-0.5 text-[9px] font-mono">
                        <button
                          id="view-mode-list-btn"
                          onClick={() => setHypothesesViewMode("list")}
                          className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                            hypothesesViewMode === "list"
                              ? "bg-sky-500/20 text-sky-300 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Flat List View"
                        >
                          <Grid className="w-3 h-3" />
                          <span>List</span>
                        </button>
                        <button
                          id="view-mode-cluster-btn"
                          onClick={() => setHypothesesViewMode("cluster")}
                          className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                            hypothesesViewMode === "cluster"
                              ? "bg-sky-500/20 text-sky-300 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Domain Cluster Tree View"
                        >
                          <FolderTree className="w-3 h-3" />
                          <span>Clusters</span>
                        </button>
                      </div>

                      {/* Compare Toggle Switch */}
                      <button
                        id="hypotheses-compare-toggle"
                        onClick={() => {
                          const next = !isCompareMode;
                          setIsCompareMode(next);
                          if (next && hypotheses.length >= 2) {
                            setCompareHypoA(hypotheses[0] || null);
                            setCompareHypoB(hypotheses[1] || null);
                            setCompareHypoC(hypotheses[2] || null);
                            setCompareSlot("A");
                          }
                        }}
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border transition-all uppercase tracking-wide flex items-center gap-1 cursor-pointer ${
                          isCompareMode
                            ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                        }`}
                        title="Toggle tri-panel side-by-side comparison workspace"
                      >
                        <GitCompare className="w-3 h-3" />
                        {isCompareMode ? "Tri-Compare ON" : "Compare"}
                      </button>
                    </div>
                  </div>

                  {/* 1. Real-Time Text Input Search Field */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      id="hypotheses-search-input"
                      type="text"
                      placeholder="Filter by title or domain..."
                      value={hypothesesSearchQuery}
                      onChange={(e) => setHypothesesSearchQuery(e.target.value)}
                      className="w-full bg-[#07080A] border border-slate-800 rounded pl-8 pr-7 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 font-sans"
                    />
                    {hypothesesSearchQuery && (
                      <button
                        onClick={() => setHypothesesSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* 2 & 3. Range Slider & Sort Selector Sidebar Controls */}
                  <div className="flex flex-col gap-2 bg-[#07080A] p-2.5 rounded border border-slate-800 text-[10px] font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider">
                        <SlidersHorizontal className="w-3 h-3 text-sky-400" />
                        <span>Filter & Sort</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                        <select
                          id="hypotheses-sort-select"
                          value={hypothesesSortBy}
                          onChange={(e) => setHypothesesSortBy(e.target.value as any)}
                          className="bg-[#0D0F16] border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="newest">Sort: Newest</option>
                          <option value="confidence">Sort: Highest Confidence</option>
                          <option value="impact">Sort: Most Impactful</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-slate-400 text-[9.5px]">
                        <span>Min Confidence Threshold:</span>
                        <span className="text-sky-400 font-bold">{minConfidenceFilter}%</span>
                      </div>
                      <input
                        id="confidence-range-slider"
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={minConfidenceFilter}
                        onChange={(e) => setMinConfidenceFilter(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                    </div>
                  </div>

                  {/* 4. Multi-Select & Batch Actions Toolbar (Batch Export & Batch Delete) */}
                  <div className="flex items-center justify-between text-[10px] font-mono px-0.5">
                    <button
                      id="batch-select-toggle"
                      onClick={() => {
                        if (batchSelectedHypothesisIds.length === displayedHypotheses.length) {
                          setBatchSelectedHypothesisIds([]);
                        } else {
                          setBatchSelectedHypothesisIds(displayedHypotheses.map(h => h.id));
                        }
                      }}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {batchSelectedHypothesisIds.length > 0 && batchSelectedHypothesisIds.length === displayedHypotheses.length ? (
                        <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Select All ({displayedHypotheses.length})</span>
                    </button>

                    {batchSelectedHypothesisIds.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          id="batch-export-modal-btn"
                          onClick={() => setShowExportModal(true)}
                          className="flex items-center gap-1 text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:border-sky-400 px-2 py-0.5 rounded uppercase tracking-wide transition-all shadow-[0_0_8px_rgba(56,189,248,0.2)] cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export ({batchSelectedHypothesisIds.length})</span>
                        </button>
                        <button
                          id="batch-delete-modal-btn"
                          onClick={() => setShowBatchDeleteModal(true)}
                          className="flex items-center gap-1 text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:border-rose-400 px-2 py-0.5 rounded uppercase tracking-wide transition-all shadow-[0_0_8px_rgba(244,63,94,0.2)] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete ({batchSelectedHypothesisIds.length})</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hypotheses Content View: Either Flat List or Collapsible Domain Cluster Tree */}
                  {hypothesesViewMode === "cluster" ? (
                    <div className="flex flex-col gap-2.5 overflow-y-auto">
                      {Object.keys(clusteredHypotheses).length === 0 ? (
                        <div className="p-4 text-center text-slate-500 font-mono text-[10px] border border-dashed border-slate-800 rounded">
                          No hypothesis domain clusters match your current filters.
                        </div>
                      ) : (
                        Object.entries(clusteredHypotheses).map(([domName, list]) => {
                          const isCollapsed = collapsedDomains[domName];
                          const avgConf = Math.round((list.reduce((acc, h) => acc + (h.confidence || 0.7), 0) / list.length) * 100);

                          return (
                            <div key={domName} className="bg-[#07080A] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                              {/* Domain Cluster Collapsible Header */}
                              <button
                                type="button"
                                onClick={() => toggleDomainCollapse(domName)}
                                className="p-2 bg-[#0D0F16] hover:bg-[#16181D] border-b border-slate-800/80 flex items-center justify-between text-left transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5">
                                  {isCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  )}
                                  <FolderTree className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <span className="text-[11px] font-bold text-slate-200 font-sans">{domName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[8.5px] font-mono">
                                  <span className="text-slate-500">AVG CONF: <strong className="text-emerald-400">{avgConf}%</strong></span>
                                  <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold">
                                    {list.length} {list.length === 1 ? 'item' : 'items'}
                                  </span>
                                </div>
                              </button>

                              {/* Cluster Hypotheses items */}
                              {!isCollapsed && (
                                <div className="flex flex-col p-1.5 gap-1.5 bg-[#07080A]">
                                  {list.map((hypo) => {
                                    const isSelected = !isCompareMode && selectedHypothesis?.id === hypo.id;
                                    const isBatchChecked = batchSelectedHypothesisIds.includes(hypo.id);

                                    return (
                                      <div
                                        key={hypo.id}
                                        className={`p-2 rounded border transition-all flex items-start gap-2 ${
                                          isSelected
                                            ? "bg-sky-500/10 border-sky-500 shadow-md shadow-sky-950/10"
                                            : "bg-[#0D0F16] hover:bg-[#16181D] border-slate-800/80"
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isBatchChecked) {
                                              setBatchSelectedHypothesisIds(batchSelectedHypothesisIds.filter(id => id !== hypo.id));
                                            } else {
                                              setBatchSelectedHypothesisIds([...batchSelectedHypothesisIds, hypo.id]);
                                            }
                                          }}
                                          className="mt-0.5 p-0.5 text-slate-500 hover:text-sky-400 shrink-0 cursor-pointer"
                                        >
                                          {isBatchChecked ? (
                                            <CheckSquare className="w-3 h-3 text-sky-400" />
                                          ) : (
                                            <Square className="w-3 h-3 text-slate-600" />
                                          )}
                                        </button>

                                        <div
                                          onClick={() => setSelectedHypothesis(hypo)}
                                          className="flex-1 cursor-pointer flex flex-col gap-1"
                                        >
                                          <h5 className={`text-[10.5px] font-bold leading-snug ${isSelected ? "text-sky-400" : "text-slate-200"}`}>
                                            {hypo.title}
                                          </h5>
                                          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                                            <span>CONF: {Math.round(hypo.confidence * 100)}%</span>
                                            <span className="text-violet-400">NOVELTY: {hypo.noveltyScore || 80}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    /* Flat Cards List */
                    <div className="flex flex-col gap-2 overflow-y-auto">
                    {displayedHypotheses.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 font-mono text-[10px] border border-dashed border-slate-800 rounded">
                        No hypotheses match the selected search or confidence threshold ({minConfidenceFilter}%).
                      </div>
                    ) : (
                      displayedHypotheses.map((hypo) => {
                        const isSelected = !isCompareMode && selectedHypothesis?.id === hypo.id;
                        const isCompareA = isCompareMode && compareHypoA?.id === hypo.id;
                        const isCompareB = isCompareMode && compareHypoB?.id === hypo.id;
                        const isCompareC = isCompareMode && compareHypoC?.id === hypo.id;
                        const isBatchChecked = batchSelectedHypothesisIds.includes(hypo.id);

                        const handleSelect = () => {
                          if (isCompareMode) {
                            if (compareSlot === "A") {
                              setCompareHypoA(hypo);
                              setCompareSlot("B"); // Auto-advance to B
                            } else if (compareSlot === "B") {
                              setCompareHypoB(hypo);
                              setCompareSlot("C"); // Auto-advance to C
                            } else {
                              setCompareHypoC(hypo);
                              setCompareSlot("A"); // Wrap back to A
                            }
                          } else {
                            setSelectedHypothesis(hypo);
                          }
                        };

                        return (
                          <div
                            key={hypo.id}
                            className={`w-full text-left p-2.5 rounded border transition-all flex items-start gap-2 relative ${
                              isSelected
                                ? "bg-sky-500/10 border-sky-500 shadow-md shadow-sky-950/10"
                                : isCompareA
                                  ? "bg-sky-500/5 border-sky-500/50"
                                  : isCompareB
                                    ? "bg-violet-500/5 border-violet-500/50"
                                    : isCompareC
                                      ? "bg-emerald-500/5 border-emerald-500/50"
                                      : "bg-[#07080A] hover:bg-[#16181D] border-slate-800"
                            }`}
                          >
                            {/* Checkbox for batch multi-select */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isBatchChecked) {
                                  setBatchSelectedHypothesisIds(batchSelectedHypothesisIds.filter(id => id !== hypo.id));
                                } else {
                                  setBatchSelectedHypothesisIds([...batchSelectedHypothesisIds, hypo.id]);
                                }
                              }}
                              className="mt-0.5 p-0.5 text-slate-500 hover:text-sky-400 shrink-0 cursor-pointer"
                              title="Toggle batch selection"
                            >
                              {isBatchChecked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </button>

                            <div
                              onClick={handleSelect}
                              className="flex-1 flex flex-col gap-1.5 cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-[11px] font-bold font-sans leading-snug line-clamp-2 ${
                                  isSelected ? "text-sky-400" : isCompareA ? "text-sky-400" : isCompareB ? "text-violet-400" : isCompareC ? "text-emerald-400" : "text-slate-200"
                                }`}>
                                  {hypo.title}
                                </h4>
                                
                                <div className="flex gap-1 shrink-0">
                                  {isCompareA && (
                                    <span className="text-[7.5px] font-mono font-bold text-sky-400 bg-sky-500/20 px-1 py-0.2 rounded uppercase tracking-wider">
                                      SLOT A
                                    </span>
                                  )}
                                  {isCompareB && (
                                    <span className="text-[7.5px] font-mono font-bold text-violet-400 bg-violet-500/20 px-1 py-0.2 rounded uppercase tracking-wider">
                                      SLOT B
                                    </span>
                                  )}
                                  {isCompareC && (
                                    <span className="text-[7.5px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded uppercase tracking-wider">
                                      SLOT C
                                    </span>
                                  )}
                                  {!isCompareA && !isCompareB && !isCompareC && (
                                    hypo.status === "verified" ? (
                                      <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded uppercase tracking-wider shrink-0">
                                        Verified
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1 rounded uppercase tracking-wider shrink-0">
                                        Draft
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 font-sans line-clamp-2 leading-relaxed">
                                {hypo.description}
                              </p>
                              <div className="flex items-center justify-between mt-0.5 text-[8px] font-mono text-slate-500">
                                <span>CONF: {Math.round(hypo.confidence * 100)}%</span>
                                <span>{new Date(hypo.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    </div>
                  )}
                </div>

                {/* Right Column hypothesis detailed inspection report */}
                <div className="lg:col-span-2 h-full">
                  {isCompareMode ? (
                    <HypothesisCompare
                      hypoA={compareHypoA}
                      hypoB={compareHypoB}
                      hypoC={compareHypoC}
                      activeSlot={compareSlot}
                      setActiveSlot={setCompareSlot}
                      onClearSlot={(slot) => {
                        if (slot === "A") setCompareHypoA(null);
                        else if (slot === "B") setCompareHypoB(null);
                        else setCompareHypoC(null);
                      }}
                      onCloseCompare={() => setIsCompareMode(false)}
                    />
                  ) : (
                    <HypothesisDetail
                      hypothesis={selectedHypothesis}
                      onVerify={handleVerifyHypothesis}
                      isVerifying={isVerifyingHypothesis}
                      papers={papers}
                      onSimulateExperiment={handleSimulateExperiment}
                      isSimulatingExperiment={isSimulatingExperiment}
                      onAdvancePhase={handleAdvancePhase}
                      onSaveFeedback={handleSaveFeedback}
                      isSavingFeedback={isSavingFeedback}
                      isBookmarked={selectedHypothesis ? userFavorites.includes(selectedHypothesis.id) : false}
                      onToggleBookmark={handleToggleBookmark}
                      onDeleteHypothesis={handleDeleteSingleHypothesis}
                    />
                  )}
                </div>
              </div>
            )}
          </main>

          {/* High Density Footer */}
          <footer className="hidden lg:grid h-40 bg-[#07080A] border-t border-slate-800 grid-cols-4 divide-x divide-slate-800 shrink-0 text-[10px]">
            {/* Column 1: Research Coordinator Log */}
            <div className="p-3 flex flex-col gap-2 overflow-hidden">
              <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-1 h-1 bg-sky-500"></div>
                Research Coordinator Logs
              </div>
              <div className="font-mono text-[9px] space-y-1 overflow-y-auto pr-1">
                {agentLogs.length > 0 ? (
                  agentLogs.slice(-4).map((log, i) => (
                    <div key={i} className="text-slate-300 truncate">
                      <span className="text-sky-400 mr-1">[{log.timestamp}]</span>
                      <span className="text-slate-500 font-semibold mr-1">{log.agent}:</span>
                      {log.message}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-emerald-500">[09:12:01] AGENT_SUMMARIZER_ACT: Paper 14-X ingested</div>
                    <div className="text-sky-400">[09:12:05] AGENT_CIT_VERIFY: Cross-checking arXiv:2305.1...</div>
                    <div className="text-slate-600">[09:12:10] AGENT_CRITIC: Evaluating hypothesis #FF-092...</div>
                    <div className="text-slate-600">[09:12:11] AGENT_CRITIC: Evidence strength: MODERATE</div>
                  </>
                )}
              </div>
            </div>

            {/* Column 2: Literature Search Status */}
            <div className="p-3 flex flex-col gap-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-1 h-1 bg-amber-500"></div>
                Literature Databases
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-1 bg-slate-900/40 rounded border border-slate-800/80 text-slate-400">arXiv: Biology</div>
                <div className="p-1 bg-slate-900/40 rounded border border-slate-800/80 text-slate-400">PubMed Central</div>
                <div className="p-1 bg-slate-900/40 rounded border border-slate-800/80 text-slate-400">Nature Bio</div>
                <div className="p-1 bg-sky-950/20 rounded border border-sky-500/30 text-sky-400">Patents_US</div>
              </div>
            </div>

            {/* Column 3: Extraction Layer */}
            <div className="p-3 flex flex-col gap-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-1 h-1 bg-sky-500"></div>
                Extraction Layer
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>SPECTER2 Embedding</span>
                  <span className="font-mono text-sky-400">99%</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="w-[99%] h-full bg-sky-500 rounded-full"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>SciBERT Saliency</span>
                  <span className="font-mono text-sky-400">{isIngesting ? "85%" : "42%"}</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: isIngesting ? "85%" : "42%" }}></div>
                </div>
              </div>
            </div>

            {/* Column 4: Resource Monitor */}
            <div className="p-3 flex flex-col gap-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Resource Monitor</div>
              <div className="flex-1 flex gap-2">
                <div className="flex-1 bg-slate-900/40 border border-slate-800/80 p-2 flex flex-col justify-center items-center rounded">
                  <span className="text-[8px] text-slate-500 font-mono">GPU CLUSTER</span>
                  <span className="text-xs font-mono text-slate-200 font-bold">
                    {isGeneratingHypothesis ? "94%" : isDiscovering ? "76%" : "12%"}
                  </span>
                </div>
                <div className="flex-1 bg-slate-900/40 border border-slate-800/80 p-2 flex flex-col justify-center items-center rounded">
                  <span className="text-[8px] text-slate-500 font-mono">NODE LATENCY</span>
                  <span className="text-xs font-mono text-emerald-500 font-bold">
                    {isDiscovering ? "24ms" : "12ms"}
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Morning Briefing Modal overlay */}
      {showBriefingModal && autonomousBriefing && (
        <div id="morning-briefing-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-[11px]">
          <div className="bg-[#0F1115] border-2 border-emerald-500/40 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden flex flex-col gap-0 select-none">
            
            {/* Header */}
            <div className="bg-emerald-950/20 border-b border-emerald-900/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-emerald-400 font-bold tracking-wider text-[10px] uppercase">Scientific Discovery Morning Briefing</span>
              </div>
              <button 
                onClick={() => setShowBriefingModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Stats Block */}
            <div className="p-4 flex flex-col gap-4">
              
              <div className="bg-emerald-950/5 border border-emerald-900/10 p-3.5 rounded flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Overnight Sweep Complete (12h cycle)</span>
                <p className="text-slate-300 font-sans leading-relaxed text-[10.5px]">
                  The SDOS Prediction Engine executed background crawls across multiple active corpora. High-density spectral GNN link-prediction filters are completed.
                </p>
              </div>

              {/* Grid of counters */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/50 border border-slate-800 p-2.5 rounded">
                  <span className="text-[8px] font-mono text-slate-500 block mb-0.5">PAPERS READ</span>
                  <span className="text-base font-mono font-bold text-slate-200">{autonomousBriefing.papersRead}</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-2.5 rounded">
                  <span className="text-[8px] font-mono text-slate-500 block mb-0.5">CONNECTIONS LINKED</span>
                  <span className="text-base font-mono font-bold text-sky-400">+{autonomousBriefing.newConnections}</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-2.5 rounded">
                  <span className="text-[8px] font-mono text-slate-500 block mb-0.5">CONTRADICTIONS LOGGED</span>
                  <span className="text-base font-mono font-bold text-rose-400">{autonomousBriefing.criticalContradictions}</span>
                </div>
              </div>

              {/* Formulated breakthrough */}
              {selectedHypothesis && (
                <div className="p-3.5 bg-gradient-to-br from-violet-500/5 to-sky-500/5 border border-sky-500/20 rounded flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      FORMULATED BREAKTHROUGH CANDIDATE
                    </span>
                    <span className="text-[9px] font-mono font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded uppercase">
                      DVS: {selectedHypothesis.discoveryValueScore}
                    </span>
                  </div>
                  <h4 className="text-slate-100 font-bold font-sans text-xs leading-snug mt-0.5">
                    {selectedHypothesis.title}
                  </h4>
                  <p className="text-slate-400 text-[10.5px] leading-relaxed font-sans line-clamp-2 mt-0.5">
                    {selectedHypothesis.description}
                  </p>
                </div>
              )}

            </div>

            {/* Footer actions */}
            <div className="bg-[#07080A] border-t border-slate-800 p-4 flex gap-2.5">
              <button
                onClick={() => {
                  setShowBriefingModal(false);
                  setActiveTab("hypotheses");
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1"
              >
                Examine Breakthrough Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowBriefingModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded text-[10.5px] uppercase tracking-wider border border-slate-800"
              >
                Acknowledge
              </button>
            </div>

          </div>
        </div>
      )}
      {/* FA-CDGRF Morning Scientific Briefing Modal */}
      <MorningBriefingModal
        isOpen={showBriefingModal}
        onClose={() => setShowBriefingModal(false)}
        onSelectHypothesis={(item) => {
          if (typeof item === "string") {
            const found = hypotheses.find(h => h.id === item || h.title.toLowerCase().includes(item.toLowerCase()));
            if (found) {
              setSelectedHypothesis(found);
            } else if (hypotheses.length > 0) {
              setSelectedHypothesis(hypotheses[0]);
            }
          } else if (item && typeof item === "object") {
            const found = hypotheses.find(h => h.id === item.id || h.title === item.title);
            if (found) {
              setSelectedHypothesis(found);
            } else {
              // Construct a complete hypothesis object from briefing item if not present in hypotheses state
              const enriched: Hypothesis = {
                id: item.id || `hypo-mb-${Date.now()}`,
                title: item.title || "Morning Briefing Hypothesis Candidate",
                domain: item.domain || classifyTopicDomain(item.title || "").domainName,
                description: item.summary || "Hypothesis generated during overnight multi-agent synthesis.",
                query: "Overnight Briefing Synthesis",
                confidence: 0.91,
                noveltyScore: 0.92,
                impactScore: 0.94,
                computationalFeasibility: 0.88,
                clinicalFeasibility: 0.85,
                discoveryValueScore: item.dvsScore || 94.3,
                grantFitScore: item.grantFit || 94,
                grantSuccessProbability: 82,
                status: "draft",
                createdAt: new Date().toISOString(),
                supportingEvidence: [],
                analogousMethods: ["Quantum error correction", "Spin-glass dynamics"],
                indirectLinks: [
                  { source: "Quantum Error Correction", target: "Amyloid Protein Folding", relation: "MODELS_DYNAMICS" }
                ],
                discoveryPhase: "Hypothesis"
              };
              setHypotheses(prev => [enriched, ...prev]);
              setSelectedHypothesis(enriched);
            }
          }
          setActiveTab("hypotheses");
        }}
      />

      {/* Roblox Gamified Mascot Assistant & Team Support Notification */}
      <RobloxGuideBot
        currentTab={activeTab}
        onNavigateTab={setActiveTab}
        userProfile={userProfile}
        onTriggerNotification={triggerNotification}
        papers={papers}
        onHypothesisGenerated={(hypo) => {
          setHypotheses((prev) => [hypo, ...prev]);
          setSelectedHypothesis(hypo);
        }}
        onApplySpssAnalysis={(pkg) => {
          setAppliedSpssPackage(pkg);
        }}
      />

      {/* Scientific Discovery Report Export Modal (PDF / CSV / JSON Graph) */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        stats={{
          totalPapers: papers.length,
          totalNodes: nodes.length,
          totalLinks: links.length,
          totalHypotheses: hypotheses.length,
          grantFitPercentage: 92.4
        }}
        hypotheses={batchSelectedHypothesisIds.length > 0 ? hypotheses.filter(h => batchSelectedHypothesisIds.includes(h.id)) : hypotheses}
        nodes={nodes}
        links={links}
        userName={userProfile?.displayName || userProfile?.email || "Guest Scholar"}
      />

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0F1115] border border-rose-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white font-sans uppercase tracking-wider">
                  Confirm Batch Deletion
                </h3>
                <p className="text-[11px] font-mono text-rose-400 mt-0.5">
                  Action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-[12px] font-sans text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-rose-400 font-mono font-bold">{batchSelectedHypothesisIds.length}</strong> selected hypotheses from your local workspace state and Firestore database?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.4)] flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key BYOK Settings Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyUpdated={() => setUserHasCustomKey(!!localStorage.getItem('user_gemini_api_key'))}
      />
    </div>
  );
}
