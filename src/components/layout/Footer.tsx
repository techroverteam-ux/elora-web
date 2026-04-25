"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";

const Footer = () => {
  const { darkMode } = useTheme();

  return (
    <footer
      className={`mt-auto py-4 px-6 border-t transition-colors ${
        darkMode
          ? "bg-black/50 border-purple-700/30 text-gray-400"
          : "bg-gray-50/50 border-gray-200 text-gray-600"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-red-500 fill-current" />
          <span>and powered by</span>
        </div>
        <a
          href="https://www.techrover.co.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-500 hover:text-yellow-600 font-semibold transition-colors"
        >
          TechRover
        </a>
      </div>
    </footer>
  );
};

export default Footer;