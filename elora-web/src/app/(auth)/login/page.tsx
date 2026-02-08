"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Mail, Lock, Loader2, AlertCircle, Sun, Moon } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import api from "@/src/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/login", { email, password });
      await login();
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      darkMode ? 'bg-black' : 'bg-white'
    }`}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={300}
            height={150}
            className="mb-8"
            priority
          />
          <h1 className="text-4xl font-black mb-4 text-center">
            Transform Your Business
          </h1>
          <p className="text-xl text-center opacity-90 max-w-md">
            Professional branding solutions from design to installation
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-80">Happy Clients</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5+</div>
              <div className="text-sm opacity-80">Years Experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={180}
              height={90}
              className="mx-auto mb-4"
              priority
            />
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your admin dashboard</p>
            </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 pl-12 pr-4 py-4 text-gray-900 placeholder:text-gray-500 focus:border-yellow-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 pl-12 pr-4 py-4 text-gray-900 placeholder:text-gray-500 focus:border-yellow-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 py-4 text-lg font-bold text-white hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-yellow-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign In to Dashboard"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Secure admin access • Protected by encryption
          </p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
