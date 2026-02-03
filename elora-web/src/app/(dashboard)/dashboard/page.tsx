"use client";

import {
  Users,
  ShieldCheck,
  UserCheck,
  Activity,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">System overview and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value="124"
          icon={<Users className="h-6 w-6 text-blue-600" />}
          bg="bg-blue-50"
        />
        <StatCard
          title="Active Users"
          value="98"
          icon={<UserCheck className="h-6 w-6 text-green-600" />}
          bg="bg-green-50"
        />
        <StatCard
          title="Roles"
          value="6"
          icon={<ShieldCheck className="h-6 w-6 text-purple-600" />}
          bg="bg-purple-50"
        />
        <StatCard
          title="System Health"
          value="Stable"
          icon={<Activity className="h-6 w-6 text-emerald-600" />}
          bg="bg-emerald-50"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              User Growth (Monthly)
            </h3>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>

          {/* Dummy Chart */}
          <div className="flex items-end gap-2 h-32">
            {[40, 55, 70, 65, 80, 95].map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-t-md"
                style={{ height: `${value}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Role Distribution
          </h3>

          <div className="space-y-3">
            <Progress label="Admin" value={40} />
            <Progress label="Manager" value={25} />
            <Progress label="Operator" value={20} />
            <Progress label="Viewer" value={15} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-700">Recent Users</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                {
                  name: "Amit Sharma",
                  email: "amit@example.com",
                  role: "Admin",
                  status: "Active",
                },
                {
                  name: "Neha Verma",
                  email: "neha@example.com",
                  role: "Manager",
                  status: "Active",
                },
                {
                  name: "Rohit Singh",
                  email: "rohit@example.com",
                  role: "Operator",
                  status: "Inactive",
                },
              ].map((user, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium ${
                        user.status === "Active"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function StatCard({
  title,
  value,
  icon,
  bg,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <div
      className={`p-4 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-between`}
    >
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      <div
        className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center`}
      >
        {icon}
      </div>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
