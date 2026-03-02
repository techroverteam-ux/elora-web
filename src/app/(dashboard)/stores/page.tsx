"use client";

import React, { useEffect, useState, useRef } from "react";
import api from "@/src/lib/api";
import { Store, StoreStatus } from "@/src/types/store";
import {
  Upload,
  Search,
  Loader2,
  MoreVertical,
  FileSpreadsheet,
  FileText,
  MapPin,
  Trash2,
  UserPlus,
  CheckSquare,
  Square,
  Download,
  Eye,
  Plus,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Ruler,
  User,
  Edit2,
  Check,
  XCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { exportToExcel } from "@/src/utils/excelExport";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import Modal from "@/src/components/ui/Modal";
import { TableSkeleton } from "@/src/components/ui/Skeleton";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function StoresPage() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  // Check if user has RECCE or INSTALLATION role
  const isRecceOrInstallUser = React.useMemo(() => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;
    
    return user.roles.some((role) => 
      role?.name === "RECCE" || role?.name === "INSTALLATION"
    );
  }, [user]);

  
  // Data State
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterClientCode, setFilterClientCode] = useState("");
  const [filterClientName, setFilterClientName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStats, setUploadStats] = useState<any>(null);

  // Assignment State
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStage, setAssignStage] = useState<"RECCE" | "INSTALLATION">("RECCE");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [singleAssignTarget, setSingleAssignTarget] = useState<Store | null>(null);

  // Add Single Store State
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Download Menu State
  const [downloadMenuOpen, setDownloadMenuOpen] = useState<{storeId: string, type: string} | null>(null);

  // Delete State - Track ongoing delete confirmations
  const deleteConfirmOpenRef = useRef<Set<string>>(new Set());

  // Specifications State
  const [specifications, setSpecifications] = useState([{
    type: "",
    width: "",
    height: "",
    unit: "ft",
    qty: "1"
  }]);
  const [showSpecifications, setShowSpecifications] = useState(false);

  // Initial Form State
  const initialFormState = {
    zone: "", state: "", district: "", city: "",
    vendorCode: "", dealerCode: "", dealerName: "", dealerAddress: "",
    clientCode: "",
    poNumber: "", invoiceRemarks: "", poMonth: "", invoiceNo: "",
    boardRate: "", angleCharges: "", scaffoldingCharges: "", transportation: "",
    flanges: "", lollipop: "", oneWayVision: "", sunboard: "", totalCost: "",
    latitude: "", longitude: ""
  };

  const [newStoreData, setNewStoreData] = useState(initialFormState);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchStores = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterCity) params.append("city", filterCity);
      if (filterClientCode) params.append("clientCode", filterClientCode);
      if (filterClientName) params.append("clientName", filterClientName);

      const { data } = await api.get(`/stores?${params.toString()}`);
      setStores(data.stores);
      if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setTotalStores(data.pagination.total);
      }
    } catch (error) {
      toast.error("Failed to load stores");
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        setTimeout(() => setIsLoading(false), 800 - elapsed);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, limit, filterStatus, debouncedSearch, filterCity, filterClientCode, filterClientName]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get("/clients");
      console.log("Fetched clients:", data);
      setClients(data.clients || data || []);
    } catch (error) {
      console.error("Failed to fetch clients", error);
      toast.error("Failed to load clients");
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!userSearchTerm) {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(user => 
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, availableUsers]);

  // --- Handlers ---
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStoreData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreData.dealerCode || !newStoreData.dealerName) {
      return toast.error("Dealer Code and Name are required");
    }
    if (!newStoreData.clientCode) {
      return toast.error("Client Code is required");
    }
    setIsSavingStore(true);
    try {
      const payload = {
        dealerCode: newStoreData.dealerCode,
        storeName: newStoreData.dealerName,
        vendorCode: newStoreData.vendorCode,
        clientCode: newStoreData.clientCode,
        location: {
          zone: newStoreData.zone,
          state: newStoreData.state,
          district: newStoreData.district,
          city: newStoreData.city,
          address: newStoreData.dealerAddress,
          ...(newStoreData.latitude && newStoreData.longitude && {
            coordinates: {
              lat: Number(newStoreData.latitude),
              lng: Number(newStoreData.longitude)
            }
          })
        }
      };
      await api.post("/stores", payload);
      toast.success("Store Added Successfully");
      setIsAddStoreOpen(false);
      setNewStoreData(initialFormState);
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add store");
    } finally {
      setIsSavingStore(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      toast.dismiss();
      const response = await api.get('/stores/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Elora_Store_Upload_Template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleExportStores = async () => {
    try {
      toast.dismiss();
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterCity) params.append("city", filterCity);
      if (filterClientCode) params.append("clientCode", filterClientCode);
      if (filterClientName) params.append("clientName", filterClientName);
      
      const response = await api.get(`/stores/export?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Stores_Export.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Stores exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export stores');
    }
  };

  const downloadPPT = async (storeId: string, dealerCode: string, type: "recce" | "installation") => {
    try {
      toast.loading(`Generating ${type} PPT...`);
      const response = await api.get(`/stores/${storeId}/ppt/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${type.charAt(0).toUpperCase() + type.slice(1)}_${dealerCode}.pptx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (filenameMatch) filename = filenameMatch[1];
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("PPT Downloaded!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download. Ensure data exists.");
    }
  };

  const downloadPDF = async (storeId: string, dealerCode: string, type: "recce" | "installation") => {
    try {
      toast.loading(`Generating ${type} PDF...`);
      const response = await api.get(`/stores/${storeId}/pdf/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${type.charAt(0).toUpperCase() + type.slice(1)}_${dealerCode}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (filenameMatch) filename = filenameMatch[1];
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("PDF Downloaded!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download PDF. Ensure data exists.");
    }
  };

  const downloadExcel = async (storeId: string, dealerCode: string, type: "recce" | "installation") => {
    try {
      toast.loading(`Generating ${type} Excel...`);
      const response = await api.get(`/stores/${storeId}/excel/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${type.charAt(0).toUpperCase() + type.slice(1)}_${dealerCode}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (filenameMatch) filename = filenameMatch[1];
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Excel Downloaded!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download Excel. Ensure data exists.");
    }
  };

  const toggleDownloadMenu = (storeId: string, type: string) => {
    if (downloadMenuOpen?.storeId === storeId && downloadMenuOpen?.type === type) {
      setDownloadMenuOpen(null);
    } else {
      setDownloadMenuOpen({ storeId, type });
    }
  };

  const handleDownload = async (storeId: string, dealerCode: string, reportType: "recce" | "installation", format: "pdf" | "ppt" | "excel") => {
    setDownloadMenuOpen(null);
    if (format === "pdf") {
      await downloadPDF(storeId, dealerCode, reportType);
    } else if (format === "excel") {
      await downloadExcel(storeId, dealerCode, reportType);
    } else {
      await downloadPPT(storeId, dealerCode, reportType);
    }
  };

  const toggleStoreSelection = (id: string) => {
    const newSet = new Set(selectedStoreIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStoreIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedStoreIds.size === stores.length) {
      setSelectedStoreIds(new Set());
    } else {
      const allIds = stores.map((s) => s._id);
      setSelectedStoreIds(new Set(allIds));
    }
  };

  const openAssignModal = async (stage: "RECCE" | "INSTALLATION", specificStore?: Store) => {
    if (specificStore) {
      setSingleAssignTarget(specificStore);
    } else {
      if (selectedStoreIds.size === 0) return toast.error("Select stores first");
      setSingleAssignTarget(null);
    }
    setAssignStage(stage);
    setSelectedUserId("");
    setUserSearchTerm("");
    setIsAssignModalOpen(true);
    try {
      const roleCode = stage === "RECCE" ? "RECCE" : "INSTALLATION";
      const { data } = await api.get(`/users/role/${roleCode}`);
      setAvailableUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error) {
      toast.error(`Failed to fetch ${stage} users`);
      setAvailableUsers([]);
      setFilteredUsers([]);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) return toast.error("Please select a user");
    setIsAssigning(true);
    try {
      const idsToAssign = singleAssignTarget ? [singleAssignTarget._id] : Array.from(selectedStoreIds);
      await api.post("/stores/assign", {
        storeIds: idsToAssign,
        userId: selectedUserId,
        stage: assignStage,
      });
      toast.success("Assignment Successful!");
      setIsAssignModalOpen(false);
      setSelectedStoreIds(new Set());
      setSingleAssignTarget(null);
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Assignment Failed");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (storeId: string, stage: "RECCE" | "INSTALLATION") => {
    try {
      await api.post("/stores/unassign", {
        storeIds: [storeId],
        stage,
      });
      toast.success(`${stage} Unassigned Successfully!`);
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unassignment Failed");
    }
  };

  const handleDelete = async (id: string) => {
    // Prevent multiple confirmation dialogs for the same store
    if (deleteConfirmOpenRef.current.has(id)) return;
    
    deleteConfirmOpenRef.current.add(id);
    
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className={`flex flex-col gap-3 p-2 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
          <p className="font-semibold">Delete this store?</p>
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
      ), { duration: Infinity, position: 'bottom-center', style: { background: 'transparent', boxShadow: 'none', padding: 0 } });
    });
    
    deleteConfirmOpenRef.current.delete(id);
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/stores/${id}`);
      toast.success("Store deleted successfully", {
        position: 'bottom-center',
        style: {
          background: darkMode ? '#065f46' : '#d1fae5',
          color: darkMode ? '#d1fae5' : '#065f46',
          border: darkMode ? '1px solid #10b981' : '1px solid #059669',
          borderRadius: '10px',
          padding: '12px 16px',
        },
      });
      fetchStores();
    } catch (error) {
      toast.error("Failed to delete store", {
        position: 'bottom-center',
        style: {
          background: darkMode ? '#7f1d1d' : '#fee2e2',
          color: darkMode ? '#fecaca' : '#7f1d1d',
          border: darkMode ? '1px solid #ef4444' : '1px solid #dc2626',
          borderRadius: '10px',
          padding: '12px 16px',
        },
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStoreIds.size === 0) return;
    if (deleteConfirmOpenRef.current.has('bulk')) return;
    
    deleteConfirmOpenRef.current.add('bulk');

    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className={`flex flex-col gap-3 p-2 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
          <p className="font-semibold">Delete {selectedStoreIds.size} store(s)?</p>
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
              Delete All
            </button>
          </div>
        </div>
      ), { duration: Infinity, position: 'bottom-center', style: { background: 'transparent', boxShadow: 'none', padding: 0 } });
    });

    deleteConfirmOpenRef.current.delete('bulk');

    if (!confirmed) return;

    try {
      const storeIds = Array.from(selectedStoreIds);
      await Promise.all(storeIds.map(id => api.delete(`/stores/${id}`)));
      toast.success(`${storeIds.length} store(s) deleted successfully`, {
        position: 'bottom-center',
        style: {
          background: darkMode ? '#065f46' : '#d1fae5',
          color: darkMode ? '#d1fae5' : '#065f46',
          border: darkMode ? '1px solid #10b981' : '1px solid #059669',
          borderRadius: '10px',
          padding: '12px 16px',
        },
      });
      setSelectedStoreIds(new Set());
      fetchStores();
    } catch (error) {
      toast.error("Failed to delete some stores", {
        position: 'bottom-center',
        style: {
          background: darkMode ? '#7f1d1d' : '#fee2e2',
          color: darkMode ? '#fecaca' : '#7f1d1d',
          border: darkMode ? '1px solid #ef4444' : '1px solid #dc2626',
          borderRadius: '10px',
          padding: '12px 16px',
        },
      });
    }
  };

  const handleApproveRecce = async (id: string) => {
    try {
      await api.post(`/stores/${id}/recce/review`, { status: "APPROVED" });
      toast.success("Recce Approved Successfully!");
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve recce");
    }
  };

  const handleRejectRecce = async (id: string) => {
    try {
      await api.post(`/stores/${id}/recce/review`, { status: "REJECTED" });
      toast.success("Recce Rejected");
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject recce");
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
      const { data } = await api.post("/stores/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStats(data);
      if (data.errorCount > 0) {
        toast.error(`Upload rejected: ${data.errorCount} errors found. Fix and re-upload.`);
      } else {
        toast.success(`All ${data.successCount} stores uploaded successfully!`);
        fetchStores();
        setSelectedFiles([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed");
      if (error.response?.data?.rows) {
        setUploadStats(error.response.data);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportUploadResults = (type: 'valid' | 'invalid' | 'all') => {
    if (!uploadStats?.rows) return;
    const filename = `Store_Upload_${type === 'valid' ? 'Valid' : type === 'invalid' ? 'Invalid' : 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(uploadStats.rows, type, filename);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} rows exported!`);
  };

  const getStatusColor = (status: StoreStatus) => {
    switch (status) {
      case StoreStatus.UPLOADED: return "bg-gray-100 text-gray-800";
      case StoreStatus.RECCE_ASSIGNED: return "bg-blue-100 text-blue-800";
      case StoreStatus.RECCE_SUBMITTED: return "bg-yellow-100 text-yellow-800";
      case StoreStatus.RECCE_APPROVED: return "bg-purple-100 text-purple-800";
      case StoreStatus.INSTALLATION_ASSIGNED: return "bg-indigo-100 text-indigo-800";
      case StoreStatus.INSTALLATION_SUBMITTED: return "bg-teal-100 text-teal-800";
      case StoreStatus.COMPLETED: return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const inputClass = `w-full border p-2 rounded text-sm transition-all outline-none ${darkMode ? "bg-gray-800 border-gray-700 text-white focus:border-yellow-500" : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500"}`;
  const labelClass = `block text-xs font-bold mb-1 uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-600"}`;
  const sectionHeaderClass = `text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${darkMode ? "text-yellow-500 border-gray-700" : "text-yellow-600 border-gray-200"}`;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Store Operations</h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Manage and track all store activities</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={handleExportStores} className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium text-sm bg-green-600 hover:bg-green-700 text-white">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export Stores</span>
          </button>
           <button onClick={() => { setUploadStats(null); setSelectedFiles([]); setIsUploadOpen(true); }} className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium text-sm bg-yellow-500 hover:bg-yellow-600 text-white">
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>
          <button onClick={() => setIsAddStoreOpen(true)} className="inline-flex items-center px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm shadow-md shadow-yellow-500/20">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Store</span>
          </button>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <div className="flex flex-col gap-3">
             <div className="flex flex-col sm:flex-row gap-3">
                 {/* Search */}
                <div className="relative flex-1">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <input type="text" placeholder="Search stores, dealers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm font-medium ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`} />
                </div>
                 {/* Status Filter */}
                <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`}>
                    <option value="ALL">All Status</option>
                    {Object.values(StoreStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
                {/* City Filter */}
                <input type="text" placeholder="Filter by City" value={filterCity} onChange={(e) => { setFilterCity(e.target.value); setPage(1); }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium sm:w-[150px] ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`} />
                {/* Client Code Filter */}
                <input type="text" placeholder="Client Code" value={filterClientCode} onChange={(e) => { setFilterClientCode(e.target.value); setPage(1); }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium sm:w-[150px] ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`} />
                {/* Client Name Filter */}
                <input type="text" placeholder="Client Name" value={filterClientName} onChange={(e) => { setFilterClientName(e.target.value); setPage(1); }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium sm:w-[150px] ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`} />
            </div>

            {/* Bulk Actions */}
            {selectedStoreIds.size > 0 && (
                 <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                    <button onClick={() => openAssignModal("RECCE")} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                        <UserPlus className="h-4 w-4 mr-2" /> Assign Recce ({selectedStoreIds.size})
                    </button>
                    {!isRecceOrInstallUser && (
                      <button onClick={handleBulkDelete} className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete ({selectedStoreIds.size})
                      </button>
                    )}
                 </div>
            )}
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden shadow-sm ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
        {isLoading ? (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={darkMode ? "bg-gray-800" : "bg-gray-100"}>
                    <tr>
                      <th className="px-4 py-4 w-12"><div className={`h-5 w-5 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`} /></th>
                      {[...Array(33)].map((_, i) => (
                        <th key={i} className="px-4 py-4"><div className={`h-3 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`} /></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {[...Array(limit)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4"><div className={`h-5 w-5 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-32 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-32 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-12 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-12 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-4 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className={`h-6 w-20 rounded-full animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                        <td className="px-4 py-4"><div className="space-y-1"><div className={`h-4 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></div></td>
                        <td className="px-4 py-4"><div className="flex justify-end gap-1.5">{[...Array(3)].map((_, j) => <div key={j} className={`h-8 w-8 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                <div className={`h-4 w-48 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className="flex gap-1">
                    <div className={`h-8 w-8 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-8 w-8 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-8 w-8 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                </div>
              </div>
            </div>
        ) : stores.length === 0 ? (
             <div className="p-8 text-center text-gray-500"><MapPin className="h-8 w-8 mx-auto mb-2 opacity-50"/> <p>No stores found matching filters</p></div>
        ) : (
        <>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-200">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-50"}>
              <tr>
                <th className="px-4 py-4 text-left w-12">
                  <button onClick={toggleAllSelection}>
                    {selectedStoreIds.size === stores.length && stores.length > 0 ? <CheckSquare className="h-5 w-5 text-yellow-500" /> : <Square className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />}
                  </button>
                </th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Store ID</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Client Code</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Zone</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>State</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>District</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Vendor Code</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dealer Code</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>City</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dealer Name</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Address</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>PO Number</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Invoice Remarks</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>PO Month</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Board Type</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Width (Ft.)</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Height (Ft.)</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Qty</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Board Size (Sq.Ft.)</th>
                {!isRecceOrInstallUser && (
                  <>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Board Rate/Sq.Ft.</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Total Board Cost</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Angle Charges</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Scaffolding</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Transportation</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Flanges</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Lollipop</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>One Way Vision</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Sunboard</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Total Cost</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Remark</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Images Attached</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Invoice No</th>
                  </>
                )}
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</th>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Assignment</th>
                <th className={`px-4 py-4 text-right text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-900" : "divide-gray-200 bg-white"}`}>
              {stores.map((store, index) => {
                  const isSelected = selectedStoreIds.has(store._id);
                  return (
                    <tr key={store._id} className={`transition-colors ${isSelected ? (darkMode ? "bg-blue-900/30" : "bg-blue-50") : darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <button onClick={() => toggleStoreSelection(store._id)}>
                                {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />}
                            </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm font-mono font-semibold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>{store.storeId || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm font-mono ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{store.clientCode || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location.zone || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location.state || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location.district || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.vendorCode || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm font-mono font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{store.dealerCode}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location.city || "-"}</div>
                        </td>
                        <td className="px-4 py-4">
                            <div className={`text-sm font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{store.storeName}</div>
                        </td>
                        <td className="px-4 py-4">
                            <div className={`text-sm max-w-[200px] truncate ${darkMode ? "text-gray-200" : "text-gray-900"}`} title={store.location.address}>{store.location.address || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.commercials?.poNumber || "-"}</div>
                        </td>
                        <td className="px-4 py-4">
                            <div className={`text-sm max-w-[150px] truncate ${darkMode ? "text-gray-200" : "text-gray-900"}`} title={store.commercials?.invoiceRemarks}>{store.commercials?.invoiceRemarks || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.commercials?.poMonth || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.type || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.width || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.height || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.qty || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.boardSize || "-"}</div>
                        </td>
                        {!isRecceOrInstallUser && (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.boardRate || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>₹{store.costDetails?.totalBoardCost?.toLocaleString() || "0"}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.angleCharges || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.scaffoldingCharges || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.transportation || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.flanges || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.lollipop || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.oneWayVision || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>₹{store.costDetails?.sunboard || 0}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>₹{store.commercials?.totalCost?.toLocaleString() || "0"}</div>
                            </td>
                            <td className="px-4 py-4">
                                <div className={`text-xs max-w-[150px] truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`} title={store.remark}>{store.remark || "-"}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className={`text-xs font-semibold ${store.imagesAttached ? "text-green-600" : "text-gray-400"}`}>{store.imagesAttached ? "Yes" : "No"}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.commercials?.invoiceNumber || "-"}</div>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap">
                             <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${getStatusColor(store.currentStatus)}`}>
                                 {store.currentStatus.replace(/_/g, " ")}
                             </span>
                        </td>
                        <td className="px-4 py-4">
                            <div className="space-y-1.5">
                                {store.workflow.recceAssignedTo ? (
                                    <div className="flex items-center gap-1.5 text-xs" title="Recce Assigned">
                                         <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">R</div>
                                         <span className={`truncate max-w-[100px] ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{(store.workflow.recceAssignedTo as any).name}</span>
                                         {!isRecceOrInstallUser && (
                                           <button onClick={() => handleUnassign(store._id, "RECCE")} className="text-red-500 hover:text-red-700" title="Unassign Recce">
                                             <X className="w-3 h-3" />
                                           </button>
                                         )}
                                    </div>
                                ) : <div className={`text-xs italic ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Unassigned</div>}
                                
                                {store.workflow.installationAssignedTo && (
                                     <div className="flex items-center gap-1.5 text-xs" title="Install Assigned">
                                         <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">I</div>
                                         <span className={`truncate max-w-[100px] ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{(store.workflow.installationAssignedTo as any).name}</span>
                                         {!isRecceOrInstallUser && (
                                           <button onClick={() => handleUnassign(store._id, "INSTALLATION")} className="text-red-500 hover:text-red-700" title="Unassign Installation">
                                             <X className="w-3 h-3" />
                                           </button>
                                         )}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                             <div className="flex justify-end items-center gap-1.5">
                                <button onClick={()=>router.push(`/store/${store._id}`)} className="p-1.5 rounded hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-blue-600" title="View Details"><Eye className="w-4 h-4"/></button>
                                {!isRecceOrInstallUser && (
                                  <button onClick={()=>handleDelete(store._id)} className="p-1.5 rounded hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-red-600" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                )}
                                
                                {store.currentStatus === StoreStatus.UPLOADED && (
                                     <button onClick={()=>openAssignModal("RECCE", store)} className="p-1.5 rounded hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-blue-600" title="Assign Recce"><UserPlus className="w-4 h-4"/></button>
                                )}
                                
                                {store.currentStatus === StoreStatus.RECCE_SUBMITTED && (
                                     <>
                                        <button onClick={()=>handleApproveRecce(store._id)} className="p-1.5 rounded hover:bg-green-50/50 dark:hover:bg-green-900/20 text-green-600" title="Approve Recce"><Check className="w-4 h-4"/></button>
                                        <button onClick={()=>handleRejectRecce(store._id)} className="p-1.5 rounded hover:bg-red-50/50 dark:hover:bg-red-900/20 text-red-600" title="Reject Recce"><XCircle className="w-4 h-4"/></button>
                                        <div className="relative">
                                          <button onClick={()=>toggleDownloadMenu(store._id, "recce")} className="p-1.5 rounded hover:bg-orange-50/50 dark:hover:bg-orange-900/20 text-orange-600" title="Download Recce"><Download className="w-4 h-4"/></button>
                                          {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "recce" && (
                                            <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                                            </div>
                                          )}
                                        </div>
                                     </>
                                )}
                                
                                {store.currentStatus === StoreStatus.RECCE_APPROVED && (
                                     <>
                                        <button onClick={()=>openAssignModal("INSTALLATION", store)} className="p-1.5 rounded hover:bg-green-50/50 dark:hover:bg-green-900/20 text-green-600" title="Assign Installation"><UserPlus className="w-4 h-4"/></button>
                                        <div className="relative">
                                          <button onClick={()=>toggleDownloadMenu(store._id, "recce")} className="p-1.5 rounded hover:bg-orange-50/50 dark:hover:bg-orange-900/20 text-orange-600" title="Download Recce"><Download className="w-4 h-4"/></button>
                                          {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "recce" && (
                                            <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                                            </div>
                                          )}
                                        </div>
                                     </>
                                )}
                                
                                {[StoreStatus.INSTALLATION_ASSIGNED, StoreStatus.INSTALLATION_SUBMITTED].includes(store.currentStatus) && (
                                     <div className="relative">
                                       <button onClick={()=>toggleDownloadMenu(store._id, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce")} className="p-1.5 rounded hover:bg-orange-50/50 dark:hover:bg-orange-900/20 text-orange-600" title="Download"><Download className="w-4 h-4"/></button>
                                       {downloadMenuOpen?.storeId === store._id && (
                                         <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                                           <button onClick={()=>handleDownload(store._id, store.dealerCode, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                                           <button onClick={()=>handleDownload(store._id, store.dealerCode, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                                           <button onClick={()=>handleDownload(store._id, store.dealerCode, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                                         </div>
                                       )}
                                     </div>
                                )}
                                
                                {store.currentStatus === StoreStatus.COMPLETED && (
                                     <>
                                        <div className="relative">
                                          <button onClick={()=>toggleDownloadMenu(store._id, "recce")} className="p-1.5 rounded hover:bg-orange-50/50 dark:hover:bg-orange-900/20 text-orange-600" title="Download Recce"><Download className="w-4 h-4"/></button>
                                          {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "recce" && (
                                            <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                                            </div>
                                          )}
                                        </div>
                                        <div className="relative">
                                          <button onClick={()=>toggleDownloadMenu(store._id, "installation")} className="p-1.5 rounded hover:bg-purple-50/50 dark:hover:bg-purple-900/20 text-purple-600" title="Download Installation"><Download className="w-4 h-4"/></button>
                                          {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "installation" && (
                                            <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "installation", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "installation", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                                              <button onClick={()=>handleDownload(store._id, store.dealerCode, "installation", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                                            </div>
                                          )}
                                        </div>
                                     </>
                                )}
                             </div>
                        </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3 p-4">
          {stores.map(store => {
            const isSelected = selectedStoreIds.has(store._id);
            return (
              <div key={store._id} className={`p-4 rounded-lg border ${isSelected ? (darkMode ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-300") : darkMode ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-200"}`}>
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button onClick={() => toggleStoreSelection(store._id)} className="mt-1">
                      {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${darkMode ? "text-yellow-400" : "text-yellow-600"} mb-1`}>{store.storeId || store.dealerCode}</div>
                      <div className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"} truncate`}>{store.storeName}</div>
                      <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>{store.location.city}, {store.location.state}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap ${getStatusColor(store.currentStatus)}`}>
                    {store.currentStatus.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Dealer Code:</span>
                    <span className={`font-mono font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{store.dealerCode}</span>
                  </div>
                  {store.specs && (
                    <div className="flex justify-between">
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Dimensions:</span>
                      <span className={darkMode ? "text-gray-200" : "text-gray-900"}>{store.specs.width}x{store.specs.height} ft (Qty: {store.specs.qty})</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Total Cost:</span>
                    <span className={`font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>₹{store.commercials?.totalCost?.toLocaleString() || "0"}</span>
                  </div>
                  {store.workflow.recceAssignedTo && (
                    <div className="flex justify-between items-center">
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Recce:</span>
                      <span className={`text-xs ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{(store.workflow.recceAssignedTo as any).name}</span>
                    </div>
                  )}
                  {store.workflow.installationAssignedTo && (
                    <div className="flex justify-between items-center">
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Installation:</span>
                      <span className={`text-xs ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{(store.workflow.installationAssignedTo as any).name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={`flex flex-wrap gap-2 mt-3 pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <button onClick={()=>router.push(`/store/${store._id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">
                    <Eye className="w-3.5 h-3.5"/> View
                  </button>
                  {!isRecceOrInstallUser && (
                    <button onClick={()=>handleDelete(store._id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                      <Trash2 className="w-3.5 h-3.5"/> Delete
                    </button>
                  )}
                  {store.currentStatus === StoreStatus.UPLOADED && (
                    <button onClick={()=>openAssignModal("RECCE", store)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">
                      <UserPlus className="w-3.5 h-3.5"/> Assign Recce
                    </button>
                  )}
                  {store.currentStatus === StoreStatus.RECCE_SUBMITTED && (
                    <>
                      <button onClick={()=>handleApproveRecce(store._id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-600 text-xs font-medium">
                        <Check className="w-3.5 h-3.5"/> Approve
                      </button>
                      <button onClick={()=>handleRejectRecce(store._id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5"/> Reject
                      </button>
                      <div className="relative">
                        <button onClick={()=>toggleDownloadMenu(store._id, "recce")} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium">
                          <Download className="w-3.5 h-3.5"/> Download
                        </button>
                        {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "recce" && (
                          <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {store.currentStatus === StoreStatus.RECCE_APPROVED && (
                    <>
                      <button onClick={()=>openAssignModal("INSTALLATION", store)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-600 text-xs font-medium">
                        <UserPlus className="w-3.5 h-3.5"/> Assign Install
                      </button>
                      <div className="relative">
                        <button onClick={()=>toggleDownloadMenu(store._id, "recce")} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium">
                          <Download className="w-3.5 h-3.5"/> Download
                        </button>
                        {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "recce" && (
                          <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {[StoreStatus.INSTALLATION_ASSIGNED, StoreStatus.INSTALLATION_SUBMITTED].includes(store.currentStatus) && (
                    <div className="relative">
                      <button onClick={()=>toggleDownloadMenu(store._id, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce")} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium">
                        <Download className="w-3.5 h-3.5"/> Download
                      </button>
                      {downloadMenuOpen?.storeId === store._id && (
                        <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                          <button onClick={()=>handleDownload(store._id, store.dealerCode, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                          <button onClick={()=>handleDownload(store._id, store.dealerCode, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                          <button onClick={()=>handleDownload(store._id, store.dealerCode, store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ? "installation" : "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                        </div>
                      )}
                    </div>
                  )}
                  {store.currentStatus === StoreStatus.COMPLETED && (
                    <>
                      <div className="relative">
                        <button onClick={()=>toggleDownloadMenu(store._id, "recce")} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium">
                          <Download className="w-3.5 h-3.5"/> Recce
                        </button>
                        {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "recce" && (
                          <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "recce", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <button onClick={()=>toggleDownloadMenu(store._id, "installation")} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 text-purple-600 text-xs font-medium">
                          <Download className="w-3.5 h-3.5"/> Install
                        </button>
                        {downloadMenuOpen?.storeId === store._id && downloadMenuOpen?.type === "installation" && (
                          <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "installation", "pdf")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileText className="w-3.5 h-3.5"/>PDF</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "installation", "ppt")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>PPT</button>
                            <button onClick={()=>handleDownload(store._id, store.dealerCode, "installation", "excel")} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}`}><FileSpreadsheet className="w-3.5 h-3.5"/>Excel</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls */}
        <div className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex items-center gap-2">
                 <span className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Showing {(page-1)*limit + 1}-{Math.min(page*limit, totalStores)} of {totalStores}</span>
            </div>
            <div className="flex items-center gap-2">
                 <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className={`text-xs font-medium rounded border px-2 py-1 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                 </select>
                 <div className="flex gap-1">
                    <button onClick={()=>setPage(p => Math.max(1, p-1))} disabled={page===1} className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"}`}><ChevronLeft className="w-4 h-4"/></button>
                    <span className={`px-2 text-sm font-medium flex items-center ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{page}</span>
                    <button onClick={()=>setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"}`}><ChevronRight className="w-4 h-4"/></button>
                 </div>
            </div>
        </div>
        </>
        )}
      </div>

       {/* MODALS (Keep existing logic mostly as is, just wrapped cleanly) */}
       {/* UPLOAD MODAL */}
       <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Bulk Upload Stores">
         <div className="space-y-4">
           {uploadStats ? (
             <div className="space-y-4">
               <div className={`p-4 rounded-lg ${uploadStats.errorCount === 0 ? darkMode ? "bg-green-900/20 border border-green-500/30" : "bg-green-50 border border-green-200" : darkMode ? "bg-red-900/20 border border-red-500/30" : "bg-red-50 border border-red-200"}`}>
                 <div className="flex items-center gap-3 mb-2">
                   {uploadStats.errorCount === 0 ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                   <div>
                     <p className={`font-bold text-lg ${uploadStats.errorCount === 0 ? "text-green-600" : "text-red-600"}`}>
                       {uploadStats.errorCount === 0 ? "Upload Successful!" : "Upload Rejected"}
                     </p>
                     <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                       Processed: {uploadStats.totalProcessed} | Valid: {uploadStats.successCount} | Errors: {uploadStats.errorCount}
                     </p>
                   </div>
                 </div>
                 {uploadStats.errorCount > 0 && (
                   <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Fix all errors and re-upload the file. Use export buttons below to download corrected data.</p>
                 )}
               </div>

               <div className="flex gap-2">
                 <button onClick={() => handleExportUploadResults('valid')} disabled={uploadStats.successCount === 0} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm">
                   <Download className="w-4 h-4" /> Export Valid ({uploadStats.successCount})
                 </button>
                 <button onClick={() => handleExportUploadResults('invalid')} disabled={uploadStats.errorCount === 0} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm">
                   <Download className="w-4 h-4" /> Export Invalid ({uploadStats.errorCount})
                 </button>
                 <button onClick={() => handleExportUploadResults('all')} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                   <Download className="w-4 h-4" /> Export All
                 </button>
               </div>

               <div className={`border rounded-lg ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                 <div className="max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-200">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                     <thead className={`sticky top-0 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                       <tr>
                         <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Row</th>
                         <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Client Code</th>
                         <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dealer Code</th>
                         <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dealer Name</th>
                         <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>State</th>
                         <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>City</th>
                         <th className={`px-3 py-2 text-left text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status/Error</th>
                       </tr>
                     </thead>
                     <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                       {uploadStats.rows?.map((row: any, idx: number) => (
                         <tr key={idx} className={row.status === 'error' ? (darkMode ? "bg-red-900/10" : "bg-red-50") : (darkMode ? "bg-green-900/10" : "bg-green-50")}>
                           <td className={`px-3 py-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{row.rowNumber}</td>
                           <td className={`px-3 py-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{row.data.clientCode || '-'}</td>
                           <td className={`px-3 py-2 text-xs font-mono ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{row.data.dealerCode || '-'}</td>
                           <td className={`px-3 py-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{row.data.dealerName || '-'}</td>
                           <td className={`px-3 py-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{row.data.state || '-'}</td>
                           <td className={`px-3 py-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{row.data.city || '-'}</td>
                           <td className={`px-3 py-2 text-xs ${row.status === 'success' ? "text-green-600 font-semibold" : "text-red-600"}`}>
                             {row.status === 'success' ? '✓ Valid' : row.error}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

               <button onClick={() => { setIsUploadOpen(false); setUploadStats(null); setSelectedFiles([]); }} className={`w-full py-2 rounded-lg font-medium ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"}`}>Close</button>
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
                    <input type="file" multiple accept=".xlsx,.xls" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Drop files here or click to upload</p>
                    <p className="text-xs text-gray-500">Supports .xlsx, .xls</p>
                </div>
                {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                        {selectedFiles.map((file, i) => (
                            <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"}`}>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileSpreadsheet className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-green-400" : "text-green-600"}`} />
                                    <span className={`text-sm font-medium break-all ${darkMode ? "text-gray-200" : "text-gray-700"}`} title={file.name}>{file.name}</span>
                                </div>
                                <button type="button" onClick={()=>removeFile(i)} className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
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

        {/* ASSIGN MODAL */}
       <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign ${assignStage === "RECCE" ? "Recce" : "Installation"}`}>
          <div className="space-y-4">
              <div className={`p-3 rounded-lg ${darkMode ? "bg-yellow-900/20 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"}`}>
                <p className={`text-sm font-medium ${darkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                  Assigning <strong>{singleAssignTarget ? singleAssignTarget.storeName : `${selectedStoreIds.size} stores`}</strong> to {assignStage === "RECCE" ? "Recce" : "Installation"} team
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={userSearchTerm} 
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400" : "bg-white border-gray-300 text-gray-700 placeholder-gray-500"} focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20`}
                />
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-200">
                  {filteredUsers.map(user => (
                      <div 
                        key={user._id} 
                        onClick={() => setSelectedUserId(user._id)}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedUserId === user._id 
                            ? darkMode
                              ? "border-yellow-500 bg-yellow-900/20 shadow-md" 
                              : "border-yellow-500 bg-yellow-50 shadow-md"
                            : darkMode
                              ? "border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${
                            selectedUserId === user._id
                              ? "bg-yellow-500 text-white"
                              : darkMode
                                ? "bg-gray-700 text-gray-200"
                                : "bg-gray-200 text-gray-700"
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{user.name}</div>
                            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{user.email}</div>
                          </div>
                          {selectedUserId === user._id && (
                            <CheckSquare className="w-5 h-5 text-yellow-500" />
                          )}
                      </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs mt-1">Try adjusting your search</p>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsAssignModalOpen(false)} 
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                    darkMode 
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssign} 
                  disabled={isAssigning || !selectedUserId} 
                  className="flex-1 bg-yellow-500 text-white font-bold py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {isAssigning ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
          </div>
       </Modal>

        {/* ADD STORE MODAL (Simplified layout) */}
       <Modal isOpen={isAddStoreOpen} onClose={() => setIsAddStoreOpen(false)} title="Add New Store">
           <form onSubmit={handleAddStore} className="space-y-6">
               <div className="space-y-4">
                   <div className={sectionHeaderClass}>BASIC DETAILS</div>
                   <div className="grid grid-cols-2 gap-4">
                       <div><label className={labelClass}>Dealer Code *</label><input required name="dealerCode" value={newStoreData.dealerCode} onChange={handleInputChange} className={inputClass} /></div>
                       <div><label className={labelClass}>Dealer Name *</label><input required name="dealerName" value={newStoreData.dealerName} onChange={handleInputChange} className={inputClass} /></div>
                       <div><label className={labelClass}>Vendor Code</label><input name="vendorCode" value={newStoreData.vendorCode} onChange={handleInputChange} className={inputClass} /></div>
                       <div>
                         <label className={labelClass}>Select Client</label>
                         <select 
                           onChange={(e) => {
                             const selectedClient = clients.find(c => c._id === e.target.value);
                             if (selectedClient) {
                               setNewStoreData({ ...newStoreData, clientCode: selectedClient.clientCode });
                             }
                           }}
                           className={inputClass}
                         >
                           <option value="">Select a client...</option>
                           {clients.map(client => (
                             <option key={client._id} value={client._id}>
                               {client.clientName} ({client.clientCode})
                             </option>
                           ))}
                         </select>
                       </div>
                       <div><label className={labelClass}>Client Code *</label><input required name="clientCode" value={newStoreData.clientCode} onChange={handleInputChange} className={inputClass} placeholder="e.g., CLI001" /></div>
                   </div>
                   
                   <div className={sectionHeaderClass}>LOCATION</div>
                   <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelClass}>Zone</label><input name="zone" value={newStoreData.zone} onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className={labelClass}>State</label><input name="state" value={newStoreData.state} onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className={labelClass}>District *</label><input required name="district" value={newStoreData.district} onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className={labelClass}>City *</label><input required name="city" value={newStoreData.city} onChange={handleInputChange} className={inputClass} /></div>
                        <div className="col-span-2"><label className={labelClass}>Address</label><input name="dealerAddress" value={newStoreData.dealerAddress} onChange={handleInputChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Latitude</label><input type="number" step="any" name="latitude" value={newStoreData.latitude} onChange={handleInputChange} className={inputClass} placeholder="e.g. 28.7041" /></div>
                        <div><label className={labelClass}>Longitude</label><input type="number" step="any" name="longitude" value={newStoreData.longitude} onChange={handleInputChange} className={inputClass} placeholder="e.g. 77.1025" /></div>
                   </div>
               </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={() => setIsAddStoreOpen(false)} className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button type="submit" disabled={isSavingStore} className="px-6 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600 disabled:opacity-70 flex items-center">
                        {isSavingStore && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Store
                    </button>
                </div>
           </form>
       </Modal>

    </div>
  );
}
