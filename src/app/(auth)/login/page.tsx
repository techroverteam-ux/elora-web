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
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);
      console.log("All cookies:", document.cookie);
      
      // Small delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("Cookies after delay:", document.cookie);
      
      // Call login function which will fetch user data and redirect
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
    <div className={`h-screen w-full overflow-hidden flex transition-colors duration-300 ${
      darkMode ? "bg-gray-900" : "bg-white"
    }`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 1000px ${darkMode ? '#374151' : '#f9fafb'} inset !important;
            -webkit-text-fill-color: ${darkMode ? '#ffffff' : '#111827'} !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `
      }} />
      {/* Left Side - Branding */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden h-full transition-all duration-300 ${
        darkMode 
          ? "bg-gray-900" 
          : "bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500"
      }`}>
        <div className={`absolute inset-0 ${
          darkMode ? "bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50" : "bg-black/10"
        }`}></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 h-full">
          <Image
            src={darkMode ? "/logo.svg" : "/logo-dark.svg"}
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
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 h-full transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src={darkMode ? "/logo.svg" : "/logo-dark.svg"}
              alt="Logo"
              width={180}
              height={90}
              className="mx-auto mb-4"
              priority
            />
          </div>

          <div className={`rounded-3xl p-8 transition-all duration-300 ${
            darkMode 
              ? "bg-gray-800/50 border border-gray-700/50 shadow-xl" 
              : "bg-white shadow-2xl"
          }`}>
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                Welcome Back
              </h2>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                Sign in to your admin dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
                darkMode 
                  ? "border-red-900/50 bg-red-950/30 text-red-400" 
                  : "border-red-200 bg-red-50"
              }`}>
                <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  darkMode ? "text-red-400" : "text-red-500"
                }`} />
                <p className={`text-sm ${
                  darkMode ? "text-red-400" : "text-red-700"
                }`}>{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}>
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
                    className={`w-full rounded-xl border-2 pl-12 pr-4 py-4 focus:border-yellow-500 focus:outline-none transition-all ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600"
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}>
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
                    className={`w-full rounded-xl border-2 pl-12 pr-12 py-4 focus:border-yellow-500 focus:outline-none transition-all ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600"
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white"
                    }`}
                  />
                  {/* Toggle Password Visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none ${
                      darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                    }`}
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
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Security Check
                </label>
                <div className="flex gap-3">
                  {/* Captcha Display */}
                  <div className={`flex-1 border-2 rounded-xl flex items-center justify-between px-4 select-none ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-200"
                  }`}>
                    <span className={`text-xl font-mono font-bold tracking-widest line-through decoration-yellow-500/50 decoration-2 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {captchaCode}
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className={`p-1 rounded-full transition-colors ${
                        darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
                      }`}
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
                      className={`w-full rounded-xl border-2 px-4 py-3.5 text-center font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal focus:border-yellow-500 focus:outline-none transition-all ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:bg-gray-600"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white"
                      }`}
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
              <p className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                Secure admin access • Protected by encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
