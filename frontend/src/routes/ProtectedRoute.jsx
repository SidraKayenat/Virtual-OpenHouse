import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "#0c0c0f" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
