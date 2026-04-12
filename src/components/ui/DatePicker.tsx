"use client";

import React from "react";
import { useTheme } from "@/src/context/ThemeContext";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = "Select date", className = "" }: DatePickerProps) {
  const { darkMode } = useTheme();

  return (
    <div className={`relative ${className}`}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors focus:outline-none focus:border-yellow-500 ${
          darkMode
            ? "bg-gray-800 border-gray-600 text-gray-200 [color-scheme:dark]"
            : "bg-white border-gray-300 text-gray-700 [color-scheme:light]"
        } ${value ? "border-yellow-500" : ""} hover:border-yellow-500`}
      />
    </div>
  );
}
