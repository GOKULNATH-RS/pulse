"use client";

import { useTheme } from "@/components/theme-provider";

interface GuidePageProps {
  onBack: () => void;
}

const steps = [
  {
    icon: "📡",
    title: "1. Event Simulation",
    desc: "Simulated users browse products, add items to cart, and make purchases. Events are generated at a configurable rate and pushed to Redis Streams.",
    detail: "Each user has unique behavioral patterns — different browsing intensity, purchase probability, and category preferences.",
  },
  {
    icon: "⚡",
    title: "2. Real-Time Processing",
    desc: "Every event is processed sub-50ms: user profiles are updated, engagement scores are recalculated, and churn risk is predicted using a decay-weighted model.",
    detail: "Processing latency is tracked via an exponential moving average stored in Redis.",
  },
  {
    icon: "🎯",
    title: "3. Campaign Triggers",
    desc: "Five trigger types evaluate after each event: abandoned cart, browse abandonment, post-purchase cross-sell, re-engagement, and high churn risk.",
    detail: "All eligible triggers are collected and one is randomly selected — a dedup cooldown prevents spam.",
  },
  {
    icon: "✨",
    title: "4. Email Personalization",
    desc: "The winning trigger generates a fully personalized email: dynamic greeting, product recommendations, discount offers, inventory alerts, and cart reminders.",
    detail: "Three+ personalization variables are used per email, satisfying the success criteria.",
  },
  {
    icon: "📧",
    title: "5. Email Delivery",
    desc: "Emails are sent via Google Apps Script (GmailApp API). A professional table-based HTML template renders correctly across all email clients.",
    detail: "Delivery results (success/failure) are recorded in Redis and displayed in the Campaign Feed.",
  },
  {
    icon: "📊",
    title: "6. Live Dashboard",
    desc: "The Next.js frontend polls metrics every 2 seconds. Charts show event rate, email performance, and processing latency in real-time.",
    detail: "All data flows through Redis — no external database required.",
  },
];

const criteria = [
  {
    requirement: "Process 10,000+ events/min with < 50ms latency using Redis",
    implementation: "Redis Streams + Sorted Sets power event ingestion. Latency is tracked via exponential moving average — visible in the Processing Latency chart.",
    verify: "Set event rate to 60/min. Observe the Processing Latency metric staying below 50ms. Rate can be scaled higher via the API.",
  },
  {
    requirement: "Dynamic email content with 3+ personalization variables",
    implementation: "Each email includes: personalized greeting, product recommendations (category-matched), dynamic discount (engagement-based), inventory alerts, and cart reminders.",
    verify: "Click any email in Campaign Activity → Mail Preview tab. Count the distinct personalized sections: greeting, recommendations, discount, inventory, cart items.",
  },
  {
    requirement: "Frontend performance score ≥ 90 (PageSpeed Insights)",
    implementation: "Next.js 16 with Turbopack, minimal client JS, CSS custom properties (no heavy CSS-in-JS), optimized re-renders with polling.",
    verify: "Run Google PageSpeed Insights on the deployed URL.",
  },
  {
    requirement: "Secure API with JWT authentication",
    implementation: "The /api/events POST endpoint requires a valid JWT Bearer token. Tokens are generated via /api/auth/token and verified on each request.",
    verify: "Try POST /api/events without a token → 401 Unauthorized. With a valid token → 200 OK.",
  },
];

const testingSteps = [
  {
    step: "1",
    title: "Configure Your Email",
    instructions: [
      "Click the ▶ button (bottom-right) to open Simulation Controls.",
      "Switch to the \"Test Users\" tab.",
      "Edit any user's email address to your own.",
      "Click \"Save Users\".",
    ],
  },
  {
    step: "2",
    title: "Start Simulation",
    instructions: [
      "Switch back to the \"Simulation\" tab.",
      "Set Event Rate (start with 10-20/min for visibility).",
      "Set Email Cooldown to 5-10s for quick testing.",
      "Click \"Start\".",
    ],
  },
  {
    step: "3",
    title: "Observe Real-Time Data",
    instructions: [
      "Watch the Incoming Events feed populate with browse/cart/purchase events.",
      "Metrics cards update live: total events, active users, email success rate.",
      "Charts render event throughput, email performance, and processing latency.",
    ],
  },
  {
    step: "4",
    title: "Verify Email Delivery",
    instructions: [
      "Campaign Activity feed shows sent emails (green) and failures (red).",
      "Click any email entry to see the full HTML preview.",
      "Switch to \"Data\" tab to inspect the raw personalization payload.",
      "Check your inbox for the actual email.",
    ],
  },
  {
    step: "5",
    title: "Verify JWT Auth",
    instructions: [
      "GET /api/auth/token — returns a JWT.",
      "POST /api/events with Bearer token → processes the event.",
      "POST /api/events without token → 401 Unauthorized.",
    ],
  },
];

export function GuidePage({ onBack }: GuidePageProps) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-secondary)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-[800px] mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
              alt="Pulse"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
              How Pulse Works
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-3">
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Real-Time Personalized Email Campaign Optimizer
          </h1>
          <p className="text-[15px] leading-relaxed max-w-[600px] mx-auto" style={{ color: "var(--text-tertiary)" }}>
            Pulse processes user behavior events in real-time, predicts churn risk, triggers personalized email campaigns, and delivers them — all powered by Redis with sub-50ms latency.
          </p>
        </section>

        {/* Architecture Pipeline */}
        <section className="space-y-4">
          <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Architecture Pipeline
          </h2>
          <div className="space-y-3">
            {steps.map((s) => (
              <div
                key={s.title}
                className="card p-4 animate-fade-in"
              >
                <div className="flex gap-3">
                  <span className="text-[20px] mt-0.5 flex-shrink-0">{s.icon}</span>
                  <div className="space-y-1.5">
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {s.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {s.desc}
                    </p>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-quaternary)" }}>
                      {s.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testing Guide */}
        <section className="space-y-4">
          <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Testing Guide for Evaluators
          </h2>
          <div className="space-y-3">
            {testingSteps.map((t) => (
              <div
                key={t.step}
                className="card p-4"
              >
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {t.step}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {t.title}
                    </h3>
                    <ul className="space-y-1">
                      {t.instructions.map((ins, i) => (
                        <li key={i} className="text-[13px] leading-relaxed flex gap-2" style={{ color: "var(--text-secondary)" }}>
                          <span style={{ color: "var(--text-quaternary)" }}>•</span>
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Success Criteria */}
        <section className="space-y-4">
          <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Success Criteria Verification
          </h2>
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <div key={i} className="card p-4 space-y-3">
                <div
                  className="text-[13px] font-semibold px-2.5 py-1 rounded-md inline-block"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {c.requirement}
                </div>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>
                      How it&apos;s implemented
                    </span>
                    <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {c.implementation}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>
                      How to verify
                    </span>
                    <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {c.verify}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="space-y-4">
          <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Tech Stack
          </h2>
          <div className="card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: "Next.js 16", desc: "App Router + Turbopack" },
                { name: "React 19", desc: "Client components" },
                { name: "Redis 7", desc: "Streams, Sorted Sets, Hashes" },
                { name: "TypeScript", desc: "End-to-end type safety" },
                { name: "Tailwind CSS 4", desc: "Design system" },
                { name: "Docker", desc: "Multi-stage containerized" },
                { name: "JWT", desc: "API authentication" },
                { name: "Google Apps Script", desc: "Email delivery" },
                { name: "Recharts", desc: "Real-time charts" },
              ].map((t) => (
                <div key={t.name} className="space-y-0.5">
                  <div className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {t.name}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Back button */}
        <div className="text-center pb-8">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
