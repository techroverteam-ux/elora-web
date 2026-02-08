"use client";

import React from 'react';
import { Users, ShieldCheck, UserCheck, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { useTheme } from '@/src/context/ThemeContext';

export default function DashboardPage() {
  const { darkMode } = useTheme();

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Dashboard</h1>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Overview & Analytics</p>
        </div>
        <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
          darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
        }`}>
          System Online
        </div>
      </div>

      {/* Compact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Users" value="124" icon={<Users className="h-4 w-4" />} darkMode={darkMode} />
        <StatCard title="Active" value="98" icon={<UserCheck className="h-4 w-4" />} darkMode={darkMode} />
        <StatCard title="Roles" value="6" icon={<ShieldCheck className="h-4 w-4" />} darkMode={darkMode} />
        <StatCard title="Health" value="99%" icon={<Activity className="h-4 w-4" />} darkMode={darkMode} />
      </div>

      {/* Compact Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`rounded-xl p-4 border ${
          darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Growth</h3>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex items-end gap-1 h-16">
            {[40, 55, 70, 65, 80, 95].map((value, i) => (
              <div key={i} className="flex-1 bg-yellow-500 rounded-t" style={{ height: `${value}%` }} />
            ))}
          </div>
        </div>

        <div className={`rounded-xl p-4 border ${
          darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-sm font-semibold mb-3 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Roles</h3>
          <div className="space-y-2">
            {[{l:'Admin',v:40},{l:'Manager',v:25},{l:'Staff',v:35}].map((item,i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{item.l}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-1 rounded-full ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div className="bg-yellow-500 h-1 rounded-full" style={{width:`${item.v}%`}} />
                  </div>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.v}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl p-4 border ${
          darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-sm font-semibold mb-3 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Recent Activity</h3>
          <div className="space-y-2">
            {['User created','Role updated','System backup'].map((activity,i) => (
              <div key={i} className={`text-xs p-2 rounded border-l-2 border-yellow-500 ${
                darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-50 text-gray-600'
              }`}>
                {activity}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, darkMode }: {
  title: string; value: string; icon: React.ReactNode; darkMode: boolean;
}) {
  return (
    <div className={`p-3 rounded-xl border transition-all hover:scale-105 ${
      darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <p className={`text-lg font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${
          darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
