"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { useTheme } from "@/src/context/ThemeContext";
import { 
  ArrowLeft, User as UserIcon, Mail, Calendar, Activity, 
  CheckCircle, Clock, XCircle, TrendingUp, BarChart3, 
  MapPin, Loader2, Shield, LogIn
} from "lucide-react";
import toast from "react-hot-toast";

interface UserStats {
  user: {
    _id: string;
    name: string;
    email: string;
    roles: Array<{ _id: string; name: string; code: string }>;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
    loginCount?: number;
  };
  workStats: {
    totalAssigned: number;
    completed: number;
    pending: number;
    inProgress: number;
    rejected: number;
  };
  recceStats?: {
    assigned: number;
    submitted: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  installationStats?: {
    assigned: number;
    submitted: number;
    completed: number;
    pending: number;
  };
  adminStats?: {
    totalAssignments: number;
    usersManaged: number;
    storesManaged: number;
  };
  recentActivity: Array<{
    _id: string;
    storeId: string;
    storeName: string;
    dealerCode: string;
    city: string;
    status: string;
    assignedDate?: string;
    submittedDate?: string;
  }>;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { darkMode } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchUserStats();
    }
  }, [params.id]);

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/users/${params.id}/stats`);
      setStats(data);
    } catch (error) {
      toast.error("Failed to load user details");
      router.push("/users");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!stats) return null;

  const isRecceUser = stats.user.roles.some(r => r.code === "RECCE");
  const isInstallUser = stats.user.roles.some(r => r.code === "INSTALLATION");
  const isAdmin = stats.user.roles.some(r => r.code === "SUPER_ADMIN" || r.code === "ADMIN");

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/users")}
          className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            User Details
          </h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Comprehensive user activity and statistics
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <div className={`rounded-xl border p-6 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white text-3xl flex-shrink-0">
            {stats.user.name.charAt(0)}
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-3">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {stats.user.name}
                </h2>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} flex items-center gap-2 mt-1`}>
                  <Mail className="w-4 h-4" />
                  {stats.user.email}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${stats.user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {stats.user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Roles</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {stats.user.roles.map(role => (
                    <span key={role._id} className={`px-2 py-0.5 text-xs font-medium rounded ${darkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}>
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Joined</span>
                </div>
                <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {new Date(stats.user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <LogIn className="w-4 h-4 text-green-500" />
                  <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Login Activity</span>
                </div>
                <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {stats.user.loginCount || 0} times
                </p>
                {stats.user.lastLogin && (
                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                    Last: {new Date(stats.user.lastLogin).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-blue-900/30 border-blue-700/50" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {stats.workStats.totalAssigned}
            </span>
          </div>
          <p className={`text-sm font-medium ${darkMode ? "text-blue-400" : "text-blue-700"}`}>Total Assigned</p>
        </div>

        <div className={`rounded-xl border p-5 ${darkMode ? "bg-green-900/30 border-green-700/50" : "bg-green-50 border-green-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {stats.workStats.completed}
            </span>
          </div>
          <p className={`text-sm font-medium ${darkMode ? "text-green-400" : "text-green-700"}`}>Completed</p>
        </div>

        <div className={`rounded-xl border p-5 ${darkMode ? "bg-yellow-900/30 border-yellow-700/50" : "bg-yellow-50 border-yellow-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {stats.workStats.pending}
            </span>
          </div>
          <p className={`text-sm font-medium ${darkMode ? "text-yellow-400" : "text-yellow-700"}`}>Pending</p>
        </div>

        <div className={`rounded-xl border p-5 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-purple-50 border-purple-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {stats.workStats.inProgress}
            </span>
          </div>
          <p className={`text-sm font-medium ${darkMode ? "text-purple-400" : "text-purple-700"}`}>In Progress</p>
        </div>
      </div>

      {/* Role-Specific Stats */}
      {isRecceUser && stats.recceStats && (
        <div className={`rounded-xl border p-6 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Recce Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.recceStats.assigned}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Assigned</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.recceStats.submitted}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Submitted</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold text-green-600`}>{stats.recceStats.approved}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Approved</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold text-red-600`}>{stats.recceStats.rejected}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Rejected</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold text-yellow-600`}>{stats.recceStats.pending}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Pending</p>
            </div>
          </div>
        </div>
      )}

      {isInstallUser && stats.installationStats && (
        <div className={`rounded-xl border p-6 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <BarChart3 className="w-5 h-5 text-green-500" />
            Installation Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.installationStats.assigned}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Assigned</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.installationStats.submitted}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Submitted</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold text-green-600`}>{stats.installationStats.completed}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Completed</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold text-yellow-600`}>{stats.installationStats.pending}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Pending</p>
            </div>
          </div>
        </div>
      )}

      {isAdmin && stats.adminStats && (
        <div className={`rounded-xl border p-6 ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <Shield className="w-5 h-5 text-purple-500" />
            Admin Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.adminStats.totalAssignments}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total Assignments Made</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.adminStats.usersManaged}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Users Managed</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.adminStats.storesManaged}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Stores Managed</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <Activity className="w-5 h-5 text-yellow-500" />
            Recent Activity
          </h3>
        </div>
        <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {stats.recentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent activity</div>
          ) : (
            stats.recentActivity.map((activity) => (
              <div key={activity._id} className={`p-4 transition-colors ${darkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {activity.storeName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}>
                        {activity.dealerCode}
                      </span>
                    </div>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {activity.city} • {activity.status.replace(/_/g, " ")}
                    </p>
                    {activity.assignedDate && (
                      <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                        Assigned: {new Date(activity.assignedDate).toLocaleDateString()}
                        {activity.submittedDate && ` • Submitted: ${new Date(activity.submittedDate).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
