"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDateTime, cn } from "@/lib/utils";

const STORAGE_KEY = "speedy-cheetahs-rsvp";

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

interface FamilyLookup {
  id: string;
  parentName: string;
  players: Player[];
}

interface Rsvp {
  playerId: string;
  status: string;
}

function AttendanceContent() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Family lookup state
  const [phone, setPhone] = useState("");
  const [family, setFamily] = useState<FamilyLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  // Load event + existing RSVPs
  useEffect(() => {
    async function load() {
      try {
        const [eRes, rRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/gameday/${eventId}/attendance`),
        ]);
        setEvent(await eRes.json());
        setRsvps(await rRes.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [eventId]);

  // Auto-lookup from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { phone: savedPhone } = JSON.parse(saved);
        if (savedPhone) {
          setPhone(savedPhone);
          lookupFamily(savedPhone);
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookupFamily(phoneValue: string) {
    const trimmed = phoneValue.trim();
    if (!trimmed) return;

    setLookupLoading(true);
    setLookupError("");
    try {
      const res = await fetch(`/api/families/lookup?phone=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data: FamilyLookup = await res.json();
        setFamily(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone: trimmed }));
      } else {
        setLookupError("No family found with that phone number.");
        setFamily(null);
      }
    } catch {
      setLookupError("Lookup failed. Please try again.");
    }
    setLookupLoading(false);
  }

  async function loadAllPlayers() {
    const res = await fetch("/api/players");
    const data: Player[] = await res.json();
    setAllPlayers(data);
    setShowAllPlayers(true);
  }

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

  function resetLookup() {
    setFamily(null);
    setPhone("");
    setLookupError("");
    setShowAllPlayers(false);
    localStorage.removeItem(STORAGE_KEY);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Determine which players to show
  const displayPlayers = family ? family.players : showAllPlayers ? allPlayers : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-secondary">{event?.title || "Game"}</h1>
        <p className="text-sm text-muted">
          {event && formatDateTime(event.date)} &middot; {event?.locationName}
        </p>
      </div>

      {/* Step 1: Phone Lookup (when no family found yet and not showing all) */}
      {!family && !showAllPlayers && (
        <div className="bg-surface border border-border rounded-lg p-6 mb-4">
          <h2 className="font-semibold text-sm mb-1">Find Your Players</h2>
          <p className="text-xs text-muted mb-4">Enter the phone number you registered with.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookupFamily(phone);
            }}
            className="flex gap-2"
          >
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={lookupLoading || !phone.trim()}>
              {lookupLoading ? "Finding..." : "Find"}
            </Button>
          </form>
          {lookupError && (
            <div className="mt-3">
              <p className="text-xs text-red-600 mb-2">{lookupError}</p>
              <button
                onClick={loadAllPlayers}
                className="text-xs text-primary underline hover:no-underline"
              >
                Show all players instead
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Show players and RSVP buttons */}
      {displayPlayers.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">
              {family
                ? `RSVP for ${family.parentName}'s player${family.players.length > 1 ? "s" : ""}`
                : "RSVP for your player"}
            </h2>
            {(family || showAllPlayers) && (
              <button
                onClick={resetLookup}
                className="text-xs text-primary underline hover:no-underline"
              >
                Change
              </button>
            )}
          </div>

          <p className="text-xs text-muted mb-4">
            Responses automatically update Game Day attendance.
          </p>

          <div className="space-y-2">
            {displayPlayers.map((player) => {
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
        </>
      )}
    </div>
  );
}

export default function RsvpPage() {
  return <ToastProvider><AttendanceContent /></ToastProvider>;
}
