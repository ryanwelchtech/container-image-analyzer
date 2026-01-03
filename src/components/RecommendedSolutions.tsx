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
    const issueIds = new Set(summary.results.map(r => r.id));

    // Check current state
    let hasUser = fixed.some(line => /^USER\s+(?!root)/i.test(line.trim()));
    let hasHealthcheck = fixed.some(line => /^HEALTHCHECK/i.test(line.trim()));
    let hasWorkdir = fixed.some(line => /^WORKDIR/i.test(line.trim()));
    let hasMaintainerLabel = fixed.some(line => /^LABEL.*maintainer/i.test(line.trim()));
    let hasOCILabels = fixed.some(line => /^LABEL.*org\.opencontainers\.image/i.test(line.trim()));

    // Fix DL003: Replace :latest with specific version
    if (issueIds.has('DL003')) {
      fixed = fixed.map(line => {
        if (/^FROM\s+node:latest/i.test(line)) {
          return 'FROM node:20.10.0-alpine';
        }
        if (/^FROM\s+python:latest/i.test(line)) {
          return 'FROM python:3.11-alpine';
        }
        if (/^FROM\s+([^:@\s]+):latest/i.test(line)) {
          return line.replace(':latest', ':stable-alpine');
        }
        if (/^FROM\s+([^:@\s]+)\s*$/i.test(line)) {
          const match = line.match(/^FROM\s+([^:@\s]+)/i);
          if (match && !line.includes('AS')) {
            return `FROM ${match[1]}:stable-alpine`;
          }
        }
        return line;
      });
    }

    // Fix DL002: Remove hardcoded secrets
    if (issueIds.has('DL002')) {
      fixed = fixed.filter(line => {
        const hasSecret = /password\s*[=:]\s*['"]\w+['"]/i.test(line) ||
                         /api[_-]?key\s*[=:]\s*['"]\w+['"]/i.test(line) ||
                         /secret\s*[=:]\s*['"]\w+['"]/i.test(line);
        return !hasSecret;
      });
    }

    // Fix DL019: Convert shell form to exec form
    if (issueIds.has('DL019')) {
      fixed = fixed.map(line => {
        const trimmed = line.trim();
        if (/^CMD\s+(?!\[)/.test(trimmed)) {
          const parts = trimmed.split(/\s+/).slice(1);
          return `CMD ["${parts.join('", "')}"]`;
        }
        if (/^ENTRYPOINT\s+(?!\[)/.test(trimmed)) {
          const parts = trimmed.split(/\s+/).slice(1);
          return `ENTRYPOINT ["${parts.join('", "')}"]`;
        }
        return line;
      });
    }

    // Fix DL008: Add WORKDIR if missing
    if (issueIds.has('DL008') && !hasWorkdir) {
      const fromIndex = fixed.findIndex(line => /^FROM/i.test(line.trim()));
      if (fromIndex !== -1) {
        fixed.splice(fromIndex + 1, 0, '', 'WORKDIR /app');
      }
    }

    // Fix DL009: Replace wildcard COPY with specific paths
    if (issueIds.has('DL009') || issueIds.has('DL026')) {
      fixed = fixed.map(line => {
        if (/^COPY\s+\.\s+\./.test(line.trim())) {
          return line.replace('COPY . .', 'COPY src/ ./src/\nCOPY package*.json ./');
        }
        return line;
      });
    }

    // Fix DL006: Add package cleanup
    if (issueIds.has('DL006')) {
      fixed = fixed.map(line => {
        if (/apt-get install/i.test(line) && !/rm -rf \/var\/lib\/apt/.test(line)) {
          return line.trimEnd() + ' && rm -rf /var/lib/apt/lists/*';
        }
        if (/apk add/i.test(line) && !/--no-cache/.test(line)) {
          return line.replace(/apk add/i, 'apk add --no-cache');
        }
        return line;
      });
    }

    // Fix DL001: Add USER if missing
    if (issueIds.has('DL001') && !hasUser) {
      const cmdIndex = fixed.findIndex(line => /^(CMD|ENTRYPOINT)/i.test(line.trim()));
      if (cmdIndex !== -1) {
        fixed.splice(cmdIndex, 0, '', 'RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup', 'USER appuser');
      }
    }

    // Fix DL004: Add HEALTHCHECK if missing
    if (issueIds.has('DL004') && !hasHealthcheck) {
      const cmdIndex = fixed.findIndex(line => /^(CMD|ENTRYPOINT)/i.test(line.trim()));
      if (cmdIndex !== -1) {
        const portMatch = fixed.find(line => /^EXPOSE\s+(\d+)/.test(line.trim()));
        const port = portMatch ? portMatch.match(/^EXPOSE\s+(\d+)/)?.[1] : '3000';
        fixed.splice(cmdIndex, 0, `HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:${port}/health || exit 1`);
      }
    }

    // Fix DL012/DL013: Add LABEL maintainer
    if ((issueIds.has('DL012') || issueIds.has('DL013')) && !hasMaintainerLabel) {
      const workdirIndex = fixed.findIndex(line => /^WORKDIR/i.test(line.trim()));
      const insertIndex = workdirIndex !== -1 ? workdirIndex : 1;
      fixed.splice(insertIndex, 0, 'LABEL maintainer="security@example.com"');
    }

    // Fix DL031: Add OCI labels
    if (issueIds.has('DL031') && !hasOCILabels) {
      const labelIndex = fixed.findIndex(line => /^LABEL/i.test(line.trim()));
      if (labelIndex !== -1) {
        fixed.splice(labelIndex + 1, 0,
          'LABEL org.opencontainers.image.source="https://github.com/example/app"',
          'LABEL org.opencontainers.image.version="1.0.0"',
          'LABEL org.opencontainers.image.created="2026-01-03T00:00:00Z"'
        );
      }
    }

    // Fix DL014: Combine multiple RUN commands
    if (issueIds.has('DL014')) {
      let inRunSequence = false;
      let runCommands: string[] = [];
      const combined: string[] = [];

      for (let i = 0; i < fixed.length; i++) {
        const line = fixed[i].trim();
        if (/^RUN\s+/.test(line) && !/addgroup|adduser/.test(line)) {
          runCommands.push(line.replace(/^RUN\s+/, '').trim());
          inRunSequence = true;
        } else {
          if (inRunSequence && runCommands.length > 0) {
            combined.push(`RUN ${runCommands.join(' && \\\n    ')}`);
            runCommands = [];
            inRunSequence = false;
          }
          combined.push(fixed[i]);
        }
      }
      if (runCommands.length > 0) {
        combined.push(`RUN ${runCommands.join(' && \\\n    ')}`);
      }
      fixed = combined;
    }

    // Clean up empty lines and format
    return fixed
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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
