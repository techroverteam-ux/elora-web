"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import api from "@/src/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const { darkMode } = useTheme();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");

  // UI State
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate random captcha on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptcha("");
  };

  const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserCaptcha(e.target.value.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Validate Captcha
    if (userCaptcha !== captchaCode) {
      setError("Incorrect captcha code. Please try again.");
      generateCaptcha();
      return;
    }

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
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // UPDATED: Changed 'min-h-screen' to 'h-screen w-full overflow-hidden' to prevent scrolling
    <div
      className={`h-screen w-full overflow-hidden flex transition-colors duration-300 ${
        darkMode ? "bg-black" : "bg-white"
      }`}
    >
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 h-full">
          <Image
            src="/logo-dark.svg"
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
      {/* Added h-full to ensure it takes full height of the container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 h-full">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/logo-dark.svg"
              alt="Logo"
              width={180}
              height={90}
              className="mx-auto mb-4"
              priority
            />
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
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
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 pl-12 pr-12 py-4 text-gray-900 placeholder:text-gray-500 focus:border-yellow-500 focus:bg-white focus:outline-none transition-all"
                  />
                  {/* Toggle Password Visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Captcha Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Security Check
                </label>
                <div className="flex gap-3">
                  {/* Captcha Display */}
                  <div className="flex-1 bg-gray-100 border-2 border-gray-200 rounded-xl flex items-center justify-between px-4 select-none">
                    <span className="text-xl font-mono font-bold tracking-widest text-gray-600 line-through decoration-yellow-500/50 decoration-2">
                      {captchaCode}
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Captcha Input */}
                  <div className="w-1/2">
                    <input
                      type="text"
                      required
                      value={userCaptcha}
                      onChange={handleCaptchaChange}
                      placeholder="ENTER CODE"
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3.5 text-center font-bold tracking-widest text-gray-900 placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal focus:border-yellow-500 focus:bg-white focus:outline-none transition-all"
                      maxLength={6}
                    />
                  </div>
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
