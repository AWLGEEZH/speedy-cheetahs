"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, groupEventsByPeriod } from "@/lib/utils";
import { Gamepad2, ChevronRight, ChevronDown } from "lucide-react";

interface GameEvent {
  id: string;
  title: string;
  date: string;
  locationName: string;
  opponent: string | null;
  type: string;
  gameState?: { status: string } | null;
}

export default function GameDaySelectPage() {
  const [games, setGames] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events?type=GAME");
        const events = await res.json();
        setGames(Array.isArray(events) ? events : []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const grouped = useMemo(() => groupEventsByPeriod(games), [games]);
  const upcomingGroups = useMemo(() => grouped.filter((g) => g.label !== "Past"), [grouped]);
  const pastGroup = useMemo(() => grouped.find((g) => g.label === "Past"), [grouped]);

  function renderGameCard(game: GameEvent) {
    return (
      <Link key={game.id} href={`/gameday/${game.id}`}>
        <Card className="hover:shadow-md transition-shadow mb-3">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <span className="font-medium">{game.title}</span>
              <p className="text-xs text-muted mt-1">
                {formatDateTime(game.date)} &middot; {game.locationName}
              </p>
            </div>
            <Badge
              variant={
                game.gameState?.status === "IN_PROGRESS"
                  ? "success"
                  : game.gameState?.status === "COMPLETED"
                  ? "default"
                  : "warning"
              }
            >
              {game.gameState?.status === "IN_PROGRESS"
                ? "Live"
                : game.gameState?.status === "COMPLETED"
                ? "Done"
                : "Not Started"}
            </Badge>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PageHeader title="Game Day" subtitle="Select a game to manage" />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : games.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="h-12 w-12 text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">No games scheduled yet. Create a game in the Schedule page first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingGroups.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{group.label}</h3>
              <div className="space-y-3">
                {group.events.map((game) => renderGameCard(game))}
              </div>
            </div>
          ))}

          {pastGroup && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowPast(!showPast)}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground font-medium mb-3"
              >
                {showPast ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Past Games ({pastGroup.events.length})
              </button>
              {showPast && (
                <div className="space-y-3 opacity-70">
                  {pastGroup.events.map((game) => renderGameCard(game))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
