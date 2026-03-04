"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { CoachLayout } from "@/components/layout/coach-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { usePolling } from "@/hooks/use-polling";
import { cn, formatDateTime } from "@/lib/utils";
import { FIELD_POSITIONS } from "@/lib/constants";
import type { PlayerWithFamily, BattingEntryWithPlayer, FieldingEntryWithPlayer } from "@/types";
import { Users, ListOrdered, Diamond, ChevronRight, Undo2, Plus, CircleDot } from "lucide-react";

type Tab = "attendance" | "batting" | "fielding";

interface GameEvent {
  id: string;
  title: string;
  date: string;
  opponent: string | null;
  locationName: string;
}

interface AttendanceRsvp {
  id: string;
  playerId: string;
  status: string;
  player: { id: string; firstName: string; lastName: string; jerseyNumber: number | null };
}

function GameDayContent() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [tab, setTab] = useState<Tab>("attendance");
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [players, setPlayers] = useState<PlayerWithFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [eRes, pRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch("/api/players"),
        ]);
        setEvent(await eRes.json());
        setPlayers(await pRes.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [eventId]);

  if (loading) {
    return (
      <CoachLayout>
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <PageHeader
        title={event?.title || "Game Day"}
        subtitle={event ? `${formatDateTime(event.date)} - ${event.locationName}` : ""}
        backHref="/gameday"
      />

      {/* Tab bar - large touch targets for mobile */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {([
          { key: "attendance" as Tab, label: "Attendance", icon: Users },
          { key: "batting" as Tab, label: "Batting", icon: ListOrdered },
          { key: "fielding" as Tab, label: "Fielding", icon: Diamond },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-md text-sm font-medium transition-colors",
              tab === key ? "bg-white shadow-sm text-secondary" : "text-muted"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "attendance" && <AttendanceTab eventId={eventId} players={players} addToast={addToast} />}
      {tab === "batting" && <BattingTab eventId={eventId} players={players} addToast={addToast} />}
      {tab === "fielding" && <FieldingTab eventId={eventId} players={players} addToast={addToast} />}
    </CoachLayout>
  );
}

// ─── ATTENDANCE TAB ────────────────────────────
function AttendanceTab({
  eventId,
  players,
  addToast,
}: {
  eventId: string;
  players: PlayerWithFamily[];
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}) {
  const fetchAttendance = useCallback(
    () => fetch(`/api/gameday/${eventId}/attendance`).then((r) => r.json()),
    [eventId]
  );
  const { data: rsvps, refresh } = usePolling<AttendanceRsvp[]>(fetchAttendance, 10000);

  async function toggleAttendance(playerId: string, familyId: string, currentStatus: string) {
    const newStatus = currentStatus === "CONFIRMED" ? "DECLINED" : "CONFIRMED";
    await fetch(`/api/gameday/${eventId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, familyId, status: newStatus }),
    });
    refresh();
    addToast(`Marked ${newStatus.toLowerCase()}`, "success");
  }

  const confirmed = rsvps?.filter((r) => r.status === "CONFIRMED").length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <span className="font-semibold text-sm">Player Attendance</span>
          <Badge variant="info">{confirmed}/{players.length} confirmed</Badge>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {players.map((player) => {
          const rsvp = rsvps?.find((r) => r.playerId === player.id);
          const status = rsvp?.status || "PENDING";
          return (
            <div key={player.id} className="flex items-center justify-between py-3">
              <div>
                <span className="text-sm font-medium">
                  {player.jerseyNumber != null && `#${player.jerseyNumber} `}
                  {player.firstName} {player.lastName}
                </span>
              </div>
              <button
                onClick={() => toggleAttendance(player.id, player.familyId, status)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium min-w-[90px] transition-colors",
                  status === "CONFIRMED" && "bg-green-100 text-green-800",
                  status === "DECLINED" && "bg-red-100 text-red-800",
                  status === "PENDING" && "bg-gray-100 text-gray-600"
                )}
              >
                {status === "CONFIRMED" ? "Present" : status === "DECLINED" ? "Absent" : "Pending"}
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── BATTING TAB ───────────────────────────────
function BattingTab({
  eventId,
  players,
  addToast,
}: {
  eventId: string;
  players: PlayerWithFamily[];
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}) {
  const [battingEntries, setBattingEntries] = useState<BattingEntryWithPlayer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadBatting = useCallback(async () => {
    const res = await fetch(`/api/gameday/${eventId}/batting`);
    const data = await res.json();
    if (data.gameState?.battingEntries?.length > 0) {
      setBattingEntries(data.gameState.battingEntries);
      setCurrentIndex(data.gameState.currentBatterIndex);
      setInitialized(true);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadBatting(); }, [loadBatting]);

  async function initializeLineup() {
    const playerOrder = players.map((p) => p.id);
    const res = await fetch(`/api/gameday/${eventId}/batting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerOrder }),
    });
    if (res.ok) {
      await loadBatting();
      addToast("Batting lineup set", "success");
    }
  }

  async function advanceBatter(action: "NEXT_BATTER" | "UNDO") {
    // Optimistic update
    if (action === "NEXT_BATTER") {
      setBattingEntries((prev) => {
        const updated = [...prev];
        if (updated[currentIndex]) {
          updated[currentIndex] = { ...updated[currentIndex], atBatCount: updated[currentIndex].atBatCount + 1, currentAtBat: false };
        }
        const nextIdx = (currentIndex + 1) % updated.length;
        if (updated[nextIdx]) {
          updated[nextIdx] = { ...updated[nextIdx], currentAtBat: true };
        }
        return updated;
      });
      setCurrentIndex((prev) => (prev + 1) % battingEntries.length);
    }

    const res = await fetch(`/api/gameday/${eventId}/batting`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setBattingEntries(data.gameState.battingEntries);
      setCurrentIndex(data.gameState.currentBatterIndex);
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (!initialized) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ListOrdered className="h-12 w-12 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted mb-4">Set up the batting lineup to start tracking.</p>
          <Button onClick={initializeLineup} size="lg">
            <Plus className="h-4 w-4 mr-2" /> Initialize Batting Lineup
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentBatter = battingEntries[currentIndex];
  const onDeckIndex = (currentIndex + 1) % battingEntries.length;
  const onDeckBatter = battingEntries[onDeckIndex];

  return (
    <div className="space-y-4">
      {/* Current batter - large display */}
      <Card className="border-primary border-2">
        <CardContent className="py-5 text-center">
          <p className="text-xs text-primary font-medium uppercase mb-1">Now Batting</p>
          <p className="text-2xl font-bold text-secondary">
            {currentBatter?.player.jerseyNumber != null && `#${currentBatter.player.jerseyNumber} `}
            {currentBatter?.player.firstName} {currentBatter?.player.lastName}
          </p>
          <p className="text-sm text-muted mt-1">
            At-bat #{(currentBatter?.atBatCount ?? 0) + 1} &middot; Order #{currentBatter?.battingOrder}
          </p>
        </CardContent>
      </Card>

      {/* On deck */}
      <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
        <span className="text-xs text-muted">On Deck: </span>
        <span className="text-sm font-medium">
          {onDeckBatter?.player.firstName} {onDeckBatter?.player.lastName}
        </span>
      </div>

      {/* Action buttons - big touch targets */}
      <div className="flex gap-3">
        <Button
          onClick={() => advanceBatter("NEXT_BATTER")}
          size="xl"
          className="flex-1"
        >
          <ChevronRight className="h-5 w-5 mr-2" /> Next Batter
        </Button>
        <Button
          onClick={() => advanceBatter("UNDO")}
          variant="outline"
          size="xl"
          className="w-20"
        >
          <Undo2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Full lineup list */}
      <Card>
        <CardHeader><span className="font-semibold text-sm">Full Lineup</span></CardHeader>
        <CardContent className="divide-y divide-border max-h-[40vh] overflow-y-auto scrollbar-thin">
          {battingEntries.map((entry, idx) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center justify-between py-2.5 px-1",
                idx === currentIndex && "bg-yellow-50 -mx-1 px-2 rounded",
                idx === onDeckIndex && "bg-blue-50/50 -mx-1 px-2 rounded"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted w-5">{entry.battingOrder}</span>
                {idx === currentIndex && <CircleDot className="h-3 w-3 text-primary" />}
                <span className="text-sm">
                  {entry.player.jerseyNumber != null && `#${entry.player.jerseyNumber} `}
                  {entry.player.firstName} {entry.player.lastName}
                </span>
              </div>
              <Badge variant={entry.atBatCount > 0 ? "success" : "default"}>
                {entry.atBatCount} AB
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FIELDING TAB ──────────────────────────────
function FieldingTab({
  eventId,
  players,
  addToast,
}: {
  eventId: string;
  players: PlayerWithFamily[];
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}) {
  const [fieldingEntries, setFieldingEntries] = useState<FieldingEntryWithPlayer[]>([]);
  const [currentInning, setCurrentInning] = useState(1);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadFielding = useCallback(async () => {
    const res = await fetch(`/api/gameday/${eventId}/fielding`);
    const data = await res.json();
    if (data.gameState) {
      setFieldingEntries(data.gameState.fieldingEntries || []);
      setCurrentInning(data.gameState.currentInning || 1);
      // Load current inning assignments
      const currentEntries = (data.gameState.fieldingEntries || []).filter(
        (e: FieldingEntryWithPlayer) => e.inning === (data.gameState.currentInning || 1)
      );
      const assgn: Record<string, string> = {};
      currentEntries.forEach((e: FieldingEntryWithPlayer) => {
        assgn[e.playerId] = e.position;
      });
      setAssignments(assgn);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadFielding(); }, [loadFielding]);

  function assignPosition(playerId: string, position: string) {
    setAssignments((prev) => ({ ...prev, [playerId]: position }));
  }

  async function saveFielding() {
    const assignmentList = Object.entries(assignments).map(([playerId, position]) => ({
      playerId,
      position,
    }));

    const res = await fetch(`/api/gameday/${eventId}/fielding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inning: currentInning, assignments: assignmentList }),
    });

    if (res.ok) {
      await loadFielding();
      addToast(`Inning ${currentInning} positions saved`, "success");
    }
  }

  async function recordOut() {
    const res = await fetch(`/api/gameday/${eventId}/fielding`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inning: currentInning }),
    });
    if (res.ok) {
      await loadFielding();
      addToast("Out recorded", "success");
    }
  }

  function nextInning() {
    setCurrentInning((prev) => prev + 1);
    setAssignments({});
  }

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  // Calculate per-player stats
  const playerStats = players.map((p) => {
    const entries = fieldingEntries.filter((e) => e.playerId === p.id);
    const totalOuts = entries.reduce((sum, e) => sum + e.outsRecorded, 0);
    const positions = [...new Set(entries.map((e) => e.position).filter((pos) => pos !== "BENCH"))];
    const innings = entries.filter((e) => e.position !== "BENCH").length;
    return { ...p, totalOuts, positions, innings };
  });

  return (
    <div className="space-y-4">
      {/* Inning indicator */}
      <div className="flex items-center justify-between bg-secondary text-white rounded-lg px-4 py-3">
        <span className="font-bold">Inning {currentInning}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={recordOut}>
            Record Out
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={nextInning}>
            Next Inning
          </Button>
        </div>
      </div>

      {/* Position assignments */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <span className="font-semibold text-sm">Field Positions - Inning {currentInning}</span>
            <Button size="sm" onClick={saveFielding}>Save Positions</Button>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border max-h-[50vh] overflow-y-auto scrollbar-thin">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between py-2.5">
              <span className="text-sm font-medium min-w-[120px]">
                {player.jerseyNumber != null && `#${player.jerseyNumber} `}
                {player.firstName} {player.lastName[0]}.
              </span>
              <select
                value={assignments[player.id] || "BENCH"}
                onChange={(e) => assignPosition(player.id, e.target.value)}
                className="text-xs px-2 py-1.5 border border-border rounded bg-white min-w-[100px]"
              >
                {FIELD_POSITIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>{pos.short} - {pos.label}</option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Player stats summary */}
      <Card>
        <CardHeader><span className="font-semibold text-sm">Player Field Stats</span></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <th className="pb-2">Player</th>
                  <th className="pb-2 text-center">Innings</th>
                  <th className="pb-2 text-center">Outs</th>
                  <th className="pb-2">Positions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {playerStats.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-medium">
                      {p.firstName} {p.lastName[0]}.
                    </td>
                    <td className="py-2 text-center">{p.innings}</td>
                    <td className="py-2 text-center">{p.totalOuts}</td>
                    <td className="py-2">
                      <div className="flex gap-1 flex-wrap">
                        {p.positions.length === 0 ? (
                          <span className="text-xs text-muted">-</span>
                        ) : (
                          p.positions.map((pos) => {
                            const posInfo = FIELD_POSITIONS.find((fp) => fp.value === pos);
                            return (
                              <Badge key={pos} variant="info">
                                {posInfo?.short || pos}
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GameDayPage() {
  return <ToastProvider><GameDayContent /></ToastProvider>;
}
