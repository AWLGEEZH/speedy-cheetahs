export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-xs text-muted mb-6">Last updated: March 6, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold mb-2">Acceptance of Terms</h2>
            <p>
              By accessing and using the Speedy Cheetahs team management
              platform, you agree to be bound by these Terms and Conditions. If
              you do not agree with any part of these terms, you should not use
              this platform.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Description of Service</h2>
            <p>
              Speedy Cheetahs provides a team management platform for the Speedy
              Cheetahs Farm-1 coach pitch youth baseball team. The platform
              enables coaches and parents to:
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>View and manage team rosters</li>
              <li>Access game and practice schedules</li>
              <li>Receive SMS notifications about team activities</li>
              <li>Sign up for volunteer opportunities</li>
              <li>View team updates and announcements</li>
              <li>Register and update parent/guardian contact information</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">User Accounts</h2>
            <p>
              Coach accounts are created by the head coach and are protected by
              password. You are responsible for maintaining the confidentiality
              of your account credentials and for all activity that occurs under
              your account.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">SMS Notifications</h2>
            <p>
              By opting in to SMS notifications through the parent registration
              page, you consent to receive text messages from the Speedy
              Cheetahs coaching staff. These messages may include:
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Game and practice schedule updates</li>
              <li>Weather-related cancellations or changes</li>
              <li>Team announcements and reminders</li>
              <li>Volunteer coordination messages</li>
            </ul>
            <p className="mt-2">
              Message frequency varies based on team activity. Standard message
              and data rates may apply. You may opt out at any time by
              unchecking the SMS notification option on the parent registration
              page or by contacting the head coach.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>
                Use the platform for any purpose other than Speedy Cheetahs team
                management
              </li>
              <li>
                Provide false or misleading information in your registration
              </li>
              <li>
                Attempt to gain unauthorized access to other users&apos; accounts or
                data
              </li>
              <li>
                Use the platform to send spam, unsolicited messages, or harmful
                content
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Privacy</h2>
            <p>
              Your use of the platform is also governed by our{" "}
              <a href="/team/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              , which describes how we collect, use, and protect your personal
              information.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Disclaimer</h2>
            <p>
              This platform is provided on an &quot;as is&quot; basis for the
              convenience of the Speedy Cheetahs team. We make no warranties
              regarding the availability, accuracy, or reliability of the
              platform. The coaching staff is not liable for any issues arising
              from the use of this platform, including but not limited to missed
              notifications or scheduling errors.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Continued
              use of the platform after changes constitutes acceptance of the
              updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Contact</h2>
            <p>
              For questions about these terms, contact the head coach at{" "}
              <a
                href="mailto:doyle.zhang@gmail.com"
                className="text-primary underline"
              >
                doyle.zhang@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
