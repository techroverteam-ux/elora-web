"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  User,
  Settings,
  Menu,
  Sun,
  Moon,
  Loader2,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { HowItWorks } from "@/src/components/detail";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import api from "@/src/lib/api";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const pathname = usePathname() || "";
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showNotifications && notifications.length === 0) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Load once on start so the bell shows a count before it is opened.
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = (link: string) => {
    setShowNotifications(false);
    router.push(link);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`h-20 sticky top-0 z-30 border-b transition-colors ${
        darkMode
          ? "bg-black/95 backdrop-blur border-purple-700/50"
          : "bg-white/95 backdrop-blur border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Mobile: Logo + Menu button grouped */}
        <div className="flex items-center gap-4 md:hidden">
          <div className="relative h-10 w-24">
            <Image
              src="/logo.svg"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <button
            onClick={onMobileMenuToggle}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop: where am I */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
          {crumbs(pathname).map((c, i, all) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className={`w-4 h-4 shrink-0 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />}
              {c.href && i < all.length - 1 ? (
                <button onClick={() => router.push(c.href!)} className={`truncate hover:underline ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {c.label}
                </button>
              ) : (
                <span className={`truncate font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* How it works */}
          <button
            onClick={() => setShowGuide(true)}
            aria-label="How it works"
            title="How a store moves through Elora"
            className={`flex items-center gap-1.5 p-2 rounded-lg text-sm font-medium transition-colors ${
              darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="hidden lg:inline">How it works</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-800 text-yellow-500"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={`Notifications${notifications.length ? `, ${notifications.length}` : ""}`}
              className={`p-2 rounded-lg transition-colors relative ${
                darkMode
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg border overflow-hidden z-50 ${
                  darkMode
                    ? "bg-gray-800 border-gray-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`px-4 py-3 border-b ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <h3
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className={`p-8 text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.link)}
                        className={`px-4 py-3 border-b transition-colors cursor-pointer ${
                          darkMode
                            ? "border-gray-700 hover:bg-gray-700"
                            : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-2 bg-yellow-500"></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {getTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Account menu"
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p
                  className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {user?.name}
                </p>
                <p
                  className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {user?.roles?.[0]?.name || "User"}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden ${
                  darkMode
                    ? "bg-gray-800 border-gray-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="py-2">
                  <div className={`px-4 py-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Signed in as<br />
                    <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{user?.email || user?.name}</span>
                  </div>
                  <hr className={`my-1 ${darkMode ? "border-gray-600" : "border-gray-200"}`} />
                  <button
                    onClick={logout}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 text-red-600 transition-colors ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <HowItWorks open={showGuide} onClose={() => setShowGuide(false)} />
    </header>
  );
}

const SECTIONS: Record<string, { label: string; href: string; detail?: string }> = {
  dashboard: { label: "Dashboard", href: "/dashboard" },
  clients: { label: "Clients", href: "/clients" },
  users: { label: "Users", href: "/users", detail: "User details" },
  roles: { label: "Roles", href: "/roles" },
  stores: { label: "Store Operations", href: "/stores" },
  store: { label: "Store Operations", href: "/stores", detail: "Store details" },
  recce: { label: "Recce", href: "/recce", detail: "Recce" },
  installation: { label: "Installation", href: "/installation", detail: "Installation" },
  elements: { label: "Element Mapping", href: "/elements" },
  rfq: { label: "RFQ Generation", href: "/rfq" },
  enquiries: { label: "Enquiries", href: "/enquiries" },
  reports: { label: "Reports", href: "/reports", detail: "Report" },
};

/** Breadcrumb from the URL: section, then the detail page name if there is one. */
function crumbs(pathname: string): Array<{ label: string; href?: string }> {
  const parts = pathname.split("/").filter(Boolean);
  const sec = SECTIONS[parts[0]];
  if (!sec) return [{ label: "Elora" }];
  const out: Array<{ label: string; href?: string }> = [{ label: sec.label, href: sec.href }];
  if (parts.length > 1) out.push({ label: sec.detail || "Details" });
  if (parts[2] === "review") out.push({ label: "Review photos" });
  return out;
}
