"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  UserCheck,
  Activity,
  TrendingUp,
  BarChart3,
  MapPin,
  FileText,
  Download,
  Loader2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import api from "@/src/lib/api";
import { StoreStatus } from "@/src/types/store";

export default function DashboardPage() {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const startTime = Date.now();
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        setTimeout(() => setLoading(false), 800 - elapsed);
      } else {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-8 w-48 rounded-lg mb-2 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-4 w-32 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
          <div className={`h-6 w-24 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`p-4 rounded-xl border animate-pulse ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`h-3 w-20 rounded mb-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-8 w-16 rounded mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-3 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
                <div className={`h-10 w-10 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`col-span-1 lg:col-span-2 rounded-xl border p-5 animate-pulse ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
            <div className={`h-6 w-40 rounded mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-12 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
          <div className={`rounded-xl border p-5 animate-pulse ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
            <div className={`h-6 w-32 rounded mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`p-3 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex gap-3">
                    <div className={`h-10 w-10 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="flex-1">
                      <div className={`h-4 w-32 rounded mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      <div className={`h-3 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Dashboard
          </h1>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Overview & Analytics
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            darkMode
              ? "bg-green-500/20 text-green-400"
              : "bg-green-100 text-green-700"
          }`}
        >
          System Online
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stores"
          value={stats?.kpi?.totalStores || 0}
          icon={<MapPin className="h-4 w-4" />}
          darkMode={darkMode}
          trend={`+${stats?.kpi?.newStoresToday || 0} today`}
        />
        <StatCard
          title="Recce Completed"
          value={stats?.kpi?.recceDoneTotal || 0}
          icon={<Activity className="h-4 w-4" />}
          darkMode={darkMode}
          trend={`+${stats?.kpi?.recceDoneToday || 0} today`}
          color="blue"
        />
        <StatCard
          title="Installations"
          value={stats?.kpi?.installationDoneTotal || 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          darkMode={darkMode}
          trend={`+${stats?.kpi?.installationDoneToday || 0} today`}
          color="green"
        />
        <StatCard
          title="Pending Actions"
          value={stats?.kpi?.totalStores - stats?.kpi?.recceDoneTotal} // Rough estimate
          icon={<Activity className="h-4 w-4" />}
          darkMode={darkMode}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ASSIGNED PERSONNEL TABLE */}
        <div
          className={`col-span-1 lg:col-span-2 rounded-xl border p-5 ${
            darkMode
              ? "bg-purple-900/30 border-purple-700/50"
              : "bg-white border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Assigned Personnel
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead
                className={`text-xs uppercase ${
                  darkMode
                    ? "text-gray-400 bg-gray-800/50"
                    : "text-gray-500 bg-gray-50"
                }`}
              >
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3 rounded-r-lg">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/10">
                {stats?.personnelStats?.map((person: any) => (
                  <tr
                    key={person._id}
                    className={`border-b ${
                      darkMode ? "border-gray-700" : "border-gray-100"
                    }`}
                  >
                    <td
                      className={`px-4 py-3 font-medium ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {person.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          person.role === "RECCE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {person.role}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {person.assignedCount}
                    </td>
                    <td className="px-4 py-3 text-green-500 font-bold">
                      {person.completedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT DOWNLOADS / STORES */}
        <div className="space-y-6">
          {/* Recent Stores */}
          <div
            className={`rounded-xl border p-5 ${
              darkMode
                ? "bg-purple-900/30 border-purple-700/50"
                : "bg-white border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              New Stores
            </h3>
            <div className="space-y-4">
              {stats?.recentStores?.map((store: any) => (
                <div
                  key={store._id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    darkMode
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full mt-1 ${
                      darkMode ? "bg-gray-700" : "bg-white"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {store.storeName}
                    </h4>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {store.location?.city} • {store.dealerCode}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400">
                        {store.currentStatus?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  darkMode,
  trend,
  color = "yellow",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  darkMode: boolean;
  trend?: string;
  color?: string;
}) {
  const colorClasses: any = {
    yellow: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-500",
      border: "border-yellow-500",
    },
    blue: { bg: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500" },
    green: {
      bg: "bg-green-500/20",
      text: "text-green-500",
      border: "border-green-500",
    },
    orange: {
      bg: "bg-orange-500/20",
      text: "text-orange-500",
      border: "border-orange-500",
    },
  };

  const selectedColor = colorClasses[color] || colorClasses.yellow;

  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:scale-105 hover:shadow-lg ${
        darkMode
          ? "bg-purple-900/30 border-purple-700/50"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-wider ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3
              className={`text-2xl font-black ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {value}
            </h3>
          </div>
          {trend && (
            <p className="text-xs text-green-500 font-medium mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${selectedColor.bg} ${selectedColor.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
