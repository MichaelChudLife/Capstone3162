import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Sidebar now has member avatar + logout controls in the bottom-left corner
  // (see src/components/Sidebar.tsx); move the dev indicator so they don't overlap.
  devIndicators: {
    position: "bottom-right",
  },
  // Don't regenerate AGENTS.md / CLAUDE.md on every `next dev` run.
  agentRules: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
