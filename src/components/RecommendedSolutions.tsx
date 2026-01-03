'use client';

import { useState } from 'react';
import { AnalysisSummary } from '@/lib/analyzer';

interface RecommendedSolutionsProps {
  summary: AnalysisSummary | null;
  originalDockerfile: string;
}

export default function RecommendedSolutions({ summary, originalDockerfile }: RecommendedSolutionsProps) {
  const [activeTab, setActiveTab] = useState<'issues' | 'solutions' | 'fixed'>('issues');

  if (!summary || summary.results.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recommended Solutions</h3>
        <div className="text-gray-400 text-sm text-center py-8">
          No issues detected. Your Dockerfile looks good!
        </div>
      </div>
    );
  }

  const generateFixedDockerfile = (): string => {
    const lines = originalDockerfile.split('\n');
    let fixed = [...lines];
    const issues = summary.results;

    // Apply automatic fixes based on detected issues
    let hasUser = fixed.some(line => /^USER\s+(?!root)/i.test(line.trim()));
    let hasHealthcheck = fixed.some(line => /^HEALTHCHECK/i.test(line.trim()));
    let hasWorkdir = fixed.some(line => /^WORKDIR/i.test(line.trim()));
    let hasLabel = fixed.some(line => /^LABEL.*maintainer/i.test(line.trim()));

    // Fix 1: Replace :latest with specific version
    fixed = fixed.map(line => {
      if (/^FROM\s+node:latest/i.test(line)) {
        return line.replace(':latest', ':20.10.0-alpine');
      }
      if (/^FROM\s+python:latest/i.test(line)) {
        return line.replace(':latest', ':3.11-alpine');
      }
      if (/^FROM\s+(\w+):latest/i.test(line)) {
        return line.replace(':latest', ':stable');
      }
      if (/^FROM\s+([^:@\s]+)\s*$/i.test(line)) {
        const match = line.match(/^FROM\s+([^:@\s]+)/i);
        if (match) {
          return `FROM ${match[1]}:stable`;
        }
      }
      return line;
    });

    // Fix 2: Remove hardcoded secrets
    fixed = fixed.filter(line => {
      const hasSecret = /password\s*[=:]\s*['"]\w+['"]/i.test(line) ||
                       /api[_-]?key\s*[=:]\s*['"]\w+['"]/i.test(line) ||
                       /secret\s*[=:]\s*['"]\w+['"]/i.test(line);
      return !hasSecret;
    });

    // Fix 3: Convert shell form to exec form
    fixed = fixed.map(line => {
      if (/^CMD\s+node\s+/i.test(line)) {
        const parts = line.trim().split(/\s+/).slice(1);
        return `CMD ["${parts.join('", "')}"]`;
      }
      if (/^ENTRYPOINT\s+(?!\[)/i.test(line)) {
        const parts = line.trim().split(/\s+/).slice(1);
        return `ENTRYPOINT ["${parts.join('", "')}"]`;
      }
      return line;
    });

    // Fix 4: Add WORKDIR if missing
    if (!hasWorkdir) {
      const fromIndex = fixed.findIndex(line => /^FROM/i.test(line.trim()));
      if (fromIndex !== -1) {
        fixed.splice(fromIndex + 1, 0, 'WORKDIR /app');
      }
    }

    // Fix 5: Add USER if missing
    if (!hasUser) {
      const cmdIndex = fixed.findIndex(line => /^(CMD|ENTRYPOINT)/i.test(line.trim()));
      if (cmdIndex !== -1) {
        fixed.splice(cmdIndex, 0, 'RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup');
        fixed.splice(cmdIndex + 1, 0, 'USER appuser');
      }
    }

    // Fix 6: Add HEALTHCHECK if missing
    if (!hasHealthcheck) {
      const cmdIndex = fixed.findIndex(line => /^(CMD|ENTRYPOINT)/i.test(line.trim()));
      if (cmdIndex !== -1) {
        fixed.splice(cmdIndex, 0, 'HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1');
      }
    }

    // Fix 7: Add LABEL maintainer if missing
    if (!hasLabel) {
      const fromIndex = fixed.findIndex(line => /^FROM/i.test(line.trim()));
      if (fromIndex !== -1) {
        fixed.splice(fromIndex + 1, 0, 'LABEL maintainer="developer@example.com"');
      }
    }

    // Fix 8: Clean up apt-get/apk
    fixed = fixed.map(line => {
      if (/apt-get install/i.test(line) && !/rm -rf \/var\/lib\/apt/.test(line)) {
        return line + ' && rm -rf /var/lib/apt/lists/*';
      }
      if (/apk add/i.test(line) && !/--no-cache/.test(line)) {
        return line.replace('apk add', 'apk add --no-cache');
      }
      return line;
    });

    return fixed.filter(line => line.trim() !== '').join('\n');
  };

  const criticalIssues = summary.results.filter(r => r.severity === 'critical');
  const highIssues = summary.results.filter(r => r.severity === 'high');
  const mediumIssues = summary.results.filter(r => r.severity === 'medium');
  const lowIssues = summary.results.filter(r => r.severity === 'low');

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'issues'
              ? 'bg-gray-700 text-white border-b-2 border-cyan-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-750'
          }`}
        >
          Issues ({summary.results.length})
        </button>
        <button
          onClick={() => setActiveTab('solutions')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'solutions'
              ? 'bg-gray-700 text-white border-b-2 border-cyan-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-750'
          }`}
        >
          Solutions
        </button>
        <button
          onClick={() => setActiveTab('fixed')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'fixed'
              ? 'bg-gray-700 text-white border-b-2 border-cyan-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-750'
          }`}
        >
          Fixed Dockerfile
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'issues' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              Found {summary.results.length} issues. Grade: <span className={`font-bold ${
                summary.grade === 'A' ? 'text-green-400' :
                summary.grade === 'B' ? 'text-blue-400' :
                summary.grade === 'C' ? 'text-yellow-400' :
                summary.grade === 'D' ? 'text-orange-400' : 'text-red-400'
              }`}>{summary.grade}</span>
            </div>

            {criticalIssues.length > 0 && (
              <div>
                <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Critical ({criticalIssues.length})
                </h4>
                <ul className="space-y-1 text-sm text-gray-300 ml-4">
                  {criticalIssues.map(issue => (
                    <li key={issue.id}>• {issue.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {highIssues.length > 0 && (
              <div>
                <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  High ({highIssues.length})
                </h4>
                <ul className="space-y-1 text-sm text-gray-300 ml-4">
                  {highIssues.map(issue => (
                    <li key={issue.id}>• {issue.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {mediumIssues.length > 0 && (
              <div>
                <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Medium ({mediumIssues.length})
                </h4>
                <ul className="space-y-1 text-sm text-gray-300 ml-4">
                  {mediumIssues.map(issue => (
                    <li key={issue.id}>• {issue.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {lowIssues.length > 0 && (
              <div>
                <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Low & Info ({lowIssues.length})
                </h4>
                <ul className="space-y-1 text-sm text-gray-300 ml-4">
                  {lowIssues.map(issue => (
                    <li key={issue.id}>• {issue.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              Top recommendations to improve your security score:
            </div>

            <div className="space-y-3">
              {summary.results.slice(0, 10).map((issue, idx) => (
                <div key={issue.id} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      issue.severity === 'critical' ? 'bg-red-500' :
                      issue.severity === 'high' ? 'bg-orange-500' :
                      issue.severity === 'medium' ? 'bg-yellow-500' :
                      issue.severity === 'low' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white font-medium mb-1">{issue.title}</h5>
                      <p className="text-gray-400 text-xs mb-2">{issue.description}</p>
                      <div className="bg-gray-900 rounded px-3 py-2 text-xs text-cyan-400 font-mono">
                        {issue.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {summary.results.length > 10 && (
              <div className="text-center text-sm text-gray-500 pt-2">
                Showing top 10 recommendations. View all issues in the Issues tab.
              </div>
            )}
          </div>
        )}

        {activeTab === 'fixed' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              Automatically generated Dockerfile with common fixes applied:
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
                <code>{generateFixedDockerfile()}</code>
              </pre>
            </div>
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-4 text-sm text-blue-200">
              <strong>Note:</strong> This is an automated fix. Please review and test before using in production.
              Some issues may require manual intervention (e.g., removing secrets, adjusting ports, etc.).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
