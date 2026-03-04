import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicUpdatesPage() {
  let updates: {
    id: string;
    title: string;
    message: string;
    createdAt: Date;
    coach: { name: string };
  }[] = [];

  try {
    updates = await prisma.update.findMany({
      orderBy: { createdAt: "desc" },
      include: { coach: { select: { name: true } } },
      take: 20,
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
            <h1 className="font-bold">Team Updates</h1>
            <p className="text-xs text-white/70">Speedy Cheetahs</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {updates.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No updates yet.</p>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-muted" />
                  <span className="font-medium text-sm">{update.title}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.message}</p>
                <p className="text-xs text-muted mt-2">
                  {update.coach.name} &middot; {formatDateTime(update.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
