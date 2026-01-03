'use client';

import { AnalysisSummary } from '@/lib/analyzer';

interface ScoreDisplayProps {
  summary: AnalysisSummary | null;
}

export default function ScoreDisplay({ summary }: ScoreDisplayProps) {
  if (!summary) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center">
        <div className="text-6xl font-bold text-gray-600">--</div>
        <div className="text-gray-500 mt-2">Paste a Dockerfile to analyze</div>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-green-500';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      default: return 'text-red-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'stroke-green-400';
    if (score >= 80) return 'stroke-green-500';
    if (score >= 70) return 'stroke-yellow-400';
    if (score >= 60) return 'stroke-orange-400';
    return 'stroke-red-500';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (summary.score / 100) * circumference;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Security Score</h2>
        <span className={`text-4xl font-bold ${getGradeColor(summary.grade)}`}>
          {summary.grade}
        </span>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={`${getScoreColor(summary.score)} transition-all duration-500`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{summary.score}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 text-center text-sm">
        <div className="bg-red-900/30 rounded-lg p-2">
          <div className="text-red-400 font-bold text-lg">{summary.stats.critical}</div>
          <div className="text-red-400/70 text-xs">Critical</div>
        </div>
        <div className="bg-orange-900/30 rounded-lg p-2">
          <div className="text-orange-400 font-bold text-lg">{summary.stats.high}</div>
          <div className="text-orange-400/70 text-xs">High</div>
        </div>
        <div className="bg-yellow-900/30 rounded-lg p-2">
          <div className="text-yellow-400 font-bold text-lg">{summary.stats.medium}</div>
          <div className="text-yellow-400/70 text-xs">Medium</div>
        </div>
        <div className="bg-blue-900/30 rounded-lg p-2">
          <div className="text-blue-400 font-bold text-lg">{summary.stats.low}</div>
          <div className="text-blue-400/70 text-xs">Low</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <div className="text-gray-400 font-bold text-lg">{summary.stats.info}</div>
          <div className="text-gray-400/70 text-xs">Info</div>
        </div>
      </div>
    </div>
  );
}
