import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Boxes,
  Bot,
  MessageSquare,
  Video,
  Sparkles,
  Headset,
  ChevronRight,
  ArrowRight,
  Zap,
  Globe,
  Eye,
  Heart,
  Clock,
} from "lucide-react";
import EventCard from "@/components/event/EventCard";
import PublicNavbar from "@/components/navbar/PublicNavbar";
import { api } from "@/lib/api";

// ─── useInView hook ────────────────────────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, ...options },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ─── Animated counter ─────────────────────────────────────────────────────
function Counter({ to, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * to));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Reveal wrapper ────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "", from = "bottom" }) {
  const [ref, inView] = useInView();
  const transforms = {
    bottom: "translateY(32px)",
    left: "translateX(-32px)",
    right: "translateX(32px)",
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : transforms[from] || "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Feature card ──────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        className="relative p-6 rounded-2xl h-full cursor-default transition-all duration-300"
        style={{
          background: hovered ? `${color}08` : "rgba(255,255,255,0.025)",
          border: `1px solid ${hovered ? color + "35" : "rgba(255,255,255,0.08)"}`,
          transform: hovered ? "translateY(-4px)" : "none",
          boxShadow: hovered ? `0 16px 40px ${color}18` : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
          style={{
            background: hovered ? `${color}22` : `${color}14`,
            border: `1px solid ${color}28`,
          }}
        >
          <Icon size={20} style={{ color }} strokeWidth={1.7} />
        </div>
        <h3
          className="text-white font-bold text-[15px] mb-2"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {title}
        </h3>
        <p
          className="text-[13.5px] leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {description}
        </p>
        <div
          className="absolute bottom-5 right-5 transition-all duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateX(0)" : "translateX(-6px)",
          }}
        >
          <ChevronRight size={14} style={{ color }} />
        </div>
      </div>
    </Reveal>
  );
}

// ─── Event skeleton ────────────────────────────────────────────────────────
function EventSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="h-44" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="p-5 space-y-3">
        <div
          className="h-4 rounded-lg w-3/4"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div
          className="h-3 rounded-lg w-1/2"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        <div
          className="h-3 rounded-lg w-2/3"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      </div>
    </div>
  );
}

// ─── Step card ─────────────────────────────────────────────────────────────
function Step({ number, title, description, delay }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className="flex gap-5"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateX(-20px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          border: "1px solid rgba(167,139,250,0.3)",
          fontFamily: "'Syne',sans-serif",
        }}
      >
        {number}
      </div>
      <div className="pt-1.5">
        <h3
          className="text-white font-bold text-[15px] mb-1"
          style={{ fontFamily: "'Syne',sans-serif" }}
        >
          {title}
        </h3>
        <p
          className="text-[13.5px] leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Decorative grid bg ────────────────────────────────────────────────────
function GridBg({ opacity = 0.03 }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="white"
            strokeWidth="0.7"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const heroRef = useRef(null);

  // Parallax hero
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.28}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/events/published");
        const events = res.data || res.events || [];
        setLiveEvents(events.filter((e) => e.status === "live"));
        setUpcomingEvents(events.filter((e) => e.status === "published"));
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, []);

  const features = [
    {
      icon: Boxes,
      title: "Immersive 3D Spaces",
      description:
        "Explore events in stunning Three.js environments — walk exhibition halls and interact with stalls in real space.",
      color: "#a78bfa",
      delay: 0,
    },
    {
      icon: Bot,
      title: "AI-Powered Assistant",
      description:
        "Our intelligent chatbot navigates you through 3D spaces, finds exhibitors, and answers questions instantly.",
      color: "#60a5fa",
      delay: 60,
    },
    {
      icon: Video,
      title: "Interactive Virtual Booths",
      description:
        "Visit exhibitor stalls in 3D, interact with rich media, and engage with content in real-time.",
      color: "#34d399",
      delay: 120,
    },
    {
      icon: Users,
      title: "Multi-Role Platform",
      description:
        "Attend, speak, exhibit, and host events — all from one unified dashboard with seamless role switching.",
      color: "#f472b6",
      delay: 180,
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description:
        "Track engagement, attendance, and stall performance with real-time insights and exportable reports.",
      color: "#fb923c",
      delay: 240,
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security with JWT auth, role-based access, and encrypted data at every layer.",
      color: "#fbbf24",
      delay: 300,
    },
  ];

  const stats = [
    { value: 1240, suffix: "+", label: "Events Hosted" },
    { value: 48, suffix: "K+", label: "Attendees" },
    { value: 320, suffix: "+", label: "Exhibitors" },
    { value: 99, suffix: "%", label: "Uptime" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#0c0c0f",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        color: "white",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');
        .font-syne { font-family:'Syne',sans-serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-slow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: float 8s ease-in-out 1s infinite; }
        .float-3 { animation: float 7s ease-in-out 2s infinite; }
        .gradient-text {
          background: linear-gradient(135deg,#fff 0%,#c4b5fd 50%,#818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .cta-btn {
          background: linear-gradient(135deg,#7c3aed,#6d28d9);
          border: 1px solid rgba(167,139,250,0.3);
          box-shadow: 0 0 0 0 rgba(124,58,237,0.4);
          transition: all 0.3s ease;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.45), 0 0 0 4px rgba(124,58,237,0.12);
        }
        .event-scroll { scrollbar-width: none; }
        .event-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <PublicNavbar />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* BG layers */}
        <div ref={heroRef} className="absolute inset-0">
          {/* Mesh gradient blobs */}
          <div
            className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full opacity-25"
            style={{
              background: "radial-gradient(circle,#7c3aed,transparent 65%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle,#2563eb,transparent 65%)",
              filter: "blur(90px)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-10"
            style={{
              background: "radial-gradient(circle,#ec4899,transparent 65%)",
              filter: "blur(60px)",
            }}
          />
          <GridBg opacity={0.035} />
        </div>

        {/* Floating decorative badges */}
        <div className="absolute top-28 right-[10%] float-1 hidden lg:block">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-semibold"
            style={{
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.25)",
              color: "#6ee7b7",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />{" "}
            Always-On Experiences
          </div>
        </div>
        <div className="absolute bottom-36 right-[15%] float-2 hidden lg:block">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-semibold"
            style={{
              background: "rgba(96,165,250,0.12)",
              border: "1px solid rgba(96,165,250,0.25)",
              color: "#93c5fd",
              backdropFilter: "blur(12px)",
            }}
          >
            <Users size={13} /> Global Visitors
          </div>
        </div>
        <div className="absolute top-48 left-[8%] float-3 hidden xl:block">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-semibold"
            style={{
              background: "rgba(167,139,250,0.12)",
              border: "1px solid rgba(167,139,250,0.25)",
              color: "#c4b5fd",
              backdropFilter: "blur(12px)",
            }}
          >
            <Sparkles size={13} /> AI-Powered
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full py-32">
          <div className="max-w-3xl">
            {/* Label */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold mb-8"
              style={{
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.25)",
                color: "#c4b5fd",
                opacity: 0,
                animation: "none",
                animationName: "fadeSlideUp",
                animationDuration: "0.7s",
                animationDelay: "0.05s",
                animationFillMode: "forwards",
              }}
            >
              <Zap size={12} style={{ color: "#a78bfa" }} /> Virtual Open House
              Platform
            </div>

            {/* Headline */}
            <h1
              className="font-syne font-bold leading-[1.06] mb-7 tracking-tight"
              style={{
                fontSize: "clamp(44px,7vw,82px)",
                opacity: 0,
                animation: "fadeSlideUp 0.8s ease 0.15s forwards",
              }}
            >
              <span className="gradient-text">Experience</span>
              <br />
              <span className="text-white">Open House</span>
              <br />
              <span style={{ color: "rgba(255,255,255,0.55)" }}>
                Virtually.
              </span>
            </h1>

            {/* Sub */}
            <p
              className="text-[17px] leading-relaxed mb-10 max-w-xl"
              style={{
                color: "rgba(255,255,255,0.55)",
                opacity: 0,
                animation: "fadeSlideUp 0.8s ease 0.28s forwards",
              }}
            >
              Explore stalls, view projects, and interact inside immersive 3D
              event environments — from anywhere in the world.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-4"
              style={{
                opacity: 0,
                animation: "fadeSlideUp 0.8s ease 0.4s forwards",
              }}
            >
              <Link
                to="/publicbrowseevents"
                className="cta-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[15px] font-semibold text-white"
              >
                Explore Events <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[15px] font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          style={{
            opacity: 0,
            animation: "fadeSlideUp 0.8s ease 0.8s forwards",
          }}
        >
          <div
            className="w-5 h-9 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: "1.5px solid rgba(255,255,255,0.2)" }}
          >
            <div
              className="w-1 h-2.5 rounded-full bg-white opacity-60"
              style={{ animation: "float 1.6s ease-in-out infinite" }}
            />
          </div>
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Scroll
          </p>
        </div>

        <style>{`
          @keyframes fadeSlideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 overflow-hidden"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, suffix, label }, i) => (
              <Reveal
                key={label}
                delay={i * 80}
                className="flex flex-col items-center text-center gap-1.5"
              >
                <p
                  className="font-bold leading-none"
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 40,
                    background: "linear-gradient(135deg,#fff,#c4b5fd)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <Counter to={value} suffix={suffix} />
                </p>
                <p
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(255,255,255,0.42)" }}
                >
                  {label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LIVE EVENTS
      ══════════════════════════════════════════════════════════════════════ */}
      {(eventsLoading || liveEvents.length > 0) && (
        <section className="py-20 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                "radial-gradient(circle at 20% 50%,#34d399,transparent 60%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <Reveal className="flex items-center gap-4 mb-10">
              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <h2 className="font-syne font-bold text-[28px] text-white">
                Live Events
              </h2>
              <span
                className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(52,211,153,0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(52,211,153,0.25)",
                }}
              >
                Happening now
              </span>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {eventsLoading ? (
                [...Array(4)].map((_, i) => <EventSkeleton key={i} />)
              ) : liveEvents.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <p
                    className="text-[14px]"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    No live events right now — check back soon
                  </p>
                </div>
              ) : (
                liveEvents.map((e, i) => (
                  <Reveal key={e._id} delay={i * 60}>
                    <EventCard event={e} />
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 relative overflow-hidden">
        <GridBg opacity={0.028} />
        <div
          className="absolute right-0 top-0 w-96 h-96 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle,#7c3aed,transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal className="text-center mb-16 max-w-2xl mx-auto">
            <p
              className="text-[12px] font-bold uppercase tracking-widest mb-4"
              style={{ color: "#a78bfa" }}
            >
              What we offer
            </p>
            <h2 className="font-syne font-bold text-[36px] md:text-[44px] text-white leading-tight mb-5">
              Everything you need to{" "}
              <span className="gradient-text">succeed</span>
            </h2>
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Powerful tools for organizers, exhibitors, and attendees — all in
              one platform.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — 2-col with mockup side
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-24 relative overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="absolute left-0 bottom-0 w-80 h-80 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle,#2563eb,transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: steps */}
            <div>
              <Reveal>
                <p
                  className="text-[12px] font-bold uppercase tracking-widest mb-4"
                  style={{ color: "#60a5fa" }}
                >
                  How it works
                </p>
                <h2 className="font-syne font-bold text-[36px] md:text-[42px] text-white leading-tight mb-12">
                  Get started in minutes
                </h2>
              </Reveal>
              <div className="flex flex-col gap-8">
                <Step
                  number="1"
                  title="Create your account"
                  description="Sign up in seconds and choose your role — attendee, exhibitor, or event organizer. No credit card required."
                  delay={0}
                />
                <Step
                  number="2"
                  title="Browse or create events"
                  description="Explore live and upcoming events, or submit your own open house event for admin approval."
                  delay={80}
                />
                <Step
                  number="3"
                  title="Register & set up your stall"
                  description="Apply for a stall slot once approved. Upload media, add team members, and publish your 3D booth."
                  delay={160}
                />
                <Step
                  number="4"
                  title="Go live"
                  description="Walk your audience through an immersive 3D environment on event day. Track views, likes, and engagement in real-time."
                  delay={240}
                />
              </div>
            </div>

            {/* Right: visual card */}
            <Reveal from="right" delay={100}>
              <div className="relative">
                {/* Glow */}
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.1))",
                    filter: "blur(20px)",
                    transform: "scale(1.04)",
                  }}
                />
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Fake dashboard header */}
                  <div
                    className="flex items-center gap-2 px-5 py-4"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.025)",
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: "rgba(248,113,113,0.6)" }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: "rgba(251,191,36,0.6)" }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: "rgba(52,211,153,0.6)" }}
                    />
                    <div
                      className="flex-1 mx-4 h-5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Fake stall card */}
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-28 relative"
                        style={{
                          background: "linear-gradient(135deg,#1e1b30,#2d1f5e)",
                        }}
                      >
                        <div
                          className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(52,211,153,0.2)",
                            color: "#34d399",
                            border: "1px solid rgba(52,211,153,0.3)",
                          }}
                        >
                          ● Published
                        </div>
                      </div>
                      <div
                        className="p-4"
                        style={{ background: "rgba(255,255,255,0.025)" }}
                      >
                        <div
                          className="h-3.5 w-2/3 rounded mb-2"
                          style={{ background: "rgba(255,255,255,0.12)" }}
                        />
                        <div
                          className="h-2.5 w-1/2 rounded mb-4"
                          style={{ background: "rgba(255,255,255,0.07)" }}
                        />
                        <div className="flex gap-2">
                          <div
                            className="flex-1 h-7 rounded-xl"
                            style={{ background: "rgba(124,58,237,0.25)" }}
                          />
                          <div
                            className="w-7 h-7 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Fake stat row */}
                    <div className="grid grid-cols-3 gap-3">
                      {["#a78bfa", "#34d399", "#60a5fa"].map((c, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl"
                          style={{
                            background: `${c}10`,
                            border: `1px solid ${c}20`,
                          }}
                        >
                          <div
                            className="h-5 w-8 rounded mb-1"
                            style={{ background: c + "30" }}
                          />
                          <div
                            className="h-2 rounded"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Fake notification */}
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: "rgba(52,211,153,0.07)",
                        border: "1px solid rgba(52,211,153,0.15)",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        style={{ background: "rgba(52,211,153,0.2)" }}
                      />
                      <div className="flex-1 space-y-1">
                        <div
                          className="h-2.5 rounded w-3/4"
                          style={{ background: "rgba(255,255,255,0.12)" }}
                        />
                        <div
                          className="h-2 rounded w-1/2"
                          style={{ background: "rgba(255,255,255,0.07)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          UPCOMING EVENTS
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal className="flex items-end justify-between gap-4 mb-10 flex-wrap">
            <div>
              <p
                className="text-[12px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "#a78bfa" }}
              >
                Coming up
              </p>
              <h2 className="font-syne font-bold text-[28px] text-white">
                Upcoming Events
              </h2>
            </div>
            <Link
              to="/browseevents"
              className="flex items-center gap-1.5 text-[13.5px] font-semibold transition-colors"
              style={{ color: "#a78bfa" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b5fd")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a78bfa")}
            >
              View all <ChevronRight size={14} />
            </Link>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {eventsLoading ? (
              [...Array(4)].map((_, i) => <EventSkeleton key={i} />)
            ) : upcomingEvents.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-20 gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Calendar
                    size={24}
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  />
                </div>
                <p
                  className="text-[14px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  No upcoming events yet
                </p>
                <Link
                  to="/user/create-event"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}
                >
                  Create an Event
                </Link>
              </div>
            ) : (
              upcomingEvents.slice(0, 8).map((e, i) => (
                <Reveal key={e._id} delay={i * 50}>
                  <EventCard event={e} />
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(37,99,235,0.08))",
          }}
        />
        <GridBg opacity={0.03} />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(ellipse,#7c3aed,transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <p
              className="text-[12px] font-bold uppercase tracking-widest mb-4"
              style={{ color: "#a78bfa" }}
            >
              Ready to start?
            </p>
            <h2
              className="font-syne font-bold text-white leading-tight mb-6"
              style={{ fontSize: "clamp(32px,5vw,52px)" }}
            >
              Create amazing virtual events —{" "}
              <span className="gradient-text">for free</span>
            </h2>
            <p
              className="text-[15px] mb-10 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Join thousands of event organizers building immersive 3D
              experiences on Open House.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/register"
                className="cta-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[15px] font-semibold text-white"
              >
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link
                to="/publicbrowseevents"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[15px] font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.75)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
              >
                Browse Events
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer
        id="contact"
        className="py-16 relative"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  }}
                >
                  <Globe size={16} className="text-white" />
                </div>
                <span
                  className="font-bold text-white text-[16px]"
                  style={{ fontFamily: "'Syne',sans-serif" }}
                >
                  Open House
                </span>
              </div>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Immersive virtual event platform powered by 3D technology and
                AI.
              </p>
            </div>

            {[
              {
                heading: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Browse Events", href: "/publicbrowseevents" },
                ],
              },
              {
                heading: "Platform",
                links: [
                  { label: "Login", href: "/login" },
                  { label: "Register", href: "/register" },
                  { label: "Dashboard", href: "/user/dashboard" },
                ],
              },
              {
                heading: "Support",
                links: [
                  { label: "Help Center", href: "#" },
                  { label: "Contact", href: "#contact" },
                  { label: "Privacy", href: "#" },
                ],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  {heading}
                </p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        to={href}
                        className="text-[13.5px] transition-colors"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "white")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            "rgba(255,255,255,0.45)")
                        }
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-4 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="text-[12.5px]"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              © {new Date().getFullYear()} Open House. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[12px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
                  }
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
