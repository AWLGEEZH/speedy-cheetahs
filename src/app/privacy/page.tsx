export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-xs text-muted mb-6">Last updated: March 6, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold mb-2">Overview</h2>
          <p>
            3D Printed Diamonds is a youth baseball team management platform used
            to coordinate schedules, communicate updates, and manage team
            information for the 3D Printed Diamonds Farm-1 coach pitch team.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Information We Collect</h2>
          <p>We collect the following information from parents and guardians:</p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Parent/guardian name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Player name and jersey number</li>
            <li>Emergency contact information</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold mb-2">How We Use Your Information</h2>
          <p>Your information is used solely for:</p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Sending game and practice schedule updates via SMS</li>
            <li>Communicating weather cancellations and schedule changes</li>
            <li>Coordinating volunteer sign-ups for team events</li>
            <li>Managing team roster and attendance</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold mb-2">SMS Notifications</h2>
          <p>
            By opting in to SMS notifications, you consent to receive text
            messages from the 3D Printed Diamonds coaching staff regarding team
            activities. Message frequency varies. Message and data rates may
            apply. You can opt out at any time by updating your preferences on
            the parent registration page or by contacting the head coach.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Data Sharing</h2>
          <p>
            We do not sell, trade, or share your personal information with
            third parties. Your data is only accessible to the 3D Printed Diamonds
            coaching staff and is used exclusively for team management
            purposes.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Data Security</h2>
          <p>
            We use industry-standard security measures to protect your
            information, including encrypted connections and secure database
            storage.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Data Retention</h2>
          <p>
            Your information is retained for the duration of the baseball
            season and may be carried over to subsequent seasons. You may
            request deletion of your data at any time by contacting the head
            coach.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Contact</h2>
          <p>
            For questions about this privacy policy or to request data
            deletion, contact the head coach at{" "}
            <a href="mailto:doyle.zhang@gmail.com" className="text-primary underline">
              doyle.zhang@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
