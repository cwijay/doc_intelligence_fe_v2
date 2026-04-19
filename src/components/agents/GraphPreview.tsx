'use client';

import { useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MarkerType, Position,
  type Node as RFNode, type Edge as RFEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphSpec } from '@/types/agents';
import { useTheme } from '@/contexts/ThemeContext';

interface GraphPreviewProps {
  spec: GraphSpec;
  height?: string;
}

const NODE_WIDTH = 180;
const NODE_GAP = 80;

const LIGHT_NODE = {
  border: '1px solid #cbd5e1',   // slate-300
  background: '#f8fafc',         // slate-50
  color: '#0f172a',              // slate-900
};

const DARK_NODE = {
  border: '1px solid #475569',   // slate-600
  background: '#1e293b',         // slate-800
  color: '#f1f5f9',              // slate-100
};

/**
 * Read-only left-to-right layout. All current backend templates are
 * linear, so a simple x-offset layout is enough.
 */
export default function GraphPreview({ spec, height = 'h-80' }: GraphPreviewProps) {
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === 'dark' ? DARK_NODE : LIGHT_NODE;

  const { nodes, edges } = useMemo(() => {
    const rfNodes: RFNode[] = spec.nodes.map((n, idx) => ({
      id: n.id,
      position: { x: idx * (NODE_WIDTH + NODE_GAP), y: 0 },
      data: { label: n.nodeType },
      style: {
        width: NODE_WIDTH,
        padding: 8,
        borderRadius: 8,
        border: palette.border,
        background: palette.background,
        color: palette.color,
        fontFamily: 'var(--font-inter, system-ui)',
        fontSize: 13,
        textAlign: 'center',
      } as React.CSSProperties,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));
    const rfEdges: RFEdge[] = spec.edges.map((e) => ({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      markerEnd: { type: MarkerType.ArrowClosed },
    }));
    return { nodes: rfNodes, edges: rfEdges };
  }, [spec, palette]);

  return (
    <div className={`${height} rounded-lg border border-secondary-200 dark:border-secondary-700`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
