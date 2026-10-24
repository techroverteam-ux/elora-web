"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isSubAdmin, SUB_ADMIN_BLOCKED_PATHS } from "@/src/lib/roles";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import Header from "@/src/components/layout/Header";
import Sidebar from "@/src/components/layout/Sidebar";
import Footer from "@/src/components/layout/Footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  // Sub Admins can't open User Management, Role Management or Element Mapping by URL
  const blockedForSubAdmin =
    isSubAdmin(user) && SUB_ADMIN_BLOCKED_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
  const { darkMode } = useTheme();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && blockedForSubAdmin) router.replace("/dashboard");
  }, [isLoading, blockedForSubAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || blockedForSubAdmin) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${
      darkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="md:pl-72 flex flex-col flex-1">
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
