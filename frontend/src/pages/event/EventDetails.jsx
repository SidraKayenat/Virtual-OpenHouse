import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { eventAPI } from "@/lib/api"; // adjust path if your api.js lives elsewhere

// ─── Countdown Hook ────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({
    h: "00",
    m: "00",
    s: "00",
    total: 0,
  });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ h: "00", m: "00", s: "00", total: 0 });
      return;
    }

    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0)
        return setTimeLeft({ h: "00", m: "00", s: "00", total: 0 });
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
        total: diff,
      });
    };

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

// ─── Status Badge ──────────────────────────────────────────────────────────
const STATUS_META = {
  pending: {
    label: "Pending Review",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Approved",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-100 text-red-700 border-red-200",
  },
  published: {
    label: "Published",
    classes: "bg-blue-100 text-blue-700 border-blue-200",
  },
  live: {
    label: "Live Now",
    classes: "bg-red-100 text-red-600 border-red-200 animate-pulse",
  },
  completed: {
    label: "Completed",
    classes: "bg-slate-100 text-slate-500 border-slate-200",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

// ─── Share Button ──────────────────────────────────────────────────────────
function ShareBtn({ icon, label, color, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Share on ${label}`}
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md hover:scale-110 transition-transform duration-200 ${color}`}
    >
      {icon}
    </a>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderSet, setReminderSet] = useState(false);
  const heroRef = useRef(null);

  // Fetch event from real API
  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    eventAPI
      .getById(eventId)
      .then((res) => {
        // Response shape: { success: true, data: { ...event, registrationCount } }
        setEvent(res.data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load event");
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const countdownTarget = useMemo(
    () => (event?.liveDate ? new Date(event.liveDate) : null),
    [event?.liveDate],
  );
  const countdown = useCountdown(countdownTarget);

  // Parallax hero
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Loading event
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c0f]">
        <div className="text-center">
          <p className="text-2xl text-white font-semibold mb-2">
            Something went wrong
          </p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-violet-400 underline text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c0f]">
        <div className="text-center">
          <p className="text-2xl text-white font-semibold mb-2">
            Event not found
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-violet-400 underline text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const liveDateObj = new Date(event.liveDate);
  const dateStr = liveDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeRange = `${event.startTime || "TBD"} – ${event.endTime || "TBD"}`;
  const isUpcoming = countdown.total > 0;
  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(event.name);
  const statusMeta = STATUS_META[event.status] || STATUS_META.published;

  return (
    <div
      className="min-h-screen bg-[#0c0c0f] text-white"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* ── GOOGLE FONT IMPORT ── */}
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        .fade-up { animation: fadeUp 0.55s ease forwards; }
        .fade-up-1 { animation-delay: 0.05s; opacity:0; }
        .fade-up-2 { animation-delay: 0.15s; opacity:0; }
        .fade-up-3 { animation-delay: 0.25s; opacity:0; }
        .fade-up-4 { animation-delay: 0.35s; opacity:0; }
        .digit-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          border-radius: 14px;
          min-width: 72px;
          padding: 14px 10px 10px;
          text-align: center;
        }
        .glass-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }
        .tag-pill {
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.3);
          color: #c4b5fd;
          border-radius: 999px;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          transition: background 0.2s;
        }
        .tag-pill:hover { background: rgba(139,92,246,0.22); }
        .register-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          border-radius: 12px;
          padding: 14px 32px;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 24px rgba(124,58,237,0.35);
          transition: all 0.25s ease;
          border: 1px solid rgba(167,139,250,0.3);
          width: 100%;
        }
        .register-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.5);
        }
        .register-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .reminder-btn {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 13px 32px;
          font-weight: 500;
          font-size: 15px;
          width: 100%;
          transition: all 0.25s;
        }
        .reminder-btn:hover { border-color: rgba(167,139,250,0.5); background: rgba(139,92,246,0.08); }
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 0; }
        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6d6d82;
          margin-bottom: 12px;
        }
      `}</style>

      {/* ── TOP NAV BAR ── */}
      <nav
        className="sticky top-0 z-50 flex items-center px-4 md:px-8 h-14 border-b border-white/5"
        style={{
          background: "rgba(12,12,15,0.88)",
          backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <div className="ml-auto flex items-center gap-3">
          {event.isFeatured && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: "rgba(234,179,8,0.12)",
                color: "#fbbf24",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              ★ Featured
            </span>
          )}
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusMeta.classes}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="relative h-[420px] md:h-[520px] overflow-hidden">
        {/* BG */}
        <div ref={heroRef} className="absolute inset-0 w-full h-full">
          {event.thumbnailUrl ? (
            <img
              src={event.thumbnailUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "linear-gradient(135deg, #0f0f1a 0%, #1a1030 40%, #0e1a2e 100%)",
              }}
            >
              {/* Decorative blobs */}
              <div
                className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20"
                style={{
                  background:
                    "radial-gradient(circle, #7c3aed, transparent 70%)",
                  filter: "blur(60px)",
                }}
              />
              <div
                className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15"
                style={{
                  background:
                    "radial-gradient(circle, #2563eb, transparent 70%)",
                  filter: "blur(60px)",
                }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-10"
                style={{
                  background:
                    "radial-gradient(circle, #ec4899, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
              {/* Grid lines */}
              <svg
                className="absolute inset-0 w-full h-full opacity-[0.04]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="60"
                    height="60"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #0c0c0f 0%, rgba(12,12,15,0.6) 50%, rgba(12,12,15,0.2) 100%)",
            }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col justify-end px-4 md:px-10 pb-10">
          <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Left: title */}
            <div>
              <div className="flex items-center gap-2 mb-3 fade-up fade-up-1">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {event.eventType}
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {event.environmentType}
                </span>
              </div>
              <h1
                className="font-syne text-3xl md:text-5xl font-800 leading-tight max-w-xl fade-up fade-up-2"
                style={{
                  fontWeight: 800,
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                }}
              >
                {event.name}
              </h1>
              <p className="mt-2 text-slate-300 text-sm fade-up fade-up-3">
                Hosted by{" "}
                <span className="text-violet-300 font-medium">
                  {event.createdBy.name}
                </span>
                {event.createdBy.organization && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-slate-400">
                      {event.createdBy.organization}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Right: countdown */}
            {isUpcoming && (
              <div className="fade-up fade-up-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-3 text-center md:text-right">
                  Starts In
                </p>
                <div className="flex items-end gap-2">
                  {[
                    { val: countdown.h, label: "HRS" },
                    { val: countdown.m, label: "MIN" },
                    { val: countdown.s, label: "SEC" },
                  ].map(({ val, label }) => (
                    <div key={label} className="digit-card">
                      <div
                        className="font-syne text-3xl md:text-4xl font-bold tabular-nums"
                        style={{ fontWeight: 800 }}
                      >
                        {val}
                      </div>
                      <div className="text-[10px] font-semibold tracking-widest text-slate-500 mt-1">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!isUpcoming && (
              <div className="fade-up fade-up-4 digit-card px-6 py-4 text-center">
                <div className="text-red-400 font-semibold text-sm uppercase tracking-widest">
                  Event Live / Ended
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT / MAIN ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: "🏪",
                label: "Total Stalls",
                value: event.numberOfStalls,
              },
              { icon: "✅", label: "Available", value: event.availableStalls },
              {
                icon: "📅",
                label: "Live Date",
                value: liveDateObj.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
              },
              { icon: "⏰", label: "Duration", value: timeRange },
            ].map(({ icon, label, value }) => (
              <div key={label} className="glass-card p-4">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="font-semibold text-white text-sm">{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="font-syne text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
              About This Event
            </h2>
            {event.description.split("\n\n").map((para, i) => (
              <p
                key={i}
                className="text-slate-300 text-sm leading-relaxed mb-4 last:mb-0"
              >
                {para}
              </p>
            ))}
          </div>

          {/* Date & Time */}
          <div className="glass-card p-6">
            <h2 className="font-syne text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
              Date & Time
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="section-label">Event Goes Live On</div>
                <div className="text-violet-300 font-medium text-sm">
                  {dateStr}
                </div>
              </div>
              <div>
                <div className="section-label">Duration</div>
                <div className="text-violet-300 font-medium text-sm">
                  {event.startTime} – {event.endTime}
                </div>
              </div>
              {event.venue && (
                <div className="sm:col-span-2">
                  <div className="section-label">Venue</div>
                  <div className="text-slate-300 text-sm flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {event.venue}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div className="glass-card p-6">
            <h2 className="font-syne text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
              Organizer Contact
            </h2>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                }}
              >
                {event.createdBy.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {event.createdBy.name}
                </div>
                {event.createdBy.organization && (
                  <div className="text-slate-400 text-sm">
                    {event.createdBy.organization}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mt-2">
                  {event.createdBy.email && (
                    <a
                      href={`mailto:${event.createdBy.email}`}
                      className="text-violet-300 text-xs flex items-center gap-1 hover:text-violet-200 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {event.createdBy.email}
                    </a>
                  )}
                  {event.createdBy.phone && (
                    <a
                      href={`tel:${event.createdBy.phone}`}
                      className="text-violet-300 text-xs flex items-center gap-1 hover:text-violet-200 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {event.createdBy.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="flex flex-col gap-5">
          {/* CTA Card */}
          <div className="glass-card p-5 flex flex-col gap-3 sticky top-20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Stall availability</span>
              <span className="text-xs font-semibold text-white">
                {event.availableStalls} / {event.numberOfStalls}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((event.availableStalls / event.numberOfStalls) * 100)}%`,
                  background:
                    event.availableStalls === 0
                      ? "#ef4444"
                      : "linear-gradient(90deg, #7c3aed, #a78bfa)",
                }}
              />
            </div>

            <Link to={`/user/register/${eventId}`}>
              <button
                className="register-btn text-white"
                disabled={
                  event.availableStalls === 0 ||
                  !["published", "live"].includes(event.status)
                }
              >
                {event.availableStalls === 0 ? "Stalls Full" : "Register Now"}
              </button>
            </Link>

            <button
              className={`reminder-btn ${reminderSet ? "text-violet-300 border-violet-500/40" : "text-slate-300"}`}
              onClick={() => setReminderSet(!reminderSet)}
            >
              {reminderSet ? "✓ Reminder Set" : "🔔 Set a Reminder"}
            </button>

            <hr className="divider" />

            {/* Quick info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">
                  Date
                </span>
                <span className="text-slate-200 text-xs text-right">
                  {liveDateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">
                  Time
                </span>
                <span className="text-slate-200 text-xs">{timeRange}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">
                  Format
                </span>
                <span className="text-slate-200 text-xs capitalize">
                  {event.environmentType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs uppercase tracking-wide font-medium">
                  Type
                </span>
                <span className="text-slate-200 text-xs capitalize">
                  {event.eventType}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-label">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="glass-card p-5">
            <h3 className="section-label">Share with friends</h3>
            <div className="flex gap-3">
              <ShareBtn
                label="Facebook"
                href={`https://facebook.com/sharer/sharer.php?u=${shareUrl}`}
                color="bg-[#1877f2]"
                icon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                }
              />
              <ShareBtn
                label="WhatsApp"
                href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
                color="bg-[#25d366]"
                icon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                }
              />
              <ShareBtn
                label="LinkedIn"
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`}
                color="bg-[#0a66c2]"
                icon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                }
              />
              <ShareBtn
                label="Twitter"
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                color="bg-[#1da1f2]"
                icon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-white/5 mt-4 px-4 md:px-10 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} VirtualEvents. All rights reserved.
      </div>
    </div>
  );
}
