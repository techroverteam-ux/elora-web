"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import api from "@/src/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
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
      login();
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
    <div
      className="
    relative min-h-screen flex items-center justify-center px-4
    bg-gradient-to-br from-[#c4d6fc] via-[#ffffff] to-[#c4d6fc]
    bg-[length:200%_200%] animate-gradient
  "
    >
      {/* Subtle background glow for depth */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.svg"
            alt="Elora Logo"
            width={56}
            height={56}
            className="mb-3"
            priority
          />
          <h1 className="text-2xl font-semibold text-gray-900">Elora System</h1>
          <p className="mt-1 text-sm text-gray-500 text-center">
            Sign in to access the management portal
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@elora.com"
                className="
                w-full rounded-lg border border-gray-300 bg-white
                pl-10 pr-3 py-2.5 text-sm text-gray-900
                placeholder:text-gray-400
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                focus:outline-none transition
              "
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="
                w-full rounded-lg border border-gray-300 bg-white
                pl-10 pr-3 py-2.5 text-sm text-gray-900
                placeholder:text-gray-400
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                focus:outline-none transition
              "
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="
            w-full flex items-center justify-center gap-2
            rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white
            hover:bg-blue-700 active:scale-[0.99]
            focus:outline-none focus:ring-2 focus:ring-blue-500/30
            disabled:opacity-60 disabled:cursor-not-allowed
            transition
          "
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
