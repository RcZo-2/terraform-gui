import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Package } from 'lucide-react';

export default function GroupNode({ data }: NodeProps) {
    return (
        <div className="group-node flex flex-col items-center justify-start pt-2 w-full h-full min-w-[200px] min-h-[100px]">
            <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 pointer-events-none mb-4 z-10">
                <Package className="w-4 h-4 text-gray-500" />
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {data.label}
                </div>
            </div>
        </div>
    );
}
