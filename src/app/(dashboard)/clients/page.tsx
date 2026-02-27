"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { Plus, Trash2, Loader2, Edit2, Search, ChevronLeft, ChevronRight, X, FileText } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

interface Element {
  _id: string;
  name: string;
  standardRate: number;
}

interface ClientElement {
  elementId: string;
  elementName: string;
  customRate: number;
  quantity: number;
}

interface Client {
  _id: string;
  clientCode: string;
  clientName: string;
  branchName: string;
  amount: number;
  gstNumber: string;
  elements: ClientElement[];
  createdAt: string;
}

export default function ClientsPage() {
  const { darkMode } = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [availableElements, setAvailableElements] = useState<Element[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    clientName: "",
    branchName: "",
    amount: "",
    gstNumber: "",
    elements: [] as ClientElement[],
  });

  const [errors, setErrors] = useState({
    clientName: "",
    branchName: "",
    amount: "",
    gstNumber: "",
  });

  const [selectedElementId, setSelectedElementId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchElements();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch]);

  const fetchData = async () => {
    try {
      setIsFetching(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);

      const { data } = await api.get(`/clients?${params.toString()}`);
      setClients(data.clients || []);
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setTotalClients(data.pagination.total);
      }
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const fetchElements = async () => {
    try {
      const { data } = await api.get("/elements/all");
      setAvailableElements(data.elements || []);
    } catch {
      toast.error("Failed to load elements");
    }
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      clientName: "",
      branchName: "",
      amount: "",
      gstNumber: "",
      elements: [],
    });
    setErrors({
      clientName: "",
      branchName: "",
      amount: "",
      gstNumber: "",
    });
    setSelectedElementId("");
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      clientName: client.clientName,
      branchName: client.branchName,
      amount: client.amount.toString(),
      gstNumber: client.gstNumber,
      elements: client.elements,
    });
    setErrors({
      clientName: "",
      branchName: "",
      amount: "",
      gstNumber: "",
    });
    setSelectedElementId("");
    setIsModalOpen(true);
  };

  const addElement = () => {
    if (!selectedElementId) {
      toast.error("Please select an element");
      return;
    }

    const element = availableElements.find(e => e._id === selectedElementId);
    if (!element) return;

    const alreadyAdded = formData.elements.some(e => e.elementId === selectedElementId);
    if (alreadyAdded) {
      toast.error("Element already added");
      return;
    }

    setFormData({
      ...formData,
      elements: [
        ...formData.elements,
        {
          elementId: element._id,
          elementName: element.name,
          customRate: element.standardRate,
          quantity: 1,
        },
      ],
    });
    setSelectedElementId("");
  };

  const removeElement = (elementId: string) => {
    setFormData({
      ...formData,
      elements: formData.elements.filter(e => e.elementId !== elementId),
    });
  };

  const updateElementQuantity = (elementId: string, newQuantity: number) => {
    setFormData({
      ...formData,
      elements: formData.elements.map(e =>
        e.elementId === elementId ? { ...e, quantity: newQuantity } : e
      ),
    });
  };

  const updateElementRate = (elementId: string, newRate: number) => {
    setFormData({
      ...formData,
      elements: formData.elements.map(e =>
        e.elementId === elementId ? { ...e, customRate: newRate } : e
      ),
    });
  };

  const validateForm = () => {
    const newErrors = {
      clientName: "",
      branchName: "",
      amount: "",
      gstNumber: "",
    };

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = "Client name must be at least 2 characters";
    } else if (/\d/.test(formData.clientName)) {
      newErrors.clientName = "Client name cannot contain numbers";
    }

    if (!formData.branchName.trim()) {
      newErrors.branchName = "Branch name is required";
    } else if (formData.branchName.trim().length < 2) {
      newErrors.branchName = "Branch name must be at least 2 characters";
    } else if (/\d/.test(formData.branchName)) {
      newErrors.branchName = "Branch name cannot contain numbers";
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (Number(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (!/^\d{1,10}(\.\d{1,2})?$/.test(formData.amount)) {
      newErrors.amount = "Invalid amount format (max 10 digits, 2 decimals)";
    }

    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = "GST number is required";
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.trim())) {
      newErrors.gstNumber = "Invalid GST number format (e.g., 22AAAAA0000A1Z5)";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        clientName: formData.clientName,
        branchName: formData.branchName,
        amount: Number(formData.amount),
        gstNumber: formData.gstNumber,
        elements: formData.elements,
      };

      if (editingClient) {
        await api.put(`/clients/${editingClient._id}`, payload);
        toast.success("Client updated successfully");
      } else {
        await api.post("/clients", payload);
        toast.success("Client created successfully");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className={`flex flex-col gap-3 p-2 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
          <p className="font-semibold">Delete this client?</p>
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
      await api.delete(`/clients/${clientId}`);
      toast.success("Client deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete client");
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/clients/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Clients.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Clients exported successfully");
    } catch (error) {
      toast.error("Failed to export clients");
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
          <div className={`h-10 w-32 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Client Management
          </h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Manage clients and their element rates
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
            Add Client
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"} focus:outline-none focus:border-yellow-500`}
            />
          </div>
          <div className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Total: {totalClients}
          </div>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-50"}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Client Code
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Client Name
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Branch
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Amount
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  GST Number
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Elements
                </th>
                <th className={`px-4 py-3 text-right text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {clients.map((client) => (
                <tr key={client._id} className={`transition-colors ${darkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-sm ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                      {client.clientCode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {client.clientName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={darkMode ? "text-gray-200" : "text-gray-900"}>
                      {client.branchName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={darkMode ? "text-gray-200" : "text-gray-900"}>
                      ₹{client.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {client.gstNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {client.elements.length} element(s)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(client)}
                        className={`p-2 rounded transition-colors ${darkMode ? "text-blue-400 hover:bg-blue-500/20" : "text-blue-600 hover:bg-blue-50"}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className={`p-2 rounded transition-colors ${darkMode ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-50"}`}
                      >
                        <Trash2 className="h-4 w-4" />
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
          {clients.map((client) => (
            <div key={client._id} className={`p-4 rounded-lg border transition-all ${darkMode ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-base ${darkMode ? "text-white" : "text-gray-900"} truncate`}>
                    {client.clientName}
                  </div>
                  <div className={`text-xs font-mono mt-1 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                    {client.clientCode}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Branch:</span>
                  <span className={darkMode ? "text-gray-200" : "text-gray-900"}>{client.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Amount:</span>
                  <span className={`font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>₹{client.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? "text-gray-400" : "text-gray-600"}>GST:</span>
                  <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{client.gstNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Elements:</span>
                  <span className={darkMode ? "text-gray-300" : "text-gray-700"}>{client.elements.length} element(s)</span>
                </div>
              </div>

              <div className={`flex gap-2 pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <button
                  onClick={() => openEditModal(client)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(client._id)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalClients)} of {totalClients} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className={`text-xs font-medium rounded border px-2 py-1 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`px-2 text-sm font-medium flex items-center ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"}`}
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
        title={editingClient ? "Edit Client" : "Add Client"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Client Name *
              </label>
              <input
                required
                minLength={2}
                maxLength={100}
                pattern="[^0-9]*"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none ${errors.clientName ? "border-red-500 focus:ring-red-500" : "focus:ring-yellow-500"} ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={formData.clientName}
                onChange={(e) => {
                  const value = e.target.value.replace(/[0-9]/g, '');
                  setFormData({ ...formData, clientName: value });
                  if (errors.clientName) setErrors({ ...errors, clientName: "" });
                }}
              />
              {errors.clientName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Branch Name *
              </label>
              <input
                required
                minLength={2}
                maxLength={100}
                pattern="[^0-9]*"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none ${errors.branchName ? "border-red-500 focus:ring-red-500" : "focus:ring-yellow-500"} ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                value={formData.branchName}
                onChange={(e) => {
                  const value = e.target.value.replace(/[0-9]/g, '');
                  setFormData({ ...formData, branchName: value });
                  if (errors.branchName) setErrors({ ...errors, branchName: "" });
                }}
              />
              {errors.branchName && (
                <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Amount *
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g., 1234567890.99"
                required
                className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none ${errors.amount ? "border-red-500 focus:ring-red-500" : "focus:ring-yellow-500"} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d{0,10}(\.\d{0,2})?$/.test(value)) {
                    setFormData({ ...formData, amount: value });
                    if (errors.amount) setErrors({ ...errors, amount: "" });
                  }
                }}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                GST Number *
              </label>
              <input
                required
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none uppercase ${errors.gstNumber ? "border-red-500 focus:ring-red-500" : "focus:ring-yellow-500"} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                value={formData.gstNumber}
                onChange={(e) => {
                  setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() });
                  if (errors.gstNumber) setErrors({ ...errors, gstNumber: "" });
                }}
              />
              {errors.gstNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>
              )}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Elements
            </label>
            <div className="flex gap-2 mb-3">
              <select
                value={selectedElementId}
                onChange={(e) => setSelectedElementId(e.target.value)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm focus:ring-1 focus:ring-yellow-500 focus:outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              >
                <option value="">Select Element</option>
                {availableElements.map((element) => (
                  <option key={element._id} value={element._id}>
                    {element.name} (₹{element.standardRate}/sq.ft)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addElement}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
              >
                Add
              </button>
            </div>

            {formData.elements.length > 0 && (
              <div className={`border rounded-md max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <table className="min-w-full text-sm">
                  <thead className={`sticky top-0 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                    <tr>
                      <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Element
                      </th>
                      <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Rate (₹/sq.ft)
                      </th>
                      <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Qty
                      </th>
                      <th className={`px-3 py-2 text-right text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {formData.elements.map((element) => (
                      <tr key={element.elementId}>
                        <td className={`px-3 py-2 ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                          {element.elementName}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={element.customRate}
                            onChange={(e) => updateElementRate(element.elementId, Number(e.target.value))}
                            className={`w-20 rounded border px-2 py-1 text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={element.quantity}
                            onChange={(e) => updateElementQuantity(element.elementId, Number(e.target.value))}
                            className={`w-16 rounded border px-2 py-1 text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeElement(element.elementId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={`flex justify-end gap-3 pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`px-4 py-2 rounded-md font-medium text-sm ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-medium text-sm flex items-center justify-center"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
              {editingClient ? "Save Changes" : "Add Client"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
