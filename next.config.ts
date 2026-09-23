import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sidebar now has member avatar + logout controls in the bottom-left corner
  // (see src/components/Sidebar.tsx); move the dev indicator so they don't overlap.
  devIndicators: {
    position: "bottom-right",
  },
  // Don't regenerate AGENTS.md / CLAUDE.md on every `next dev` run.
  agentRules: false,
};

export default nextConfig;
