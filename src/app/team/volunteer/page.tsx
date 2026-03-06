"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Check } from "lucide-react";

interface VolunteerRole {
  id: string;
  name: string;
  description: string | null;
  slotsNeeded: number;
  event: { id: string; title: string; date: string; type: string };
  signups: { id: string; family: { id: string; parentName: string } }[];
}

function VolunteerContent() {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/volunteer/roles");
        setRoles(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSignup(roleId: string) {
    if (!familyName || !familyPhone) {
      addToast("Please enter your name and phone number", "error");
      return;
    }

    // Create or find family
    const familyRes = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentName: familyName, phone: familyPhone }),
    });
    const family = await familyRes.json();

    if (!family.id) {
      addToast("Could not register. Please try again.", "error");
      return;
    }

    const res = await fetch("/api/volunteer/signups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId: family.id, roleId }),
    });

    if (res.ok) {
      // Reload roles
      const rolesRes = await fetch("/api/volunteer/roles");
      setRoles(await rolesRes.json());
      setSigningUp(null);
      addToast("Signed up! Thank you!", "success");
    } else {
      const data = await res.json();
      addToast(data.error || "Failed to sign up", "error");
    }
  }

  // Group by event
  const grouped = roles.reduce<Record<string, VolunteerRole[]>>((acc, role) => {
    const key = `${role.event.title}|||${role.event.date}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(role);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="hover:bg-white/10 p-1 rounded">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold">Volunteer Sign-Up</h1>
            <p className="text-xs text-white/70">Speedy Cheetahs</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Family info collection */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3">Your Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Your Name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Parent/Guardian name"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={familyPhone}
              onChange={(e) => setFamilyPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No volunteer roles available right now.</p>
        ) : (
          Object.entries(grouped).map(([key, eventRoles]) => {
            const [title, dateStr] = key.split("|||");
            return (
              <div key={key} className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-border">
                  <span className="font-semibold text-sm">{title}</span>
                  <span className="text-xs text-muted ml-2">{formatDate(dateStr)}</span>
                </div>
                <div className="divide-y divide-border">
                  {eventRoles.map((role) => {
                    const isFull = role.signups.length >= role.slotsNeeded;
                    return (
                      <div key={role.id} className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-sm font-medium">{role.name}</span>
                            {role.description && (
                              <p className="text-xs text-muted">{role.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant={isFull ? "success" : "warning"}>
                                {role.signups.length}/{role.slotsNeeded} filled
                              </Badge>
                              {role.signups.length > 0 && (
                                <span className="text-xs text-muted">
                                  {role.signups.map((s) => s.family.parentName).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isFull && (
                            <div className="shrink-0">
                              {signingUp === role.id ? (
                                <Button size="sm" onClick={() => handleSignup(role.id)}>
                                  <Check className="h-4 w-4 mr-1" /> Confirm
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setSigningUp(role.id)}>
                                  Sign Up
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function PublicVolunteerPage() {
  return <ToastProvider><VolunteerContent /></ToastProvider>;
}
