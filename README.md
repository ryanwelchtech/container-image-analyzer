# Container Image Analyzer

A client-side Dockerfile security scanner that provides instant feedback on vulnerabilities, best practice violations, and actionable recommendations.

🔗 **[Live Demo](https://container-image-analyzer.vercel.app/)** | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ryanwelchtech/container-image-analyzer)

## Features

- **32 Security Rules** - Comprehensive checks for common Dockerfile security issues
- **Real-time Analysis** - Instant feedback as you type
- **Privacy-First** - All analysis happens in your browser, no data sent to servers
- **Actionable Recommendations** - Clear guidance on how to fix each issue
- **Security Scoring** - Grade-based scoring system (A-F) with severity breakdown
- **Recommended Solutions** - Interactive tab showing issues, solutions, and auto-generated fixes

## Security Checks

| Severity | Count | Examples |
|----------|-------|----------|
| Critical | 6 | Running as root, hardcoded secrets, :latest tag, ARG for secrets, shell form CMD/ENTRYPOINT, privileged ports |
| High | 8 | No HEALTHCHECK, ADD vs COPY, package cleanup, sudo usage, unpinned versions, separate apt update, missing pipefail |
| Medium | 8 | Missing WORKDIR, wildcard COPY, no multi-stage build, unverified downloads, unnecessary packages, no .dockerignore |
| Low | 6 | Missing maintainer, deprecated MAINTAINER, multiple RUN layers, apt -y flag, security labels, ENV references |
| Info | 4 | Non-Alpine base, missing EXPOSE, no OCI labels, consider distroless |

## Architecture

```mermaid
graph TB
    subgraph Browser
        UI[React UI]
        Editor[Dockerfile Editor]
        Analyzer[Security Rules Engine]
        Results[Results Display]
    end

    User([User]) --> Editor
    Editor --> Analyzer
    Analyzer --> Results
    Results --> UI
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ryanwelchtech/container-image-analyzer.git
cd container-image-analyzer

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Deploy with default settings

Or use the one-click deploy button above.

## Sample Dockerfiles

The application includes three sample Dockerfiles to demonstrate the analyzer:

- **Insecure Example** (Grade: F, 0-20%) - Multiple critical and high severity issues including :latest tag, hardcoded secrets, shell form CMD, no USER, no HEALTHCHECK
- **Basic Example** (Grade: C-D, 60-75%) - Basic security practices with HEALTHCHECK, USER, and pinned versions but missing multi-stage builds and some optimizations
- **Secure Example** (Grade: A, 95%+) - Follows best practices with multi-stage builds, Alpine base, non-root user, HEALTHCHECK, OCI labels, and specific COPY paths

## Security Rules Reference

### Critical (25 points each)
- **DL001**: Running as root user
- **DL002**: Secrets or credentials in Dockerfile
- **DL003**: Using :latest tag
- **DL018**: Using ARG for secrets
- **DL019**: Using shell form for CMD/ENTRYPOINT
- **DL020**: Privileged port exposure without dropping privileges

### High (15 points each)
- **DL004**: No HEALTHCHECK defined
- **DL005**: Using ADD instead of COPY
- **DL006**: apt-get/apk without cleanup
- **DL007**: Using sudo in container
- **DL021**: Package versions not pinned
- **DL022**: apt-get update run separately
- **DL023**: Missing pipefail for shell scripts
- **DL024**: COPY from untrusted source

### Medium (8 points each)
- **DL008**: Missing WORKDIR instruction
- **DL009**: COPY with wildcard
- **DL010**: Not using multi-stage build
- **DL011**: Using curl/wget without verification
- **DL025**: Installing unnecessary packages
- **DL026**: Missing .dockerignore reference
- **DL027**: Not using --chown in COPY
- **DL028**: Using absolute paths without WORKDIR

### Low (3 points each)
- **DL012**: Missing LABEL maintainer
- **DL013**: Using deprecated MAINTAINER
- **DL014**: Multiple RUN instructions
- **DL015**: apt-get without -y flag
- **DL029**: Missing security labels
- **DL030**: Setting environment without explicit values

### Info (1 point each)
- **DL016**: Consider using Alpine base image
- **DL017**: No EXPOSE instruction
- **DL031**: No build-time metadata labels
- **DL032**: Consider using distroless base

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-rule`)
3. Commit your changes (`git commit -m 'Add new security rule'`)
4. Push to the branch (`git push origin feature/new-rule`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Ryan Welch** - Cloud & Systems Security Engineer

- Website: [ryanwelchtech.com](https://ryanwelchtech.com)
- GitHub: [@ryanwelchtech](https://github.com/ryanwelchtech)
- LinkedIn: [Ryan Welch](https://linkedin.com/in/ryanwelchtech)
