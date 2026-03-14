import Link from "next/link";
import { Calendar, UserPlus, HandHelping, LogIn } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime, buildEventLabels } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";

export const dynamic = "force-dynamic";

async function getAllEvents() {
  try {
    return await prisma.event.findMany({
      where: { isCancelled: false },
      orderBy: { date: "asc" },
      select: { id: true, title: true, type: true, date: true, locationName: true },
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
  const [allEvents, updates] = await Promise.all([
    getAllEvents(),
    getRecentUpdates(),
  ]);

  // Compute numbered labels from ALL events, then filter to upcoming 5 for display
  const eventLabels = buildEventLabels(allEvents);
  const now = new Date();
  const events = allEvents.filter((e) => new Date(e.date) >= now).slice(0, 5);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-hero-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div className="flex justify-center mb-4">
            <TeamLogo size="xl" />
          </div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Speedy Cheetahs</h1>
          <p className="text-white/70 text-lg">Farm-1 Coach Pitch Baseball</p>
          <div className="w-12 h-0.5 bg-primary mx-auto mt-4 mb-8 rounded-full" />
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <Link
              href="/schedule"
              className="flex flex-col items-center gap-2 px-4 py-5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark hover:scale-[1.03] transition-all duration-200 text-center shadow-lg shadow-primary/20"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">View Schedule</span>
            </Link>
            <Link
              href="/register"
              className="flex flex-col items-center gap-2 px-4 py-5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark hover:scale-[1.03] transition-all duration-200 text-center shadow-lg shadow-primary/20"
            >
              <UserPlus className="h-6 w-6" />
              <span className="text-sm">Parent Registration</span>
            </Link>
            <Link
              href="/volunteer"
              className="flex flex-col items-center gap-2 px-4 py-5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 hover:scale-[1.03] transition-all duration-200 text-center backdrop-blur-sm"
            >
              <HandHelping className="h-6 w-6" />
              <span className="text-sm">Volunteer Sign-Up</span>
            </Link>
            <Link
              href="/login"
              className="flex flex-col items-center gap-2 px-4 py-5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 hover:scale-[1.03] transition-all duration-200 text-center backdrop-blur-sm"
            >
              <LogIn className="h-6 w-6" />
              <span className="text-sm">Coach Login</span>
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
                  <span className="text-xs text-muted font-medium whitespace-nowrap">
                    {eventLabels.get(event.id) ?? event.type}
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
                  {update.imageUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={update.imageUrl}
                        alt={update.title}
                        className="max-w-full max-h-48 rounded-lg border border-border object-contain"
                      />
                    </div>
                  )}
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
