"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a365d] px-4">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">🐆</div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
        <p className="text-white/70 mb-6">
          Check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white text-[#1a365d] font-semibold rounded-lg hover:bg-white/90 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
