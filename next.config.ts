import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  async redirects() {
    return [
      { source: "/team/schedule", destination: "/schedule", permanent: true },
      { source: "/team/updates", destination: "/updates", permanent: true },
      { source: "/team/volunteer", destination: "/volunteer", permanent: true },
      { source: "/team/register", destination: "/register", permanent: true },
      { source: "/team/privacy", destination: "/privacy", permanent: true },
      { source: "/team/terms", destination: "/terms", permanent: true },
      { source: "/team/gameday/:eventId", destination: "/rsvp/:eventId", permanent: true },
    ];
  },
};

export default nextConfig;
