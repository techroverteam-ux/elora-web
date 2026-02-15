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
  FileText,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
} from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { darkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStats, setUploadStats] = useState<any>(null);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal State
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
    isActive: true,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, roleFilter, statusFilter, searchTerm]);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get("/roles?limit=100");
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  const fetchUsers = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(searchTerm && { search: searchTerm }),
      });
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
      setTotalUsers(data.pagination.total);
    } catch (err: any) {
      setError("Failed to load users");
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        setTimeout(() => setIsLoading(false), 800 - elapsed);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      toast.dismiss();
      const response = await api.get("/users/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Users.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Users exported successfully!');
    } catch (error) {
      toast.error("Failed to export users");
    }
  };

  const downloadTemplate = async () => {
    try {
      toast.dismiss();
      const response = await api.get('/users/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Elora_User_Upload_Template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    try {
      const { data } = await api.post("/users/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStats(data);
      toast.success(`Success: ${data.successCount}, Errors: ${data.errorCount}`);
      if (data.successCount > 0) {
        fetchUsers();
        setSelectedFiles([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      await api.put(`/users/${user._id}`, { isActive: newStatus });
      
      // Optimistic update
      setUsers(users.map(u => u._id === user._id ? { ...u, isActive: newStatus } : u));
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", roles: [], isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    // Extract role IDs
    let userRoles: string[] = [];
    if (user.roles && Array.isArray(user.roles)) {
      userRoles = user.roles.map((r: any) => r._id);
    } else if (user.role) {
      userRoles = [user.role._id];
    }

    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      roles: userRoles,
      isActive: user.isActive,
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
        roles: formData.roles,
        isActive: formData.isActive
      };

      if (formData.password) payload.password = formData.password;

      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
        toast.success("User updated successfully!");
      } else {
        await api.post("/users", payload);
        toast.success("User created successfully!");
      }

      await fetchUsers(); // Refresh current page
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className={`flex flex-col gap-3 p-2 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
          <p className="font-semibold">Delete this user?</p>
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
      await api.delete(`/users/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Users
            </h1>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Manage system users
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
              <button
                  onClick={() => { setUploadStats(null); setSelectedFiles([]); setIsUploadOpen(true); }}
                  className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Bulk Upload</span>
              </button>
              <button
                  onClick={handleExport}
                  className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                      darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                  <FileText className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
              </button>
              <button
              onClick={openCreateModal}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
              >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add User</span>
              </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${
              darkMode
                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500"
            } focus:outline-none focus:ring-2 focus:ring-yellow-500/20`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        {isLoading ? (
             <div className="p-6">
                <div className={`mb-4 ${darkMode ? "bg-gray-800/50" : "bg-gray-50"} rounded-lg p-4`}>
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-4 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {[...Array(limit)].map((_, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/30 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className="flex-1 space-y-2">
                          <div className={`h-4 w-32 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                          <div className={`h-3 w-48 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        </div>
                        <div className={`h-6 w-20 rounded-full animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className={`h-8 w-24 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className="flex gap-2">
                          <div className={`h-9 w-9 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                          <div className={`h-9 w-9 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
        ) : (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
                <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-50"}>
                <tr>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>User</th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Role</th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</th>
                    <th className={`px-6 py-4 text-right text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Actions</th>
                </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {users.map((user) => (
                    <tr key={user._id} className={`${darkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white text-base">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <p className={`font-medium text-base ${darkMode ? "text-white" : "text-gray-900"}`}>{user.name}</p>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                         <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? user.roles.map((r: any) => (
                                <span key={r._id} className={`px-2.5 py-1 text-xs font-medium rounded-full ${darkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}>
                                    {r.name}
                                </span>
                            )) : <span className="text-gray-400 text-sm">No Role</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => toggleUserStatus(user)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            user.isActive 
                                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                        >
                            {user.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                            {user.isActive ? "Active" : "Inactive"}
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(user)} className={`p-2 rounded hover:bg-blue-50 text-blue-600 transition-colors`}>
                            <Edit2 className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(user._id)} className={`p-2 rounded hover:bg-red-50 text-red-600 transition-colors`}>
                            <Trash2 className="h-5 w-5" />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
              {users.map((user) => (
                <div key={user._id} className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base ${darkMode ? "text-white" : "text-gray-900"} truncate`}>{user.name}</p>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} truncate`}>{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? user.roles.map((r: any) => (
                        <span key={r._id} className={`px-2 py-1 text-xs font-medium rounded-full ${darkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}>
                          {r.name}
                        </span>
                      )) : <span className="text-gray-400 text-xs">No Role</span>}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button 
                        onClick={() => toggleUserStatus(user)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          user.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(user)} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="p-2 rounded-lg bg-red-50 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className={`px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t ${darkMode ? "border-purple-700/50" : "border-gray-200"}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Rows:</span>
                    <select 
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className={`text-sm font-medium border rounded px-2 py-1 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                        {page} / {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"}`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
        )}
      </div>

       {/* MODAL IS SAME AS BEFORE BUT I WILL INCLUDE IT FOR COMPLETENESS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit User" : "Create New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}`} />
            </div>
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Email Address</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}`} />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <label className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Password</label>
              {!editingUser && <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>Min 8 characters</span>}
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required={!editingUser} value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); checkStrength(e.target.value); }} className={`w-full px-4 py-2.5 pr-10 rounded-lg border focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}`} />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus:outline-none ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
               </button>
            </div>
          </div>
            <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Assign Roles</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {formData.roles.map(rId => {
                        const r = roles.find(role => role._id === rId);
                        return <span key={rId} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${darkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}>{r?.name} <X className="w-3 h-3 cursor-pointer" onClick={() => setFormData({...formData, roles: formData.roles.filter(id => id !== rId)})} /></span>
                    })}
                </div>
                <select 
                    onChange={(e) => {
                        if (e.target.value && !formData.roles.includes(e.target.value)) {
                            setFormData({...formData, roles: [...formData.roles, e.target.value]});
                        }
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                >
                    <option value="">Select a role...</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
            </div>

          <div className={`flex justify-end gap-3 pt-4 border-t mt-6 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <button type="button" onClick={() => setIsModalOpen(false)} className={`px-5 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-yellow-500 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 disabled:opacity-70 flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* UPLOAD MODAL */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Bulk Upload Users">
        <div className="space-y-4">
          {uploadStats ? (
            <div className="text-center space-y-3">
              <div className={`text-4xl font-bold ${uploadStats.errorCount === 0 ? "text-green-500" : "text-orange-500"}`}>{uploadStats.successCount} / {uploadStats.totalProcessed}</div>
              <p className="text-sm text-gray-500">Records Processed</p>
              {uploadStats.errors?.length > 0 && (
                <div className="mt-4 text-left bg-red-50 p-3 rounded-lg max-h-48 overflow-y-auto text-xs text-red-600">
                  <ul className="list-disc pl-4 space-y-1">{uploadStats.errors.map((e:any, i:number) => <li key={i}>{e.error} {e.row && `(Row ${e.row})`}</li>)}</ul>
                </div>
              )}
              <button onClick={() => { setIsUploadOpen(false); setUploadStats(null); }} className="w-full bg-gray-900 text-white py-2 rounded-lg mt-2">Close</button>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </button>
              </div>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors relative ${darkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"}`}>
                <input type="file" multiple accept=".xlsx,.xls" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className={`mx-auto h-10 w-10 mb-2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Drop files here or click to upload</p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Supports .xlsx, .xls</p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-100 rounded text-sm"><span className="truncate">{file.name}</span><button type="button" onClick={()=>removeFile(i)} className="text-red-500"><X className="w-4 h-4"/></button></div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={isUploading || selectedFiles.length === 0} className="w-full bg-yellow-500 text-white font-bold py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex justify-center items-center">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload Files"}
              </button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
