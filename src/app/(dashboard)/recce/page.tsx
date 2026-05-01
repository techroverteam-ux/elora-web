"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { Store, StoreStatus } from "@/src/types/store";
import {
  MapPin,
  Navigation,
  Camera,
  CheckCircle2,
  Loader2,
  Search,
  LayoutList,
  LayoutGrid,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  FileText,
  ClipboardCheck,
  Upload,
  FileSpreadsheet,
  UserPlus
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import * as XLSX from "xlsx";
import FilterDropdown from "@/src/components/ui/FilterDropdown";
import { generateReccePDF, generateReccePPT } from "@/src/utils/recceExport";

export default function RecceListPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = React.useMemo(() => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((role) => 
      role?.code === "SUPER_ADMIN" || role?.code === "ADMIN"
    );
  }, [user]);
  
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "card">(typeof window !== 'undefined' && window.innerWidth < 768 ? "card" : "table");
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isDownloadingPPT, setIsDownloadingPPT] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStoreName, setFilterStoreName] = useState("");
  const [filterStoreCode, setFilterStoreCode] = useState("");
  const [filterCity, setFilterCity] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAssigningInstallation, setIsAssigningInstallation] = useState(false);
  const [availableInstallUsers, setAvailableInstallUsers] = useState<any[]>([]);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [selectedInstallUserId, setSelectedInstallUserId] = useState("");
  const [installUserSearchTerm, setInstallUserSearchTerm] = useState("");
  const [filteredInstallUsers, setFilteredInstallUsers] = useState<any[]>([]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchTerm);
        setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle Mobile/Desktop View Switch
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 768) setViewMode("card");
        else setViewMode("table");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter install users based on search term
  useEffect(() => {
    if (!installUserSearchTerm) {
      setFilteredInstallUsers(availableInstallUsers);
    } else {
      const filtered = availableInstallUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(installUserSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(installUserSearchTerm.toLowerCase()),
      );
      setFilteredInstallUsers(filtered);
    }
  }, [installUserSearchTerm, availableInstallUsers]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterStoreName) params.append("storeName", filterStoreName);
      if (filterStoreCode) params.append("storeCode", filterStoreCode);
      if (filterCity.length > 0) params.append("city", filterCity.join(","));
      
      // Filter by recce-related statuses only
      if (filterStatus.length > 0) {
        params.append("status", filterStatus.join(","));
      } else {
        // Show all recce-related stores (including completed for admins)
        const statuses = isAdmin 
          ? `${StoreStatus.RECCE_ASSIGNED},${StoreStatus.RECCE_SUBMITTED},${StoreStatus.RECCE_APPROVED},${StoreStatus.RECCE_REJECTED},${StoreStatus.INSTALLATION_ASSIGNED},${StoreStatus.INSTALLATION_SUBMITTED},${StoreStatus.INSTALLATION_REJECTED},${StoreStatus.COMPLETED}`
          : `${StoreStatus.RECCE_ASSIGNED},${StoreStatus.RECCE_SUBMITTED},${StoreStatus.RECCE_APPROVED},${StoreStatus.RECCE_REJECTED}`;
        params.append("status", statuses);
      }

      const { data } = await api.get(`/stores?${params.toString()}`);
      
      // Client-side filter: when no status filter, apply recce-specific logic
      // When status filter is active, trust the API result directly
      let recceStores = data.stores || [];
      if (filterStatus.length === 0) {
        recceStores = isAdmin 
          ? recceStores.filter((store: Store) => store.recce?.submittedDate)
          : recceStores.filter((store: Store) => 
              store.currentStatus === StoreStatus.RECCE_ASSIGNED ||
              store.currentStatus === StoreStatus.RECCE_SUBMITTED ||
              store.currentStatus === StoreStatus.RECCE_APPROVED ||
              store.currentStatus === StoreStatus.RECCE_REJECTED
            );
      }
      setStores(recceStores);
      if (data.pagination) {
          setTotalPages(data.pagination.pages);
          setTotalStores(data.pagination.total);
      }
    } catch (error) {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Map display label -> StoreStatus for recce
  const recceStatusLabelToValue = (label: string): StoreStatus => {
    switch (label) {
      case "Recce Assigned": return StoreStatus.RECCE_ASSIGNED;
      case "Recce Submitted": return StoreStatus.RECCE_SUBMITTED;
      case "Recce Approved": return StoreStatus.RECCE_APPROVED;
      case "Recce Rejected": return StoreStatus.RECCE_REJECTED;
      case "Install Assigned": return StoreStatus.INSTALLATION_ASSIGNED;
      case "Install Submitted": return StoreStatus.INSTALLATION_SUBMITTED;
      case "Completed": return StoreStatus.COMPLETED;
      default: return label as StoreStatus;
    }
  };

  const recceStatusValueToLabel = (val: string): string => {
    switch (val) {
      case StoreStatus.RECCE_ASSIGNED: return "Recce Assigned";
      case StoreStatus.RECCE_SUBMITTED: return "Recce Submitted";
      case StoreStatus.RECCE_APPROVED: return "Recce Approved";
      case StoreStatus.RECCE_REJECTED: return "Recce Rejected";
      case StoreStatus.INSTALLATION_ASSIGNED: return "Install Assigned";
      case StoreStatus.INSTALLATION_SUBMITTED: return "Install Submitted";
      case StoreStatus.COMPLETED: return "Completed";
      default: return val;
    }
  };

  const recceStatusOptions = isAdmin
    ? ["Recce Assigned", "Recce Submitted", "Recce Approved", "Recce Rejected", "Install Assigned", "Install Submitted", "Completed"]
    : ["Recce Assigned", "Recce Submitted", "Recce Approved", "Recce Rejected"];

  useEffect(() => {
    fetchStores();
  }, [page, limit, debouncedSearch, filterStatus, filterStoreName, filterStoreCode, filterCity]);

  // Fetch available filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const citiesRes = await api.get("/stores/cities").catch(() => ({ data: { cities: [] } }));
        if (citiesRes.data?.cities) setAvailableCities(citiesRes.data.cities);
      } catch {}
    };
    fetchFilterOptions();
  }, []);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await api.get('/stores/export/recce', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Recce_Tasks.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Exported Successfully');
    } catch (err) {
      toast.error('Export Failed');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleStoreSelection = (id: string) => {
    const store = stores.find(s => s._id === id);
    // Only allow selection of approved recce stores for installation assignment
    if (store && store.currentStatus === StoreStatus.RECCE_APPROVED) {
      const newSet = new Set(selectedStoreIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedStoreIds(newSet);
    }
  };

  const toggleAllSelection = () => {
    const approvedStores = stores.filter(s => s.currentStatus === StoreStatus.RECCE_APPROVED);
    if (selectedStoreIds.size === approvedStores.length && approvedStores.length > 0) {
      setSelectedStoreIds(new Set());
    } else {
      setSelectedStoreIds(new Set(approvedStores.map(s => s._id)));
    }
  };

  const handleBulkPPTDownload = async () => {
    if (selectedStoreIds.size === 0) {
      toast.error("Please select stores");
      return;
    }
    setIsDownloadingPPT(true);
    const toastId = toast.loading("Generating PPT...");
    try {
      const storeDataList = await Promise.all(
        Array.from(selectedStoreIds).map(id => api.get(`/stores/${id}`).then(r => r.data.store))
      );
      await generateReccePPT(storeDataList);
      toast.dismiss(toastId);
      toast.success(`Downloaded PPT with ${selectedStoreIds.size} stores`);
      setSelectedStoreIds(new Set());
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('PPT generation error:', err);
      toast.error(err?.message || 'Failed to generate PPT');
    } finally {
      setIsDownloadingPPT(false);
    }
  };

  const handleBulkPDFDownload = async () => {
    if (selectedStoreIds.size === 0) {
      toast.error("Please select stores");
      return;
    }
    setIsDownloadingPDF(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      const storeDataList = await Promise.all(
        Array.from(selectedStoreIds).map(id => api.get(`/stores/${id}`).then(r => r.data.store))
      );
      await generateReccePDF(storeDataList);
      toast.dismiss(toastId);
      toast.success(`Downloaded PDF with ${selectedStoreIds.size} stores`);
      setSelectedStoreIds(new Set());
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('PDF generation error:', err);
      toast.error(err?.message || 'Failed to generate PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (selectedStoreIds.size === 0) {
      toast.error("Please select stores");
      return;
    }
    setIsExportingExcel(true);
    try {
      toast.loading("Generating Excel...");
      const response = await api.post('/stores/recce/export-approval', {
        storeIds: Array.from(selectedStoreIds)
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recce_Approval_${selectedStoreIds.size}_Stores_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success(`Excel exported with ${selectedStoreIds.size} stores`);
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading("Importing approvals...");
      const { data } = await api.post('/stores/recce/import-approval', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.dismiss();
      toast.success(`Import completed: ${data.successCount} photos updated`);
      if (data.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} errors occurred`);
      }
      fetchStores();
      setSelectedStoreIds(new Set());
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleBulkInstallationAssignment = async () => {
    if (selectedStoreIds.size === 0) {
      toast.error("Please select approved recce stores");
      return;
    }
    setIsInstallModalOpen(true);
    try {
      const { data } = await api.get(`/users/role/INSTALLATION`);
      setAvailableInstallUsers(data.users);
      setFilteredInstallUsers(data.users);
    } catch (error) {
      toast.error("Failed to fetch installation users");
      setAvailableInstallUsers([]);
      setFilteredInstallUsers([]);
    }
  };

  const handleInstallationAssign = async () => {
    if (!selectedInstallUserId) return toast.error("Please select a user");
    setIsAssigningInstallation(true);
    try {
      await api.post("/stores/assign", {
        storeIds: Array.from(selectedStoreIds),
        userId: selectedInstallUserId,
        stage: "INSTALLATION",
      });
      toast.success("Installation Assignment Successful!");
      setIsInstallModalOpen(false);
      setSelectedStoreIds(new Set());
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Assignment Failed");
    } finally {
      setIsAssigningInstallation(false);
    }
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

  if (initialLoad && loading)
    return (
      <div className="max-w-7xl mx-auto pb-20 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className={`h-8 w-48 rounded-lg mb-2 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-4 w-56 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
          <div className={`h-10 w-32 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <div className="flex gap-4">
            <div className={`flex-1 h-10 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`w-48 h-10 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        </div>
        {viewMode === "card" ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`rounded-xl border overflow-hidden animate-pulse ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <div className={`h-1.5 w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className={`h-5 w-48 rounded mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      <div className={`h-3 w-32 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </div>
                    <div className={`h-6 w-20 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-4 w-4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-4 flex-1 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                  <div className={`h-10 w-full rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={darkMode ? "bg-gray-800/80" : "bg-gray-50"}>
                  <tr>
                    {[...Array(4)].map((_, i) => (
                      <th key={i} className="px-6 py-3"><div className={`h-3 w-20 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`} /></th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className={`h-4 w-32 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                          <div className={`h-3 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className={`h-4 w-24 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                          <div className={`h-3 w-32 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className={`h-6 w-20 rounded-full animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                      <td className="px-6 py-4"><div className={`h-8 w-20 rounded-lg animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
              <div className={`h-4 w-48 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              <div className="flex items-center gap-2">
                <div className={`h-8 w-16 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className="flex gap-1">
                  <div className={`h-8 w-8 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-8 w-8 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-8 w-8 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Recce Inspection</h1>
           <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Manage your recce assignments</p>
        </div>
        <div className="flex flex-wrap gap-2">
             {isAdmin && selectedStoreIds.size > 0 && (
               <>
                 <button onClick={handleBulkPPTDownload} disabled={isDownloadingPPT} className="flex items-center px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
                   <FileText className="w-4 h-4 sm:mr-2"/>
                   <span className="hidden sm:inline">PPT ({selectedStoreIds.size})</span>
                   <span className="sm:hidden">PPT</span>
                 </button>
                 <button onClick={handleBulkPDFDownload} disabled={isDownloadingPDF} className="flex items-center px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                   <FileText className="w-4 h-4 sm:mr-2"/>
                   <span className="hidden sm:inline">PDF ({selectedStoreIds.size})</span>
                   <span className="sm:hidden">PDF</span>
                 </button>
                 <button onClick={handleExportExcel} disabled={isExportingExcel} className="flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                   <FileSpreadsheet className="w-4 h-4 sm:mr-2"/>
                   <span className="hidden sm:inline">Excel ({selectedStoreIds.size})</span>
                   <span className="sm:hidden">Excel</span>
                 </button>
                 {/* Installation Assignment for Approved Recce */}
                 <button onClick={handleBulkInstallationAssignment} disabled={isAssigningInstallation} className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                   <UserPlus className="w-4 h-4 sm:mr-2"/>
                   <span className="hidden sm:inline">Assign Installation ({selectedStoreIds.size})</span>
                   <span className="sm:hidden">Install</span>
                 </button>
               </>
             )}
             {isAdmin && (
               <label className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
                 <Upload className="w-4 h-4 sm:mr-2"/>
                 <span className="hidden sm:inline">Import</span>
                 <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
               </label>
             )}
             <button onClick={handleExport} className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-300 text-gray-700"}`}>
                 <Download className="w-4 h-4 sm:mr-2"/>
                 <span className="hidden sm:inline">Export</span>
             </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
         <div className="flex flex-col gap-3">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <input type="text" placeholder="Search store name, city..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm font-medium ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`} />
              </div>
              <FilterDropdown
                label="All Status"
                allLabel="All Status"
                options={recceStatusOptions}
                selected={filterStatus.map(recceStatusValueToLabel)}
                onChange={(vals) => { setFilterStatus(vals.map(recceStatusLabelToValue)); setPage(1); }}
                className="w-[160px]"
              />
              <FilterDropdown
                label="City"
                allLabel="All Cities"
                options={availableCities}
                selected={filterCity}
                onChange={(vals) => { setFilterCity(vals); setPage(1); }}
                className="w-[150px]"
              />
            </div>
         </div>
      </div>

      {/* CONTENT */}
      {stores.length === 0 && !loading ? (
        <div className={`rounded-xl border p-12 text-center ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <Search className={`w-16 h-16 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
            {debouncedSearch ? "No stores found" : filterStatus.length > 0 ? "No stores with this status" : "No recce tasks available"}
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {debouncedSearch 
              ? `No stores match "${debouncedSearch}". Try a different search term.`
              : filterStatus.length > 0
                ? `No stores found with selected status. Try selecting a different status.`
                : "There are no recce tasks assigned yet."}
          </p>
          {(debouncedSearch || filterStatus.length > 0) && (
            <button 
              onClick={() => { setSearchTerm(""); setFilterStatus([]); }}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
      {/* MOBILE CARD VIEW */}
      <div className="lg:hidden space-y-4">
         {stores.map(store => {
              const isDone = store.currentStatus !== StoreStatus.RECCE_ASSIGNED;
              const canSelect = store.currentStatus === StoreStatus.RECCE_SUBMITTED || store.currentStatus === StoreStatus.RECCE_APPROVED;
              const isSelected = selectedStoreIds.has(store._id);
              return (
                <div key={store._id}
                    className={`rounded-xl shadow-sm border overflow-hidden transition-all ${isSelected ? (darkMode ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-300") : darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                    <div className={`h-1.5 w-full ${isDone ? "bg-green-500" : "bg-blue-600"}`}></div>
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-start gap-3 flex-1">
                                {isAdmin && store.currentStatus === StoreStatus.RECCE_APPROVED && (
                                  <button onClick={() => toggleStoreSelection(store._id)} className="mt-1">
                                    {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />}
                                  </button>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-base ${darkMode ? "text-white" : "text-gray-900"} truncate`}>{store.storeName}</h3>
                                    <p className={`text-xs font-mono mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{store.dealerCode}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${getStatusColor(store.currentStatus)}`}>
                                {store.currentStatus.replace(/_/g, " ")}
                            </span>
                        </div>
                        <div className={`flex items-start gap-2 text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{store.location.address || store.location.city}</span>
                        </div>
                        {store.contact?.mobile && (
                          <div className={`flex items-center gap-2 text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            <span className="text-xs">📱</span>
                            <span>{store.contact.mobile}</span>
                          </div>
                        )}
                        {(isAdmin ? store.workflow?.recceAssignedTo : store.workflow?.recceAssignedBy) && (
                          <div className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {isAdmin ? "Assigned To: " : "Assigned By: "}
                            <span className={darkMode ? "text-gray-200" : "text-gray-900"}>
                              {isAdmin ? (store.workflow?.recceAssignedTo as any)?.name : (store.workflow?.recceAssignedBy as any)?.name}
                            </span>
                          </div>
                        )}
                        {isAdmin && store.recce?.reccePhotos && store.recce.reccePhotos.length > 0 && (
                          <div className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            <span className="text-green-600 font-medium">{store.recce.approvedPhotosCount || 0}</span> approved, 
                            <span className="text-red-600 font-medium ml-1">{store.recce.rejectedPhotosCount || 0}</span> rejected, 
                            <span className="text-yellow-600 font-medium ml-1">{
                              store.recce.reccePhotos.filter(
                                (photo: any) => !photo.approvalStatus || photo.approvalStatus === "PENDING"
                              ).length
                            }</span> pending
                          </div>
                        )}
                        {isAdmin && store.currentStatus === "RECCE_SUBMITTED" ? (
                          <button onClick={() => router.push(`/recce/${store._id}/review`)} className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white bg-purple-600 hover:bg-purple-700">
                            <ClipboardCheck className="h-4 w-4" /> Review Photos
                          </button>
                        ) : (
                          <button onClick={() => router.push(`/recce/${store._id}`)} className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white ${isDone ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                            {isDone ? <><CheckCircle2 className="h-4 w-4" /> View Details</> : <><Camera className="h-4 w-4" /> Start Recce</>}
                          </button>
                        )}
                    </div>
                </div>
              );
         })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className={`hidden lg:block rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
              <div className="overflow-x-auto">
                  <table className="min-w-full">
                      <thead className={darkMode ? "bg-gray-800/80" : "bg-gray-50"}>
                          <tr>
                              {isAdmin && (
                                <th className="px-6 py-3 text-left w-12">
                                  <button onClick={toggleAllSelection}>
                                    {(() => {
                                      const approvedStores = stores.filter(s => s.currentStatus === StoreStatus.RECCE_APPROVED);
                                      return selectedStoreIds.size > 0 && selectedStoreIds.size === approvedStores.length && approvedStores.length > 0 ? 
                                        <CheckSquare className="h-5 w-5 text-yellow-500" /> : 
                                        <Square className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                                    })()}
                                  </button>
                                </th>
                              )}
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Store</th>
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Location</th>
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Mobile</th>
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{isAdmin ? "Assigned To" : "Assigned By"}</th>
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Status</th>
                              <th className={`px-6 py-3 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Action</th>
                          </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                          {stores.map(store => {
                               const isDone = store.currentStatus !== StoreStatus.RECCE_ASSIGNED;
                               const canSelect = store.currentStatus === StoreStatus.RECCE_SUBMITTED || store.currentStatus === StoreStatus.RECCE_APPROVED;
                               const isSelected = selectedStoreIds.has(store._id);
                               return (
                                   <tr key={store._id} className={`transition-colors border-b ${isSelected ? (darkMode ? "bg-blue-900/30" : "bg-blue-50") : darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}>
                                       {isAdmin && (
                                         <td className="px-6 py-4 whitespace-nowrap">
                                           {store.currentStatus === StoreStatus.RECCE_APPROVED && (
                                             <button onClick={() => toggleStoreSelection(store._id)}>
                                               {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />}
                                             </button>
                                           )}
                                         </td>
                                       )}
                                       <td className="px-6 py-4">
                                           <div className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{store.storeName}</div>
                                           <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{store.dealerCode}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{store.location.city}</div>
                                            <div className={`text-xs truncate max-w-[200px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{store.location.address}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                            <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{store.contact?.mobile || "-"}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                           {isAdmin ? (
                                             <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                               {(store.workflow?.recceAssignedTo as any)?.name || "-"}
                                               {store.recce?.reccePhotos && store.recce.reccePhotos.length > 0 && (
                                                 <div className="text-xs mt-1">
                                                   <span className="text-green-600">{store.recce.approvedPhotosCount || 0}</span> / 
                                                   <span className="text-red-600">{store.recce.rejectedPhotosCount || 0}</span> / 
                                                   <span className="text-yellow-600">{
                                                     store.recce.reccePhotos.filter(
                                                       (photo: any) => !photo.approvalStatus || photo.approvalStatus === "PENDING"
                                                     ).length
                                                   }</span>
                                                 </div>
                                               )}
                                             </div>
                                           ) : (
                                             <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                               {(store.workflow?.recceAssignedBy as any)?.name || "-"}
                                             </div>
                                           )}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap">
                                           <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${getStatusColor(store.currentStatus)}`}>
                                               {store.currentStatus.replace(/_/g, " ")}
                                           </span>
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                           {isAdmin && store.currentStatus === "RECCE_SUBMITTED" ? (
                                             <button onClick={() => router.push(`/recce/${store._id}/review`)} 
                                               className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200">
                                               <ClipboardCheck className="w-3 h-3 mr-1"/> Review
                                             </button>
                                           ) : (
                                             <button onClick={() => router.push(`/recce/${store._id}`)} 
                                               className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDone ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                                               {isDone ? <><Eye className="w-3 h-3 mr-1"/> View</> : <><Camera className="w-3 h-3 mr-1"/> Start</>}
                                             </button>
                                           )}
                                       </td>
                                   </tr>
                               );
                          })}
                      </tbody>
                  </table>
              </div>
               {/* Pagination Controls */}
                <div className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Showing {(page-1)*limit + 1}-{Math.min(page*limit, totalStores)} of {totalStores}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            className={`text-xs rounded border px-2 py-1 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="flex gap-1">
                            <button onClick={()=>setPage(p => Math.max(1, p-1))} disabled={page===1} className={`p-1 rounded ${darkMode ? "hover:bg-gray-700 disabled:text-gray-600" : "hover:bg-gray-200 disabled:text-gray-300"}`}><ChevronLeft className="w-4 h-4"/></button>
                            <span className={`px-2 text-sm flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{page}</span>
                            <button onClick={()=>setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className={`p-1 rounded ${darkMode ? "hover:bg-gray-700 disabled:text-gray-600" : "hover:bg-gray-200 disabled:text-gray-300"}`}><ChevronRight className="w-4 h-4"/></button>
                        </div>
                    </div>
                </div>
          </div>
        </>
      )}

      {/* Installation Assignment Modal */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl shadow-2xl max-w-md w-full mx-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Assign Installation
              </h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Assigning {selectedStoreIds.size} approved recce stores
              </p>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={installUserSearchTerm}
                  onChange={(e) => setInstallUserSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-blue-500`}
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredInstallUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedInstallUserId(user._id)}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedInstallUserId === user._id
                        ? darkMode ? "border-blue-500 bg-blue-900/20" : "border-blue-500 bg-blue-50"
                        : darkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${
                      selectedInstallUserId === user._id ? "bg-blue-500 text-white" : darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                        {user.name}
                      </div>
                      <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {user.email}
                      </div>
                    </div>
                    {selectedInstallUserId === user._id && (
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={`px-6 py-4 flex gap-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className={`flex-1 py-2 rounded-lg font-medium text-sm ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleInstallationAssign}
                disabled={isAssigningInstallation || !selectedInstallUserId}
                className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isAssigningInstallation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isAssigningInstallation ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
