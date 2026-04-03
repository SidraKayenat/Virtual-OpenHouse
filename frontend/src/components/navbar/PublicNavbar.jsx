import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import {
  Globe,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Browse Events", href: "/publicbrowseevents" },
  { label: "About", href: "#features" },
  { label: "Contact", href: "#contact" },
];

export default function PublicNavbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false); // avatar dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // mobile menu
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);

  // Scroll detection — switch from transparent to frosted
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  const goToDashboard = () => {
    setOpen(false);
    navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
  };

  if (loading)
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{ background: "rgba(12,12,15,0.0)" }}
      />
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .nav-link-underline::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 1.5px;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          border-radius: 4px;
          transition: width 0.25s ease;
        }
        .nav-link-underline:hover::after { width: 100%; }
        .nav-link-active::after { width: 100% !important; }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes mobileSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(12,12,15,0.88)" : "rgba(12,12,15,0.0)",
          backdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-2.5 flex-shrink-0 group"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: "0 0 0 0 rgba(124,58,237,0.4)",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 14px rgba(124,58,237,0.55)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 0 0 rgba(124,58,237,0.4)")
                }
              >
                <Globe size={14} className="text-white" />
              </div>
              <span
                className="text-white font-bold text-[16px] tracking-wide"
                style={{
                  fontFamily: "'Syne',sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                Open House
              </span>
            </Link>

            {/* ── Center nav links (desktop) ── */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ label, href }) => {
                const isActive =
                  href.startsWith("/") && location.pathname === href;
                const isAnchor = href.startsWith("#");
                const Comp = isAnchor ? "a" : Link;
                const linkProps = isAnchor ? { href } : { to: href };
                return (
                  <Comp
                    key={label}
                    {...linkProps}
                    className={`relative text-[13.5px] font-medium nav-link-underline transition-colors duration-200 ${isActive ? "nav-link-active" : ""}`}
                    style={{
                      color: isActive
                        ? "rgba(255,255,255,0.92)"
                        : "rgba(255,255,255,0.52)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.92)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = isActive
                        ? "rgba(255,255,255,0.92)"
                        : "rgba(255,255,255,0.52)")
                    }
                  >
                    {label}
                  </Comp>
                );
              })}
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-3">
              {!user ? (
                /* ── Logged-out CTAs ── */
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200"
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.25)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.12)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      boxShadow: "0 2px 12px rgba(124,58,237,0.25)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(124,58,237,0.45)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 2px 12px rgba(124,58,237,0.25)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    Get Started <ArrowRight size={13} />
                  </Link>
                </>
              ) : (
                /* ── Logged-in controls ── */
                <>
                  {/* Dashboard shortcut */}
                  <button
                    onClick={goToDashboard}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-200"
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#c4b5fd";
                      e.currentTarget.style.background =
                        "rgba(124,58,237,0.12)";
                      e.currentTarget.style.borderColor =
                        "rgba(124,58,237,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.08)";
                    }}
                  >
                    <LayoutDashboard size={13} /> Dashboard
                  </button>

                  {/* Avatar dropdown */}
                  <div className="relative" ref={dropRef}>
                    <button
                      onClick={() => setOpen(!open)}
                      className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-2xl transition-all duration-200"
                      style={{
                        background: open
                          ? "rgba(124,58,237,0.18)"
                          : "rgba(255,255,255,0.06)",
                        border: `1px solid ${open ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.1)"}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!open) {
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.09)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.16)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!open) {
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.06)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)";
                        }
                      }}
                    >
                      {/* Avatar circle */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                        style={{
                          background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                        }}
                      >
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      {/* Name (md+) */}
                      <span
                        className="hidden md:block text-[12.5px] font-medium max-w-[90px] truncate"
                        style={{ color: "rgba(255,255,255,0.78)" }}
                      >
                        {user.name?.split(" ")[0]}
                      </span>
                      <ChevronDown
                        size={12}
                        className="transition-transform duration-200"
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </button>

                    {/* Dropdown panel */}
                    {open && (
                      <div
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                        style={{
                          background: "#1a1728",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 20px 48px rgba(0,0,0,0.55)",
                          animation: "fadeSlideDown 0.18s ease",
                        }}
                      >
                        {/* User info header */}
                        <div
                          className="px-4 py-3.5"
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                              style={{
                                background:
                                  "linear-gradient(135deg,#7c3aed,#2563eb)",
                              }}
                            >
                              {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-[13px] truncate">
                                {user.name}
                              </p>
                              <p
                                className="text-[10.5px] truncate"
                                style={{ color: "rgba(255,255,255,0.38)" }}
                              >
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-1.5">
                          <button
                            onClick={goToDashboard}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors text-left"
                            style={{ color: "rgba(255,255,255,0.65)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(124,58,237,0.12)";
                              e.currentTarget.style.color = "#c4b5fd";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color =
                                "rgba(255,255,255,0.65)";
                            }}
                          >
                            <LayoutDashboard
                              size={14}
                              style={{ color: "#a78bfa" }}
                            />
                            Dashboard
                          </button>

                          <div
                            style={{
                              borderTop: "1px solid rgba(255,255,255,0.07)",
                              margin: "4px 0",
                            }}
                          />

                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors text-left"
                            style={{ color: "rgba(255,255,255,0.65)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(248,113,113,0.1)";
                              e.currentTarget.style.color = "#f87171";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color =
                                "rgba(255,255,255,0.65)";
                            }}
                          >
                            <LogOut size={14} style={{ color: "#f87171" }} />
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Mobile hamburger ── */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors ml-1"
                style={{
                  color: "rgba(255,255,255,0.6)",
                  background: mobileOpen
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {mobileOpen ? <X size={15} /> : <Menu size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div
            className="md:hidden border-t"
            style={{
              background: "rgba(12,12,15,0.97)",
              borderColor: "rgba(255,255,255,0.07)",
              animation: "mobileSlide 0.22s ease",
            }}
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => {
                const isAnchor = href.startsWith("#");
                const Comp = isAnchor ? "a" : Link;
                const linkProps = isAnchor ? { href } : { to: href };
                return (
                  <Comp
                    key={label}
                    {...linkProps}
                    className="px-4 py-3 rounded-xl text-[14px] font-medium transition-colors"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}
                  >
                    {label}
                  </Comp>
                );
              })}

              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  margin: "4px 0",
                }}
              />

              {!user ? (
                <div className="flex gap-3 pt-1">
                  <Link
                    to="/login"
                    className="flex-1 py-2.5 rounded-xl text-[13.5px] font-medium text-center transition-all"
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-center text-white"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      border: "1px solid rgba(167,139,250,0.25)",
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-1 pt-1">
                  {/* User card */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(124,58,237,0.08)",
                      border: "1px solid rgba(124,58,237,0.18)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                      }}
                    >
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-[13px] truncate">
                        {user.name}
                      </p>
                      <p
                        className="text-[10.5px] truncate"
                        style={{ color: "rgba(255,255,255,0.38)" }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={goToDashboard}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-medium text-left transition-colors"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    }}
                  >
                    <LayoutDashboard size={15} style={{ color: "#a78bfa" }} />{" "}
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-medium text-left transition-colors"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(248,113,113,0.08)";
                      e.currentTarget.style.color = "#f87171";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    }}
                  >
                    <LogOut size={15} style={{ color: "#f87171" }} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content jumping behind fixed nav */}
      <div className="h-16" />
    </>
  );
}
