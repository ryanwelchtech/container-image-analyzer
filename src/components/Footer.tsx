'use client';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            Built by{' '}
            <a
              href="https://ryanwelchtech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ryan Welch
            </a>
            {' '}&bull;{' '}
            <a
              href="https://github.com/ryanwelchtech/container-image-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              View Source
            </a>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>32 Security Rules</span>
            <span>&bull;</span>
            <span>Client-Side Analysis</span>
            <span>&bull;</span>
            <span>No Data Stored</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
