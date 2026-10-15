"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Users,
  CheckCircle2,
  Filter,
  Calendar,
  Loader2,
  BarChart3,
  Hammer,
  Camera,
  ArrowRight,
  ClipboardCheck,
  UserPlus,
  AlertTriangle,
  Eye,
  Sparkles,
  X,
} from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import api from "@/src/lib/api";
import {
  Btn,
  PageIntro,
  Section,
  StageStrip,
  StatusCell,
  cx,
  timeAgo,
  toneClasses,
  useSurface,
  Tone,
} from "@/src/components/detail";

export default function DashboardPage() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const s = useSurface();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "", zone: "", state: "", store: "", client: "", city: "", district: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  // Re-render every 15 s so "Updated x ago" stays true.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const fetchStats = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/dashboard/stats?${params}`);
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  };

  const [internalDates, setInternalDates] = useState({ startDate: "", endDate: "" });

  const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setInternalDates({ ...internalDates, [field]: value });
    if (value) {
      setFilters({ ...filters, [field]: formatDateToDisplay(value) });
    } else {
      setFilters({ ...filters, [field]: "" });
    }
  };

  // Keep the old numbers on screen while new ones load, instead of blanking the page.
  const applyFilters = () => {
    fetchStats(!!stats);
  };

  const resetFilters = () => {
    setFilters({ startDate: "", endDate: "", status: "", zone: "", state: "", store: "", client: "", city: "", district: "" });
    setInternalDates({ startDate: "", endDate: "" });
    fetchStats(!!stats);
  };

  if (loading && !stats) return <DashboardSkeleton dark={darkMode} />;

  /* ---------------- derived numbers ---------------- */
  const counts: Record<string, number> = {};
  (stats?.statusBreakdown || []).forEach((r: any) => {
    if (r?._id) counts[r._id] = Number(r.count || 0);
  });
  const c = (...keys: string[]) => keys.reduce((n, k) => n + (counts[k] || 0), 0);
  const totalStores = Number(stats?.kpi?.totalStores || 0);
  const recceDone = Number(stats?.kpi?.recceDoneTotal || 0);
  const installDone = Number(stats?.kpi?.installationDoneTotal || 0);
  const awaitingRecce = Math.max(0, totalStores - recceDone);
  const isAdmin = !!stats?.isAdmin;

  const attention: Array<{ key: string; label: string; hint: string; n: number; tone: Tone; icon: React.ReactNode; href: string }> = isAdmin
    ? [
        { key: "review", label: "Recces to review", hint: "Approve or reject the board photos", n: c("RECCE_SUBMITTED"), tone: "warning", icon: <ClipboardCheck className="h-4 w-4" />, href: "/recce?status=RECCE_SUBMITTED" },
        { key: "installer", label: "Need an installer", hint: "Recce approved, nobody assigned yet", n: c("RECCE_APPROVED"), tone: "violet", icon: <UserPlus className="h-4 w-4" />, href: "/stores?status=RECCE_APPROVED" },
        { key: "new", label: "Need a recce user", hint: "New stores nobody has visited", n: c("UPLOADED", "MANUALLY_ADDED"), tone: "neutral", icon: <Camera className="h-4 w-4" />, href: "/stores" },
        { key: "check", label: "Installations to check", hint: "Installed photos waiting for a final check", n: c("INSTALLATION_SUBMITTED"), tone: "warning", icon: <Eye className="h-4 w-4" />, href: "/stores?status=INSTALLATION_SUBMITTED" },
        { key: "redo", label: "Sent back for redo", hint: "Rejected recces and installations", n: c("RECCE_REJECTED", "INSTALLATION_REJECTED"), tone: "danger", icon: <AlertTriangle className="h-4 w-4" />, href: "/stores?status=RECCE_REJECTED,INSTALLATION_REJECTED" },
      ]
    : [
        { key: "visit", label: "Recce visits to do", hint: "Go to the store, photograph and measure", n: c("RECCE_ASSIGNED"), tone: "info", icon: <Camera className="h-4 w-4" />, href: "/recce" },
        { key: "reshoot", label: "Recces to re-shoot", hint: "Some boards were rejected", n: c("RECCE_REJECTED"), tone: "danger", icon: <AlertTriangle className="h-4 w-4" />, href: "/recce" },
        { key: "install", label: "Installations to do", hint: "Put up the boards and upload photos", n: c("INSTALLATION_ASSIGNED"), tone: "info", icon: <Hammer className="h-4 w-4" />, href: "/installation" },
        { key: "redo", label: "Installations to redo", hint: "The installation was rejected", n: c("INSTALLATION_REJECTED"), tone: "danger", icon: <AlertTriangle className="h-4 w-4" />, href: "/installation" },
      ];
  const openItems = attention.filter((a) => a.n > 0);

  const activeFilters = Object.entries(filters).filter(([, v]) => !!v);
  const filterLabel: Record<string, string> = { startDate: "From", endDate: "To", store: "Store", client: "Client", zone: "Zone", state: "State", city: "City", district: "District", status: "Status" };
  const inputCls = `px-3 py-2 rounded-lg border text-sm w-full ${darkMode ? "bg-gray-950 border-gray-700 text-white placeholder:text-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <PageIntro
        title="Dashboard"
        description={isAdmin ? "What needs attention today, and where every store is in the workflow." : "Your work for today and where your stores are."}
        actions={
          <>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cx(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                autoRefresh
                  ? darkMode ? "border-green-800 bg-green-950/40 text-green-300" : "border-green-200 bg-green-50 text-green-800"
                  : darkMode ? "border-gray-700 bg-gray-900 text-gray-400" : "border-gray-200 bg-white text-gray-500"
              )}
              title={autoRefresh ? "Numbers refresh every 30 seconds. Click to pause." : "Auto-refresh is paused. Click to resume."}
            >
              {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className={cx("h-2 w-2 rounded-full", autoRefresh ? "bg-green-500" : "bg-gray-400")} />}
              {autoRefresh ? "Live" : "Paused"}
              {lastUpdated && <span className="hidden opacity-75 sm:inline">· updated {timeAgo(lastUpdated)}</span>}
            </button>
            <Btn variant="secondary" icon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters(!showFilters)}>
              Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
            </Btn>
          </>
        }
      />

      {/* Applied filters, visible even when the panel is closed */}
      {activeFilters.length > 0 && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx("text-xs font-medium", s.muted)}>Filtered by:</span>
          {activeFilters.map(([k, v]) => (
            <span key={k} className={cx("rounded-full border px-2.5 py-0.5 text-xs font-medium", s.dark ? "border-gray-700 bg-gray-900 text-gray-200" : "border-gray-200 bg-white text-gray-700")}>
              {filterLabel[k] || k}: {v}
            </span>
          ))}
          <button onClick={resetFilters} className={cx("inline-flex items-center gap-1 text-xs font-semibold", s.muted)}>
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className={cx("rounded-xl border p-4", s.card)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={cx("mb-1 block text-xs font-semibold", s.body)}>From date</span>
              <input type="date" value={internalDates.startDate} onChange={(e) => handleDateChange("startDate", e.target.value)} className={inputCls} style={{ colorScheme: darkMode ? "dark" : "light" }} />
            </label>
            <label className="block">
              <span className={cx("mb-1 block text-xs font-semibold", s.body)}>To date</span>
              <input type="date" value={internalDates.endDate} onChange={(e) => handleDateChange("endDate", e.target.value)} className={inputCls} style={{ colorScheme: darkMode ? "dark" : "light" }} />
            </label>
            {(
              [
                ["store", "Store name or code"],
                ["client", "Client code"],
                ["zone", "Zone"],
                ["state", "State"],
                ["city", "City"],
                ["district", "District"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className={cx("mb-1 block text-xs font-semibold", s.body)}>{label}</span>
                <input type="text" value={(filters as any)[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} className={inputCls} />
              </label>
            ))}
          </div>
          <div className={cx("mt-4 flex justify-end gap-2 border-t pt-3", s.divider)}>
            <Btn variant="secondary" onClick={resetFilters}>
              Reset
            </Btn>
            <Btn variant="primary" loading={refreshing} onClick={applyFilters}>
              Apply filters
            </Btn>
          </div>
        </div>
      )}

      {/* Needs attention */}
      <Section
        title={isAdmin ? "Needs your attention" : "Your work"}
        icon={<Sparkles className="h-4 w-4" />}
        subtitle={openItems.length === 0 ? "Nothing waiting right now." : "Click a line to open those stores."}
        bodyClassName="p-2"
      >
        {openItems.length === 0 ? (
          <p className={cx("flex items-center gap-2 px-2 py-3 text-sm", s.muted)}>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> All caught up. New work will show here.
          </p>
        ) : (
          <ul className="divide-y divide-transparent">
            {openItems.map((a) => {
              const t = toneClasses(a.tone, s.dark);
              return (
                <li key={a.key}>
                  <button
                    onClick={() => router.push(a.href)}
                    className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors", s.hover)}
                  >
                    <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", t.badge)}>{a.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cx("block text-sm font-semibold", s.text)}>{a.label}</span>
                      <span className={cx("block text-xs", s.muted)}>{a.hint}</span>
                    </span>
                    <span className={cx("text-xl font-bold tabular-nums", s.text)}>{a.n}</span>
                    <ArrowRight className={cx("h-4 w-4", s.faint)} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Pipeline */}
      <StageStrip
        title="Where stores are"
        counts={counts}
        onSelect={(statuses) => statuses.length && router.push(`/stores?status=${statuses.join(",")}`)}
        hint="Click a stage to see its stores. Hover for what happens there."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard title={isAdmin ? "Total stores" : "Assigned to me"} value={totalStores} icon={<MapPin className="h-4 w-4" />} today={stats?.kpi?.newStoresToday} todayLabel="added today" darkMode={darkMode} />
        {isAdmin && stats?.kpi?.totalClients !== undefined && (
          <StatCard title="Clients" value={stats?.kpi?.totalClients || 0} icon={<Users className="h-4 w-4" />} color="purple" darkMode={darkMode} />
        )}
        <StatCard title="Recces done" value={recceDone} icon={<CheckCircle2 className="h-4 w-4" />} today={stats?.kpi?.recceDoneToday} todayLabel="today" color="blue" darkMode={darkMode} />
        <StatCard title="Awaiting recce" value={awaitingRecce} icon={<Camera className="h-4 w-4" />} subtitle="Stores without a submitted recce" color="orange" darkMode={darkMode} />
        <StatCard title="Installations done" value={installDone} icon={<Hammer className="h-4 w-4" />} today={stats?.kpi?.installationDoneToday} todayLabel="today" color="green" darkMode={darkMode} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Zone Distribution */}
        <Section title="Stores by zone" icon={<BarChart3 className="h-4 w-4" />}>
          {stats?.zoneDistribution && stats.zoneDistribution.length > 0 ? (
            <ul className="space-y-3">
              {stats.zoneDistribution.map((item: any) => (
                <li key={item._id || "none"} className="flex items-center gap-3">
                  <span className={cx("w-28 shrink-0 truncate text-sm", item._id ? s.body : s.faint)}>{item._id || "Zone not set"}</span>
                  <div className={cx("h-2 flex-1 rounded-full", s.dark ? "bg-gray-800" : "bg-gray-200")}>
                    <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${totalStores ? (item.count / totalStores) * 100 : 0}%` }} />
                  </div>
                  <span className={cx("w-10 text-right text-sm font-bold tabular-nums", s.text)}>{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={cx("text-sm", s.muted)}>No zone data for these filters.</p>
          )}
        </Section>

        {/* Monthly Trend */}
        <Section title="New stores per month" icon={<Calendar className="h-4 w-4" />} subtitle="Last 6 months">
          {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
            <div className="flex h-44 items-end justify-between gap-2">
              {stats.monthlyTrend.map((item: any) => {
                const maxCount = Math.max(...stats.monthlyTrend.map((m: any) => m.count));
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item._id} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className={cx("text-xs font-bold tabular-nums", s.text)}>{item.count}</span>
                    <div className="w-full max-w-12 rounded-t-md bg-yellow-400" style={{ height: `${heightPercent}%`, minHeight: item.count > 0 ? "4px" : "0" }} />
                    <span className={cx("text-xs", s.muted)}>{item._id}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={cx("text-sm", s.muted)}>No data for these filters.</p>
          )}
        </Section>
      </div>

      {/* Recent Stores */}
      <Section title="Recently added stores" icon={<MapPin className="h-4 w-4" />} subtitle="Click a store to open it">
        {stats?.recentStores && stats.recentStores.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.recentStores.map((store: any) => (
              <button
                key={store._id}
                onClick={() => router.push(`/store/${store._id}`)}
                className={cx("rounded-lg border p-3 text-left transition-colors", s.sunken, s.dark ? "hover:border-gray-600" : "hover:border-gray-400")}
              >
                <p className={cx("truncate text-sm font-bold", s.text)}>{store.storeName || "Unnamed store"}</p>
                <p className={cx("truncate text-xs", s.muted)}>
                  {[store.location?.city, store.dealerCode].filter(Boolean).join(" · ") || "No city"}
                </p>
                <div className="mt-2">
                  <StatusCell status={store.currentStatus} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className={cx("text-sm", s.muted)}>No stores added yet.</p>
        )}
      </Section>

      {/* Personnel Stats */}
      {isAdmin && stats?.personnelStats && stats.personnelStats.length > 0 && (
        <Section title="Team performance" icon={<Users className="h-4 w-4" />} subtitle="Completed out of assigned, per person">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={cx("text-xs", s.muted)}>
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Role</th>
                  <th className="px-3 py-2 text-right font-semibold">Assigned</th>
                  <th className="px-3 py-2 text-right font-semibold">Completed</th>
                  <th className="px-3 py-2 text-left font-semibold">Progress</th>
                </tr>
              </thead>
              <tbody>
                {[...stats.personnelStats]
                  .sort((a: any, b: any) => (b.completedCount || 0) - (a.completedCount || 0))
                  .map((person: any) => {
                    const pct = person.assignedCount ? Math.round(((person.completedCount || 0) / person.assignedCount) * 100) : 0;
                    return (
                      <tr key={person._id} className={cx("border-t", s.divider)}>
                        <td className={cx("px-3 py-2.5 font-medium", s.text)}>{person.name}</td>
                        <td className="px-3 py-2.5">
                          <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold", person.role === "RECCE" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800")}>
                            {person.role === "RECCE" ? "Recce" : person.role === "INSTALLATION" ? "Installation" : person.role}
                          </span>
                        </td>
                        <td className={cx("px-3 py-2.5 text-right tabular-nums", s.body)}>{person.assignedCount}</td>
                        <td className={cx("px-3 py-2.5 text-right font-semibold tabular-nums", s.text)}>{person.completedCount}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={cx("h-1.5 w-24 rounded-full", s.dark ? "bg-gray-800" : "bg-gray-200")}>
                              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                            <span className={cx("text-xs tabular-nums", s.muted)}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* State Distribution */}
      <Section title="Top 10 states" icon={<MapPin className="h-4 w-4" />}>
        {stats?.stateDistribution && stats.stateDistribution.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {stats.stateDistribution.map((item: any) => (
              <div key={item._id || "none"} className={cx("rounded-lg border p-3", s.sunken)}>
                <div className={cx("text-xl font-bold tabular-nums", s.text)}>{item.count}</div>
                <div className={cx("truncate text-xs", item._id ? s.muted : s.faint)} title={item._id || "State not set"}>
                  {item._id || "State not set"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={cx("text-sm", s.muted)}>No state data for these filters.</p>
        )}
      </Section>
    </div>
  );
}

function StatCard({ title, value, icon, darkMode, today, todayLabel, color = "yellow", subtitle }: any) {
  const colors: any = {
    yellow: "bg-yellow-400/20 text-yellow-600",
    blue: "bg-blue-500/15 text-blue-600",
    green: "bg-emerald-500/15 text-emerald-600",
    orange: "bg-orange-500/15 text-orange-600",
    purple: "bg-violet-500/15 text-violet-600",
  };
  const n = Number(today || 0);
  return (
    <div className={`rounded-xl border p-4 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
        <span className={`rounded-lg p-1.5 ${colors[color] || colors.yellow}`}>{icon}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</p>
      {subtitle && <p className={`mt-0.5 text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>{subtitle}</p>}
      {todayLabel !== undefined && (
        <p className={`mt-0.5 text-xs ${n > 0 ? "font-medium text-emerald-600" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
          {n > 0 ? `+${n} ${todayLabel}` : `None ${todayLabel}`}
        </p>
      )}
    </div>
  );
}

function DashboardSkeleton({ dark }: { dark: boolean }) {
  const b = dark ? "bg-gray-800" : "bg-gray-200";
  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-pulse">
      <div className={`h-8 w-48 rounded-lg ${b}`} />
      <div className={`h-40 w-full rounded-xl ${b}`} />
      <div className={`h-24 w-full rounded-xl ${b}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-24 rounded-xl ${b}`} />
        ))}
      </div>
    </div>
  );
}
