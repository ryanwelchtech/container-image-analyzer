'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DockerfileEditor from '@/components/DockerfileEditor';
import ScoreDisplay from '@/components/ScoreDisplay';
import ResultsList from '@/components/ResultsList';
import SampleSelector from '@/components/SampleSelector';
import RecommendedSolutions from '@/components/RecommendedSolutions';
import { analyzeDockerfile, sampleDockerfiles, AnalysisSummary } from '@/lib/analyzer';

export default function Home() {
  const [dockerfile, setDockerfile] = useState('');
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (dockerfile.trim()) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        const result = analyzeDockerfile(dockerfile);
        setSummary(result);
        setIsAnalyzing(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSummary(null);
    }
  }, [dockerfile]);

  const handleSampleSelect = (sample: 'insecure' | 'basic' | 'secure') => {
    setDockerfile(sampleDockerfiles[sample]);
  };

  const highlightedLines = summary?.results
    .filter(r => r.line)
    .map(r => r.line as number) || [];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            Analyze Your Dockerfile for Security Issues
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Paste your Dockerfile below to get instant feedback on security vulnerabilities,
            best practice violations, and recommendations for improvement.
          </p>
        </div>

        <div className="mb-4">
          <SampleSelector onSelect={handleSampleSelect} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DockerfileEditor
              value={dockerfile}
              onChange={setDockerfile}
              highlightedLines={highlightedLines}
            />

            {dockerfile.trim() && (
              <div className="lg:hidden">
                <ScoreDisplay summary={summary} />
              </div>
            )}

            {summary && (
              <>
                <RecommendedSolutions summary={summary} originalDockerfile={dockerfile} />
                <ResultsList results={summary.results} />
              </>
            )}

            {!dockerfile.trim() && (
              <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">Paste your Dockerfile to begin analysis</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Or try one of the sample Dockerfiles above
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block space-y-6">
            <ScoreDisplay summary={summary} />

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Security Checks</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Root user detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Hardcoded secrets
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Latest tag usage
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Health check presence
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  ADD vs COPY usage
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Package cache cleanup
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Multi-stage builds
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  WORKDIR configuration
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Layer optimization
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Best practices
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-sm text-gray-400">
                All analysis happens in your browser. Your Dockerfile is never sent to any server
                or stored anywhere.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
