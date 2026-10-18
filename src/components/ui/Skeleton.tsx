"use client";

// Loading placeholders that copy the shape of the real page, so nothing jumps when data arrives.
// They read dark mode from ThemeContext (the app toggles it with state, not Tailwind's `dark:`).

import React from "react";
import { useTheme } from "@/src/context/ThemeContext";

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const useBoneColors = () => {
  const { darkMode } = useTheme();
  return {
    dark: darkMode,
    bone: darkMode ? "bg-gray-800" : "bg-gray-200",
    boneSoft: darkMode ? "bg-gray-800/60" : "bg-gray-100",
    card: darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
    head: darkMode ? "bg-gray-800/70" : "bg-gray-50",
    divide: darkMode ? "divide-gray-800" : "divide-gray-100",
    border: darkMode ? "border-gray-800" : "border-gray-200",
  };
};

/** Screen-reader text and busy state for a loading region. */
const Busy = ({ label = "Loading", children, className }: { label?: string; children: React.ReactNode; className?: string }) => (
  <div role="status" aria-busy="true" aria-live="polite" className={className}>
    <span className="sr-only">{label}…</span>
    {children}
  </div>
);

interface SkeletonProps {
  className?: string;
  soft?: boolean;
}

export const Skeleton = ({ className = "", soft }: SkeletonProps) => {
  const c = useBoneColors();
  return <div aria-hidden="true" className={cn("rounded motion-safe:animate-pulse", soft ? c.boneSoft : c.bone, className)} />;
};

// Varied widths so rows look like text, not a grid of identical bars.
const WIDTHS = ["w-24", "w-16", "w-20", "w-28", "w-14", "w-24", "w-20", "w-16", "w-28", "w-12"];
const w = (row: number, col: number) => WIDTHS[(row * 3 + col * 7) % WIDTHS.length];

/** Title + description + action buttons, matching PageIntro. */
export const PageHeaderSkeleton = ({ actions = 2 }: { actions?: number }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-2">
      <Skeleton className="h-7 w-48 rounded-lg" />
      <Skeleton className="h-4 w-72 max-w-full" soft />
    </div>
    {actions > 0 && (
      <div className="flex gap-2">
        {Array.from({ length: actions }).map((_, i) => (
          <Skeleton key={i} className={cn("h-10 rounded-lg", i === actions - 1 ? "w-32" : "w-24")} />
        ))}
      </div>
    )}
  </div>
);

/** Search box + filter dropdowns. */
export const ToolbarSkeleton = ({ filters = 3 }: { filters?: number }) => {
  const c = useBoneColors();
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center", c.card)}>
      <Skeleton className="h-10 w-full rounded-lg md:max-w-sm" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: filters }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-lg" soft />
        ))}
      </div>
    </div>
  );
};

/** Row of KPI / stat tiles. */
export const StatTilesSkeleton = ({ count = 4 }: { count?: number }) => {
  const c = useBoneColors();
  const cols = count >= 5 ? "lg:grid-cols-5" : count === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("space-y-3 rounded-xl border p-4", c.card)}>
          <Skeleton className="h-3 w-20" soft />
          <Skeleton className="h-7 w-14 rounded-md" />
        </div>
      ))}
    </div>
  );
};

/** Table body only (header + rows). Keeps the old `rows` / `cols` props. */
export const TableSkeleton = ({ rows = 5, cols = 8, checkbox = false }: { rows?: number; cols?: number; checkbox?: boolean }) => {
  const c = useBoneColors();
  return (
    <div className="overflow-hidden">
      <table className="min-w-full">
        <thead className={c.head}>
          <tr>
            {checkbox && (
              <th className="w-12 px-4 py-3">
                <Skeleton className="h-4 w-4" />
              </th>
            )}
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className={cn("h-3", i === 0 ? "w-28" : "w-16")} soft />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn("divide-y", c.divide)}>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {checkbox && (
                <td className="px-4 py-4">
                  <Skeleton className="h-4 w-4" soft />
                </td>
              )}
              {Array.from({ length: cols }).map((_, col) => (
                <td key={col} className="px-4 py-4">
                  {col === 0 ? (
                    <div className="space-y-1.5">
                      <Skeleton className={cn("h-4", r % 2 ? "w-40" : "w-32")} />
                      <Skeleton className="h-3 w-20" soft />
                    </div>
                  ) : col === 1 ? (
                    <Skeleton className="h-6 w-24 rounded-full" />
                  ) : col === cols - 1 ? (
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" soft />
                      <Skeleton className="h-8 w-8 rounded-lg" soft />
                    </div>
                  ) : (
                    <Skeleton className={cn("h-4", w(r, col))} soft />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** One record as a card (mobile list item). */
export const CardSkeleton = () => {
  const c = useBoneColors();
  return (
    <div className={cn("space-y-3 rounded-xl border p-4", c.card)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-24" soft />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-4 w-full" soft />
        <Skeleton className="h-4 w-3/4" soft />
        <Skeleton className="h-4 w-1/2" soft />
        <Skeleton className="h-4 w-2/3" soft />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 flex-1 rounded-lg" soft />
        <Skeleton className="h-9 w-9 rounded-lg" soft />
      </div>
    </div>
  );
};

export const CardListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/** A list that is a table on desktop and cards on phones, like the real list pages. */
export const ListSkeleton = ({ rows = 8, cols = 7, checkbox = false, bare = false }: { rows?: number; cols?: number; checkbox?: boolean; bare?: boolean }) => {
  const c = useBoneColors();
  return (
    <Busy label="Loading list">
      <div className={cn("hidden lg:block", !bare && cn("overflow-hidden rounded-xl border", c.card))}>
        <TableSkeleton rows={rows} cols={cols} checkbox={checkbox} />
      </div>
      <div className={cn("lg:hidden", bare && "p-4")}>
        <CardListSkeleton count={Math.min(rows, 4)} />
      </div>
    </Busy>
  );
};

/** Chart card placeholder with axis and bars. */
export const ChartSkeleton = ({ height = "h-64", title = true }: { height?: string; title?: boolean }) => {
  const c = useBoneColors();
  const bars = [55, 80, 40, 95, 65, 75, 35, 85];
  return (
    <div className={cn("rounded-xl border p-4", c.card)}>
      {title && (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" soft />
        </div>
      )}
      <div className={cn("flex items-end gap-3 border-b border-l pl-3", c.border, height)}>
        {bars.map((h, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <div className="w-full" style={{ height: `${h}%` }}>
              <Skeleton className="h-full w-full rounded-b-none rounded-t-md" soft={i % 2 === 1} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Form sections: label + input pairs in a two-column grid. */
export const FormSkeleton = ({ sections = 3, fields = 4 }: { sections?: number; fields?: number }) => {
  const c = useBoneColors();
  return (
    <Busy label="Loading form" className="space-y-4">
      {Array.from({ length: sections }).map((_, s) => (
        <div key={s} className={cn("rounded-xl border", c.card)}>
          <div className={cn("flex items-center gap-2 border-b px-4 py-3", c.border)}>
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {Array.from({ length: fields }).map((_, f) => (
              <div key={f} className={cn("space-y-2", f === fields - 1 && fields % 2 === 1 && "sm:col-span-2")}>
                <Skeleton className="h-3 w-24" soft />
                <Skeleton className="h-10 w-full rounded-lg" soft />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Busy>
  );
};

/** A whole list page: header, optional stats, toolbar and list. */
export const ListPageSkeleton = ({
  actions = 2,
  stats = 0,
  filters = 3,
  rows = 8,
  cols = 7,
  checkbox = false,
}: {
  actions?: number;
  stats?: number;
  filters?: number;
  rows?: number;
  cols?: number;
  checkbox?: boolean;
}) => (
  <Busy label="Loading page" className="space-y-4">
    <PageHeaderSkeleton actions={actions} />
    {stats > 0 && <StatTilesSkeleton count={stats} />}
    {filters >= 0 && <ToolbarSkeleton filters={filters} />}
    <ListSkeleton rows={rows} cols={cols} checkbox={checkbox} />
  </Busy>
);

/** Thin moving bar shown on top of content that is refreshing (data stays visible). */
export const RefreshBar = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden" role="progressbar" aria-label="Refreshing" aria-busy="true">
      <div className="h-full w-1/3 bg-yellow-500 motion-safe:animate-[elora-refresh_1.1s_ease-in-out_infinite]" />
      <style>{`@keyframes elora-refresh{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
};

/** Report-style page: header, KPI tiles, charts and a table. */
export const ReportPageSkeleton = ({ stats = 5, charts = 2, table = true }: { stats?: number; charts?: number; table?: boolean }) => (
  <Busy label="Loading report" className="space-y-6">
    <PageHeaderSkeleton actions={1} />
    <StatTilesSkeleton count={stats} />
    {charts > 0 && (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: charts }).map((_, i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    )}
    {table && <ListSkeleton rows={5} cols={6} />}
  </Busy>
);

/** A person's page: avatar + name, stat tiles and their work list. */
export const ProfileSkeleton = () => {
  const c = useBoneColors();
  return (
    <Busy label="Loading profile" className="space-y-6">
      <div className={cn("flex items-center gap-4 rounded-xl border p-5", c.card)}>
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 max-w-full" soft />
        </div>
        <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
      </div>
      <StatTilesSkeleton count={4} />
      <ListSkeleton rows={6} cols={6} />
    </Busy>
  );
};
