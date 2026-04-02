import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Globe,
  ArrowRight,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Building,
  Phone,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// ─── Re-used bg from Login ─────────────────────────────────────────────────
function AuthBg() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#0c0c0f" }}
    >
      <div
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle,#7c3aed,transparent 65%)",
          filter: "blur(90px)",
          animation: "blobFloat1 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle,#2563eb,transparent 65%)",
          filter: "blur(90px)",
          animation: "blobFloat2 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[30%] left-[30%] w-[300px] h-[300px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle,#ec4899,transparent 65%)",
          filter: "blur(70px)",
          animation: "blobFloat3 12s ease-in-out infinite",
        }}
      />
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
  hint,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          className="text-[11.5px] font-semibold uppercase tracking-widest"
          style={{
            color: focused
              ? "rgba(255,255,255,0.55)"
              : "rgba(255,255,255,0.35)",
            letterSpacing: "0.07em",
            transition: "color 0.18s",
          }}
        >
          {label}
        </label>
        {hint && (
          <span
            className="text-[10.5px]"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            {hint}
          </span>
        )}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
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
          className="w-full rounded-2xl text-[13.5px] transition-all duration-200 outline-none"
          style={{
            background: focused
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? "rgba(248,113,113,0.55)" : focused ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.1)"}`,
            color: "rgba(255,255,255,0.88)",
            padding: `11px ${rightSlot ? "44px" : "14px"} 11px ${Icon ? "42px" : "14px"}`,
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
          className="flex items-center gap-1.5 text-[11.5px]"
          style={{ color: "#f87171" }}
        >
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Password strength ─────────────────────────────────────────────────────
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
    { label: "Too weak", color: "#f87171" },
    { label: "Fair", color: "#fbbf24" },
    { label: "Good", color: "#60a5fa" },
    { label: "Strong", color: "#34d399" },
  ];
  const { label, color } = meta[Math.max(0, score - 1)];
  return (
    <div className="flex flex-col gap-1.5">
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
        {label} password
      </p>
    </div>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            background:
              i === current
                ? "linear-gradient(90deg,#7c3aed,#a78bfa)"
                : i < current
                  ? "rgba(167,139,250,0.4)"
                  : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Signup ────────────────────────────────────────────────────────────────
export default function Signup() {
  const { setUser, user } = useAuth();
  const navigate = useNavigate();

  // 2-step: step 0 = account info, step 1 = profile info
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (user)
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
  }, [user]);

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validateStep0 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.length < 2) e.name = "At least 2 characters";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Min 6 characters";
    if (!form.confirmPassword)
      e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords don't match";
    return e;
  };

  const handleNext = () => {
    const e = validateStep0();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(1);
  };

  const handleBack = () => {
    setErrors({});
    setStep(0);
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setApiError("");
    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        organization: form.organization.trim(),
        phoneNumber: form.phoneNumber.trim(),
      };
      const res = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUser(res.user || res);
      navigate(
        res.user?.role === "admin" || res.role === "admin"
          ? "/admin/dashboard"
          : "/user/dashboard",
        { replace: true },
      );
    } catch (err) {
      setApiError(err.message || "Failed to create account. Try again.");
      if (err.message.includes("exists")) {
        setStep(0);
      }
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
        @keyframes slideLeft  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        .auth-card { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .step-0 { animation: slideRight 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
        .step-1 { animation: slideLeft  0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
      >
        <div className="auth-card w-full max-w-[440px]">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-7">
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
            className="rounded-3xl px-8 py-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <h1
                className="text-white font-bold text-[23px] mb-1"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                {step === 0 ? "Create your account" : "Almost there!"}
              </h1>
              <p
                className="text-[13.5px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {step === 0
                  ? "Start with your account credentials"
                  : "Add a few more details — both optional"}
              </p>
            </div>

            {/* Step dots */}
            <StepDots current={step} total={2} />

            {/* API error */}
            {apiError && (
              <div
                className="flex items-center gap-2.5 p-3.5 rounded-2xl mb-5 text-[12.5px]"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  color: "#fca5a5",
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> {apiError}
              </div>
            )}

            <form
              onSubmit={
                step === 0
                  ? (e) => {
                      e.preventDefault();
                      handleNext();
                    }
                  : handleSubmit
              }
            >
              {/* ── STEP 0: credentials ── */}
              {step === 0 && (
                <div className="step-0 flex flex-col gap-4">
                  <AuthInput
                    label="Full Name"
                    icon={User}
                    value={form.name}
                    placeholder="Jane Smith"
                    autoComplete="name"
                    error={errors.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />

                  <AuthInput
                    label="Email Address"
                    type="email"
                    icon={Mail}
                    value={form.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />

                  <div className="flex flex-col gap-1.5">
                    <AuthInput
                      label="Password"
                      type={showPw ? "text" : "password"}
                      icon={Lock}
                      value={form.password}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      error={errors.password}
                      onChange={(e) => setField("password", e.target.value)}
                      hint={
                        form.password ? `${form.password.length} chars` : ""
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
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                    <PasswordStrength password={form.password} />
                  </div>

                  <AuthInput
                    label="Confirm Password"
                    type={showCpw ? "text" : "password"}
                    icon={Lock}
                    value={form.confirmPassword}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    error={errors.confirmPassword}
                    onChange={(e) =>
                      setField("confirmPassword", e.target.value)
                    }
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowCpw(!showCpw)}
                        className="transition-colors"
                        style={{
                          color: showCpw ? "#a78bfa" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-semibold text-white transition-all duration-250 mt-2"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      boxShadow: "0 6px 24px rgba(124,58,237,0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 10px 32px rgba(124,58,237,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow =
                        "0 6px 24px rgba(124,58,237,0.4)";
                    }}
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* ── STEP 1: profile ── */}
              {step === 1 && (
                <div className="step-1 flex flex-col gap-4">
                  {/* Preview chip */}
                  <div
                    className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{
                      background: "rgba(124,58,237,0.08)",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                      }}
                    >
                      {form.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-[13px] truncate">
                        {form.name}
                      </p>
                      <p
                        className="text-[11px] truncate"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {form.email}
                      </p>
                    </div>
                    <span
                      className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: "rgba(52,211,153,0.12)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.22)",
                      }}
                    >
                      ✓ Ready
                    </span>
                  </div>

                  <AuthInput
                    label="Organization"
                    icon={Building}
                    value={form.organization}
                    placeholder="Your company or institution"
                    hint="Optional"
                    onChange={(e) => setField("organization", e.target.value)}
                  />

                  <AuthInput
                    label="Phone Number"
                    icon={Phone}
                    value={form.phoneNumber}
                    placeholder="+1 234 567 8900"
                    hint="Optional"
                    onChange={(e) => setField("phoneNumber", e.target.value)}
                  />

                  <div
                    className="p-3.5 rounded-2xl text-[12.5px]"
                    style={{
                      background: "rgba(96,165,250,0.07)",
                      border: "1px solid rgba(96,165,250,0.15)",
                      color: "#93c5fd",
                    }}
                  >
                    You can always add these details later in your profile
                    settings.
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-5 py-3 rounded-2xl text-[13.5px] font-medium transition-all"
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.08)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold text-white transition-all duration-250"
                      style={{
                        background: loading
                          ? "rgba(124,58,237,0.4)"
                          : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                        border: "1px solid rgba(167,139,250,0.3)",
                        boxShadow: loading
                          ? "none"
                          : "0 6px 24px rgba(124,58,237,0.4)",
                        cursor: loading ? "not-allowed" : "pointer",
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
                          <Loader2 size={15} className="animate-spin" />{" "}
                          Creating account…
                        </>
                      ) : (
                        <>
                          Create Account <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Footer link */}
            <div className="flex items-center gap-3 mt-6">
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.07)" }}
              />
              <p
                className="text-[13px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold transition-colors"
                  style={{ color: "#a78bfa" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#c4b5fd")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#a78bfa")
                  }
                >
                  Sign in
                </Link>
              </p>
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.07)" }}
              />
            </div>
          </div>

          <p
            className="text-center text-[12px] mt-5"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            By creating an account, you agree to our{" "}
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
