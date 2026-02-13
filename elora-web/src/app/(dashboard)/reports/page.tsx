"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  CheckCircle,
  Clock,
  Award,
  MapPin,
  Activity,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = React.useMemo(() => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((role) => 
      role?.code === "SUPER_ADMIN" || role?.code === "ADMIN"
    );
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/analytics/dashboard");
      setAnalytics(data.analytics);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <BarChart3 className="h-6 w-6 text-yellow-500" /> Analytics Dashboard
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {isAdmin ? "Complete project overview and insights" : "Your performance metrics and tasks"}
        </p>
      </div>

      {isAdmin ? (
        /* ADMIN DASHBOARD */
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<Package className="h-5 w-5" />} label="Total Stores" value={analytics.overview.totalStores} darkMode={darkMode} color="blue" />
            <StatCard icon={<Users className="h-5 w-5" />} label="Active Users" value={analytics.overview.activeUsers} darkMode={darkMode} color="green" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Recce Pending" value={analytics.recce.assigned} darkMode={darkMode} color="yellow" />
            <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Completed" value={analytics.installation.completed} darkMode={darkMode} color="green" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Completion Rate" value={`${analytics.installation.completionRate}%`} darkMode={darkMode} color="purple" />
          </div>

          {/* Recce & Installation Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Recce Operations</h3>
              <div className="space-y-3">
                <ProgressBar label="Assigned" value={analytics.recce.assigned} total={analytics.recce.total} color="blue" darkMode={darkMode} />
                <ProgressBar label="Submitted" value={analytics.recce.submitted} total={analytics.recce.total} color="yellow" darkMode={darkMode} />
                <ProgressBar label="Approved" value={analytics.recce.approved} total={analytics.recce.total} color="green" darkMode={darkMode} />
                <ProgressBar label="Rejected" value={analytics.recce.rejected} total={analytics.recce.total} color="red" darkMode={darkMode} />
              </div>
              <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Success Rate</span>
                  <span className={`text-lg font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>{analytics.recce.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Installation Operations</h3>
              <div className="space-y-3">
                <ProgressBar label="Assigned" value={analytics.installation.assigned} total={analytics.installation.total} color="orange" darkMode={darkMode} />
                <ProgressBar label="Submitted" value={analytics.installation.submitted} total={analytics.installation.total} color="blue" darkMode={darkMode} />
                <ProgressBar label="Completed" value={analytics.installation.completed} total={analytics.installation.total} color="green" darkMode={darkMode} />
              </div>
              <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Completion Rate</span>
                  <span className={`text-lg font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>{analytics.installation.completionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Activity className="h-5 w-5 text-yellow-500" /> Recent Activity (Last 7 Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>New Stores</div>
                <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{analytics.recentActivity.newStores}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Recce Submissions</div>
                <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{analytics.recentActivity.recceSubmissions}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Installations</div>
                <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{analytics.recentActivity.installations}</div>
              </div>
            </div>
          </div>

          {/* Top Performers & Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <Award className="h-5 w-5 text-yellow-500" /> Top Performers
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Recce Team</h4>
                  {analytics.topPerformers.recce.map((user: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2">
                      <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{user.name}</span>
                      <span className={`text-sm font-bold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>{user.count} tasks</span>
                    </div>
                  ))}
                </div>
                <div className={`pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <h4 className={`text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Installation Team</h4>
                  {analytics.topPerformers.installation.map((user: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2">
                      <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{user.name}</span>
                      <span className={`text-sm font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>{user.count} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <MapPin className="h-5 w-5 text-yellow-500" /> Top Cities
              </h3>
              <div className="space-y-3">
                {analytics.distribution.byCity.slice(0, 8).map((city: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`text-sm font-medium w-32 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{city._id || "Unknown"}</div>
                    <div className="flex-1">
                      <div className={`h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                        <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${(city.count / analytics.overview.totalStores) * 100}%` }} />
                      </div>
                    </div>
                    <div className={`text-sm font-bold w-12 text-right ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{city.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* USER DASHBOARD */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Package className="h-5 w-5" />} label="Total Assigned" value={analytics.overview.totalAssigned} darkMode={darkMode} color="blue" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Pending" value={analytics.overview.pending} darkMode={darkMode} color="yellow" />
            <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Completed" value={analytics.overview.approved || analytics.overview.completed} darkMode={darkMode} color="green" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Success Rate" value={`${analytics.overview.completionRate}%`} darkMode={darkMode} color="purple" />
          </div>

          <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Task Breakdown</h3>
            <div className="space-y-3">
              <ProgressBar label="Pending" value={analytics.overview.pending} total={analytics.overview.totalAssigned} color="yellow" darkMode={darkMode} />
              <ProgressBar label="Submitted" value={analytics.overview.submitted} total={analytics.overview.totalAssigned} color="blue" darkMode={darkMode} />
              {analytics.overview.approved !== undefined && (
                <ProgressBar label="Approved" value={analytics.overview.approved} total={analytics.overview.totalAssigned} color="green" darkMode={darkMode} />
              )}
              {analytics.overview.completed !== undefined && (
                <ProgressBar label="Completed" value={analytics.overview.completed} total={analytics.overview.totalAssigned} color="green" darkMode={darkMode} />
              )}
              {analytics.overview.rejected !== undefined && analytics.overview.rejected > 0 && (
                <ProgressBar label="Rejected" value={analytics.overview.rejected} total={analytics.overview.totalAssigned} color="red" darkMode={darkMode} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <Activity className="h-5 w-5 text-yellow-500" /> Recent Activity
              </h3>
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Submissions (Last 7 Days)</div>
                <div className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{analytics.recentActivity.submissionsLast7Days}</div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <MapPin className="h-5 w-5 text-yellow-500" /> Your Cities
              </h3>
              <div className="space-y-2">
                {analytics.distribution.byCity.slice(0, 5).map((city: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{city._id || "Unknown"}</span>
                    <span className={`text-sm font-bold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>{city.count} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, darkMode, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500", green: "bg-green-500", yellow: "bg-yellow-500",
    purple: "bg-purple-500", orange: "bg-orange-500", red: "bg-red-500"
  };

  return (
    <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]} bg-opacity-10`}>
          <div className={`${colorClasses[color].replace('bg-', 'text-')}`}>{icon}</div>
        </div>
        <div>
          <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{label}</div>
          <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color, darkMode }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500", green: "bg-green-500", yellow: "bg-yellow-500",
    purple: "bg-purple-500", orange: "bg-orange-500", red: "bg-red-500"
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
        <span className={`text-sm font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{value}</span>
      </div>
      <div className={`h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
        <div className={`h-2 rounded-full ${colorClasses[color]}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
