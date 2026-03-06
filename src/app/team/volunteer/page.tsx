"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, HandHelping, UserPlus, X } from "lucide-react";

interface VolunteerRole {
  id: string;
  name: string;
  description: string | null;
  slotsNeeded: number;
  event: { id: string; title: string; date: string; type: string };
  signups: { id: string; family: { id: string; parentName: string } }[];
}

const STORAGE_KEY = "speedy-cheetahs-volunteer";

function VolunteerContent() {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const { addToast } = useToast();

  // Load saved info from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { name, phone } = JSON.parse(saved);
        if (name) setFamilyName(name);
        if (phone) setFamilyPhone(phone);
      }
    } catch { /* ignore */ }
  }, []);

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

  function handleTapRole(roleId: string) {
    if (signingUp === roleId) {
      setSigningUp(null);
    } else {
      setSigningUp(roleId);
    }
  }

  async function handleSignup(roleId: string) {
    if (!familyName.trim()) {
      addToast("Please enter your name", "error");
      return;
    }
    if (!familyPhone.trim()) {
      addToast("Please enter your phone number", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Create or find family
      const familyRes = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentName: familyName.trim(), phone: familyPhone.trim() }),
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
        // Save name/phone for future signups
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: familyName.trim(), phone: familyPhone.trim() }));
        } catch { /* ignore */ }

        // Reload roles
        const rolesRes = await fetch("/api/volunteer/roles");
        setRoles(await rolesRes.json());
        setSigningUp(null);
        addToast("You're signed up! Thank you!", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to sign up", "error");
      }
    } catch {
      addToast("Failed to sign up. Please try again.", "error");
    } finally {
      setSubmitting(false);
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
        {/* Helper text */}
        <div className="flex items-center gap-2 text-sm text-muted bg-surface border border-border rounded-lg px-4 py-3">
          <HandHelping className="h-5 w-5 shrink-0 text-primary" />
          <span>Tap any open role below to sign up. Your info is saved for future signups.</span>
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
                    const isExpanded = signingUp === role.id;

                    return (
                      <div key={role.id}>
                        {/* Role row — tappable if not full */}
                        <button
                          type="button"
                          onClick={() => !isFull && handleTapRole(role.id)}
                          disabled={isFull}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isFull
                              ? "opacity-70 cursor-default"
                              : isExpanded
                                ? "bg-primary/5"
                                : "hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{role.name}</span>
                                {!isFull && !isExpanded && (
                                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                                )}
                              </div>
                              {role.description && (
                                <p className="text-xs text-muted">{role.description}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={isFull ? "success" : "warning"}>
                                {role.signups.length}/{role.slotsNeeded} filled
                              </Badge>
                            </div>
                          </div>
                          {/* Show who's signed up */}
                          {role.signups.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {role.signups.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                >
                                  {s.family.parentName}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>

                        {/* Inline sign-up form */}
                        {isExpanded && (
                          <div className="px-4 pb-4 bg-primary/5 border-t border-primary/20">
                            <div className="pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                  Sign up for {role.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSigningUp(null)}
                                  className="text-muted hover:text-foreground p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                  label="Your Name"
                                  value={familyName}
                                  onChange={(e) => setFamilyName(e.target.value)}
                                  placeholder="Parent/Guardian name"
                                  required
                                />
                                <Input
                                  label="Phone Number"
                                  type="tel"
                                  value={familyPhone}
                                  onChange={(e) => setFamilyPhone(e.target.value)}
                                  placeholder="(555) 123-4567"
                                  required
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSignup(role.id)}
                                disabled={submitting}
                                className="w-full sm:w-auto"
                              >
                                {submitting ? "Signing up..." : "Sign Up"}
                              </Button>
                            </div>
                          </div>
                        )}
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
