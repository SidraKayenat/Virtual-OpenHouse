import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const resp = await api("/auth/profile", { method: "GET" });
      const userData = resp.user || resp;
      setUser(userData);
    } catch (err) {
      // It's normal for unauthenticated users to hit this endpoint.
      // Avoid console noise and simply treat as "no user".
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasJwtCookie = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("jwt="));

    if (hasJwtCookie) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      console.error("Failed to logout");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
