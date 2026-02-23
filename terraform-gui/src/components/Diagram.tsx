'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  Position,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

interface DiagramProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick: (node: Node) => void;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    // dagre needs width and height to layout correctly.
    // We are guessing the size of our custom node.
    dagreGraph.setNode(node.id, { width: 250, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - 125,
        y: nodeWithPosition.y - 40,
      },
    };
    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};

const LayoutFlow = ({ initialNodes, initialEdges, onNodeClick }: DiagramProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClickCallback: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickCallback}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap />
        <Background gap={16} size={1} />
      </ReactFlow>
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
