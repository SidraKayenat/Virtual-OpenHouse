import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      console.log("Loading user profile...");
      const resp = await api("/auth/profile", { method: "GET" });
      const userData = resp.user || resp;
      setUser(userData);
      // Store in sessionStorage as backup
      sessionStorage.setItem("user", JSON.stringify(userData));
      return true;
    } catch (err) {
      console.error("Failed to load user:", err);
      setUser(null);
      sessionStorage.removeItem("user");
      // If token is invalid, clear it
      localStorage.removeItem("token");
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      console.log("Token in localStorage:", token ? "Yes" : "No");

      if (token) {
        await loadUser();
      } else {
        // No token, check sessionStorage for cached user
        const cachedUser = sessionStorage.getItem("user");
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
          } catch (e) {
            console.error("Failed to parse cached user");
          }
        }
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      console.error("Failed to logout");
    }
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
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
