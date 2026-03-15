import Link from "next/link";
import { Calendar, UserPlus, HandHelping, LogIn } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatRelative, buildEventLabels } from "@/lib/utils";
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
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return await prisma.update.findMany({
      where: { createdAt: { gte: oneWeekAgo } },
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-secondary">
              Upcoming Events
            </h2>
            <Link href="/schedule" className="text-xs text-primary font-medium hover:underline">
              View all &rarr;
            </Link>
          </div>
          {events.length === 0 ? (
            <p className="text-muted text-sm">No upcoming events scheduled.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-lg p-4 flex items-center justify-between border-l-4 ${
                    event.type === "GAME"
                      ? "bg-amber-50 border-l-primary border border-amber-200"
                      : event.type === "PRACTICE"
                      ? "bg-blue-50 border-l-blue-500 border border-blue-200"
                      : "bg-surface border-l-gray-400 border border-border"
                  }`}
                >
                  <div>
                    <span className="font-medium text-sm">{event.title}</span>
                    <p className="text-xs text-muted mt-1">
                      {formatDateTime(event.date)} &middot;{" "}
                      {event.locationName}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${
                    event.type === "GAME"
                      ? "text-primary"
                      : event.type === "PRACTICE"
                      ? "text-blue-600"
                      : "text-muted"
                  }`}>
                    {eventLabels.get(event.id) ?? event.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Updates */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-secondary">
              Recent Updates
            </h2>
            <Link href="/updates" className="text-xs text-primary font-medium hover:underline">
              View all &rarr;
            </Link>
          </div>
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
                    {update.coach.name} &middot;{" "}
                    {formatRelative(update.createdAt)}
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
