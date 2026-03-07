"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/lib/utils";
import { Gamepad2 } from "lucide-react";

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
        <div className="space-y-3">
          {games.map((game) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
