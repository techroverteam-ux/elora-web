"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  Store,
  Map,
  Hammer,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  // --- HELPER: CHECK PERMISSIONS DYNAMICALLY ---
  const canView = (moduleName: string) => {
    // 1. If no user or roles, deny
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;

    // 2. SUPER_ADMIN bypass: They see everything
    if (user.roles.some((r: any) => r.code === "SUPER_ADMIN")) {
      return true;
    }

    // 3. Check if ANY assigned role has 'view' permission for this module
    return user.roles.some((role: any) => {
      const perms = role.permissions;

      // Safety check: ensure permissions exist
      if (!perms) return false;

      // Check standard object access (e.g., perms['recce'].view)
      // We use optional chaining (?.) to prevent crashes if the module key is missing
      if (perms[moduleName]?.view === true) {
        return true;
      }

      return false;
    });
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      module: "dashboard",
      alwaysShow: true, // Dashboard is usually visible to all logged-in users
    },
    {
      name: "User Management",
      href: "/users",
      icon: Users,
      module: "users",
    },
    {
      name: "Role Management",
      href: "/roles",
      icon: Shield,
      module: "roles",
    },
    {
      name: "Store Operations",
      href: "/stores",
      icon: Store,
      module: "stores",
    },
    {
      name: "Recce",
      href: "/recce",
      icon: Map,
      module: "recce",
    },
    {
      name: "Installation",
      href: "/installation",
      icon: Hammer,
      module: "installation",
    },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* SIDEBAR CONTAINER */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:fixed md:inset-y-0 ${
          darkMode
            ? "bg-gradient-to-b from-black via-purple-900/20 to-black border-r border-purple-700/30"
            : "bg-gradient-to-b from-white via-yellow-50/30 to-white border-r border-gray-200"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sidebar Header with LOGO */}
          <div
            className={`flex items-center justify-between h-20 flex-shrink-0 px-6 border-b ${
              darkMode
                ? "bg-purple-900/30 border-purple-700/50"
                : "bg-yellow-50/50 border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="relative h-12 w-24">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
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
              <button
                className={`md:hidden p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "text-gray-300 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col overflow-y-auto py-6">
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => {
                // --- DYNAMIC ACCESS CHECK ---
                // If 'alwaysShow' is true OR user has permission for this module
                const hasAccess =
                  (item as any).alwaysShow || canView(item.module);

                if (!hasAccess) return null;

                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all transform hover:scale-[1.02] ${
                      isActive
                        ? darkMode
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-yellow-500 text-white shadow-lg"
                        : darkMode
                          ? "text-gray-300 hover:bg-purple-900/30 hover:text-white"
                          : "text-gray-700 hover:bg-yellow-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-5 w-5 ${
                        isActive
                          ? "text-yellow-500"
                          : darkMode
                            ? "text-gray-400 group-hover:text-gray-300"
                            : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Footer */}
          <div
            className={`flex-shrink-0 p-4 border-t ${
              darkMode
                ? "bg-purple-900/30 border-purple-700/50"
                : "bg-yellow-50/50 border-gray-200"
            }`}
          >
            <div
              className={`flex items-center p-3 rounded-xl ${
                darkMode ? "bg-gray-800/50" : "bg-white/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  darkMode ? "bg-yellow-500" : "bg-yellow-600"
                }`}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {user?.name}
                </p>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {/* Display Logic: "FirstRoleName [+N others]" */}
                  {user?.roles && user.roles.length > 0 ? (
                    <>
                      {user.roles[0].name}
                      {user.roles.length > 1 && (
                        <span
                          className="ml-1 opacity-80"
                          title={user.roles.map((r: any) => r.name).join(", ")}
                        >
                          +{user.roles.length - 1}
                        </span>
                      )}
                    </>
                  ) : (
                    "No Role"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
