import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getUpcomingEvents() {
  try {
    return await prisma.event.findMany({
      where: { date: { gte: new Date() }, isCancelled: false },
      orderBy: { date: "asc" },
      take: 5,
    });
  } catch {
    return [];
  }
}

async function getRecentUpdates() {
  try {
    return await prisma.update.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { coach: { select: { name: true } } },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [events, updates] = await Promise.all([
    getUpcomingEvents(),
    getRecentUpdates(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-secondary text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">&#x1F406;</div>
          <h1 className="text-4xl font-bold mb-2">Speedy Cheetahs</h1>
          <p className="text-white/80 text-lg">Farm-1 Coach Pitch Baseball</p>
          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <Link
              href="/schedule"
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              View Schedule
            </Link>
            <Link
              href="/volunteer"
              className="px-5 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
            >
              Volunteer Sign-Up
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
            >
              Coach Login
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Upcoming Events */}
        <section>
          <h2 className="text-xl font-bold text-secondary mb-4">
            Upcoming Events
          </h2>
          {events.length === 0 ? (
            <p className="text-muted text-sm">No upcoming events scheduled.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          event.type === "GAME"
                            ? "bg-primary"
                            : event.type === "PRACTICE"
                            ? "bg-blue-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="font-medium text-sm">{event.title}</span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      {formatDateTime(event.date)} &middot;{" "}
                      {event.locationName}
                    </p>
                  </div>
                  <span className="text-xs text-muted uppercase font-medium">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Updates */}
        <section>
          <h2 className="text-xl font-bold text-secondary mb-4">
            Recent Updates
          </h2>
          {updates.length === 0 ? (
            <p className="text-muted text-sm">No updates yet.</p>
          ) : (
            <div className="space-y-3">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="bg-surface border border-border rounded-lg p-4"
                >
                  <h3 className="font-medium text-sm">{update.title}</h3>
                  <p className="text-sm text-muted mt-1 whitespace-pre-wrap">
                    {update.message}
                  </p>
                  <p className="text-xs text-muted mt-2">
                    Posted by {update.coach.name} &middot;{" "}
                    {formatDateTime(update.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
