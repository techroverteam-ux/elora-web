"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";
import { User } from "../types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "elora_user";
const TOKEN_KEY = "elora_token";
const LOGOUT_KEY = "elora_logged_out";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    if (sessionStorage.getItem(LOGOUT_KEY) === "1") {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Restore from storage immediately
    const storedUser = sessionStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        return; // Skip /auth/me if we have stored user + token
      } catch {
        sessionStorage.removeItem(USER_KEY);
      }
    }

    // No stored session — try /auth/me (works if cookie is valid)
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data));
    } catch {
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userData: User, token?: string) => {
    sessionStorage.removeItem(LOGOUT_KEY);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    // Fetch full user with populated roles/permissions
    try {
      const { data } = await api.get("/auth/me");
      sessionStorage.setItem(USER_KEY, JSON.stringify(data));
      setUser(data);
    } catch {
      // Fallback to login response data
      sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    }
    router.push("/dashboard");
  };

  const logout = async () => {
    sessionStorage.setItem(LOGOUT_KEY, "1");
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
