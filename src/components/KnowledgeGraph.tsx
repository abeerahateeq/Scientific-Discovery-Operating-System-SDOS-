import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { GraphNode, GraphLink, NodeGroup, ResearchNote } from "../types";
import { 
  Network, Search, Sparkles, Navigation2, CheckCircle, Info, Maximize2, 
  ZoomIn, ZoomOut, Copy, Download, BookOpen, FileText, Check, Plus, 
  Trash2, X, HelpCircle, Lightbulb, Share2
} from "lucide-react";

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick: (node: GraphNode) => void;
  selectedNode: GraphNode | null;
  onSetSource: (node: GraphNode) => void;
  onSetTarget: (node: GraphNode) => void;
  sourceNode: GraphNode | null;
  targetNode: GraphNode | null;
  activePath: string[]; // List of node labels in the active path
  onDiscover: () => void;
  isDiscovering: boolean;
  relationshipSummaryText?: string;
  discoveredConnections?: any[];
}

const GROUP_COLORS: Record<NodeGroup, string> = {
  protein: "#10b981", // Emerald
  gene: "#34d399",    // Light Emerald
  disease: "#f43f5e", // Rose
  drug: "#f59e0b",    // Amber
  quantum_concept: "#06b6d4", // Cyan
  algorithm: "#3b82f6", // Blue
  optimization_method: "#8b5cf6", // Violet
  physics_concept: "#ec4899", // Pink
  paper: "#38bdf8",   // Sky-blue (Scientific Paper)
  author: "#fb923c"   // Orange (Researcher / Author)
};

export default function KnowledgeGraph({
  nodes,
  links,
  onNodeClick,
  selectedNode,
  onSetSource,
  onSetTarget,
  sourceNode,
  targetNode,
  activePath,
  onDiscover,
  isDiscovering,
  relationshipSummaryText,
  discoveredConnections
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutName, setLayoutName] = useState<string>("cose");
  const [selectedEdge, setSelectedEdge] = useState<GraphLink | null>(null);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<{
    label: string;
    group: string;
    degree: number;
    avgConfidence: number;
  } | null>(null);

  // Copy & Export & Research Notes State
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [noteToast, setNoteToast] = useState<string | null>(null);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(true);
  const [savedNotes, setSavedNotes] = useState<ResearchNote[]>(() => {
    try {
      const stored = localStorage.getItem("sdos_research_notes");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const showToast = (msg: string) => {
    setNoteToast(msg);
    setTimeout(() => setNoteToast(null), 3000);
  };

  const showCopyToast = (label: string) => {
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Copy Node Explanation
  const handleCopyNodeExplanation = (node: GraphNode) => {
    const text = `[Knowledge Node: ${node.label}]\nCategory: ${node.group}\nDescription: ${node.description || "Core entity in research knowledge graph."}`;
    navigator.clipboard.writeText(text);
    showCopyToast(`Copied ${node.label} explanation!`);
  };

  // Copy Full Graph Analysis
  const handleCopyGraphAnalysis = () => {
    let analysisText = `# Knowledge Graph Analysis & Executive Relationship Summary\n`;
    analysisText += `Generated: ${new Date().toLocaleString()}\n`;
    analysisText += `Total Nodes: ${nodes.length} | Total Relationships: ${links.length}\n\n`;

    if (sourceNode && targetNode) {
      analysisText += `## Discovered Indirect Path Synthesis\n`;
      analysisText += `- Source Node: ${sourceNode.label} (${sourceNode.group})\n`;
      analysisText += `- Target Node: ${targetNode.label} (${targetNode.group})\n`;
      if (activePath && activePath.length > 0) {
        analysisText += `- Bridging Path Sequence: ${activePath.join(" -> ")}\n\n`;
      }
    }

    if (relationshipSummaryText) {
      analysisText += `## Executive Summary & AI Relationship Synthesis\n\n${relationshipSummaryText}\n\n`;
    }

    if (selectedNode) {
      analysisText += `## Selected Entity Focus: ${selectedNode.label}\n`;
      analysisText += `- Group: ${selectedNode.group}\n`;
      analysisText += `- Details: ${selectedNode.description || "N/A"}\n\n`;
    }

    analysisText += `## Key Entity Nodes:\n`;
    nodes.slice(0, 15).forEach(n => {
      analysisText += `- **${n.label}** [${n.group}]: ${n.description || ""}\n`;
    });

    navigator.clipboard.writeText(analysisText);
    showCopyToast("Graph analysis & executive summary copied to clipboard!");
  };

  // Export Graph Analysis File
  const handleExportGraphAnalysis = (format: 'markdown' | 'txt' | 'json') => {
    let content = "";
    let filename = `Graph_Analysis_${Date.now()}`;
    let mimeType = "text/plain";

    if (format === 'json') {
      content = JSON.stringify({ 
        nodes, 
        links, 
        activePath, 
        sourceNode, 
        targetNode,
        relationshipSummaryText,
        discoveredConnections
      }, null, 2);
      filename += ".json";
      mimeType = "application/json";
    } else if (format === 'markdown') {
      content = `# Scientific Discovery OS - Knowledge Graph Export & Relationship Summary\n\n`;
      content += `**Export Date:** ${new Date().toISOString()}\n`;
      content += `**Source Node:** ${sourceNode ? sourceNode.label : "None"}\n`;
      content += `**Target Node:** ${targetNode ? targetNode.label : "None"}\n`;
      content += `**Active Path Sequence:** ${activePath.join(" -> ") || "Direct Search"}\n\n`;
      
      if (relationshipSummaryText) {
        content += `## Executive Summary & Interdisciplinary Synthesis\n\n${relationshipSummaryText}\n\n`;
      }

      content += `## Graph Entities (${nodes.length})\n`;
      nodes.forEach(n => {
        content += `### ${n.label} (${n.group})\n${n.description || "Extracted from research literature."}\n\n`;
      });
      content += `## Structural Relationships (${links.length})\n`;
      links.forEach(l => {
        const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
        content += `- ${s} --[${l.relationship}]--> ${t} (Confidence: ${Math.round(l.confidence * 100)}%)\n`;
      });
      filename += ".md";
      mimeType = "text/markdown";
    } else {
      content = `KNOWLEDGE GRAPH ANALYSIS & RELATIONSHIP SUMMARY\nDate: ${new Date().toLocaleString()}\n`;
      content += `Nodes: ${nodes.length}, Links: ${links.length}\n`;
      content += `Source: ${sourceNode?.label || "None"}, Target: ${targetNode?.label || "None"}\n`;
      content += `Path: ${activePath.join(" -> ") || "None"}\n\n`;
      
      if (relationshipSummaryText) {
        content += `EXECUTIVE SUMMARY & INTERDISCIPLINARY SYNTHESIS:\n${relationshipSummaryText}\n\n`;
      }

      content += `NODES:\n`;
      nodes.forEach(n => {
        content += `* ${n.label} [${n.group}]: ${n.description || ""}\n`;
      });
      filename += ".txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported analysis as ${filename}`);
  };

  // Save Graph Insight to Project Research Notes
  const handleSaveToProjectNotes = (title: string, content: string) => {
    const newNote: ResearchNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      category: "graph_insight",
      tags: ["graph", "pathway", "discovery"],
      createdAt: new Date().toISOString()
    };

    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    try {
      localStorage.setItem("sdos_research_notes", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save research note", e);
    }
    showToast(`Saved "${title}" to Project Research Notes!`);
  };

  const handleDeleteNote = (id: string) => {
    const updated = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updated);
    try {
      localStorage.setItem("sdos_research_notes", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Clear selected edge when selectedNode from prop is updated
  useEffect(() => {
    if (selectedNode) {
      setSelectedEdge(null);
    }
  }, [selectedNode]);

  // Filter nodes and links based on UI controls
  const filteredNodes = nodes.filter(n => {
    const matchesGroup = filterGroup === "all" || n.group === filterGroup;
    const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = links.filter(l => {
    const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
    const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
    return filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
  });

  // Re-initialize Cytoscape when data, filters, or layout styles change
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Destroy existing instance to prevent duplicates
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Map graph data to Cytoscape format
    const cyNodes = filteredNodes.map(n => ({
      data: {
        id: n.id,
        label: n.label,
        group: n.group,
        val: n.val,
        description: n.description || ""
      }
    }));

    const cyEdges = filteredLinks.map(l => {
      const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
      return {
        data: {
          id: l.id,
          source: sId,
          target: tId,
          label: l.relationship,
          relationship: l.relationship,
          confidence: l.confidence
        },
        classes: l.predicted ? "predicted" : ""
      };
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        {
          selector: "node",
          style: {
            "label": "data(label)",
            "font-family": "Inter, system-ui, sans-serif",
            "font-size": "9px",
            "color": "#cbd5e1", // text-slate-300
            "text-valign": "bottom",
            "text-margin-y": 5 as any,
            "background-color": ((ele: any) => GROUP_COLORS[ele.data("group") as NodeGroup] || "#a3a3a3") as any,
            "width": ((ele: any) => {
              const grp = ele.data("group");
              if (grp === "paper") return 26;
              if (grp === "author") return 18;
              return 14;
            }) as any,
            "height": ((ele: any) => {
              const grp = ele.data("group");
              if (grp === "paper") return 18;
              if (grp === "author") return 18;
              return 14;
            }) as any,
            "shape": ((ele: any) => {
              const grp = ele.data("group");
              if (grp === "paper") return "round-rectangle";
              if (grp === "author") return "hexagon";
              return "ellipse";
            }) as any,
            "border-width": 1.5,
            "border-color": "#07080A",
            "text-wrap": "wrap",
            "text-max-width": "80px"
          } as any
        },
        {
          selector: "edge",
          style: {
            "label": "data(label)",
            "font-family": "monospace",
            "font-size": "7px",
            "color": "#64748b", // slate-500
            "text-rotation": "autorotate",
            "text-margin-y": -5 as any,
            "line-color": "#334155", // slate-700
            "target-arrow-color": "#334155",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "width": 1.2,
            "opacity": 0.7,
            "arrow-scale": 0.8
          } as any
        },
        {
          selector: "edge.predicted",
          style: {
            "line-style": "dashed",
            "line-color": "#d946ef", // Fuchsia neon for missing link predictions
            "target-arrow-color": "#d946ef",
            "color": "#e879f9",
            "width": 1.5,
            "opacity": 0.95
          } as any
        },
        {
          selector: "edge.selected",
          style: {
            "line-color": "#38bdf8", // Sky blue for active selection
            "target-arrow-color": "#38bdf8",
            "width": 2.5,
            "opacity": 1.0
          } as any
        },
        {
          selector: "node.selected",
          style: {
            "border-color": "#ffffff",
            "border-width": 2.5
          }
        },
        {
          selector: "node.source",
          style: {
            "border-color": "#38bdf8", // Sky blue
            "border-width": 2.5
          }
        },
        {
          selector: "node.target",
          style: {
            "border-color": "#f43f5e", // Rose pink
            "border-width": 2.5
          }
        },
        {
          selector: "node.active-path",
          style: {
            "border-color": "#22d3ee", // Glowing cyan
            "border-width": 3,
            "width": ((ele: any) => (ele.data("group") === "paper" ? 30 : 20)) as any,
            "height": ((ele: any) => (ele.data("group") === "paper" ? 22 : 20)) as any
          }
        },
        {
          selector: "edge.active-path",
          style: {
            "line-color": "#22d3ee",
            "target-arrow-color": "#22d3ee",
            "width": 2.5,
            "opacity": 1.0
          }
        },
        {
          selector: "node.hover-dimmed, edge.hover-dimmed",
          style: {
            "opacity": 0.15
          }
        },
        {
          selector: "node.hover-highlighted",
          style: {
            "border-color": "#10b981",
            "border-width": 3,
            "opacity": 1.0
          }
        },
        {
          selector: "edge.hover-highlighted",
          style: {
            "line-color": "#10b981",
            "target-arrow-color": "#10b981",
            "width": 3,
            "opacity": 1.0
          }
        }
      ] as any[],
      layout: {
        name: layoutName as any,
        animate: true,
        animationDuration: 500,
        padding: 40,
        nodeOverlap: 20,
        fit: true,
        idealEdgeLength: 80,
        nodeRepulsion: 8000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 10,
        numIter: 100
      } as any
    });

    cyRef.current = cy;

    // Node click event
    cy.on("tap", "node", (evt) => {
      const nodeEle = evt.target;
      const clickedId = nodeEle.id();
      const originalNode = nodes.find(n => n.id === clickedId);
      if (originalNode) {
        setSelectedEdge(null);
        onNodeClick(originalNode);
      }
    });

    // Node Hover Event (Highlight Related Connectivity)
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      const neighborhood = node.neighborhood().add(node);
      
      cy.elements().removeClass("hover-highlighted hover-dimmed");
      cy.elements().difference(neighborhood).addClass("hover-dimmed");
      neighborhood.addClass("hover-highlighted");

      const connectedEdges = node.connectedEdges();
      let totalConf = 0;
      connectedEdges.forEach((e: any) => {
        totalConf += (e.data("confidence") || 0.85);
      });
      const avgConf = connectedEdges.length > 0 ? totalConf / connectedEdges.length : 0.85;

      setHoveredNodeInfo({
        label: node.data("label"),
        group: node.data("group"),
        degree: connectedEdges.length,
        avgConfidence: Math.round(avgConf * 100)
      });
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("hover-highlighted hover-dimmed");
      setHoveredNodeInfo(null);
    });

    // Edge click event

    // Edge click event
    cy.on("tap", "edge", (evt) => {
      const edgeEle = evt.target;
      const clickedId = edgeEle.id();
      const originalLink = links.find(l => l.id === clickedId);
      if (originalLink) {
        setSelectedEdge(originalLink);
        onNodeClick(null as any); // Clear selected node
      }
    });

    // Apply active selection states from props
    cy.elements().forEach((ele: any) => {
      if (ele.isNode()) {
        const nid = ele.id();
        const label = ele.data("label");
        
        if (selectedNode?.id === nid) ele.addClass("selected");
        if (sourceNode?.id === nid) ele.addClass("source");
        if (targetNode?.id === nid) ele.addClass("target");
        if (activePath.includes(label)) ele.addClass("active-path");
      } else if (ele.isEdge()) {
        const sourceId = ele.data("source");
        const targetId = ele.data("target");
        
        if (selectedEdge?.id === ele.id()) ele.addClass("selected");

        // Find if both nodes are on the active pathway
        const sNode = nodes.find(n => n.id === sourceId);
        const tNode = nodes.find(n => n.id === targetId);
        if (sNode && tNode && activePath.includes(sNode.label) && activePath.includes(tNode.label)) {
          ele.addClass("active-path");
        }
      }
    });

    return () => {
      cy.destroy();
    };
  }, [nodes, links, filterGroup, searchQuery, selectedNode, sourceNode, targetNode, activePath, layoutName]);

  // Canvas Utility Actions
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  const handleFit = () => cyRef.current?.fit();
  const handleResetLayout = () => {
    const layout = cyRef.current?.layout({ name: layoutName as any, animate: true } as any);
    layout?.run();
  };

  return (
    <div id="knowledge-graph-workspace" className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full text-[11px]">
      {/* Search & Controller Panel */}
      <div id="graph-controls-panel" className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-4 h-fit lg:h-full overflow-y-auto">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
          <Network className="text-sky-400 w-4 h-4" />
          <h2 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Discovery Engine</h2>
        </div>

        {/* Filter Group */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Entity Filter</label>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="w-full bg-[#07080A] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Graph Nodes</option>
            <option value="paper">Papers (GROBID parsed)</option>
            <option value="author">Authors (PyMuPDF parsed)</option>
            <option value="protein">Proteins</option>
            <option value="gene">Genes</option>
            <option value="disease">Diseases</option>
            <option value="drug">Drugs</option>
            <option value="quantum_concept">Quantum Concepts</option>
            <option value="physics_concept">Physics Concepts</option>
            <option value="optimization_method">Optimization Methods</option>
            <option value="algorithm">Algorithms</option>
          </select>
        </div>

        {/* Keyword Search */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Search Node</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-slate-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Filter names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#07080A] border border-slate-800 rounded pl-8 pr-2.5 py-1.5 text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Layout Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Layout Style</label>
          <select
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="w-full bg-[#07080A] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="cose">CoSE (Force-Directed)</option>
            <option value="grid">Grid Pattern</option>
            <option value="circle">Circular Ring</option>
            <option value="concentric">Concentric Layers</option>
            <option value="random">Random Distribution</option>
          </select>
        </div>

        {/* Copy Analysis & Export Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>GRAPH ANALYSIS & NOTES</span>
            <button
              onClick={() => setIsNotesModalOpen(true)}
              className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              Notes ({savedNotes.length})
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleCopyGraphAnalysis}
              className="bg-[#16181D] hover:bg-[#1f2229] border border-slate-800 text-slate-300 px-2 py-1.5 text-[9.5px] uppercase font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Copy interactive graph insights"
            >
              <Copy className="w-3 h-3 text-sky-400" />
              Copy Analysis
            </button>
            
            <div className="relative group/export">
              <button
                className="w-full bg-[#16181D] hover:bg-[#1f2229] border border-slate-800 text-slate-300 px-2 py-1.5 text-[9.5px] uppercase font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                Export
              </button>
              <div className="absolute right-0 bottom-full mb-1 hidden group-hover/export:flex flex-col bg-[#07080A] border border-slate-800 rounded shadow-xl z-50 p-1 w-32 font-mono text-[9px]">
                <button 
                  onClick={() => handleExportGraphAnalysis('markdown')}
                  className="px-2 py-1 text-left text-slate-300 hover:bg-[#16181D] hover:text-emerald-400 rounded transition-colors"
                >
                  Markdown (.md)
                </button>
                <button 
                  onClick={() => handleExportGraphAnalysis('txt')}
                  className="px-2 py-1 text-left text-slate-300 hover:bg-[#16181D] hover:text-sky-400 rounded transition-colors"
                >
                  Plain Text (.txt)
                </button>
                <button 
                  onClick={() => handleExportGraphAnalysis('json')}
                  className="px-2 py-1 text-left text-slate-300 hover:bg-[#16181D] hover:text-amber-400 rounded transition-colors"
                >
                  Graph JSON (.json)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector */}
        <div id="node-inspector-box" className="flex-1 bg-[#07080A] border border-slate-800 rounded p-3 flex flex-col gap-2.5 min-h-[140px]">
          <div className="flex items-center justify-between">
            <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Entity Inspector</h3>
            {selectedNode && (
              <button
                onClick={() => handleCopyNodeExplanation(selectedNode)}
                className="flex items-center gap-1 text-[8px] font-mono text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded cursor-pointer"
                title="Copy individual node explanation"
              >
                <Copy className="w-2.5 h-2.5" />
                Copy Explanation
              </button>
            )}
          </div>
          {selectedNode ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <h4 className="text-slate-100 font-bold text-[11px] font-sans leading-snug">{selectedNode.label}</h4>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: GROUP_COLORS[selectedNode.group] || "#a3a3a3" }}
                    />
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      {selectedNode.group.replace("_", " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSaveToProjectNotes(`Node: ${selectedNode.label}`, selectedNode.description || "")}
                    className="text-[8px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1"
                    title="Save node insight to research notes"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Save Note
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-h-[120px] overflow-y-auto pr-1">
                {selectedNode.description || "No description provided."}
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  id="set-source-btn"
                  onClick={() => onSetSource(selectedNode)}
                  className={`flex items-center justify-center gap-1 px-1.5 py-1 text-[10px] uppercase font-bold rounded border transition-all ${
                    sourceNode?.id === selectedNode.id
                      ? "bg-sky-500/10 border-sky-500 text-sky-400"
                      : "bg-[#16181D] border-slate-800 text-slate-300 hover:bg-[#1f2229]"
                  }`}
                >
                  <Navigation2 className="w-3 h-3 rotate-45 text-sky-400" />
                  Set Src
                </button>
                <button
                  id="set-target-btn"
                  onClick={() => onSetTarget(selectedNode)}
                  className={`flex items-center justify-center gap-1 px-1.5 py-1 text-[10px] uppercase font-bold rounded border transition-all ${
                    targetNode?.id === selectedNode.id
                      ? "bg-rose-500/10 border-rose-500 text-rose-400"
                      : "bg-[#16181D] border-slate-800 text-slate-300 hover:bg-[#1f2229]"
                  }`}
                >
                  <CheckCircle className="w-3 h-3 text-rose-400" />
                  Set Tgt
                </button>
              </div>
            </div>
          ) : selectedEdge ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Relationship Edge</span>
                  {selectedEdge.predicted ? (
                    <span className="text-[8px] font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-1 rounded uppercase">GNN Predicted</span>
                  ) : (
                    <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded uppercase">Verified</span>
                  )}
                </div>
                <h4 className="text-slate-100 font-bold text-[11px] font-sans leading-snug mt-1 flex items-center gap-1 flex-wrap">
                  <span className="text-slate-400">{nodes.find(n => n.id === (typeof selectedEdge.source === 'string' ? selectedEdge.source : (selectedEdge.source as any).id))?.label}</span>
                  <span className="text-sky-400 font-mono text-[9px] lowercase px-1 bg-sky-500/10 rounded">{selectedEdge.relationship}</span>
                  <span className="text-slate-400">{nodes.find(n => n.id === (typeof selectedEdge.target === 'string' ? selectedEdge.target : (selectedEdge.target as any).id))?.label}</span>
                </h4>
                <div className="flex justify-between items-center mt-1.5 text-[10px] font-mono text-slate-400 bg-[#07080A] p-1 border border-slate-800 rounded">
                  <span>CONFIDENCE:</span>
                  <span className="font-bold text-sky-400">{Math.round(selectedEdge.confidence * 100)}%</span>
                </div>
              </div>

              {/* Set endpoints shortcuts */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => {
                    const srcId = typeof selectedEdge.source === 'string' ? selectedEdge.source : (selectedEdge.source as any).id;
                    const srcNode = nodes.find(n => n.id === srcId);
                    if (srcNode) onSetSource(srcNode);
                  }}
                  className="bg-[#16181D] hover:bg-[#1f2229] border border-slate-800 text-slate-300 px-1.5 py-1 text-[9px] uppercase font-bold rounded transition-all flex items-center justify-center gap-1"
                >
                  Use Src Node
                </button>
                <button
                  onClick={() => {
                    const tgtId = typeof selectedEdge.target === 'string' ? selectedEdge.target : (selectedEdge.target as any).id;
                    const tgtNode = nodes.find(n => n.id === tgtId);
                    if (tgtNode) onSetTarget(tgtNode);
                  }}
                  className="bg-[#16181D] hover:bg-[#1f2229] border border-slate-800 text-slate-300 px-1.5 py-1 text-[9px] uppercase font-bold rounded transition-all flex items-center justify-center gap-1"
                >
                  Use Tgt Node
                </button>
              </div>

              {/* Temporal Timeline */}
              {selectedEdge.temporalEvents && selectedEdge.temporalEvents.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-800/80 pt-2 max-h-[140px] overflow-y-auto pr-1">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Temporal Development</span>
                  <div className="flex flex-col gap-2 font-sans mt-0.5 pl-1.5 border-l border-slate-800">
                    {selectedEdge.temporalEvents.map((event, index) => (
                      <div key={index} className="flex flex-col gap-0.5 relative pl-1.5">
                        <div className="absolute -left-[10px] top-1 w-1 h-1 rounded-full bg-sky-500" />
                        <div className="flex items-center justify-between text-[8px] leading-none">
                          <span className="text-slate-300 font-bold uppercase">{event.status}</span>
                          <span className="text-sky-400 font-mono font-bold">{event.year}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-snug mt-0.5">{event.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 text-center my-auto py-4 text-slate-600">
              <Info className="w-4 h-4" />
              <p className="text-[10px] font-sans">Click on any node or edge in the graph to inspect details.</p>
            </div>
          )}
        </div>

        {/* Path Discovery Trigger */}
        <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-3">
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-600 font-mono">SOURCE:</span>
              <span className="text-sky-400 font-bold truncate max-w-[130px]">{sourceNode ? sourceNode.label : "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-mono">TARGET:</span>
              <span className="text-rose-400 font-bold truncate max-w-[130px]">{targetNode ? targetNode.label : "None"}</span>
            </div>
          </div>
          <button
            id="run-path-discovery-btn"
            onClick={onDiscover}
            disabled={!sourceNode || !targetNode || isDiscovering}
            className="w-full flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all text-white font-bold py-2 rounded text-[11px] uppercase tracking-wider cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            {isDiscovering ? "Analyzing Graph..." : "Discover Relationships"}
          </button>
        </div>
      </div>

      {/* Interactive Visual Canvas */}
      <div id="graph-canvas-container" className="lg:col-span-3 bg-[#07080A] border border-slate-800 rounded relative overflow-hidden h-[450px] lg:h-full min-h-[380px] flex flex-col">
        {/* Graph Hover HUD Connectivity Strength Overlay */}
        {hoveredNodeInfo && (
          <div className="absolute top-12 left-4 right-4 z-20 bg-[#07080A]/90 border border-emerald-500/40 backdrop-blur rounded p-2.5 shadow-2xl flex items-center justify-between text-[10px] font-mono animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-400 uppercase">Hover Focus:</span>
              <span className="text-slate-100 font-bold font-sans">{hoveredNodeInfo.label}</span>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded uppercase">
                {hoveredNodeInfo.group}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Direct Links: <strong className="text-emerald-400">{hoveredNodeInfo.degree}</strong>
              </span>
              <span className="text-slate-400">
                Avg Connectivity Confidence: <strong className="text-sky-400">{hoveredNodeInfo.avgConfidence}%</strong>
              </span>
            </div>
          </div>
        )}

        {/* Graph Legends & Floating Toolbar */}
        <div className="p-2 border-b border-slate-950 bg-[#0F1115]/60 backdrop-blur flex items-center justify-between z-10 flex-wrap gap-2">
          {/* Legend Badges */}
          <div id="graph-legends" className="flex flex-wrap gap-x-2.5 gap-y-1">
            {Object.entries(GROUP_COLORS).map(([group, color]) => (
              <div key={group} className="flex items-center gap-1 text-[8.5px] font-mono text-slate-400 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {group.replace("_", " ")}
              </div>
            ))}
          </div>

          {/* Controls Toolbar */}
          <div className="flex items-center gap-1 bg-[#07080A] border border-slate-800 rounded p-0.5">
            <button 
              onClick={handleZoomIn} 
              title="Zoom In" 
              className="p-1 hover:bg-[#16181D] text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleZoomOut} 
              title="Zoom Out" 
              className="p-1 hover:bg-[#16181D] text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleFit} 
              title="Fit to Screen" 
              className="p-1 hover:bg-[#16181D] text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleResetLayout} 
              title="Recalculate Layout" 
              className="px-1.5 py-0.5 text-[9px] font-mono font-bold hover:bg-[#16181D] text-slate-400 hover:text-slate-200 rounded transition-colors uppercase"
            >
              Rearrange
            </button>
          </div>
        </div>

        {/* Visual Canvas Element (Cytoscape anchor) */}
        <div 
          ref={containerRef} 
          className="flex-1 w-full bg-[#07080A] cursor-grab active:cursor-grabbing"
          style={{ minHeight: "300px" }}
        />

        {/* Interactive Onboarding Guide Banner */}
        {showOnboardingGuide && (
          <div className="mx-2 my-1 bg-gradient-to-r from-sky-950/40 via-emerald-950/40 to-slate-900/40 border border-sky-500/30 rounded p-2.5 flex items-start justify-between gap-3 text-[10px] font-sans">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sky-200">How to use this Knowledge Graph for Proposal Writing</span>
                <p className="text-slate-300 leading-relaxed">
                  Click any node to inspect details, set <strong>Source</strong> and <strong>Target</strong> nodes on the left panel, and click <strong>Discover Relationships</strong> to extract interdisciplinary bridging pathways. Use <strong>Copy Analysis</strong> or <strong>Save Note</strong> to export insights directly into grant proposal drafts.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowOnboardingGuide(false)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Empty Canvas Info Hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-[#07080A]/95 z-20">
            <div className="max-w-xs flex flex-col items-center gap-2">
              <Network className="w-8 h-8 text-slate-700 animate-spin" />
              <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                Loading AI research knowledge graph. Ingest paper sources to add nodes and connect scientific pathways.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Banner Feedback */}
      {(noteToast || copyFeedback) && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1713] border border-emerald-500/80 text-emerald-200 px-3.5 py-2 rounded shadow-2xl flex items-center gap-2 text-[11px] font-mono animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{noteToast || copyFeedback}</span>
        </div>
      )}

      {/* Research Notes Panel Drawer / Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border border-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl font-sans">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#07080A]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">Project Research Notes ({savedNotes.length})</h3>
              </div>
              <button 
                onClick={() => setIsNotesModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
              {savedNotes.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No research notes saved yet. Click "Save Note" on any graph node, edge, or hypothesis section to add notes here.
                </div>
              ) : (
                savedNotes.map((note) => (
                  <div key={note.id} className="bg-[#07080A] border border-slate-800/80 rounded p-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-slate-200 text-xs">{note.title}</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${note.title}\n${note.content}`);
                            showToast("Copied note content!");
                          }}
                          className="text-[9px] font-mono text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copy
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-[9px] font-mono text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-600 border-t border-slate-900 pt-1.5 mt-1">
                      <span>Saved: {new Date(note.createdAt).toLocaleString()}</span>
                      <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 rounded">{note.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-[#07080A] flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>Saved in local project workspace</span>
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded font-bold uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
