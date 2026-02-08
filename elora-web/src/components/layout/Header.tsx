'use client';

import React, { useState } from 'react';
import { Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: "New user registration pending approval", time: "5 min ago", unread: true },
    { id: 2, message: "Installation completed at Store #123", time: "1 hour ago", unread: true },
    { id: 3, message: "System backup completed successfully", time: "2 hours ago", unread: false },
  ];

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors ${
      darkMode 
        ? 'bg-black/95 backdrop-blur border-purple-700/50' 
        : 'bg-white/95 backdrop-blur border-gray-200'
    }`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500'
              } focus:outline-none focus:ring-2 focus:ring-yellow-500/20`}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg transition-colors relative ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </button>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg border overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`px-4 py-3 border-b ${
                  darkMode ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`px-4 py-3 border-b transition-colors ${
                      darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.unread ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm">{notification.message}</p>
                          <p className={`text-xs mt-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.role?.name}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className="py-2">
                  <button className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}>
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <hr className={`my-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} />
                  <button 
                    onClick={logout}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 text-red-600 transition-colors ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}