import { createContext, useContext, useEffect, useState } from "react";
import { ApiError, authApi, tokenStore } from "../api/client";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(null);
  const refresh = async () => { if (!tokenStore.refresh) return null; const session = await authApi.refresh(tokenStore.refresh); tokenStore.save(session); return session; };
  useEffect(() => { (async () => { try { if (tokenStore.access || tokenStore.refresh) setUser(await authApi.me()); } catch { tokenStore.clear(); setUser(null); } finally { setLoading(false); } })(); }, []);
  const login = async (credentials) => { setError(null); const session = await authApi.login(credentials); tokenStore.save(session); setUser(await authApi.me()); return session; };
  const register = async (credentials) => { setError(null); const session = await authApi.register(credentials); tokenStore.save(session); setUser(await authApi.me()); return session; };
  const logout = async () => { try { await authApi.logout(tokenStore.refresh); } finally { tokenStore.clear(); setUser(null); } };
  return <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout, refresh, authenticated: Boolean(user), authError: error instanceof ApiError ? error : null }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
