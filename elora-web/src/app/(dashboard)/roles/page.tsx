"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { Role, PermissionSet } from "@/src/types/auth";
import { Plus, Shield, Trash2, Loader2, Edit2 } from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

const MODULES = ["user", "role", "recce", "installation"];

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    permissions: generateDefaultPermissions(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/roles");
      setRoles(data);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
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
    if (!window.confirm("Delete this role?")) return;
    try {
      await api.delete(`/roles/${roleId}`);
      setRoles(roles.filter((r) => r._id !== roleId));
      toast.success("Role deleted successfully");
    } catch {
      toast.error("Failed to delete role");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500">
            Define access levels for system modules
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Role
        </button>
      </div>

      {/* ROLE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role._id}
            className="bg-white rounded-lg shadow border p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {role.name}
                  </h3>
                  <code className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                    {role.code}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(role.permissions)
                  .slice(0, 3)
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span className="capitalize">{key}</span>
                      <div className="flex space-x-1">
                        <span
                          className={`w-2 h-2 rounded-full ${val.view ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${val.create ? "bg-blue-500" : "bg-gray-300"}`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${val.edit ? "bg-yellow-500" : "bg-gray-300"}`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${val.delete ? "bg-red-500" : "bg-gray-300"}`}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
              <button
                onClick={() => openEditModal(role)}
                className="text-blue-600 flex items-center text-sm"
              >
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </button>
              {role.code !== "SUPER_ADMIN" && (
                <button
                  onClick={() => handleDelete(role._id)}
                  className="text-red-600 flex items-center text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? "Edit Role" : "Create Role"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Role Name"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              placeholder="ROLE_CODE"
              required
              disabled={!!editingRole}
              className={`w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none ${
                editingRole
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-white focus:ring-1 focus:ring-blue-500"
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

          {/* DESKTOP PERMISSIONS - IMPROVED UI */}
          <div className="hidden md:block border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Module
                  </th>
                  {["View", "Create", "Edit", "Delete"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-l border-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {MODULES.map((module) => (
                  <tr key={module} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                      {module}
                    </td>
                    {(["view", "create", "edit", "delete"] as const).map(
                      (action) => (
                        <td
                          key={action}
                          className="text-center border-l border-gray-50 py-2"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
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

          {/* MOBILE PERMISSIONS */}
          <div className="md:hidden space-y-4">
            {MODULES.map((module) => (
              <div
                key={module}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <h4 className="font-bold text-gray-900 capitalize mb-3 border-b border-gray-200 pb-2">
                  {module}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(["view", "create", "edit", "delete"] as const).map(
                    (action) => (
                      <label
                        key={action}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={formData.permissions[module][action]}
                          onChange={() => togglePermission(module, action)}
                        />
                        <span className="capitalize">{action}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center"
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
