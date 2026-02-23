'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  NodeMouseHandler,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { getElkLayout } from '@/lib/layout/elkLayout';
import SearchBar from './SearchBar';

const nodeTypes = {
  custom: CustomNode,
};

interface DiagramProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick: (node: Node) => void;
}

const LayoutFlow = ({ initialNodes, initialEdges, onNodeClick }: DiagramProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayouting, setIsLayouting] = useState(true);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const runLayout = async () => {
      setIsLayouting(true);
      const { nodes: layoutedNodes, edges: layoutedEdges } = await getElkLayout(
        initialNodes,
        initialEdges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);

      // Fit view after layout
      setTimeout(() => {
        fitView({ duration: 500 });
      }, 50);
    };

    runLayout();
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  const onNodeClickCallback: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'group') return;
      onNodeClick(node);
    },
    [onNodeClick]
  );

  const handleSearchSelect = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      fitView({ nodes: [node], duration: 800, padding: 0.5 });
      // Delay selection to allow animation
      setTimeout(() => onNodeClick(node), 100);
    }
  }, [nodes, fitView, onNodeClick]);

  const searchableNodes = useMemo(() =>
    nodes
      .filter((n) => n.type === 'custom')
      .map((n) => ({
        id: n.id,
        label: n.data.label || n.id,
        type: n.data.resourceType || '',
      })),
    [nodes]
  );

  return (
    <div className="relative w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-inner group">
      {/* Search Bar Container - Add pointer-events-none to container but auto to children */}
      <div className="absolute top-4 left-4 z-40 w-full max-w-sm pointer-events-none">
         <div className="pointer-events-auto">
            <SearchBar nodes={searchableNodes} onSelect={handleSearchSelect} />
         </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickCallback}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        className={isLayouting ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}
        minZoom={0.1}
      >
        <Controls />
        <MiniMap />
        <Background gap={16} size={1} />
      </ReactFlow>

      {isLayouting && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-50">
           <div className="animate-pulse text-blue-500 font-semibold">Calculating Layout...</div>
        </div>
      )}
    </div>
  );
};

export default function Diagram(props: DiagramProps) {
  return (
    <ReactFlowProvider>
      <LayoutFlow {...props} />
    </ReactFlowProvider>
  );
}
