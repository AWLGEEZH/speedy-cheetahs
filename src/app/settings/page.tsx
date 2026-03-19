"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { UserCog, Plus, Trash2, Key, Shield, Edit2, RotateCcw, Bell, Lock } from "lucide-react";

interface Coach {
  id: string;
  name: string;
  email: string;
  role: "HEAD" | "ASSISTANT";
  phone?: string | null;
  chatNotifyEmail?: boolean;
}

function SettingsContent() {
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Add coach form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachEmail, setNewCoachEmail] = useState("");
  const [newCoachPassword, setNewCoachPassword] = useState("");
  const [newCoachPhone, setNewCoachPhone] = useState("");
  const [addingCoach, setAddingCoach] = useState(false);

  // Edit coach form
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [editCoachForm, setEditCoachForm] = useState({ name: "", email: "", phone: "" });
  const [savingCoach, setSavingCoach] = useState(false);

  // Reset password form
  const [resetCoach, setResetCoach] = useState<Coach | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  // Registration code
  const [registrationCode, setRegistrationCode] = useState("");
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [savingCode, setSavingCode] = useState(false);

  const { addToast } = useToast();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/coaches").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
    ])
      .then(([me, coachList, team]) => {
        setCurrentCoach(me);
        setCoaches(Array.isArray(coachList) ? coachList : []);
        if (team?.registrationCode) {
          setRegistrationCode(team.registrationCode);
          setSavedCode(team.registrationCode);
        }
      })
      .catch(() => {
        addToast("Failed to load settings data", "error");
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        addToast("Password changed successfully", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to change password", "error");
      }
    } catch {
      addToast("Failed to change password", "error");
    } finally {
      setChangingPassword(false);
    }
  }

  async function deleteCoach(id: string, name: string) {
    if (
      !window.confirm(
        `Delete coach "${name}"? Their updates and coaching sessions will also be deleted.`
      )
    )
      return;

    const res = await fetch(`/api/coaches/${id}`, { method: "DELETE" });
    if (res.ok) {
      addToast("Coach deleted", "success");
      setCoaches((prev) => prev.filter((c) => c.id !== id));
      if (editingCoach?.id === id) setEditingCoach(null);
    } else {
      const data = await res.json();
      addToast(data.error || "Failed to delete coach", "error");
    }
  }

  async function handleAddCoach(e: React.FormEvent) {
    e.preventDefault();
    if (coaches.length >= 10) {
      addToast("Maximum of 10 coaches reached", "error");
      return;
    }
    if (newCoachPassword.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }

    setAddingCoach(true);
    try {
      const res = await fetch("/api/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCoachName,
          email: newCoachEmail,
          password: newCoachPassword,
          phone: newCoachPhone || undefined,
        }),
      });
      if (res.ok) {
        const newCoach = await res.json();
        addToast("Coach added successfully", "success");
        setCoaches((prev) => [...prev, newCoach]);
        setNewCoachName("");
        setNewCoachEmail("");
        setNewCoachPassword("");
        setNewCoachPhone("");
        setShowAddForm(false);
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to add coach", "error");
      }
    } catch {
      addToast("Failed to add coach", "error");
    } finally {
      setAddingCoach(false);
    }
  }

  function startEditCoach(coach: Coach) {
    setEditingCoach(coach);
    setEditCoachForm({
      name: coach.name,
      email: coach.email,
      phone: coach.phone || "",
    });
    setShowAddForm(false);
  }

  async function saveCoachEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCoach) return;
    setSavingCoach(true);
    try {
      const res = await fetch(`/api/coaches/${editingCoach.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCoachForm.name,
          email: editCoachForm.email,
          phone: editCoachForm.phone || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCoaches((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        // Also update currentCoach if editing self
        if (currentCoach && currentCoach.id === updated.id) {
          setCurrentCoach(updated);
        }
        setEditingCoach(null);
        addToast("Coach updated", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to update coach", "error");
      }
    } catch {
      addToast("Failed to update coach", "error");
    } finally {
      setSavingCoach(false);
    }
  }

  function startResetPassword(coach: Coach) {
    setResetCoach(coach);
    setResetPassword("");
    setResetConfirm("");
    setEditingCoach(null);
    setShowAddForm(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetCoach) return;
    if (resetPassword.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }
    if (resetPassword !== resetConfirm) {
      addToast("Passwords do not match", "error");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await fetch(`/api/coaches/${resetCoach.id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      });
      if (res.ok) {
        addToast(`Password reset for ${resetCoach.name}`, "success");
        setResetCoach(null);
        setResetPassword("");
        setResetConfirm("");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to reset password", "error");
      }
    } catch {
      addToast("Failed to reset password", "error");
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleSaveRegistrationCode(e: React.FormEvent) {
    e.preventDefault();
    const codeValue = registrationCode.trim() || null;
    if (codeValue && (codeValue.length < 4 || !/^[a-zA-Z0-9]+$/.test(codeValue))) {
      addToast("Code must be at least 4 characters, letters and numbers only", "error");
      return;
    }
    setSavingCode(true);
    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationCode: codeValue }),
      });
      if (res.ok) {
        setSavedCode(codeValue);
        addToast(
          codeValue
            ? "Registration code updated"
            : "Registration code removed — registration is now open",
          "success"
        );
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to update registration code", "error");
      }
    } catch {
      addToast("Failed to update registration code", "error");
    } finally {
      setSavingCode(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader title="Settings" subtitle="Team configuration" />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PageHeader title="Settings" subtitle="Team configuration" />

      <div className="space-y-4">
        {/* 1. Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Change Password</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <Input
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" size="sm" disabled={changingPassword}>
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 2. Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Notifications</h3>
            </div>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={currentCoach?.chatNotifyEmail ?? true}
                onChange={async (e) => {
                  const value = e.target.checked;
                  // Optimistic update
                  setCurrentCoach((prev) =>
                    prev ? { ...prev, chatNotifyEmail: value } : prev
                  );
                  try {
                    const res = await fetch(`/api/coaches/${currentCoach?.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ chatNotifyEmail: value }),
                    });
                    if (!res.ok) {
                      // Revert on failure
                      setCurrentCoach((prev) =>
                        prev ? { ...prev, chatNotifyEmail: !value } : prev
                      );
                      addToast("Failed to update notification preference", "error");
                    }
                  } catch {
                    setCurrentCoach((prev) =>
                      prev ? { ...prev, chatNotifyEmail: !value } : prev
                    );
                    addToast("Failed to update notification preference", "error");
                  }
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">
                Email me when a new chat message is posted
              </span>
            </label>
          </CardContent>
        </Card>

        {/* 3. Registration Security (HEAD only) */}
        {currentCoach?.role === "HEAD" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <div>
                  <h3 className="font-semibold text-sm">Registration Security</h3>
                  <p className="text-xs text-muted">
                    Require an invite code to access the registration page
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveRegistrationCode} className="space-y-3 max-w-md">
                <div>
                  <Input
                    label="Invite Code"
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value)}
                    placeholder="e.g. DIAMONDS2026"
                    maxLength={30}
                  />
                  <p className="text-xs text-muted mt-1">
                    {savedCode
                      ? `Current code: ${savedCode}`
                      : "No code set — registration is currently open to anyone with the link"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" disabled={savingCode}>
                    {savingCode ? "Saving..." : "Save Code"}
                  </Button>
                  {savedCode && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRegistrationCode("");
                      }}
                    >
                      Clear Code
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Share this code with parents so they can register. Letters and numbers only,
                  minimum 4 characters. Clear the code to allow open registration.
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 4. Manage Coaches (HEAD only) */}
        {currentCoach?.role === "HEAD" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <div>
                    <h3 className="font-semibold text-sm">Manage Coaches</h3>
                    <p className="text-xs text-muted">
                      Add, edit, or remove assistant coaches (max 10 total)
                    </p>
                  </div>
                </div>
                {!showAddForm && !editingCoach && coaches.length < 10 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Coach
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coach List */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Phone</th>
                      <th className="pb-2 font-medium w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coaches.map((coach) => (
                      <tr key={coach.id} className="border-b border-border last:border-0">
                        <td className="py-2">{coach.name}</td>
                        <td className="py-2 text-muted">{coach.email}</td>
                        <td className="py-2">
                          <Badge variant={coach.role === "HEAD" ? "info" : "default"}>
                            {coach.role}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted">{coach.phone || "---"}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditCoach(coach)}
                              title="Edit coach"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {coach.role === "ASSISTANT" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startResetPassword(coach)}
                                  title="Reset password"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => deleteCoach(coach.id, coach.name)}
                                  title="Delete coach"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit Coach Form */}
              {editingCoach && (
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Edit2 className="h-4 w-4" /> Edit Coach: {editingCoach.name}
                    <Badge variant={editingCoach.role === "HEAD" ? "info" : "default"}>
                      {editingCoach.role}
                    </Badge>
                  </h4>
                  <form onSubmit={saveCoachEdit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Name"
                        value={editCoachForm.name}
                        onChange={(e) => setEditCoachForm({ ...editCoachForm, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={editCoachForm.email}
                        onChange={(e) => setEditCoachForm({ ...editCoachForm, email: e.target.value })}
                        required
                      />
                      <Input
                        label="Phone (optional)"
                        type="tel"
                        value={editCoachForm.phone}
                        onChange={(e) => setEditCoachForm({ ...editCoachForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={savingCoach}>
                        {savingCoach ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCoach(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Reset Password Form */}
              {resetCoach && (
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset Password: {resetCoach.name}
                  </h4>
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="New Password"
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                      />
                      <Input
                        label="Confirm Password"
                        type="password"
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={resettingPassword}>
                        {resettingPassword ? "Resetting..." : "Reset Password"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setResetCoach(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add Coach Form */}
              {showAddForm && (
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <UserCog className="h-4 w-4" /> New Assistant Coach
                  </h4>
                  <form onSubmit={handleAddCoach} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Name"
                        value={newCoachName}
                        onChange={(e) => setNewCoachName(e.target.value)}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={newCoachEmail}
                        onChange={(e) => setNewCoachEmail(e.target.value)}
                        required
                      />
                      <Input
                        label="Password"
                        type="password"
                        value={newCoachPassword}
                        onChange={(e) => setNewCoachPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                      />
                      <Input
                        label="Phone (optional)"
                        type="tel"
                        value={newCoachPhone}
                        onChange={(e) => setNewCoachPhone(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={addingCoach}>
                        <Plus className="h-4 w-4 mr-1" />
                        {addingCoach ? "Adding..." : "Add Coach"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewCoachName("");
                          setNewCoachEmail("");
                          setNewCoachPassword("");
                          setNewCoachPhone("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                  {coaches.length >= 10 && (
                    <p className="text-sm text-danger">
                      Maximum of 10 coaches reached. Remove a coach before adding another.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. Family Portal Links */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">Family Portal Links</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted block mb-1">Schedule Page</label>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                {baseUrl}/schedule
              </code>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Volunteer Sign-Up</label>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                {baseUrl}/volunteer
              </code>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Updates Feed</label>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                {baseUrl}/updates
              </code>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Parent Registration</label>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                {baseUrl}/register
              </code>
            </div>
          </CardContent>
        </Card>

        {/* 4. Configuration Info */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">SMS Configuration</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Configure your Twilio credentials in the environment variables:
              TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER or
              TWILIO_MESSAGING_SERVICE_SID.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">AI Features</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Configure your Anthropic API key in the environment variable ANTHROPIC_API_KEY
              to enable rules AI chat and coaching recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  );
}
