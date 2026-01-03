'use client';

interface SampleSelectorProps {
  onSelect: (sample: 'insecure' | 'basic' | 'secure') => void;
}

export default function SampleSelector({ onSelect }: SampleSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-gray-400 text-sm">Try a sample:</span>
      <button
        onClick={() => onSelect('insecure')}
        className="px-3 py-1 text-sm bg-red-900/30 text-red-400 rounded-full hover:bg-red-900/50 transition-colors"
      >
        Insecure Example
      </button>
      <button
        onClick={() => onSelect('basic')}
        className="px-3 py-1 text-sm bg-yellow-900/30 text-yellow-400 rounded-full hover:bg-yellow-900/50 transition-colors"
      >
        Basic Example
      </button>
      <button
        onClick={() => onSelect('secure')}
        className="px-3 py-1 text-sm bg-green-900/30 text-green-400 rounded-full hover:bg-green-900/50 transition-colors"
      >
        Secure Example
      </button>
    </div>
  );
}
