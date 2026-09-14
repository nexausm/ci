import type { NextConfig } from "next";

export default function nextConfig(phase: string): NextConfig {
  return {
    ...(phase === "phase-production-build"
      ? { output: "export" as const }
      : {}),
    images: { unoptimized: true },
    turbopack: { root: __dirname },
  };
}
