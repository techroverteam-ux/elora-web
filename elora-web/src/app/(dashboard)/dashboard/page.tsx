"use client";

import React, { useEffect, useState } from "react";
import { MapPin, TrendingUp, Users, CheckCircle2, Filter, Calendar, Loader2, BarChart3, PieChart } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import api from "@/src/lib/api";

export default function DashboardPage() {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "", zone: "", state: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/dashboard/stats?${params}`);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Dashboard</h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overview & Analytics</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            darkMode ? "bg-purple-900/30 border-purple-700/50 hover:bg-purple-900/50" : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            />
            <input
              type="text"
              placeholder="Zone"
              value={filters.zone}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            />
            <input
              type="text"
              placeholder="State"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            />
            <button
              onClick={() => setFilters({ startDate: "", endDate: "", status: "", zone: "", state: "" })}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Stores" value={stats?.kpi?.totalStores || 0} icon={<MapPin className="h-4 w-4" />} darkMode={darkMode} trend={`+${stats?.kpi?.newStoresToday || 0} today`} />
        <StatCard title="Recce Completed" value={stats?.kpi?.recceDoneTotal || 0} icon={<CheckCircle2 className="h-4 w-4" />} darkMode={darkMode} trend={`+${stats?.kpi?.recceDoneToday || 0} today`} color="blue" />
        <StatCard title="Installations" value={stats?.kpi?.installationDoneTotal || 0} icon={<CheckCircle2 className="h-4 w-4" />} darkMode={darkMode} trend={`+${stats?.kpi?.installationDoneToday || 0} today`} color="green" />
        <StatCard title="Pending" value={stats?.kpi?.totalStores - stats?.kpi?.recceDoneTotal || 0} icon={<TrendingUp className="h-4 w-4" />} darkMode={darkMode} color="orange" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <PieChart className="w-5 h-5" /> Status Breakdown
          </h3>
          <div className="space-y-3">
            {stats?.statusBreakdown?.map((item: any) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item._id?.replace(/_/g, " ")}</span>
                <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Distribution */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <BarChart3 className="w-5 h-5" /> Zone Distribution
          </h3>
          <div className="space-y-3">
            {stats?.zoneDistribution?.map((item: any) => (
              <div key={item._id} className="flex items-center gap-3">
                <span className={`text-sm flex-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item._id || "N/A"}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(item.count / stats?.kpi?.totalStores) * 100}%` }}></div>
                </div>
                <span className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <Calendar className="w-5 h-5" /> Monthly Trend (Last 6 Months)
        </h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {stats?.monthlyTrend?.map((item: any) => (
            <div key={item._id} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-yellow-500 rounded-t-lg" style={{ height: `${(item.count / Math.max(...stats.monthlyTrend.map((m: any) => m.count))) * 100}%` }}></div>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{item._id}</span>
              <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Personnel & Recent Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personnel Stats */}
        <div className={`col-span-2 rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Team Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`text-xs uppercase ${darkMode ? "text-gray-400 bg-gray-800/50" : "text-gray-500 bg-gray-50"}`}>
                <tr>
                  <th className="px-4 py-3 text-left rounded-l-lg">Name</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-center">Assigned</th>
                  <th className="px-4 py-3 text-center rounded-r-lg">Completed</th>
                </tr>
              </thead>
              <tbody>
                {stats?.personnelStats?.map((person: any) => (
                  <tr key={person._id} className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <td className={`px-4 py-3 font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{person.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${person.role === "RECCE" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                        {person.role}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{person.assignedCount}</td>
                    <td className="px-4 py-3 text-center text-green-500 font-bold">{person.completedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Stores */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Recent Stores</h3>
          <div className="space-y-4">
            {stats?.recentStores?.map((store: any) => (
              <div key={store._id} className={`flex items-start gap-3 p-3 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                <div className={`p-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-white"}`}>
                  <MapPin className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{store.storeName}</h4>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{store.location?.city} • {store.dealerCode}</p>
                  <span className="text-[10px] uppercase font-bold text-gray-400">{store.currentStatus?.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State Distribution */}
      <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Top 10 States</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats?.stateDistribution?.map((item: any) => (
            <div key={item._id} className={`p-4 rounded-lg border text-center ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
              <div className={`text-2xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</div>
              <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{item._id || "N/A"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, darkMode, trend, color = "yellow" }: any) {
  const colors: any = {
    yellow: { bg: "bg-yellow-500/20", text: "text-yellow-500" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-500" },
    green: { bg: "bg-green-500/20", text: "text-green-500" },
    orange: { bg: "bg-orange-500/20", text: "text-orange-500" },
  };
  const c = colors[color] || colors.yellow;

  return (
    <div className={`p-4 rounded-xl border transition-all hover:scale-105 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
          <h3 className={`text-2xl font-black mt-2 ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</h3>
          {trend && <p className="text-xs text-green-500 font-medium mt-1">{trend}</p>}
        </div>
        <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>{icon}</div>
      </div>
    </div>
  );
}
