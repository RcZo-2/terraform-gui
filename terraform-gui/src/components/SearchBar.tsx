'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  nodes: { id: string; label: string; type: string }[];
  onSelect: (nodeId: string) => void;
}

export default function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; label: string; type: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = nodes.filter((node) =>
      node.label.toLowerCase().includes(lowerQuery) ||
      node.id.toLowerCase().includes(lowerQuery) ||
      (node.type && node.type.toLowerCase().includes(lowerQuery))
    );
    setResults(filtered.slice(0, 10)); // Limit to 10 results
  }, [query, nodes]);

  const handleSelect = (nodeId: string) => {
    onSelect(nodeId);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md pointer-events-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full p-2.5 pl-10 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white/95 backdrop-blur-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800/95 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 shadow-md transition-shadow focus:shadow-lg"
          placeholder="Search resources..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-xl dark:bg-gray-800 dark:divide-gray-700 max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5">
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white text-left transition-colors flex flex-col"
                  onClick={() => handleSelect(result.id)}
                >
                  <span className="font-medium truncate">{result.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{result.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
