"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTime, cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  locationName: string;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  familyId: string;
}

interface Rsvp {
  playerId: string;
  status: string;
}

function AttendanceContent() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [eRes, pRes, rRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch("/api/players"),
          fetch(`/api/gameday/${eventId}/attendance`),
        ]);
        setEvent(await eRes.json());
        setPlayers(await pRes.json());
        setRsvps(await rRes.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [eventId]);

  async function rsvp(playerId: string, familyId: string, status: "CONFIRMED" | "DECLINED") {
    const res = await fetch(`/api/gameday/${eventId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, familyId, status }),
    });
    if (res.ok) {
      setRsvps((prev) => {
        const filtered = prev.filter((r) => r.playerId !== playerId);
        return [...filtered, { playerId, status }];
      });
      addToast(status === "CONFIRMED" ? "Confirmed!" : "Marked as absent", "success");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="hover:bg-white/10 p-1 rounded">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold">{event?.title || "Game"}</h1>
            <p className="text-xs text-white/70">
              {event && formatDateTime(event.date)} &middot; {event?.locationName}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="font-semibold text-sm mb-4">RSVP for your player</h2>
        <div className="space-y-2">
          {players.map((player) => {
            const currentRsvp = rsvps.find((r) => r.playerId === player.id);
            return (
              <div
                key={player.id}
                className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <span className="text-sm font-medium">
                  {player.jerseyNumber != null && `#${player.jerseyNumber} `}
                  {player.firstName} {player.lastName}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={currentRsvp?.status === "CONFIRMED" ? "primary" : "outline"}
                    onClick={() => rsvp(player.id, player.familyId, "CONFIRMED")}
                    className={cn(currentRsvp?.status === "CONFIRMED" && "bg-success")}
                  >
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant={currentRsvp?.status === "DECLINED" ? "danger" : "outline"}
                    onClick={() => rsvp(player.id, player.familyId, "DECLINED")}
                  >
                    No
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PublicGameDayPage() {
  return <ToastProvider><AttendanceContent /></ToastProvider>;
}
