import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Toaster } from "react-hot-toast"; // 1. Import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elora System Management",
  description: "Internal management system for Elora Crafting Arts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="bottom-center" />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
