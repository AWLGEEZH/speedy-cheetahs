"use client";

import { CoachLayout } from "@/components/layout/coach-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <CoachLayout>
      <PageHeader title="Settings" subtitle="Team configuration" />

      <div className="space-y-4">
        <Card>
          <CardHeader><h3 className="font-semibold text-sm">Family Portal Links</h3></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted block mb-1">Schedule Page</label>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                {baseUrl}/team/schedule
              </code>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Volunteer Sign-Up</label>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                {baseUrl}/team/volunteer
              </code>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Updates Feed</label>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                {baseUrl}/team/updates
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-sm">SMS Configuration</h3></CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Configure your Twilio credentials in the environment variables:
              TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER or
              TWILIO_MESSAGING_SERVICE_SID.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-sm">AI Features</h3></CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Configure your Anthropic API key in the environment variable ANTHROPIC_API_KEY
              to enable rules AI chat and coaching recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
}
