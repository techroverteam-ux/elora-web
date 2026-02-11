"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { User, Role } from "@/src/types/auth";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { darkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roles: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (roleFilter) {
      // Check if ANY of the user's roles matches the filter ID
      filtered = filtered.filter((user) =>
        user.roles?.some((r: any) => r._id === roleFilter),
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((user) =>
        statusFilter === "active" ? user.isActive : !user.isActive,
      );
    }

    setFilteredUsers(filtered);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);

      setUsers(usersRes.data.users || usersRes.data);
      setFilteredUsers(usersRes.data.users || usersRes.data);
      setRoles(rolesRes.data);
    } catch {
      setError("Failed to load data. Please check permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    // UPDATE: Set 'roles' to an empty array instead of 'roleId'
    setFormData({ name: "", email: "", password: "", roles: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);

    // UPDATE: Extract role IDs. Handles both new (array) and old (single) structure safely.
    let userRoles: string[] = [];

    if (user.roles && Array.isArray(user.roles)) {
      // If user has multiple roles (new structure)
      userRoles = user.roles.map((r: any) => r._id);
    } else if (user.role) {
      // If user has legacy single role (old structure), wrap in array
      userRoles = [user.role._id];
    }

    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      roles: userRoles, // Bind to the array
    });
    setIsModalOpen(true);
  };

  // Helper to calculate strength
  const checkStrength = (pass: string) => {
    let score = 0;
    if (!pass) {
      setPasswordStrength(0);
      return;
    }
    if (pass.length > 7) score += 1;
    if (pass.match(/[0-9]/)) score += 1;
    if (pass.match(/[!@#$%^&*]/)) score += 1;
    if (pass.match(/[A-Z]/)) score += 1;
    setPasswordStrength(score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        roles: formData.roles, // UPDATE: Send 'roles' array
      };

      if (formData.password) payload.password = formData.password;

      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
        toast.success("User updated successfully!");
      } else {
        await api.post("/users", payload);
        toast.success("User created successfully!");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await api.delete(`/users/${userId}`);
    setUsers(users.filter((u) => u._id !== userId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-yellow-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Users
          </h1>
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Manage system users
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <div
        className={`p-4 rounded-xl border ${
          darkMode
            ? "bg-purple-900/30 border-purple-700/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:border-yellow-500`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-gray-50 border-gray-200 text-gray-900"
            } focus:outline-none focus:border-yellow-500`}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-gray-50 border-gray-200 text-gray-900"
            } focus:outline-none focus:border-yellow-500`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div
            className={`text-sm font-medium flex items-center ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Total: {filteredUsers.length}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        className={`rounded-xl border overflow-hidden ${
          darkMode
            ? "bg-purple-900/30 border-purple-700/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="hidden md:block">
          <table className="min-w-full">
            <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-50"}>
              <tr>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  User
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Role
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Status
                </th>
                <th
                  className={`px-4 py-3 text-right text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}
            >
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className={`${darkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}
                >
                  {/* User Column */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p
                          className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-900"}`}
                        >
                          {user.name}
                        </p>
                        <p
                          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role Column (FIXED) */}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        darkMode
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {/* Check if 'roles' array exists and has items */}
                      {user.roles && user.roles.length > 0
                        ? user.roles.map((r: any) => r.name).join(", ")
                        : "No Role"}
                    </span>
                  </td>

                  {/* Status Column */}
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="flex items-center text-green-500 text-xs font-medium">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-medium">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className={`p-1 rounded transition-colors ${darkMode ? "text-blue-400 hover:bg-blue-500/20" : "text-blue-600 hover:bg-blue-50"}`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className={`p-1 rounded transition-colors ${darkMode ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50"}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <div key={user._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p
                      className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {user.name}
                    </p>
                    <p
                      className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit User" : "Create New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* ROW 1: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all placeholder:text-gray-400 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="name@company.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all placeholder:text-gray-400 text-sm"
              />
            </div>
          </div>

          {/* ROW 2: Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              {!editingUser && (
                <span className="text-xs text-gray-400">Min 8 characters</span>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!editingUser}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  checkStrength(e.target.value);
                }}
                placeholder={
                  editingUser ? "Leave blank to keep current" : "••••••••"
                }
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all placeholder:text-gray-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Strength Meter */}
            {formData.password && (
              <div className="space-y-1 pt-1 animate-in fade-in slide-in-from-top-1">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= level
                          ? passwordStrength <= 2
                            ? "bg-red-500"
                            : passwordStrength === 3
                              ? "bg-yellow-500"
                              : "bg-green-600"
                          : "bg-gray-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ROW 3: SEARCHABLE MULTI-SELECT ROLES */}
          <div className="space-y-1.5 relative">
            <label className="text-sm font-semibold text-gray-700">
              Assign Roles
            </label>

            {/* Custom Combo Box */}
            <div
              className="w-full min-h-[46px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus-within:ring-2 focus-within:ring-yellow-500/20 focus-within:border-yellow-500 transition-all flex flex-wrap items-center gap-2"
              onClick={() => {
                // Focus the input when clicking anywhere in the box
                document.getElementById("role-search-input")?.focus();
                setIsRoleDropdownOpen(true);
              }}
            >
              {/* Selected Role Tags (Chips) */}
              {formData.roles?.map((roleId: string) => {
                const roleName = roles.find((r) => r._id === roleId)?.name;
                return (
                  <span
                    key={roleId}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 animate-in zoom-in-95"
                  >
                    {roleName}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRoles = formData.roles.filter(
                          (id: string) => id !== roleId,
                        );
                        setFormData({ ...formData, roles: newRoles });
                      }}
                      className="ml-1.5 text-yellow-600 hover:text-yellow-900 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}

              {/* Search Input */}
              <input
                id="role-search-input"
                type="text"
                value={roleSearch}
                onChange={(e) => {
                  setRoleSearch(e.target.value);
                  setIsRoleDropdownOpen(true);
                }}
                onFocus={() => setIsRoleDropdownOpen(true)}
                placeholder={
                  formData.roles?.length > 0 ? "" : "Select or search roles..."
                }
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-gray-400 h-6"
              />

              {/* Dropdown Arrow */}
              <div
                className="ml-auto text-gray-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRoleDropdownOpen(!isRoleDropdownOpen);
                }}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isRoleDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {/* Dropdown Menu */}
            {isRoleDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {roles.filter((role) =>
                  role.name.toLowerCase().includes(roleSearch.toLowerCase()),
                ).length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center italic">
                    No roles found
                  </div>
                ) : (
                  roles
                    .filter((role) =>
                      role.name
                        .toLowerCase()
                        .includes(roleSearch.toLowerCase()),
                    )
                    .map((role) => {
                      const isSelected = formData.roles?.includes(role._id);
                      return (
                        <div
                          key={role._id}
                          onClick={() => {
                            let newRoles;
                            if (isSelected) {
                              newRoles = formData.roles.filter(
                                (id: string) => id !== role._id,
                              );
                            } else {
                              newRoles = [...(formData.roles || []), role._id];
                            }
                            setFormData({ ...formData, roles: newRoles });
                            setRoleSearch(""); // Clear search after selection
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors ${
                            isSelected
                              ? "bg-yellow-50/50 text-yellow-900 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{role.name}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* Click Overlay to close dropdown */}
            {isRoleDropdownOpen && (
              <div
                className="fixed inset-0 z-40 bg-transparent cursor-default"
                onClick={() => setIsRoleDropdownOpen(false)}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-yellow-500 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 disabled:opacity-70 disabled:shadow-none flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>

        {/* Styles for Slim Scrollbar */}
        <style jsx>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: #e5e7eb;
            border-radius: 20px;
          }
          .scrollbar-thin:hover::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
          }
        `}</style>
      </Modal>
    </div>
  );
}
