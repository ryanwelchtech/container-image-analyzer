'use client';

import { useState, useEffect } from 'react';

interface DockerfileEditorProps {
  value: string;
  onChange: (value: string) => void;
  highlightedLines?: number[];
}

export default function DockerfileEditor({ value, onChange, highlightedLines = [] }: DockerfileEditorProps) {
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(Math.max(lines, 10));
  }, [value]);

  const lines = value.split('\n');

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-gray-400 text-sm font-mono">Dockerfile</span>
      </div>

      <div className="flex">
        <div className="select-none text-right pr-4 py-4 bg-gray-850 border-r border-gray-700 text-gray-500 font-mono text-sm">
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className={`px-2 ${highlightedLines.includes(i + 1) ? 'bg-red-900/50 text-red-400' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none min-h-[300px]"
          placeholder="Paste your Dockerfile here..."
          spellCheck={false}
          style={{ lineHeight: '1.5rem' }}
        />
      </div>
    </div>
  );
}
