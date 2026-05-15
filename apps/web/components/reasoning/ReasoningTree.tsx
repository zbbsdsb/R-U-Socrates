"use client";

import { useMemo, useState, memo } from "react";
import { useReasoningStore, type IterationData } from "@/stores/reasoningStore";

interface TreeNode {
  id: string;
  iteration: number;
  parentId: string | null;
  score: number;
  isBest: boolean;
  isCurrent: boolean;
  status: "alive" | "pruned" | "best";
}

interface TreeLayoutNode extends TreeNode {
  x: number;
  y: number;
  children: TreeLayoutNode[];
}

const NODE_COLORS = {
  alive: {
    bg: "rgba(34, 211, 238, 0.15)",
    border: "rgba(34, 211, 238, 0.5)",
    text: "#34d3ee",
  },
  best: {
    bg: "rgba(16, 185, 129, 0.2)",
    border: "rgba(16, 185, 129, 0.7)",
    text: "#34d399",
  },
  pruned: {
    bg: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.15)",
    text: "rgba(255, 255, 255, 0.4)",
  },
};

const NODE_WIDTH = 120;
const NODE_HEIGHT = 50;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 80;

function buildTreeData(iterations: IterationData[], activeIteration: number): TreeNode[] {
  const nodes: TreeNode[] = [];
  let bestScore = -1;
  let bestIteration = -1;

  for (const iter of iterations) {
    if (iter.bestScore > bestScore) {
      bestScore = iter.bestScore;
      bestIteration = iter.iteration;
    }
  }

  for (const iter of iterations) {
    const isBest = iter.iteration === bestIteration && bestScore > 0;
    const isCurrent = iter.iteration === activeIteration;

    nodes.push({
      id: `iter-${iter.iteration}`,
      iteration: iter.iteration,
      parentId: iter.iteration > 1 ? `iter-${iter.iteration - 1}` : null,
      score: iter.bestScore,
      isBest,
      isCurrent,
      status: isBest ? "best" : isCurrent ? "alive" : "pruned",
    });
  }

  return nodes;
}

function layoutTree(
  nodes: TreeNode[],
  startX: number,
  startY: number
): TreeLayoutNode[] {
  if (nodes.length === 0) return [];

  const nodeMap = new Map<string, TreeLayoutNode>();
  const rootNodes: TreeLayoutNode[] = [];

  for (const node of nodes) {
    const layoutNode: TreeLayoutNode = {
      ...node,
      x: 0,
      y: 0,
      children: [],
    };
    nodeMap.set(node.id, layoutNode);
  }

  for (const node of nodes) {
    const layoutNode = nodeMap.get(node.id)!;
    if (node.parentId === null) {
      rootNodes.push(layoutNode);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(layoutNode);
      }
    }
  }

  function positionNode(node: TreeLayoutNode, x: number, y: number): number {
    let totalWidth = 0;
    const childCount = node.children.length;

    if (childCount === 0) {
      node.x = x;
      node.y = y;
      return NODE_WIDTH;
    }

    const childWidth = (childCount - 1) * (NODE_WIDTH + HORIZONTAL_GAP);
    let currentX = x - childWidth / 2;

    for (const child of node.children) {
      const childWidth = positionNode(child, currentX + NODE_WIDTH / 2, y + NODE_HEIGHT + VERTICAL_GAP);
      currentX += childWidth + HORIZONTAL_GAP;
      totalWidth += childWidth;
    }

    node.x = (node.children[0].x + node.children[childCount - 1].x) / 2;
    node.y = y;

    return Math.max(totalWidth + (childCount - 1) * HORIZONTAL_GAP, NODE_WIDTH);
  }

  let currentX = startX;
  for (const root of rootNodes) {
    const subtreeWidth = positionNode(root, currentX, startY);
    currentX += subtreeWidth + HORIZONTAL_GAP * 2;
  }

  return rootNodes;
}

function renderConnections(
  nodes: TreeLayoutNode[],
  connections: { x1: number; y1: number; x2: number; y2: number; status: string }[]
) {
  for (const node of nodes) {
    for (const child of node.children) {
      connections.push({
        x1: node.x,
        y1: node.y + NODE_HEIGHT / 2,
        x2: child.x,
        y2: child.y - NODE_HEIGHT / 2,
        status: child.status,
      });
      renderConnections([child], connections);
    }
  }
}

interface NodeDetailsProps {
  iteration: number;
  iterations: IterationData[];
  onClose: () => void;
}

const NodeDetails = memo(function NodeDetails({ iteration, iterations, onClose }: NodeDetailsProps) {
  const iter = iterations.find((i) => i.iteration === iteration);
  if (!iter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Iteration {iteration}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-white/50 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {iter.researcher.status === "complete" && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-400">
                <span>Research</span>
              </div>
              <p className="text-xs text-white/60">{iter.researcher.nodeMotivation}</p>
            </div>
          )}

          {iter.engineer.status === "complete" && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-400">Engineer</span>
                <span className="text-sm font-mono text-emerald-400">
                  {(iter.engineer.evalScore! * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {iter.analyzer.status === "complete" && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="mb-2 text-sm font-medium text-violet-400">Analyzer</div>
              <p className="text-xs text-white/60 line-clamp-3">{iter.analyzer.analysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

interface ConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  status: string;
  index: number;
}

const Connection = memo(function Connection({ x1, y1, x2, y2, status, index }: ConnectionProps) {
  const colors = NODE_COLORS[status as keyof typeof NODE_COLORS] || NODE_COLORS.pruned;
  const midY = (y1 + y2) / 2;
  return (
    <g key={index}>
      <path
        d={`M ${x1 + NODE_WIDTH / 2} ${y1} 
            C ${x1 + NODE_WIDTH / 2} ${midY}, 
              ${x2 + NODE_WIDTH / 2} ${midY}, 
              ${x2 + NODE_WIDTH / 2} ${y2}`}
        fill="none"
        stroke={colors.border}
        strokeWidth={status === "best" ? 2 : 1}
        strokeOpacity={status === "best" ? 0.8 : 0.4}
      />
    </g>
  );
});

interface TreeNodeComponentProps {
  node: TreeLayoutNode;
  onClick: (iteration: number) => void;
}

const TreeNodeComponent = memo(function TreeNodeComponent({ node, onClick }: TreeNodeComponentProps) {
  const colors = NODE_COLORS[node.status];
  const filterId = node.status === "alive" ? "url(#glow-cyan)" : node.status === "best" ? "url(#glow-emerald)" : "";

  return (
    <g
      key={node.id}
      transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y})`}
      onClick={() => onClick(node.iteration)}
      className="cursor-pointer"
    >
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={12}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={node.status === "best" ? 2 : 1}
        filter={filterId}
        className="transition-all duration-200 hover:brightness-125"
      />

      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={colors.text}
        className="text-xs font-semibold"
      >
        Iter {node.iteration}
      </text>

      {node.score > 0 && (
        <text
          x={NODE_WIDTH / 2}
          y={NODE_HEIGHT / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          opacity={0.7}
          className="text-[10px] font-mono"
        >
          {(node.score * 100).toFixed(1)}%
        </text>
      )}

      {node.status === "best" && (
        <g transform={`translate(${NODE_WIDTH - 14}, -14)`}>
          <circle r={10} fill="#10b981" filter="url(#glow-emerald)" />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={10}
            fontWeight="bold"
          >
            ★
          </text>
        </g>
      )}
    </g>
  );
});

export function ReasoningTree() {
  const { getIterations, activeIteration, runStatus } = useReasoningStore();
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const iterations = useMemo(() => getIterations(), [getIterations]);

  const treeNodes = useMemo(
    () => buildTreeData(iterations, activeIteration),
    [iterations, activeIteration]
  );

  const layoutNodes = useMemo(
    () => layoutTree(treeNodes, 200, 60),
    [treeNodes]
  );

  const connections = useMemo(() => {
    const conns: { x1: number; y1: number; x2: number; y2: number; status: string }[] = [];
    renderConnections(layoutNodes, conns);
    return conns;
  }, [layoutNodes]);

  const svgWidth = useMemo(
    () => Math.max(400, iterations.length * (NODE_WIDTH + HORIZONTAL_GAP) + 100),
    [iterations.length]
  );

  const svgHeight = useMemo(
    () => 200 + iterations.length * (NODE_HEIGHT + VERTICAL_GAP) / 3,
    [iterations.length]
  );

  const handleNodeClick = useMemo(
    () => (iteration: number) => setSelectedNode(iteration),
    []
  );

  const handleCloseDetails = useMemo(
    () => () => setSelectedNode(null),
    []
  );

  if (iterations.length === 0 || runStatus === "idle") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-medium text-white/80">Reasoning Tree</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span className="text-white/40">Alive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-white/40">Best</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="text-white/40">Explored</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="min-w-full"
          style={{ minHeight: svgHeight }}
        >
          <defs>
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {connections.map((conn, i) => (
            <Connection
              key={i}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              status={conn.status}
              index={i}
            />
          ))}

          {layoutNodes.map((node) => (
            <TreeNodeComponent key={node.id} node={node} onClick={handleNodeClick} />
          ))}
        </svg>
      </div>

      {selectedNode !== null && (
        <NodeDetails
          iteration={selectedNode}
          iterations={iterations}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
