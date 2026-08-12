import { useEffect } from "react";
import { navigate } from "../lib/router";
import { useAuth } from "../context/AuthProvider";
export default function ProtectedRoute({ roles, children }) { const { user, loading } = useAuth(); useEffect(() => { if (!loading && !user) navigate("/login"); else if (!loading && roles && !roles.includes(user.role)) navigate(user.role === "doctor" ? "/doctor" : "/patient"); }, [loading, user, roles]); if (loading || !user || (roles && !roles.includes(user.role))) return <div className="app-loading" aria-live="polite">Loading your secure workspace…</div>; return children; }
