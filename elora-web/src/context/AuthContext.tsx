"use client"; // Required because we use hooks (useState, useEffect)

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";
import { User } from "../types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void; // We might not need token arg if using cookies alone, but good for flexibility
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Function to check if user is logged in
  const checkAuth = async () => {
    try {
      // Calls the /me endpoint we just created
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (error) {
      // If error (401), user is not logged in
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run checkAuth when app loads
  // useEffect(() => {
  //   checkAuth();
  // }, []);

  // Login function (Called after successful API login)
  const login = () => {
    checkAuth(); // Simply re-fetch user data
    router.push("/dashboard"); // Redirect to dashboard
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post("/auth/logout"); // Call backend to clear cookie
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
