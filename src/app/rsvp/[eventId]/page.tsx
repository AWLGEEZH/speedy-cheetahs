"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTime, cn } from "@/lib/utils";

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
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-secondary">{event?.title || "Game"}</h1>
        <p className="text-sm text-muted">
          {event && formatDateTime(event.date)} &middot; {event?.locationName}
        </p>
      </div>

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
  );
}

export default function RsvpPage() {
  return <ToastProvider><AttendanceContent /></ToastProvider>;
}
