"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonStatCard, SkeletonEventRow } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { Calendar, Users, Megaphone, Gamepad2 } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    players: number;
    upcomingEvents: { id: string; title: string; type: string; date: string; locationName: string }[];
    recentUpdates: { id: string; title: string; createdAt: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [playersRes, eventsRes, updatesRes] = await Promise.all([
          fetch("/api/players"),
          fetch("/api/events?upcoming=true"),
          fetch("/api/updates"),
        ]);
        const players = await playersRes.json();
        const events = await eventsRes.json();
        const updates = await updatesRes.json();
        setStats({
          players: Array.isArray(players) ? players.length : 0,
          upcomingEvents: Array.isArray(events) ? events.slice(0, 5) : [],
          recentUpdates: Array.isArray(updates) ? updates.slice(0, 3) : [],
        });
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl lg:text-2xl font-bold text-secondary mb-6">
        Dashboard
      </h1>

      {loading ? (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm">
            <div className="px-4 py-3 border-b border-border">
              <div className="skeleton-shimmer h-5 w-36 rounded" />
            </div>
            <div className="px-4 py-3 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonEventRow key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Link href="/roster">
              <Card className="hover:shadow-md border-l-4 border-l-primary">
                <CardContent className="flex items-center gap-2 sm:gap-3 p-3 sm:py-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold">{stats?.players ?? 0}</div>
                    <div className="text-xs text-muted">Players</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/schedule">
              <Card className="hover:shadow-md border-l-4 border-l-blue-500">
                <CardContent className="flex items-center gap-2 sm:gap-3 p-3 sm:py-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold">{stats?.upcomingEvents.length ?? 0}</div>
                    <div className="text-xs text-muted">Upcoming</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/updates">
              <Card className="hover:shadow-md border-l-4 border-l-green-500">
                <CardContent className="flex items-center gap-2 sm:gap-3 p-3 sm:py-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold">{stats?.recentUpdates.length ?? 0}</div>
                    <div className="text-xs text-muted">Updates</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/gameday">
              <Card className="hover:shadow-md border-l-4 border-l-primary">
                <CardContent className="flex items-center gap-2 sm:gap-3 p-3 sm:py-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold">Go</div>
                    <div className="text-xs text-muted">Game Day</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Upcoming Events</h2>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {(stats?.upcomingEvents ?? []).length === 0 ? (
                <p className="text-sm text-muted py-2">No upcoming events</p>
              ) : (
                stats?.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start sm:items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <span className="font-medium text-sm block truncate">{event.title}</span>
                      <p className="text-xs text-muted truncate">
                        {formatDateTime(event.date)} &middot; {event.locationName}
                      </p>
                    </div>
                    <Badge variant={event.type === "GAME" ? "warning" : "info"} className="shrink-0">
                      {event.type}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
