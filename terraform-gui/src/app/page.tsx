'use client';

import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';
import { TerraformPlan, parsePlan } from '@/lib/parsePlan';
import FileUpload from '@/components/FileUpload';
import Diagram from '@/components/Diagram';
import ResourceDetails from '@/components/ResourceDetails';
import { RefreshCw, LayoutTemplate } from 'lucide-react';

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleUpload = (plan: TerraformPlan) => {
    const { nodes: parsedNodes, edges: parsedEdges } = parsePlan(plan);
    setNodes(parsedNodes);
    setEdges(parsedEdges);
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const handleReload = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full px-4">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <LayoutTemplate className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
              Terraform Visualizer
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Upload your Terraform plan JSON file to visualize resources, dependencies, and changes in an interactive diagram.
            </p>
          </div>
          <FileUpload onUpload={handleUpload} />
        </div>
      ) : (
        <div className="w-full h-screen absolute inset-0">
          <Diagram
            initialNodes={nodes}
            initialEdges={edges}
            onNodeClick={handleNodeClick}
          />

          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={handleReload}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              title="Upload new plan"
            >
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Load New Plan</span>
            </button>
          </div>

          {selectedNode && (
            <ResourceDetails
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      )}
    </main>
  );
}
