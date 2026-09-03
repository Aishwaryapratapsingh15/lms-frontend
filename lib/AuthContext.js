"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh, me as apiMe } from "./api/auth";
import { loadPersistedSession, getExpiresAt, setSession, clearSession } from "./api/session";
import { FULL_ACCESS_ROLES } from "./constants";

const AuthContext = createContext(null);

// Refresh a minute before actual expiry so an in-flight request doesn't lose
// the race against the token dying mid-call.
const REFRESH_MARGIN_MS = 60_000;

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const timerRef = useRef(null);

  const logout = useCallback(async () => {
    clearTimeout(timerRef.current);
    try { await apiLogout(); }
    finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  // Recurses via this ref rather than calling `scheduleRefresh` by name from
  // inside its own body — a direct self-reference there confuses the React
  // Compiler's hook-ordering analysis (react-hooks/immutability).
  const scheduleRefreshRef = useRef(null);

  const scheduleRefresh = useCallback(
    (expiresAt) => {
      clearTimeout(timerRef.current);
      const delay = Math.max(expiresAt - Date.now() - REFRESH_MARGIN_MS, 5_000);
      timerRef.current = setTimeout(async () => {
        try {
          const data = await apiRefresh();
          setUser(data.user);
          scheduleRefreshRef.current(getExpiresAt());
        } catch {
          // Refresh token itself expired (default 7d) or was revoked — the
          // backend can't recover this session, so end it.
          logout();
        }
      }, delay);
    },
    [logout],
  );

  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh;
  }, [scheduleRefresh]);

  useEffect(() => {
    const session = loadPersistedSession();
    if (session?.user && session.expiresAt > Date.now()) {
      // Render authenticated instantly from the cache, then confirm in the
      // background that the httpOnly cookie the cache assumes still exists
      // server-side (it may have been revoked/expired since the cache was written).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(session.user);
      setStatus("authenticated");
      scheduleRefresh(session.expiresAt);
      apiMe().catch(() => {
        clearSession();
        setUser(null);
        setStatus("unauthenticated");
      });
    } else {
      apiMe().then((data) => {
        setSession({ user: data.user, expiresAt: data.expiresAt });
        setUser(data.user);
        setStatus("authenticated");
        scheduleRefresh(data.expiresAt);
      }).catch(() => {
        apiRefresh().then((data) => {
          setUser(data.user);
          setStatus("authenticated");
          scheduleRefresh(getExpiresAt());
        }).catch(() => setStatus("unauthenticated"));
      });
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearTimeout(timerRef.current);
      clearSession();
      setUser(null);
      setStatus("unauthenticated");
    }
    window.addEventListener("lms:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("lms:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const loggedInUser = await apiLogin(email, password);
      setUser(loggedInUser);
      setStatus("authenticated");
      scheduleRefresh(getExpiresAt());
      return loggedInUser;
    },
    [scheduleRefresh],
  );

  const hasFullAccess = !!user && FULL_ACCESS_ROLES.includes(user.role);

  return (
    <AuthContext.Provider value={{ status, user, login, logout, hasFullAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
