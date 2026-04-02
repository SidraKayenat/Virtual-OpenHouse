import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Globe,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// ─── Shared animated background ───────────────────────────────────────────
function AuthBg() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#0c0c0f" }}
    >
      {/* Blobs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle,#7c3aed,transparent 65%)",
          filter: "blur(90px)",
          animation: "blobFloat1 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle,#2563eb,transparent 65%)",
          filter: "blur(90px)",
          animation: "blobFloat2 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[40%] right-[25%] w-[320px] h-[320px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle,#ec4899,transparent 65%)",
          filter: "blur(70px)",
          animation: "blobFloat3 12s ease-in-out infinite",
        }}
      />
      {/* Grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.032]"
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
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <style>{`
        @keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.06)} 66%{transform:translate(-20px,25px) scale(0.96)} }
        @keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-35px,25px) scale(1.05)} 70%{transform:translate(20px,-20px) scale(0.97)} }
        @keyframes blobFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-35px) scale(1.08)} }
      `}</style>
    </div>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────
function AuthInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  icon: Icon,
  rightSlot,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[12px] font-semibold uppercase tracking-widest"
        style={{
          color: focused ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)",
          letterSpacing: "0.07em",
          transition: "color 0.18s",
        }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
            style={{ color: focused ? "#a78bfa" : "rgba(255,255,255,0.25)" }}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl text-[14px] transition-all duration-200 outline-none"
          style={{
            background: focused
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? "rgba(248,113,113,0.55)" : focused ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.1)"}`,
            color: "rgba(255,255,255,0.88)",
            padding: `12px ${rightSlot ? "44px" : "16px"} 12px ${Icon ? "44px" : "16px"}`,
            boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <p
          className="flex items-center gap-1.5 text-[12px]"
          style={{ color: "#f87171" }}
        >
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Password strength bar ─────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const meta = [
    { label: "Weak", color: "#f87171" },
    { label: "Fair", color: "#fbbf24" },
    { label: "Good", color: "#60a5fa" },
    { label: "Strong", color: "#34d399" },
  ];
  const { label, color } = meta[Math.max(0, score - 1)];
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-400"
            style={{ background: i < score ? color : "rgba(255,255,255,0.1)" }}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

// ─── Login page ────────────────────────────────────────────────────────────
export default function Login() {
  const { setUser, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (user)
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setApiError("");
    try {
      setLoading(true);
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      // Use AuthContext login to set user state
      await setUser(res.user || res);
      navigate(
        res.user?.role === "admin" || res.role === "admin"
          ? "/admin/dashboard"
          : "/user/dashboard",
        { replace: true },
      );
    } catch (err) {
      setApiError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthBg />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');
        ::placeholder { color: rgba(255,255,255,0.2) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .auth-card { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center px-4 py-16"
        style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
      >
        <div className="auth-card w-full max-w-[420px]">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                }}
              >
                <Globe size={18} className="text-white" />
              </div>
              <span
                className="text-white font-bold text-[18px]"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                Open House
              </span>
            </Link>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl px-8 py-9"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div className="mb-7">
              <h1
                className="text-white font-bold text-[24px] mb-1.5"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                Welcome back
              </h1>
              <p
                className="text-[14px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Sign in to your account to continue
              </p>
            </div>

            {/* API error */}
            {apiError && (
              <div
                className="flex items-center gap-2.5 p-3.5 rounded-2xl mb-5 text-[13px]"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  color: "#fca5a5",
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <AuthInput
                label="Email address"
                type="email"
                value={form.email}
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />

              <AuthInput
                label="Password"
                type={showPw ? "text" : "password"}
                value={form.password}
                autoComplete="current-password"
                placeholder="Your password"
                error={errors.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="transition-colors"
                    style={{
                      color: showPw ? "#a78bfa" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[14.5px] font-semibold text-white transition-all duration-250 mt-1"
                style={{
                  background: loading
                    ? "rgba(124,58,237,0.4)"
                    : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  boxShadow: loading
                    ? "none"
                    : "0 6px 24px rgba(124,58,237,0.4)",
                  cursor: loading ? "not-allowed" : "pointer",
                  transform: loading ? "none" : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 32px rgba(124,58,237,0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow =
                    "0 6px 24px rgba(124,58,237,0.4)";
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <span
                className="text-[11.5px]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                or
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>

            <p
              className="text-center text-[13.5px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold transition-colors"
                style={{ color: "#a78bfa" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b5fd")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#a78bfa")}
              >
                Create one free
              </Link>
            </p>
          </div>

          <p
            className="text-center text-[12px] mt-5"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            By continuing, you agree to our{" "}
            <a
              href="#"
              style={{ color: "rgba(255,255,255,0.38)" }}
              className="hover:text-white transition-colors"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              style={{ color: "rgba(255,255,255,0.38)" }}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
