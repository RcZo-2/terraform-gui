import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Plus, Trash2, Edit3, Circle, Database, Server, Globe, Lock } from 'lucide-react';
import { clsx } from 'clsx';

const CustomNode = ({ data, selected }: NodeProps) => {
  const { label, resourceType, action } = data;

  const getIcon = () => {
    switch (action) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'update':
        return <Edit3 className="w-4 h-4 text-yellow-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getBorderColor = () => {
    if (selected) return 'border-blue-500 ring-2 ring-blue-200';
    switch (action) {
      case 'create':
        return 'border-green-200 bg-green-50';
      case 'delete':
        return 'border-red-200 bg-red-50';
      case 'update':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  // Helper to guess icon for resource type (optional, for visual flair)
  const getResourceIcon = () => {
    if (resourceType.includes('instance')) return <Server className="w-5 h-5 text-gray-500" />;
    if (resourceType.includes('db')) return <Database className="w-5 h-5 text-gray-500" />;
    if (resourceType.includes('vpc') || resourceType.includes('subnet')) return <Globe className="w-5 h-5 text-gray-500" />;
    if (resourceType.includes('security')) return <Lock className="w-5 h-5 text-gray-500" />;
    return null;
  };

  return (
    <div className={clsx(
      "px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] transition-all",
      getBorderColor()
    )}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="flex items-center">
        <div className="mr-3 p-2 bg-white rounded-full border border-gray-100 shadow-sm">
          {getResourceIcon() || <div className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-mono">{resourceType}</div>
          <div className="text-sm font-bold text-gray-800">{label}</div>
        </div>
        <div className="ml-2">
           {getIcon()}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
};

export default memo(CustomNode);
