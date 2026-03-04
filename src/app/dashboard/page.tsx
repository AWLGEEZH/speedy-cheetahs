"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CoachLayout } from "@/components/layout/coach-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
    <CoachLayout>
      <h1 className="text-xl lg:text-2xl font-bold text-secondary mb-6">
        Dashboard
      </h1>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/roster">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 py-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.players ?? 0}</div>
                    <div className="text-xs text-muted">Players</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/schedule">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 py-4">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.upcomingEvents.length ?? 0}</div>
                    <div className="text-xs text-muted">Upcoming</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/updates">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 py-4">
                  <Megaphone className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.recentUpdates.length ?? 0}</div>
                    <div className="text-xs text-muted">Updates</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/gameday">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 py-4">
                  <Gamepad2 className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">Go</div>
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
                  <div key={event.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <span className="font-medium text-sm">{event.title}</span>
                      <p className="text-xs text-muted">
                        {formatDateTime(event.date)} &middot; {event.locationName}
                      </p>
                    </div>
                    <Badge variant={event.type === "GAME" ? "warning" : "info"}>
                      {event.type}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </CoachLayout>
  );
}
