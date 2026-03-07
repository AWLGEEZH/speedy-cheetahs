"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import React from "react";

interface Coach {
  id: string;
  name: string;
  email: string;
  role: "HEAD" | "ASSISTANT";
  phone?: string | null;
}

interface AuthContextType {
  isCoach: boolean;
  coach: Coach | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isCoach: false,
  coach: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCoach(data);
      } else {
        setCoach(null);
      }
    } catch {
      setCoach(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCoach(null);
  }, []);

  const value: AuthContextType = {
    isCoach: !!coach,
    coach,
    loading,
    logout,
    refresh: checkAuth,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
