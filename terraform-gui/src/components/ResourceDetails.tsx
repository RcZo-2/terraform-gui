'use client';

import React from 'react';
import { Node } from 'reactflow';
import { Copy, X, Terminal } from 'lucide-react';

interface ResourceDetailsProps {
  node: Node | null;
  onClose: () => void;
}

export default function ResourceDetails({ node, onClose }: ResourceDetailsProps) {
  if (!node) return null;

  const { address, details } = node.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const applyCommand = `terraform apply -target='${address}'`;
  const destroyCommand = `terraform destroy -target='${address}'`;

  return (
    <div className="absolute top-4 right-4 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col max-h-[80vh]">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 overflow-hidden">
          <Terminal className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm" title={address}>
            {address}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        <div className="space-y-6">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-3">
              Commands
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="group relative">
                <button
                  onClick={() => copyToClipboard(applyCommand)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30 transition-all active:scale-[0.98]"
                >
                  <span className="truncate mr-2 font-mono text-xs">{applyCommand}</span>
                  <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </button>
              </div>
              <div className="group relative">
                <button
                  onClick={() => copyToClipboard(destroyCommand)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 transition-all active:scale-[0.98]"
                >
                  <span className="truncate mr-2 font-mono text-xs">{destroyCommand}</span>
                  <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-3">
              Raw JSON
            </h4>
            <div className="relative group">
              <button
                onClick={() => copyToClipboard(JSON.stringify(details, null, 2))}
                className="absolute right-2 top-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy JSON"
              >
                <Copy className="w-3 h-3" />
              </button>
              <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono border border-gray-700 max-h-96 custom-scrollbar">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
