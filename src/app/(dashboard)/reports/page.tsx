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
  Loader2,
  Filter,
  Calendar,
  User,
  FileText,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "", zone: "", state: "", city: "" });
  const [internalFilters, setInternalFilters] = useState({ startDate: "", endDate: "", status: "", zone: "", state: "", city: "" });
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const assignmentsPerPage = 10;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isAdmin = React.useMemo(() => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((role) => 
      role?.code === "SUPER_ADMIN" || role?.code === "ADMIN"
    );
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const applyFilters = () => {
    setFilters(internalFilters);
  };

  const exportAssignments = async () => {
    if (!analytics.assignments || analytics.assignments.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      // Dynamic import of xlsx
      const XLSX = await import('xlsx');
      
      const data = analytics.assignments.map((a: any) => ({
        'Store Name': a.storeName,
        'Dealer Code': a.dealerCode,
        'City': a.city,
        'State': a.state,
        'Assigned To': a.assignedTo,
        'Role': a.role,
        'Date': a.date ? new Date(a.date).toLocaleDateString() : '-',
        'Status': a.status?.replace(/_/g, ' ')
      }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 20 }
      ];
      
      // Style header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = {
          fill: { fgColor: { rgb: "EAB308" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Assignments');
      
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Elora_Assignment_Details_${today}.xlsx`);
      
      toast.success("Exported successfully!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Export failed. Please try again.");
    }
  };

  useEffect(() => {
    if (filters.startDate || filters.endDate || filters.zone || filters.state || filters.city) {
      fetchAnalytics();
    }
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      // Add cache buster
      params.append('_t', Date.now().toString());
      const { data } = await api.get(`/analytics/dashboard?${params.toString()}`);
      console.log('Analytics data:', data);
      setAnalytics(data.analytics || {});
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error("Failed to load analytics");
      // Set empty analytics to prevent crashes
      setAnalytics({
        overview: { totalAssigned: 0, pending: 0, submitted: 0, approved: 0, completed: 0, completionRate: 0 },
        recentActivity: { submissionsLast7Days: 0 },
        distribution: { byCity: [] },
        myTasks: []
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <BarChart3 className="h-6 w-6 text-yellow-500" /> Reports
          </h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {isAdmin ? "Complete project overview and insights" : "Your performance metrics and tasks"}
          </p>
        </div>
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

      {/* Filters */}
      {showFilters && (
        <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <input
              type="date"
              placeholder="Start Date"
              value={internalFilters.startDate}
              onChange={(e) => setInternalFilters({ ...internalFilters, startDate: e.target.value })}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`}
            />
            <input
              type="date"
              placeholder="End Date"
              value={internalFilters.endDate}
              onChange={(e) => setInternalFilters({ ...internalFilters, endDate: e.target.value })}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`}
            />
            <input
              type="text"
              placeholder="Zone"
              value={internalFilters.zone}
              onChange={(e) => setInternalFilters({ ...internalFilters, zone: e.target.value })}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"}`}
            />
            <input
              type="text"
              placeholder="State"
              value={internalFilters.state}
              onChange={(e) => setInternalFilters({ ...internalFilters, state: e.target.value })}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"}`}
            />
            <input
              type="text"
              placeholder="City"
              value={internalFilters.city}
              onChange={(e) => setInternalFilters({ ...internalFilters, city: e.target.value })}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"}`}
            />
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold text-sm whitespace-nowrap"
            >
              Apply
            </button>
            <button
              onClick={() => { setFilters({ startDate: "", endDate: "", status: "", zone: "", state: "", city: "" }); setInternalFilters({ startDate: "", endDate: "", status: "", zone: "", state: "", city: "" }); }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"}`}
            >
              Reset
            </button>
          </div>
        </div>
      )}

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

          {/* Detailed Assignment Tracking */}
          <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <FileText className="h-5 w-5 text-yellow-500" /> Recent Assignments
              </h3>
              <button
                onClick={exportAssignments}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`text-xs uppercase ${darkMode ? "text-gray-400 bg-gray-700/50" : "text-gray-600 bg-gray-50"}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Store</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Assigned To</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {analytics.assignments && analytics.assignments.length > 0 ? analytics.assignments.slice((assignmentsPage - 1) * assignmentsPerPage, assignmentsPage * assignmentsPerPage).map((assignment: any, idx: number) => (
                    <tr key={idx} className={`cursor-pointer ${darkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`}>
                      <td className={`px-4 py-3 ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                        <div className="font-medium">{assignment.storeName}</div>
                        <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{assignment.dealerCode}</div>
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                        <div>{assignment.city}</div>
                        <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{assignment.state}</div>
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? "text-gray-300" : "text-gray-900"}`}>{assignment.assignedTo}</td>
                      <td className={`px-4 py-3`}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${assignment.role === 'RECCE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {assignment.role}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{formatDate(assignment.date)}</td>
                      <td className={`px-4 py-3`}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          assignment.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {assignment.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => window.location.href = `/reports/${assignment.storeId}`}
                          className={`p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600`}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className={`px-4 py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        No assignments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {analytics.assignments && analytics.assignments.length > assignmentsPerPage && (
              <div className={`flex items-center justify-between mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Showing {((assignmentsPage - 1) * assignmentsPerPage) + 1} to {Math.min(assignmentsPage * assignmentsPerPage, analytics.assignments.length)} of {analytics.assignments.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignmentsPage(p => Math.max(1, p - 1))}
                    disabled={assignmentsPage === 1}
                    className={`p-2 rounded ${darkMode ? "hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" : "hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`px-3 py-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {assignmentsPage} / {Math.ceil(analytics.assignments.length / assignmentsPerPage)}
                  </span>
                  <button
                    onClick={() => setAssignmentsPage(p => Math.min(Math.ceil(analytics.assignments.length / assignmentsPerPage), p + 1))}
                    disabled={assignmentsPage === Math.ceil(analytics.assignments.length / assignmentsPerPage)}
                    className={`p-2 rounded ${darkMode ? "hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" : "hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* USER DASHBOARD */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Package className="h-5 w-5" />} label="Total Assigned" value={analytics?.overview?.totalAssigned || 0} darkMode={darkMode} color="blue" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Pending" value={analytics?.overview?.pending || 0} darkMode={darkMode} color="yellow" />
            <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Completed" value={analytics?.overview?.approved || analytics?.overview?.completed || 0} darkMode={darkMode} color="green" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Success Rate" value={`${analytics?.overview?.completionRate || 0}%`} darkMode={darkMode} color="purple" />
          </div>

          <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Task Breakdown</h3>
            <div className="space-y-3">
              <ProgressBar label="Pending" value={analytics?.overview?.pending || 0} total={analytics?.overview?.totalAssigned || 0} color="yellow" darkMode={darkMode} />
              <ProgressBar label="Submitted" value={analytics?.overview?.submitted || 0} total={analytics?.overview?.totalAssigned || 0} color="blue" darkMode={darkMode} />
              {analytics?.overview?.approved !== undefined && (
                <ProgressBar label="Approved" value={analytics.overview.approved} total={analytics?.overview?.totalAssigned || 0} color="green" darkMode={darkMode} />
              )}
              {analytics?.overview?.completed !== undefined && (
                <ProgressBar label="Completed" value={analytics.overview.completed} total={analytics?.overview?.totalAssigned || 0} color="green" darkMode={darkMode} />
              )}
              {analytics?.overview?.rejected !== undefined && analytics.overview.rejected > 0 && (
                <ProgressBar label="Rejected" value={analytics.overview.rejected} total={analytics?.overview?.totalAssigned || 0} color="red" darkMode={darkMode} />
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
                <div className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{analytics?.recentActivity?.submissionsLast7Days || 0}</div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <MapPin className="h-5 w-5 text-yellow-500" /> Your Cities
              </h3>
              <div className="space-y-2">
                {analytics?.distribution?.byCity?.slice(0, 5).map((city: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{city._id || "Unknown"}</span>
                    <span className={`text-sm font-bold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>{city.count} tasks</span>
                  </div>
                )) || <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data</p>}
              </div>
            </div>
          </div>

          {/* My Tasks Detail */}
          <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <FileText className="h-5 w-5 text-yellow-500" /> My Tasks
            </h3>
            <div className="space-y-3">
              {analytics.myTasks && analytics.myTasks.length > 0 ? analytics.myTasks.map((task: any, idx: number) => {
                const location = [task.city, task.district, task.state].filter(Boolean).join(', ') || 'N/A';
                return (
                <div key={idx} className={`p-4 rounded-lg border ${darkMode ? "bg-gray-700/30 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{task.storeName}</h4>
                      <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        task.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-700' :
                        task.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status?.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{task.assignedDate ? formatDate(task.assignedDate) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}) : (
                <p className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No tasks assigned yet</p>
              )}
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
