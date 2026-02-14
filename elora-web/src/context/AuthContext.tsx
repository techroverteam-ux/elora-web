"use client"; // Required because we use hooks (useState, useEffect)

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";
import { User } from "../types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Function to check if user is logged in
  const checkAuth = async () => {
    try {
      // Check if session_id cookie exists or token in localStorage
      const sessionId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("session_id="))
        ?.split("=")[1];
      
      const token = localStorage.getItem('access_token');

      if (!sessionId && !token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Set Authorization header if token exists
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // Calls the /me endpoint
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (error) {
      // If error (401), user is not logged in
      setUser(null);
      localStorage.removeItem('access_token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  // Run checkAuth when app loads
  useEffect(() => {
    checkAuth();
  }, []);

  // Login function (Called after successful API login)
  const login = async () => {
    await checkAuth(); // Wait for user data
    router.push("/dashboard"); // Then redirect to dashboard
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post("/auth/logout"); // Call backend to clear cookie
      
      // Clear session cookies
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Clear localStorage token
      localStorage.removeItem('access_token');
      delete api.defaults.headers.common['Authorization'];
      
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
