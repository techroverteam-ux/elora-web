"use client";

import React, { useEffect, useState } from "react";
import { MapPin, TrendingUp, Users, CheckCircle2, Filter, Calendar, Loader2, BarChart3, PieChart } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import api from "@/src/lib/api";

export default function DashboardPage() {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

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

  const [internalDates, setInternalDates] = useState({ startDate: "", endDate: "" });

  const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setInternalDates({ ...internalDates, [field]: value });
    if (value) {
      setFilters({ ...filters, [field]: formatDateToDisplay(value) });
    } else {
      setFilters({ ...filters, [field]: "" });
    }
  };

  const applyFilters = () => {
    fetchStats();
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
              autoRefresh
                ? darkMode ? "bg-green-900/30 border-green-700/50 text-green-400" : "bg-green-50 border-green-200 text-green-700"
                : darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-500"
            }`}
            title={autoRefresh ? "Auto-refresh enabled (30s)" : "Auto-refresh disabled"}
          >
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              darkMode ? "bg-purple-900/30 border-purple-700/50 hover:bg-purple-900/50 text-white" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-900"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="date"
                value={internalDates.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className={`px-3 py-2 rounded-lg border w-full ${filters.startDate ? 'opacity-0' : ''} ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                style={{ colorScheme: darkMode ? 'dark' : 'light' }}
              />
              {filters.startDate && (
                <div className={`absolute inset-0 px-3 py-2 rounded-lg border flex items-center justify-between ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="date"]')?.showPicker?.()}>
                  <span className="text-sm font-medium">{filters.startDate}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="date"
                value={internalDates.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className={`px-3 py-2 rounded-lg border w-full ${filters.endDate ? 'opacity-0' : ''} ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                style={{ colorScheme: darkMode ? 'dark' : 'light' }}
              />
              {filters.endDate && (
                <div className={`absolute inset-0 px-3 py-2 rounded-lg border flex items-center justify-between ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  onClick={() => document.querySelectorAll<HTMLInputElement>('input[type="date"]')[1]?.showPicker?.()}>
                  <span className="text-sm font-medium">{filters.endDate}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Store Name/Code"
              value={filters.store}
              onChange={(e) => setFilters({ ...filters, store: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="Client Code"
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="Zone"
              value={filters.zone}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="State"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="District"
              value={filters.district}
              onChange={(e) => setFilters({ ...filters, district: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
            />
            <button
              onClick={() => {
                setFilters({ startDate: "", endDate: "", status: "", zone: "", state: "", store: "", client: "", city: "", district: "" });
                setInternalDates({ startDate: "", endDate: "" });
                fetchStats();
              }}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={stats?.isAdmin ? "Total Stores" : "Assigned to Me"} value={stats?.kpi?.totalStores || 0} icon={<MapPin className="h-4 w-4" />} darkMode={darkMode} trend={`+${stats?.kpi?.newStoresToday || 0} today`} />
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
            {stats?.statusBreakdown && stats.statusBreakdown.length > 0 ? stats.statusBreakdown.map((item: any) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item._id?.replace(/_/g, " ") || "Unknown"}</span>
                <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</span>
              </div>
            )) : <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data available</p>}
          </div>
        </div>

        {/* Zone Distribution */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <BarChart3 className="w-5 h-5" /> Zone Distribution
          </h3>
          <div className="space-y-3">
            {stats?.zoneDistribution && stats.zoneDistribution.length > 0 ? stats.zoneDistribution.map((item: any) => (
              <div key={item._id} className="flex items-center gap-3">
                <span className={`text-sm flex-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item._id || "N/A"}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(item.count / stats?.kpi?.totalStores) * 100}%` }}></div>
                </div>
                <span className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</span>
              </div>
            )) : <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data available</p>}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <Calendar className="w-5 h-5" /> Monthly Trend (Last 6 Months)
        </h3>
        {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
        <div className="flex items-end justify-between gap-2 h-48">
          {stats.monthlyTrend.map((item: any) => (
            <div key={item._id} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-yellow-500 rounded-t-lg" style={{ height: `${(item.count / Math.max(...stats.monthlyTrend.map((m: any) => m.count))) * 100}%` }}></div>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{item._id}</span>
              <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</span>
            </div>
          ))}
        </div>
        ) : <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data available</p>}
      </div>

      {/* Personnel & Recent Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personnel Stats */}
        {stats?.isAdmin && stats?.personnelStats && stats.personnelStats.length > 0 && (
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
        )}

        {/* Recent Stores */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Recent Stores</h3>
          <div className="space-y-4">
            {stats?.recentStores && stats.recentStores.length > 0 ? stats.recentStores.map((store: any) => (
              <div key={store._id} className={`flex items-start gap-3 p-3 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                <div className={`p-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-white"}`}>
                  <MapPin className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{store.storeName || "Unnamed Store"}</h4>
                  <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{store.location?.city || "N/A"} • {store.dealerCode}</p>
                  <span className="text-[10px] uppercase font-bold text-gray-400">{store.currentStatus?.replace(/_/g, " ")}</span>
                </div>
              </div>
            )) : <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No recent stores</p>}
          </div>
        </div>
      </div>

      {/* State Distribution */}
      <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Top 10 States</h3>
        {stats?.stateDistribution && stats.stateDistribution.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.stateDistribution.map((item: any) => (
            <div key={item._id} className={`p-4 rounded-lg border text-center ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
              <div className={`text-2xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{item.count}</div>
              <div className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-600"}`} title={item._id || "N/A"}>{item._id || "N/A"}</div>
            </div>
          ))}
        </div>
        ) : <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data available</p>}
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
