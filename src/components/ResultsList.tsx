'use client';

import { AnalysisResult, Severity } from '@/lib/analyzer';
import { useState } from 'react';

interface ResultsListProps {
  results: AnalysisResult[];
}

const severityConfig: Record<Severity, { bg: string; border: string; text: string; icon: string }> = {
  critical: {
    bg: 'bg-red-900/20',
    border: 'border-red-500',
    text: 'text-red-400',
    icon: '!!',
  },
  high: {
    bg: 'bg-orange-900/20',
    border: 'border-orange-500',
    text: 'text-orange-400',
    icon: '!',
  },
  medium: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    icon: '*',
  },
  low: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500',
    text: 'text-blue-400',
    icon: '-',
  },
  info: {
    bg: 'bg-gray-800',
    border: 'border-gray-600',
    text: 'text-gray-400',
    icon: 'i',
  },
};

export default function ResultsList({ results }: ResultsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-500 rounded-xl p-6 text-center">
        <div className="text-green-400 text-xl font-semibold mb-2">No Issues Found</div>
        <div className="text-green-400/70">Your Dockerfile follows security best practices.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-white mb-4">
        Issues Found ({results.length})
      </h2>
      {results.map((result) => {
        const config = severityConfig[result.severity];
        const isExpanded = expandedId === result.id;

        return (
          <div
            key={result.id}
            className={`${config.bg} border-l-4 ${config.border} rounded-r-lg overflow-hidden transition-all duration-200`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : result.id)}
              className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-white/5 transition-colors"
            >
              <span className={`${config.text} font-mono font-bold text-sm mt-0.5`}>
                [{result.severity.toUpperCase()}]
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{result.title}</span>
                  {result.line && (
                    <span className="text-gray-500 text-sm">Line {result.line}</span>
                  )}
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-700/50">
                <p className="text-gray-300 text-sm mb-3">{result.description}</p>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recommendation</div>
                  <p className="text-green-400 text-sm font-mono">{result.recommendation}</p>
                </div>
                <div className="mt-2 text-xs text-gray-500">Rule ID: {result.id}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
