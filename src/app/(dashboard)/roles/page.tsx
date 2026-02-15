"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { Role, PermissionSet } from "@/src/types/auth";
import { Plus, Shield, Trash2, Loader2, Edit2, Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

const MODULES = ["users", "roles", "stores", "recce", "installation"];

const generateDefaultPermissions = () => {
  return MODULES.reduce(
    (acc, module) => {
      acc[module] = { view: false, create: false, edit: false, delete: false };
      return acc;
    },
    {} as Record<string, PermissionSet>,
  );
};

export default function RolesPage() {
  const { darkMode } = useTheme();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    permissions: generateDefaultPermissions(),
  });

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch]);

  const fetchData = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);

      const { data } = await api.get(`/roles?${params.toString()}`);
      setRoles(data.roles || []);
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setTotalRoles(data.pagination.total);
      }
    } catch {
      toast.error("Failed to load roles");
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        setTimeout(() => setIsLoading(false), 800 - elapsed);
      } else {
        setIsLoading(false);
      }
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      code: "",
      permissions: generateDefaultPermissions(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    const mergedPermissions = {
      ...generateDefaultPermissions(),
      ...role.permissions,
    };

    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      permissions: mergedPermissions,
    });
    setIsModalOpen(true);
  };

  const togglePermission = (module: string, action: keyof PermissionSet) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action],
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, formData);
        toast.success("Role updated successfully");
      } else {
        await api.post("/roles", formData);
        toast.success("Role created successfully");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className={`flex flex-col gap-3 p-2 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
          <p className="font-semibold">Delete this role?</p>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Cancel
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ), { duration: Infinity, style: { background: 'transparent', boxShadow: 'none', padding: 0 } });
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/roles/${roleId}`);
      setRoles(roles.filter((r) => r._id !== roleId));
      toast.success("Role deleted successfully");
    } catch {
      toast.error("Failed to delete role");
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/roles/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Roles.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to export roles");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-8 w-32 rounded-lg mb-2 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-4 w-48 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
          <div className="flex gap-2">
            <div className={`h-10 w-24 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-10 w-32 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div className={`flex-1 max-w-md h-10 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`rounded-xl border p-4 animate-pulse ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
              <div className="flex items-center mb-3">
                <div className={`h-10 w-10 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className="ml-3 flex-1">
                  <div className={`h-4 w-24 rounded mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-3 w-16 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className={`h-3 w-16 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, k) => (
                        <div key={k} className={`h-2 w-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className={`flex justify-end gap-2 pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className={`h-8 w-8 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className={`h-8 w-8 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Roles
          </h1>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Manage system permissions
          </p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={handleExport}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                    darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
            >
                <FileText className="h-4 w-4 mr-2" />
                Export
            </button>
            <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
            >
            <Plus className="h-4 w-4 mr-2" />
            Create Role
            </button>
        </div>
      </div>

      <div
        className={`p-4 rounded-xl border ${
          darkMode
            ? "bg-purple-900/30 border-purple-700/50"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:border-yellow-500`}
            />
          </div>
          <div
            className={`text-sm font-medium ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Total: {totalRoles}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:hidden">
        {roles.map((role) => (
          <div
            key={role._id}
            className={`rounded-xl border p-4 transition-all hover:scale-105 ${
              darkMode
                ? "bg-purple-900/30 border-purple-700/50"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center mb-3">
              <div
                className={`p-2 rounded-lg ${
                  darkMode ? "bg-yellow-500/20" : "bg-yellow-100"
                }`}
              >
                <Shield className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <h3
                  className={`font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {role.name}
                </h3>
                <code
                  className={`text-xs px-1 rounded ${
                    darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {role.code}
                </code>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              {Object.entries(role.permissions)
                .slice(0, 3)
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span
                      className={`capitalize ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {key}
                    </span>
                    <div className="flex space-x-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          val.view
                            ? "bg-green-500"
                            : darkMode
                              ? "bg-gray-600"
                              : "bg-gray-300"
                        }`}
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          val.create
                            ? "bg-blue-500"
                            : darkMode
                              ? "bg-gray-600"
                              : "bg-gray-300"
                        }`}
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          val.edit
                            ? "bg-yellow-500"
                            : darkMode
                              ? "bg-gray-600"
                              : "bg-gray-300"
                        }`}
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          val.delete
                            ? "bg-red-500"
                            : darkMode
                              ? "bg-gray-600"
                              : "bg-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div
              className={`flex justify-end gap-2 pt-3 border-t ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => openEditModal(role)}
                className={`p-1 rounded transition-colors ${
                  darkMode
                    ? "text-blue-400 hover:bg-blue-500/20"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {role.code !== "SUPER_ADMIN" && (
                <button
                  onClick={() => handleDelete(role._id)}
                  className={`p-1 rounded transition-colors ${
                    darkMode
                      ? "text-red-400 hover:bg-red-500/20"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div
        className={`hidden lg:block rounded-xl border overflow-hidden ${
          darkMode
            ? "bg-purple-900/30 border-purple-700/50"
            : "bg-white border-gray-200"
        }`}
      >
        <table className="min-w-full">
          <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-50"}>
            <tr>
              <th
                className={`px-4 py-3 text-left text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Role
              </th>
              <th
                className={`px-4 py-3 text-left text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Permissions
              </th>
              <th
                className={`px-4 py-3 text-right text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              darkMode ? "divide-gray-700" : "divide-gray-200"
            }`}
          >
            {roles.map((role) => (
              <tr
                key={role._id}
                className={`transition-colors ${
                  darkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        darkMode ? "bg-yellow-500/20" : "bg-yellow-100"
                      }`}
                    >
                      <Shield className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {role.name}
                      </h3>
                      <code
                        className={`text-xs px-1 rounded ${
                          darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {role.code}
                      </code>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {Object.entries(role.permissions)
                      .slice(0, 4)
                      .map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span
                            className={`capitalize ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {key}
                          </span>
                          <div className="flex space-x-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                val.view
                                  ? "bg-green-500"
                                  : darkMode
                                    ? "bg-gray-600"
                                    : "bg-gray-300"
                              }`}
                              title="View"
                            />
                            <span
                              className={`w-2 h-2 rounded-full ${
                                val.create
                                  ? "bg-blue-500"
                                  : darkMode
                                    ? "bg-gray-600"
                                    : "bg-gray-300"
                              }`}
                              title="Create"
                            />
                            <span
                              className={`w-2 h-2 rounded-full ${
                                val.edit
                                  ? "bg-yellow-500"
                                  : darkMode
                                    ? "bg-gray-600"
                                    : "bg-gray-300"
                              }`}
                              title="Edit"
                            />
                            <span
                              className={`w-2 h-2 rounded-full ${
                                val.delete
                                  ? "bg-red-500"
                                  : darkMode
                                    ? "bg-gray-600"
                                    : "bg-gray-300"
                              }`}
                              title="Delete"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(role)}
                      className={`p-2 rounded transition-colors ${
                        darkMode
                          ? "text-blue-400 hover:bg-blue-500/20"
                          : "text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {role.code !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => handleDelete(role._id)}
                        className={`p-2 rounded transition-colors ${
                          darkMode
                            ? "text-red-400 hover:bg-red-500/20"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div className={`px-4 py-3 flex items-center justify-between border-t ${
          darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              darkMode ? "text-gray-200" : "text-gray-700"
            }`}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalRoles)} of {totalRoles} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className={`text-xs font-medium rounded border px-2 py-1 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-1 rounded ${
                  darkMode
                    ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className={`px-2 text-sm font-medium flex items-center ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-1 rounded ${
                  darkMode
                    ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? "Edit Role" : "Create Role"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <style dangerouslySetInnerHTML={{
            __html: `
              input:-webkit-autofill,
              input:-webkit-autofill:hover,
              input:-webkit-autofill:focus {
                -webkit-box-shadow: 0 0 0 1000px ${darkMode ? '#374151' : '#ffffff'} inset !important;
                -webkit-text-fill-color: ${darkMode ? '#ffffff' : '#111827'} !important;
                transition: background-color 5000s ease-in-out 0s;
              }
            `
          }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Role Name"
              required
              className={`w-full rounded-md border px-3 py-2 focus:ring-1 focus:ring-yellow-500 focus:outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              placeholder="ROLE_CODE"
              required
              disabled={!!editingRole}
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
                editingRole
                  ? darkMode ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                  : darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-500" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-500"
              }`}
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                })
              }
            />
          </div>

          <div className={`border rounded-md overflow-hidden ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? "bg-gray-800" : "bg-gray-100"}>
                <tr>
                  <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                    Module
                  </th>
                  {["View", "Create", "Edit", "Delete"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-center text-sm font-semibold border-l ${darkMode ? "text-gray-300 border-gray-700" : "text-gray-900 border-gray-200"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-800" : "divide-gray-100 bg-white"}`}>
                {MODULES.map((module) => (
                  <tr key={module} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className={`px-4 py-3 text-sm font-medium capitalize ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                      {module}
                    </td>
                    {(["view", "create", "edit", "delete"] as const).map(
                      (action) => (
                        <td
                          key={action}
                          className={`text-center border-l py-2 ${darkMode ? "border-gray-700" : "border-gray-50"}`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded cursor-pointer"
                            checked={formData.permissions[module][action]}
                            onChange={() => togglePermission(module, action)}
                          />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`flex justify-end gap-3 pt-2 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`px-4 py-2 rounded-md font-medium ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-medium flex items-center"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              )}
              {editingRole ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
