"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { User, Role } from "@/src/types/auth";
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Loader2, Search } from "lucide-react";
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
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
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter) {
      filtered = filtered.filter(user => user.role?._id === roleFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
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
    setFormData({ name: "", email: "", password: "", roleId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      roleId: user.role?._id || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
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
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Users
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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

      <div className={`p-4 rounded-xl border ${
        darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:border-yellow-500`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } focus:outline-none focus:border-yellow-500`}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>{role.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } focus:outline-none focus:border-yellow-500`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className={`text-sm font-medium flex items-center ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Total: {filteredUsers.length}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden ${
        darkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-white border-gray-200'
      }`}>
        <div className="hidden md:block">
          <table className="min-w-full">
            <thead className={darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>User</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Role</th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Status</th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredUsers.map((user) => (
                <tr key={user._id} className={`${
                  darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
                }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>{user.name}</p>
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.role?.name || "No Role"}
                    </span>
                  </td>
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className={`p-1 rounded transition-colors ${
                          darkMode ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className={`p-1 rounded transition-colors ${
                          darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                        }`}
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
                    <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(user)} className="text-blue-600">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(user._id)} className="text-red-600">
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
        title={editingUser ? "Edit User" : "Create User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required={!editingUser}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg disabled:opacity-50 text-sm"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
              {editingUser ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}