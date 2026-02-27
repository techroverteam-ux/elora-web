"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { Plus, Trash2, Loader2, Edit2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

interface Element {
  _id: string;
  name: string;
  standardRate: number;
  createdAt: string;
}

export default function ElementsPage() {
  const { darkMode } = useTheme();
  const [elements, setElements] = useState<Element[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingElement, setEditingElement] = useState<Element | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    standardRate: "",
  });

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
    try {
      setIsFetching(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);

      const { data } = await api.get(`/elements?${params.toString()}`);
      setElements(data.elements || []);
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setTotalElements(data.pagination.total);
      }
    } catch {
      toast.error("Failed to load elements");
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const openCreateModal = () => {
    setEditingElement(null);
    setFormData({ name: "", standardRate: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (element: Element) => {
    setEditingElement(element);
    setFormData({
      name: element.name,
      standardRate: element.standardRate.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        standardRate: Number(formData.standardRate),
      };

      if (editingElement) {
        await api.put(`/elements/${editingElement._id}`, payload);
        toast.success("Element updated successfully");
      } else {
        await api.post("/elements", payload);
        toast.success("Element created successfully");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (elementId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className={`flex flex-col gap-3 p-2 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
          <p className="font-semibold">Delete this element?</p>
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
      await api.delete(`/elements/${elementId}`);
      toast.success("Element deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete element");
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
            Element Mapping
          </h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Manage element rates
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Element
        </button>
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="text"
              placeholder="Search elements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"} focus:outline-none focus:border-yellow-500`}
            />
          </div>
          <div className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Total: {totalElements}
          </div>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <table className="min-w-full">
          <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-50"}>
            <tr>
              <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Element Name
              </th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Standard Rate (₹/sq.ft)
              </th>
              <th className={`px-4 py-3 text-right text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {elements.map((element) => (
              <tr key={element._id} className={`transition-colors ${darkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                <td className="px-4 py-3">
                  <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {element.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={darkMode ? "text-gray-200" : "text-gray-900"}>
                    ₹{element.standardRate.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(element)}
                      className={`p-2 rounded transition-colors ${darkMode ? "text-blue-400 hover:bg-blue-500/20" : "text-blue-600 hover:bg-blue-50"}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(element._id)}
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
        
        <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalElements)} of {totalElements} entries
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
        title={editingElement ? "Edit Element" : "Add Element"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Element Name *
            </label>
            <input
              required
              className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:ring-yellow-500 focus:outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Standard Rate (₹/sq.ft) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:ring-yellow-500 focus:outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              value={formData.standardRate}
              onChange={(e) => setFormData({ ...formData, standardRate: e.target.value })}
            />
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
              {editingElement ? "Save Changes" : "Add Element"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
