"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// 1. IMPORT THE STORE ICON HERE
import {
  LayoutDashboard,
  Users,
  Shield,
  Map,
  Hammer,
  X,
  Store,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["all"],
    },
    {
      name: "User Management",
      href: "/users",
      icon: Users,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Role Management",
      href: "/roles",
      icon: Shield,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    // --- NEW LINK ADDED HERE ---
    {
      name: "Store Operations",
      href: "/stores",
      icon: Store,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    // ---------------------------
    {
      name: "Recce",
      href: "/recce",
      icon: Map,
      roles: ["SUPER_ADMIN", "FIELD_STAFF"],
    },
    {
      name: "Installation",
      href: "/installation",
      icon: Hammer,
      roles: ["SUPER_ADMIN", "FIELD_STAFF"],
    },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* MOBILE OVERLAY: Dark background when menu is open on mobile */}
      <div
        className={`fixed inset-0 z-30 bg-gray-600 bg-opacity-75 transition-opacity md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* SIDEBAR CONTAINER */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:fixed md:inset-y-0
      `}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sidebar Header with LOGO */}
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-gray-800">
            <div className="flex items-center space-x-3">
              {/* Logo Container */}
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.svg" // Make sure this matches your actual file name (logo.png or logo.svg)
                  alt="Elora Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* Company Name */}
              <span className="text-xl font-bold text-white tracking-wider">
                ELORA
              </span>
            </div>

            {/* Close Button (Mobile Only) */}
            <button
              className="md:hidden text-gray-200 hover:text-white focus:outline-none"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const userRoleCode = user?.role?.code || "";
                const hasAccess =
                  item.roles.includes("all") ||
                  item.roles.includes(userRoleCode);

                if (!hasAccess) return null;

                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-300"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Footer */}
          <div className="flex-shrink-0 flex bg-gray-800 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs font-medium text-gray-400 capitalize">
                  {user?.role?.name}
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
