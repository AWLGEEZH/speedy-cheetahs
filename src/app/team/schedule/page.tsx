import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicSchedulePage() {
  let events: {
    id: string;
    type: string;
    title: string;
    date: Date;
    endTime: Date | null;
    locationName: string;
    locationAddress: string | null;
    isCancelled: boolean;
    notes: string | null;
    opponent: string | null;
  }[] = [];

  try {
    events = await prisma.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
    });
  } catch { /* DB not ready */ }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="hover:bg-white/10 p-1 rounded">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold">Speedy Cheetahs Schedule</h1>
            <p className="text-xs text-white/70">Farm-1 Coach Pitch</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {events.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No upcoming events.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={`bg-surface border border-border rounded-lg p-4 ${
                  event.isCancelled ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      event.type === "GAME" ? "bg-primary" : "bg-blue-500"
                    }`}
                  />
                  <span className="font-medium text-sm">{event.title}</span>
                  {event.isCancelled && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      Cancelled
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">{formatDateTime(event.date)}</p>
                <p className="text-sm text-muted flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {event.locationName}
                  {event.locationAddress && ` - ${event.locationAddress}`}
                </p>
                {event.notes && (
                  <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                    {event.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
