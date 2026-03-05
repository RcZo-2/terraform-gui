'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  Panel,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Search } from 'lucide-react';
import CustomNode from './CustomNode';
import GroupNode from './GroupNode';

const nodeTypes = {
  custom: CustomNode,
  group: GroupNode,
};

interface DiagramProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick: (node: Node) => void;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Adjust nodesep and ranksep to compress the layout and make better use of 16:9 space
  // rankdir 'LR' makes it left-to-right, but by reducing the separation, it won't stretch as far horizontally.
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 150 });

  nodes.forEach((node) => {
    // dagre needs width and height to layout correctly.
    if (node.type === 'group') {
      dagreGraph.setNode(node.id, { label: node.data.label });
    } else {
      dagreGraph.setNode(node.id, { width: 250, height: 80 });
    }
  });

  nodes.forEach((node) => {
    if (node.parentNode) {
      dagreGraph.setParent(node.id, node.parentNode);
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // Safety check in case dagre failed to layout this specific node
    if (!nodeWithPosition) {
      return node;
    }

    const newNode = {
      ...node,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      // If it's a child node, Dagre gives absolute coordinates, but React Flow expects relative.
      // So we have to account for parent position if needed, OR just let Dagre position them.
      // Wait, currently React Flow uses node.parentNode to compute relative positioning.
      // If Dagre positions them absolutely, React Flow parentNode might shift them again.
      // To fix this, we'll keep dagre absolute positioning but remove parentNode for layout representation
      // actually wait. If parentNode is present in ReactFlow, coordinates are relative to parent.
      position: {
        x: nodeWithPosition.x - (node.type === 'group' ? nodeWithPosition.width! / 2 : 125),
        y: nodeWithPosition.y - (node.type === 'group' ? nodeWithPosition.height! / 2 : 40),
      },
      style: node.type === 'group' ? {
        ...node.style,
        width: nodeWithPosition.width,
        height: nodeWithPosition.height,
      } : node.style
    };

    if (newNode.parentNode) {
      const parentWithPosition = dagreGraph.node(newNode.parentNode);
      if (parentWithPosition) {
        newNode.position.x -= (parentWithPosition.x - parentWithPosition.width! / 2);
        newNode.position.y -= (parentWithPosition.y - parentWithPosition.height! / 2);
      }
    }

    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};

const LayoutFlow = ({ initialNodes, initialEdges, onNodeClick }: DiagramProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter, getNode } = useReactFlow();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Node[]>([]);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const highlightNodeAndConnections = useCallback((nodeId: string | null) => {
    setEdges((eds) => {
      let connectedNodeIds = new Set<string>();
      if (nodeId) {
        const connectedEdges = eds.filter(e => e.source === nodeId || e.target === nodeId);
        connectedNodeIds = new Set(connectedEdges.flatMap(e => [e.source, e.target]));
        connectedNodeIds.add(nodeId);
      }

      setNodes((nds) => nds.map((n) => {
        if (!nodeId) return { ...n, data: { ...n.data, isHighlighted: false, isDimmed: false } };
        return {
          ...n,
          data: {
            ...n.data,
            isHighlighted: connectedNodeIds.has(n.id),
            isDimmed: !connectedNodeIds.has(n.id)
          }
        };
      }));

      return eds.map((e) => {
        if (!nodeId) return { ...e, style: { ...e.style, opacity: 1, strokeWidth: 1, stroke: '#9ca3af' }, animated: true, zIndex: 0 };
        const isConnected = e.source === nodeId || e.target === nodeId;
        return {
          ...e,
          style: {
            ...e.style,
            opacity: isConnected ? 1 : 0.3,
            strokeWidth: isConnected ? 3 : 1,
            stroke: isConnected ? '#3b82f6' : '#d1d5db'
          },
          animated: isConnected,
          zIndex: isConnected ? 10 : 0,
        };
      });
    });
  }, [setNodes, setEdges]);

  const onNodeClickCallback: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeClick(node);
      highlightNodeAndConnections(node.id);
    },
    [onNodeClick, highlightNodeAndConnections]
  );

  const onPaneClick = useCallback(() => {
    highlightNodeAndConnections(null);
  }, [highlightNodeAndConnections]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }
    const lowerTerm = term.toLowerCase();
    const results = nodes.filter(
      (n) => {
        const d = n.data;
        if (!d) return false;
        const matchLabel = d.label && typeof d.label === 'string' && d.label.toLowerCase().includes(lowerTerm);
        const matchType = d.resourceType && typeof d.resourceType === 'string' && d.resourceType.toLowerCase().includes(lowerTerm);
        const matchModule = d.moduleName && typeof d.moduleName === 'string' && d.moduleName.toLowerCase().includes(lowerTerm);
        return matchLabel || matchType || matchModule;
      }
    );
    setSearchResults(results.slice(0, 10));
  };

  const handleSelectSearchResult = (node: Node) => {
    setSearchTerm('');
    setSearchResults([]);
    const flowNode = getNode(node.id);
    if (flowNode) {
      const x = flowNode.positionAbsolute?.x ?? flowNode.position.x;
      const y = flowNode.positionAbsolute?.y ?? flowNode.position.y;
      setCenter(
        x + (flowNode.width ?? 250) / 2,
        y + (flowNode.height ?? 80) / 2,
        { zoom: 1.2, duration: 800 }
      );
      onNodeClick(flowNode);
      highlightNodeAndConnections(flowNode.id);
    }
  };

  return (
    <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickCallback}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-md min-w-[300px] z-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resource..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, i) => (
                <div
                  key={`${result.id}-${i}`}
                  onClick={() => handleSelectSearchResult(result)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col text-sm truncate text-gray-900 border-b last:border-0 border-gray-100"
                >
                  <span className="font-medium truncate">{result.data?.label || 'Unknown'}</span>
                  {result.data?.resourceType && (
                    <span className="text-xs text-gray-500 truncate mt-0.5">
                      {result.data.resourceType}
                      {result.data.moduleName ? ` (${result.data.moduleName})` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Controls />
        <MiniMap pannable zoomable style={{ backgroundColor: '#1f2937' }} maskColor="rgba(0, 0, 0, 0.4)" nodeColor="#9ca3af" />
        <Background gap={16} size={1} color="#6b7280" />
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
