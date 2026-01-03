import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Container Image Analyzer | Dockerfile Security Scanner",
  description: "Analyze your Dockerfile for security vulnerabilities, best practice violations, and get actionable recommendations. Free, client-side, privacy-focused.",
  keywords: ["Dockerfile", "Docker", "security", "container", "DevSecOps", "scanner", "analyzer"],
  authors: [{ name: "Ryan Welch", url: "https://ryanwelchtech.com" }],
  openGraph: {
    title: "Container Image Analyzer",
    description: "Free Dockerfile security scanner with instant feedback on vulnerabilities and best practices.",
    type: "website",
    url: "https://container-image-analyzer.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Container Image Analyzer",
    description: "Free Dockerfile security scanner with instant feedback on vulnerabilities and best practices.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
