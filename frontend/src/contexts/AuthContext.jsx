import { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AuthAPI.me()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const data = await AuthAPI.login({ email, password });
    localStorage.setItem("csrf_token", data.csrf_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await AuthAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem("csrf_token");
    setUser(null);
  };

  const can = (code) =>
    !!user && (user.is_superadmin || (user.permissions || []).includes(code));

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
