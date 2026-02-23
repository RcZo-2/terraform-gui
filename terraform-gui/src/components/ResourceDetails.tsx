'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Node } from 'reactflow';
import { Copy, X, Terminal, GripVertical, Layers, ArrowRight, Tag, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface ResourceDetailsProps {
  node: Node | null;
  onClose: () => void;
}

export default function ResourceDetails({ node, onClose }: ResourceDetailsProps) {
  const [width, setWidth] = useState(450);
  const [activeTab, setActiveTab] = useState<'analysis' | 'json'>('analysis');
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < 1200) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  if (!node) return null;

  const { address, details, action } = node.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const applyCommand = `terraform apply -target='${address}'`;
  const destroyCommand = `terraform destroy -target='${address}'`;

  // Safe access to nested properties with fallbacks
  const change = details?.change || {};
  const before = change.before;
  const after = change.after || {};

  // Format attribute value for display
  const formatValue = (val: any) => {
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return String(val);
  };

  const getBadgeColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'delete': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'update': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const displayObj = after || before || {};
  const displayKeys = Object.keys(displayObj).filter(k => k !== 'tags' && k !== 'id' && k !== 'arn');

  // Handle case where details might be missing
  const hasDetails = details && typeof details === 'object';

  return (
    <div
      className="absolute top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 flex flex-row max-h-[90vh]"
      style={{ width: `${width}px`, transition: isResizingRef.current ? 'none' : 'width 0.1s ease-out' }}
    >
      {/* Resize Handle */}
      <div
        className="w-4 cursor-ew-resize hover:bg-blue-500/10 flex items-center justify-center transition-colors group border-r border-gray-100 dark:border-gray-700 flex-shrink-0"
        onMouseDown={startResizing}
        title="Drag to resize"
      >
        <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex flex-col overflow-hidden mr-2">
            <div className="flex items-center space-x-2 mb-1">
               <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider", getBadgeColor(action))}>
                {action || 'unknown'}
              </span>
              <span className="text-xs text-gray-400 font-mono">{details?.type || 'unknown_type'}</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm" title={address}>
              {address}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => setActiveTab('analysis')}
            className={clsx(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'analysis'
                ? "bg-white dark:bg-gray-800 text-blue-600 border-blue-500"
                : "bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={clsx(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'json'
                ? "bg-white dark:bg-gray-800 text-blue-600 border-blue-500"
                : "bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent"
            )}
          >
            Raw JSON
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
            {activeTab === 'analysis' ? (
              <div className="space-y-6 pb-4">
                 {!hasDetails && (
                    <div className="flex items-center p-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800" role="alert">
                      <AlertCircle className="flex-shrink-0 inline w-4 h-4 me-3" />
                      <span className="sr-only">Info</span>
                      <div>
                        <span className="font-medium">Details unavailable.</span> The plan file might be missing detailed attributes for this resource. Check Raw JSON.
                      </div>
                    </div>
                 )}

                 {/* Provider Info */}
                 {hasDetails && (
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded border border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Resource Name</span>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={details.name}>{details.name || '-'}</div>
                   </div>
                   <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded border border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Provider</span>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={details.provider_name}>{details.provider_name ? details.provider_name.split('/').pop() : '-'}</div>
                   </div>
                 </div>
                 )}

                 {/* Commands */}
                 <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2 flex items-center">
                    <Terminal className="w-3 h-3 mr-1.5" /> Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <div className="group relative">
                      <button
                        onClick={() => copyToClipboard(applyCommand)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/50 transition-all"
                      >
                        <span className="truncate mr-2">{applyCommand}</span>
                        <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 shrink-0" />
                      </button>
                    </div>
                    <div className="group relative">
                      <button
                        onClick={() => copyToClipboard(destroyCommand)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/50 transition-all"
                      >
                        <span className="truncate mr-2">{destroyCommand}</span>
                        <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>

                 {/* Tags */}
                 {hasDetails && after?.tags && Object.keys(after.tags).length > 0 && (
                   <div>
                      <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2 flex items-center">
                        <Tag className="w-3 h-3 mr-1.5" /> Tags
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(after.tags).map(([key, value]) => (
                          <div key={key} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/50 flex items-center">
                            <span className="font-semibold mr-1">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* Changes Diff */}
                 {hasDetails && displayKeys.length > 0 && (
                   <div>
                      <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2 flex items-center">
                        <Layers className="w-3 h-3 mr-1.5" /> Attributes
                      </h4>
                      <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                        {displayKeys.slice(0, 20).map((key) => {
                           const valBefore = before ? before[key] : undefined;
                           const valAfter = after ? after[key] : undefined;

                           if (valAfter === undefined && valBefore === undefined) return null;

                           const hasChanged = valBefore !== valAfter && valBefore !== undefined;

                           return (
                             <div key={key} className="flex flex-col border-b border-gray-50 dark:border-gray-700/50 last:border-0 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <span className="font-mono text-gray-500 dark:text-gray-400 font-semibold text-xs mb-1 truncate" title={key}>{key}</span>
                                <div className="flex items-center space-x-2 text-xs overflow-hidden">
                                  {hasChanged && (
                                     <div className="flex items-center space-x-1 shrink-0 max-w-[45%]">
                                      <span className="text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded truncate w-full decoration-slice line-through opacity-70" title={formatValue(valBefore)}>
                                          {formatValue(valBefore)}
                                      </span>
                                      <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                                     </div>
                                  )}
                                  <span className={clsx(
                                      "px-1.5 py-0.5 rounded truncate max-w-full",
                                      hasChanged
                                        ? "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 font-medium"
                                        : "text-gray-700 dark:text-gray-300"
                                    )} title={formatValue(valAfter)}>
                                      {formatValue(valAfter)}
                                  </span>
                                </div>
                             </div>
                           );
                        })}
                        {displayKeys.length > 20 && (
                            <div className="p-2 text-center text-xs text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/30">
                              + {displayKeys.length - 20} more attributes
                            </div>
                        )}
                      </div>
                   </div>
                 )}
              </div>
            ) : (
              <div className="relative h-full group/json">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(details || node.data, null, 2))}
                  className="absolute right-2 top-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-gray-300 opacity-0 group-hover/json:opacity-100 transition-opacity z-10"
                  title="Copy JSON"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono border border-gray-700 min-h-full custom-scrollbar">
                  {JSON.stringify(details || node.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
