export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AnalysisResult {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  line?: number;
  recommendation: string;
}

export interface AnalysisSummary {
  score: number;
  grade: string;
  results: AnalysisResult[];
  stats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

interface Rule {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  check: (lines: string[], dockerfile: string) => number | null;
}

const rules: Rule[] = [
  // Critical Issues
  {
    id: 'DL001',
    severity: 'critical',
    title: 'Running as root user',
    description: 'Container runs as root by default. This is a major security risk as a compromised container could gain host-level privileges.',
    recommendation: 'Add a USER instruction to run as a non-root user: USER 1001 or USER appuser',
    check: (lines, dockerfile) => {
      const hasUser = lines.some(line => /^USER\s+(?!root)/i.test(line.trim()));
      if (!hasUser && lines.some(line => /^FROM/i.test(line.trim()))) {
        return null; // Global issue, no specific line
      }
      return -1; // Pass
    }
  },
  {
    id: 'DL002',
    severity: 'critical',
    title: 'Secrets or credentials in Dockerfile',
    description: 'Hardcoded secrets, passwords, or API keys detected. These will be visible in image layers.',
    recommendation: 'Use build-time secrets with --mount=type=secret or runtime environment variables',
    check: (lines) => {
      const secretPatterns = [
        /password\s*[=:]\s*['"]\w+['"]/i,
        /api[_-]?key\s*[=:]\s*['"]\w+['"]/i,
        /secret\s*[=:]\s*['"]\w+['"]/i,
        /aws[_-]?access[_-]?key/i,
        /aws[_-]?secret/i,
        /private[_-]?key/i,
      ];
      for (let i = 0; i < lines.length; i++) {
        if (secretPatterns.some(pattern => pattern.test(lines[i]))) {
          return i + 1;
        }
      }
      return -1;
    }
  },
  {
    id: 'DL003',
    severity: 'critical',
    title: 'Using latest tag',
    description: 'The :latest tag is mutable and can lead to unpredictable builds and security vulnerabilities.',
    recommendation: 'Pin to a specific version tag (e.g., node:20.10.0-alpine3.19)',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^FROM\s+\S+:latest/i.test(line) || /^FROM\s+[^:@\s]+\s*$/i.test(line)) {
          return i + 1;
        }
      }
      return -1;
    }
  },

  // High Issues
  {
    id: 'DL004',
    severity: 'high',
    title: 'No HEALTHCHECK defined',
    description: 'Container has no health check, making it harder to detect application failures.',
    recommendation: 'Add HEALTHCHECK instruction: HEALTHCHECK --interval=30s CMD curl -f http://localhost/ || exit 1',
    check: (lines) => {
      const hasHealthcheck = lines.some(line => /^HEALTHCHECK/i.test(line.trim()));
      return hasHealthcheck ? -1 : null;
    }
  },
  {
    id: 'DL005',
    severity: 'high',
    title: 'Using ADD instead of COPY',
    description: 'ADD has extra features (URL fetching, auto-extraction) that can introduce security risks.',
    recommendation: 'Use COPY for local files. Only use ADD when you specifically need its features.',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        if (/^ADD\s+(?!--chown)/i.test(lines[i].trim())) {
          return i + 1;
        }
      }
      return -1;
    }
  },
  {
    id: 'DL006',
    severity: 'high',
    title: 'apt-get/apk without cleanup',
    description: 'Package manager cache not cleaned, increasing image size and potential attack surface.',
    recommendation: 'Chain commands and clean up: apt-get update && apt-get install -y pkg && rm -rf /var/lib/apt/lists/*',
    check: (lines, dockerfile) => {
      const hasAptGet = dockerfile.includes('apt-get install') || dockerfile.includes('apt install');
      const hasAptCleanup = dockerfile.includes('rm -rf /var/lib/apt/lists') || dockerfile.includes('apt-get clean');
      const hasApk = dockerfile.includes('apk add');
      const hasApkCleanup = dockerfile.includes('--no-cache') || dockerfile.includes('rm -rf /var/cache/apk');

      if (hasAptGet && !hasAptCleanup) {
        for (let i = 0; i < lines.length; i++) {
          if (/apt-get install|apt install/i.test(lines[i])) return i + 1;
        }
      }
      if (hasApk && !hasApkCleanup) {
        for (let i = 0; i < lines.length; i++) {
          if (/apk add/i.test(lines[i]) && !/--no-cache/.test(lines[i])) return i + 1;
        }
      }
      return -1;
    }
  },
  {
    id: 'DL007',
    severity: 'high',
    title: 'Using sudo in container',
    description: 'sudo usage in containers suggests improper privilege management.',
    recommendation: 'Remove sudo. Switch users with USER instruction or use gosu for entrypoint scripts.',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        if (/\bsudo\b/.test(lines[i])) {
          return i + 1;
        }
      }
      return -1;
    }
  },

  // Medium Issues
  {
    id: 'DL008',
    severity: 'medium',
    title: 'Missing WORKDIR instruction',
    description: 'No WORKDIR set. Commands will run in unpredictable directories.',
    recommendation: 'Set WORKDIR early in Dockerfile: WORKDIR /app',
    check: (lines) => {
      const hasWorkdir = lines.some(line => /^WORKDIR/i.test(line.trim()));
      return hasWorkdir ? -1 : null;
    }
  },
  {
    id: 'DL009',
    severity: 'medium',
    title: 'COPY with wildcard',
    description: 'Using wildcards in COPY may include unintended files (.git, secrets, etc.).',
    recommendation: 'Be specific with COPY paths or use .dockerignore to exclude sensitive files.',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        if (/^COPY\s+.*\*/.test(lines[i].trim()) || /^COPY\s+\.\s+/.test(lines[i].trim())) {
          return i + 1;
        }
      }
      return -1;
    }
  },
  {
    id: 'DL010',
    severity: 'medium',
    title: 'Not using multi-stage build',
    description: 'Single-stage build may include build tools and source code in final image.',
    recommendation: 'Use multi-stage builds to reduce image size and attack surface.',
    check: (lines) => {
      const fromCount = lines.filter(line => /^FROM/i.test(line.trim())).length;
      return fromCount < 2 ? null : -1;
    }
  },
  {
    id: 'DL011',
    severity: 'medium',
    title: 'Using curl/wget without verification',
    description: 'Downloading files without checksum verification can introduce tampered content.',
    recommendation: 'Verify downloaded files: curl -o file.tar.gz URL && echo "CHECKSUM file.tar.gz" | sha256sum -c',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if ((line.includes('curl') || line.includes('wget')) &&
            line.includes('http') &&
            !line.includes('sha256') &&
            !line.includes('md5') &&
            !line.includes('gpg')) {
          return i + 1;
        }
      }
      return -1;
    }
  },

  // Low Issues
  {
    id: 'DL012',
    severity: 'low',
    title: 'Missing LABEL maintainer',
    description: 'No maintainer or author information in the image.',
    recommendation: 'Add LABEL maintainer="name <email>" for traceability.',
    check: (lines) => {
      const hasLabel = lines.some(line =>
        /^LABEL\s+maintainer/i.test(line.trim()) ||
        /^MAINTAINER/i.test(line.trim())
      );
      return hasLabel ? -1 : null;
    }
  },
  {
    id: 'DL013',
    severity: 'low',
    title: 'Using deprecated MAINTAINER',
    description: 'MAINTAINER instruction is deprecated.',
    recommendation: 'Use LABEL maintainer="name <email>" instead.',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        if (/^MAINTAINER/i.test(lines[i].trim())) {
          return i + 1;
        }
      }
      return -1;
    }
  },
  {
    id: 'DL014',
    severity: 'low',
    title: 'Multiple RUN instructions',
    description: 'Many separate RUN commands create extra image layers.',
    recommendation: 'Combine related RUN commands with && to reduce layers.',
    check: (lines) => {
      const runCount = lines.filter(line => /^RUN/i.test(line.trim())).length;
      return runCount > 5 ? null : -1;
    }
  },
  {
    id: 'DL015',
    severity: 'low',
    title: 'apt-get without -y flag',
    description: 'apt-get install without -y may hang waiting for user input.',
    recommendation: 'Use apt-get install -y to auto-confirm installations.',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        if (/apt-get install(?!.*-y)/i.test(lines[i]) && !/--yes/.test(lines[i])) {
          return i + 1;
        }
      }
      return -1;
    }
  },

  // Info
  {
    id: 'DL016',
    severity: 'info',
    title: 'Consider using Alpine base image',
    description: 'Non-Alpine base images are typically larger with more potential vulnerabilities.',
    recommendation: 'Consider using Alpine variants (e.g., node:20-alpine) for smaller, more secure images.',
    check: (lines) => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^FROM/i.test(line) && !line.includes('alpine') && !line.includes('distroless') && !line.includes('scratch')) {
          return i + 1;
        }
      }
      return -1;
    }
  },
  {
    id: 'DL017',
    severity: 'info',
    title: 'No EXPOSE instruction',
    description: 'No ports documented. EXPOSE helps document which ports the container listens on.',
    recommendation: 'Add EXPOSE instruction for documentation: EXPOSE 8080',
    check: (lines) => {
      const hasExpose = lines.some(line => /^EXPOSE/i.test(line.trim()));
      return hasExpose ? -1 : null;
    }
  },
];

export function analyzeDockerfile(dockerfile: string): AnalysisSummary {
  const lines = dockerfile.split('\n');
  const results: AnalysisResult[] = [];

  for (const rule of rules) {
    const lineNumber = rule.check(lines, dockerfile);
    if (lineNumber !== -1) {
      results.push({
        id: rule.id,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        line: lineNumber ?? undefined,
        recommendation: rule.recommendation,
      });
    }
  }

  const stats = {
    critical: results.filter(r => r.severity === 'critical').length,
    high: results.filter(r => r.severity === 'high').length,
    medium: results.filter(r => r.severity === 'medium').length,
    low: results.filter(r => r.severity === 'low').length,
    info: results.filter(r => r.severity === 'info').length,
  };

  // Calculate score (100 - deductions)
  const deductions =
    stats.critical * 25 +
    stats.high * 15 +
    stats.medium * 8 +
    stats.low * 3 +
    stats.info * 1;

  const score = Math.max(0, 100 - deductions);

  const grade =
    score >= 90 ? 'A' :
    score >= 80 ? 'B' :
    score >= 70 ? 'C' :
    score >= 60 ? 'D' : 'F';

  // Sort results by severity
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { score, grade, results, stats };
}

export const sampleDockerfiles = {
  insecure: `FROM node:latest
COPY . .
RUN npm install
RUN npm run build
ENV API_KEY="sk-1234567890abcdef"
CMD ["node", "server.js"]`,

  basic: `FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,

  secure: `FROM node:20.10.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20.10.0-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
LABEL maintainer="developer@example.com"
CMD ["node", "server.js"]`
};
