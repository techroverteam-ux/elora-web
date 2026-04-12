"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel?: string;
  className?: string;
}

export default function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  allLabel = "All",
  className = "",
}: FilterDropdownProps) {
  const { darkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val: string) => {
    if (val === "__all__") { onChange([]); return; }
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  const displayLabel =
    selected.length === 0 ? label :
    selected.length === 1 ? selected[0] :
    `${selected.length} selected`;

  const btnClass = `w-full px-3 py-2 rounded-lg border text-sm font-medium text-left flex items-center justify-between gap-2 focus:outline-none transition-colors ${
    darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"
  } ${selected.length > 0 ? "border-yellow-500" : ""} hover:border-yellow-500`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => { setOpen(!open); setSearch(""); }} className={btnClass}>
        <span className="truncate">{displayLabel}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="text-yellow-500 hover:text-yellow-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""} ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
        </div>
      </button>

      {open && (
        <div className={`absolute z-50 mt-1 w-full min-w-[180px] rounded-lg shadow-xl border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          {/* Search input */}
          <div className={`p-2 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-md border focus:outline-none focus:border-yellow-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Options list — max 4 rows (~168px), scroll for more */}
          <div className="overflow-y-auto" style={{ maxHeight: "175px" }}>
            {/* "All" option */}
            <div
              onClick={() => toggle("__all__")}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm font-medium ${
                selected.length === 0
                  ? "text-yellow-500"
                  : darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{allLabel}</span>
              {selected.length === 0 && <Check className="w-4 h-4 text-yellow-500" />}
            </div>

            {filtered.length === 0 && (
              <div className={`px-3 py-3 text-xs text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                No results
              </div>
            )}

            {filtered.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm ${
                    isSelected
                      ? darkMode ? "bg-yellow-900/20 text-yellow-400" : "bg-yellow-50 text-yellow-700"
                      : darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
