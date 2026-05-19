import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../shared/Sidebar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Network, Loader2, RefreshCw, AlertTriangle, ShieldCheck,
  CheckCircle2, XCircle, Clock, ChevronRight, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GraphView() {
  const { company } = useAuthStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [blockers, setBlockers] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loadingBlockers, setLoadingBlockers] = useState(false);

  const fetchGraphData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/graph/${company.companyId}`);
      
      // Transform backend nodes into ReactFlow nodes with gorgeous positioning
      // Let's lay them out in a simple tiered grid based on index
      const tfNodes = data.nodes.map((node, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        
        // Custom styling based on regulatory status
        let bgStyle = 'bg-slate-900/90 border-white/10';
        let ringStyle = '';
        if (node.status === 'active') {
          bgStyle = 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200';
          ringStyle = 'ring-2 ring-emerald-500/20';
        } else if (node.status === 'expired') {
          bgStyle = 'bg-red-950/80 border-red-500/30 text-red-200';
          ringStyle = 'ring-2 ring-red-500/20';
        } else if (node.status === 'pending_renewal') {
          bgStyle = 'bg-amber-950/80 border-amber-500/30 text-amber-200';
          ringStyle = 'ring-2 ring-amber-500/20';
        } else if (node.status === 'dependency') {
          bgStyle = 'bg-slate-800/80 border-slate-600/40 text-slate-300';
        }

        return {
          id: node.id,
          position: { x: col * 260 + 50, y: row * 180 + 80 },
          data: {
            label: (
              <div className={`p-4 rounded-2xl border text-left shadow-xl backdrop-blur-md transition-all duration-300 ${bgStyle} ${ringStyle}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{node.severity} severity</p>
                <h4 className="text-xs font-bold text-white mt-1 truncate max-w-[180px]">{node.label}</h4>
                <div className="flex items-center justify-between mt-3 gap-2">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/20 border border-white/5 uppercase">
                    {node.status}
                  </span>
                  {node.daysToExpiry !== undefined && node.status !== 'dependency' && (
                    <span className="text-[9px] font-medium text-slate-300">
                      {node.daysToExpiry < 0 ? 'Expired' : `${node.daysToExpiry}d left`}
                    </span>
                  )}
                </div>
              </div>
            ),
            raw: node
          }
        };
      });

      // Transform backend edges into ReactFlow edges
      const tfEdges = data.edges.map((edge, idx) => ({
        id: `e-${edge.from}-${edge.to}-${idx}`,
        source: edge.from,
        target: edge.to,
        animated: edge.mandatory,
        style: {
          stroke: edge.mandatory ? '#818cf8' : '#64748b',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.mandatory ? '#818cf8' : '#64748b',
        }
      }));

      setNodes(tfNodes);
      setEdges(tfEdges);
    } catch (err) {
      toast.error('Failed to load dependency graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [company]);

  // Handle clicking a node to show its dependency blockers drawer
  const onNodeClick = useCallback(async (event, node) => {
    const rawNode = node.data.raw;
    setSelectedNode(rawNode);
    setLoadingBlockers(true);
    try {
      // Fetch blockers from backend
      const { data } = await api.get(`/graph/${company.companyId}/blockers/${rawNode.id}`);
      setBlockers(data.blockers);
      setIsBlocked(data.isBlocked);
    } catch (err) {
      toast.error('Failed to retrieve dependency blocker information');
    } finally {
      setLoadingBlockers(false);
    }
  }, [company]);

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Graph Content */}
      <main className="flex-1 ml-60 p-8 min-w-0 fade-in flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Compliance Knowledge Graph
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Visual maps detailing act-level dependencies and active licensing bottlenecks
            </p>
          </div>
          <button
            onClick={fetchGraphData}
            className="btn-secondary py-2 px-4 text-xs h-10 flex items-center gap-2 self-start sm:self-auto hover:text-white"
          >
            <RefreshCw size={14} />
            Recalculate Nodes
          </button>
        </header>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center bg-white/5 border border-white/5 rounded-xl px-4 py-3 mb-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500/25 border border-emerald-500/50" />
            <span>Active License</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-amber-500/25 border border-amber-500/50" />
            <span>Expiring &lt; 30d</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-500/25 border border-red-500/50" />
            <span>Expired / Breached</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-800/80 border border-slate-600/40" />
            <span>Unlinked Dependency Requirement</span>
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="text-[10px] text-slate-500">
            * Animated paths imply mandatory legal prerequisites (Water Act, Factories Rules)
          </div>
        </div>

        {/* Graph Render Box */}
        <div className="flex-1 min-h-[500px] glass-card bg-slate-950/40 border-white/5 relative overflow-hidden flex">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-indigo-400 animate-spin" />
                <p className="text-slate-400 text-sm">Mapping Neo4j Relationships...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 h-full relative z-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                className="w-full h-full text-slate-200"
              >
                <Background color="rgba(255,255,255,0.04)" gap={16} size={1} />
                <Controls className="bg-slate-900 border-white/10 text-white rounded-lg overflow-hidden [&_button]:bg-slate-900 [&_button]:border-white/5 [&_button]:text-slate-400 [&_button:hover]:bg-slate-800" />
                <MiniMap
                  nodeColor={(n) => {
                    const status = n.data?.raw?.status;
                    if (status === 'active') return 'rgba(16, 185, 129, 0.3)';
                    if (status === 'expired') return 'rgba(239, 68, 68, 0.3)';
                    if (status === 'pending_renewal') return 'rgba(245, 158, 11, 0.3)';
                    return 'rgba(100, 116, 139, 0.2)';
                  }}
                  maskColor="rgba(15, 17, 23, 0.7)"
                  className="bg-slate-950/80 border border-white/10 rounded-xl overflow-hidden"
                />
              </ReactFlow>
            </div>
          )}

          {/* Slide Drawer for Selected Node Details & Blockers */}
          {selectedNode && (
            <div className="w-80 border-l border-white/8 bg-slate-950/95 p-6 overflow-y-auto z-20 flex flex-col justify-between shrink-0 fade-in animate-slide-in">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                    License Detail Drawer
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-xs text-slate-400 hover:text-white font-semibold"
                  >
                    Close
                  </button>
                </div>

                <h3 className="text-base font-bold text-white">{selectedNode.label}</h3>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className="text-slate-300 font-bold capitalize">{selectedNode.status}</span>
                  </div>
                  {selectedNode.daysToExpiry !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Validity Limit:</span>
                      <span className="text-slate-300 font-semibold">
                        {selectedNode.daysToExpiry < 0 ? 'Expired' : `${selectedNode.daysToExpiry} days left`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Impact Risk:</span>
                    <span className="text-slate-300 capitalize font-medium">{selectedNode.severity}</span>
                  </div>
                </div>

                {/* Dependency Blockers section */}
                <div className="mt-8 border-t border-white/5 pt-6">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-500" />
                    Blocker Assessment
                  </h4>

                  {loadingBlockers ? (
                    <div className="flex justify-center items-center py-6">
                      <Loader2 size={16} className="text-indigo-400 animate-spin" />
                    </div>
                  ) : blockers.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-[11px] text-red-400 leading-normal mb-1">
                        🚨 The following active legal prerequisites have lapsed or expired, legally blocking this license's renewal:
                      </p>
                      {blockers.map((b, i) => (
                        <div key={i} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                          <p className="text-xs font-bold text-white leading-tight">{b.name}</p>
                          <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                            <span className="capitalize font-semibold text-red-400">{b.status}</span>
                            <span>Expires: {b.expiryDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-2">
                      <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-300 leading-relaxed">
                        Prerequisite licenses are in order. No blockers are currently restricting renewal pipelines.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedNode.status !== 'dependency' && (
                <div className="mt-8 border-t border-white/5 pt-4">
                  <Link
                    to="/ai-checklist"
                    className="btn-primary w-full text-xs h-10 flex items-center justify-center gap-1.5"
                  >
                    Generate AI Renewal Guide
                    <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
