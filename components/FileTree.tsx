
import React, { useState } from 'react';
import { FileNode } from '../types';

interface FileTreeProps {
  nodes: FileNode[];
  onSelectFile: (node: FileNode) => void;
  selectedPath?: string;
  level?: number;
}

const FileTree: React.FC<FileTreeProps> = ({ nodes, onSelectFile, selectedPath, level = 0 }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setExpandedFolders(newSet);
  };

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'tree' ? -1 : 1;
  });

  return (
    <div className="flex flex-col gap-1">
      {sortedNodes.map((node) => (
        <div key={node.path}>
          <button
            onClick={() => node.type === 'tree' ? toggleFolder(node.path) : onSelectFile(node)}
            className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 hover:bg-slate-700 transition-colors ${
              selectedPath === node.path ? 'bg-indigo-600 text-white' : 'text-slate-300'
            }`}
            style={{ paddingLeft: `${(level + 1) * 12}px` }}
          >
            <span className="opacity-70">
              {node.type === 'tree' ? (
                expandedFolders.has(node.path) ? '📂' : '📁'
              ) : '📄'}
            </span>
            <span className="truncate">{node.name}</span>
          </button>
          
          {node.type === 'tree' && expandedFolders.has(node.path) && node.children && (
            <FileTree 
              nodes={node.children} 
              onSelectFile={onSelectFile} 
              selectedPath={selectedPath}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default FileTree;
