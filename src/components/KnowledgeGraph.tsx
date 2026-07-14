import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { GraphNode, GraphLink, NodeGroup } from "../types";
import { Network, Search, Sparkles, Navigation2, CheckCircle, Info, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

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
  isDiscovering
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutName, setLayoutName] = useState<string>("cose");
  const [selectedEdge, setSelectedEdge] = useState<GraphLink | null>(null);

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

        {/* Selected Entity Inspector */}
        <div id="node-inspector-box" className="flex-1 bg-[#07080A] border border-slate-800 rounded p-3 flex flex-col gap-2.5 min-h-[140px]">
          <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Entity Inspector</h3>
          {selectedNode ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <h4 className="text-slate-100 font-bold text-[11px] font-sans leading-snug">{selectedNode.label}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: GROUP_COLORS[selectedNode.group] || "#a3a3a3" }}
                  />
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    {selectedNode.group.replace("_", " ")}
                  </span>
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
    </div>
  );
}
