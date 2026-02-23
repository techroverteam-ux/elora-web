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
  Wrench,
  CheckSquare,
  Square,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import * as XLSX from "xlsx";

export default function InstallationListPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  
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
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchTerm);
        setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 768) setViewMode("card");
        else setViewMode("table");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      // Filter by installation-related statuses only
      if (filterStatus !== "ALL") {
        params.append("status", filterStatus);
      } else {
        // Show only stores that have been assigned to installation
        params.append("status", `${StoreStatus.INSTALLATION_ASSIGNED},${StoreStatus.INSTALLATION_SUBMITTED},${StoreStatus.COMPLETED}`);
      }

      const { data } = await api.get(`/stores?${params.toString()}`);
      
      // Additional client-side filter to ensure only installation-assigned stores appear
      const installationStores = data.stores.filter((store: Store) => 
        store.currentStatus === StoreStatus.INSTALLATION_ASSIGNED ||
        store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ||
        store.currentStatus === StoreStatus.COMPLETED
      );
      setStores(installationStores);
      if (data.pagination) {
          setTotalPages(data.pagination.pages);
          setTotalStores(data.pagination.total);
      }
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, limit, debouncedSearch, filterStatus]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await api.get('/stores/export/installation', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Installation_Tasks.xlsx';
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
    const newSet = new Set(selectedStoreIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStoreIds(newSet);
  };

  const toggleAllSelection = () => {
    const completedStores = stores.filter(s => s.currentStatus === StoreStatus.INSTALLATION_SUBMITTED || s.currentStatus === StoreStatus.COMPLETED);
    if (selectedStoreIds.size === completedStores.length && completedStores.length > 0) {
      setSelectedStoreIds(new Set());
    } else {
      setSelectedStoreIds(new Set(completedStores.map(s => s._id)));
    }
  };

  const handleBulkPPTDownload = async () => {
    if (selectedStoreIds.size === 0) {
      toast.error("Please select stores");
      return;
    }
    setIsDownloadingPPT(true);
    try {
      toast.loading("Generating PPTs...");
      const response = await api.post('/stores/ppt/bulk', {
        storeIds: Array.from(selectedStoreIds),
        type: "installation"
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Installation_Report_${selectedStoreIds.size}_Stores_${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success(`Downloaded PPT with ${selectedStoreIds.size} stores`);
      setSelectedStoreIds(new Set());
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to download PPTs');
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
    try {
      toast.loading("Generating PDFs...");
      const response = await api.post('/stores/pdf/bulk', {
        storeIds: Array.from(selectedStoreIds),
        type: "installation"
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Installation_Report_${selectedStoreIds.size}_Stores_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success(`Downloaded PDF with ${selectedStoreIds.size} stores`);
      setSelectedStoreIds(new Set());
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to download PDFs');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const statusColors = (status: string) => {
      switch(status) {
          case StoreStatus.INSTALLATION_ASSIGNED: return "bg-orange-100 text-orange-800";
          case StoreStatus.INSTALLATION_SUBMITTED: return "bg-blue-100 text-blue-800";
          case StoreStatus.COMPLETED: return "bg-green-100 text-green-800";
          default: return "bg-gray-100 text-gray-800";
      }
  };

  if (initialLoad && loading)
    return (
      <div className="max-w-7xl mx-auto pb-20 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className={`h-8 w-56 rounded-lg mb-2 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-4 w-48 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
               <Wrench className="h-6 w-6 text-blue-600" /> Installation Tasks
           </h1>
           <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Manage your installation assignments</p>
        </div>
        <div className="flex gap-2">
             {isAdmin && selectedStoreIds.size > 0 && (
               <>
                 <button onClick={handleBulkPPTDownload} disabled={isDownloadingPPT} className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
                   <FileText className="w-4 h-4 mr-2"/> PPT ({selectedStoreIds.size})
                 </button>
                 <button onClick={handleBulkPDFDownload} disabled={isDownloadingPDF} className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                   <FileText className="w-4 h-4 mr-2"/> PDF ({selectedStoreIds.size})
                 </button>
               </>
             )}
             <button onClick={handleExport} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-300 text-gray-700"}`}>
                 <Download className="w-4 h-4 mr-2"/> Export
             </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
         <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <input type="text" placeholder="Search store name, city..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm font-medium ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`} />
            </div>
            <select value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value); setPage(1);}}
                className={`px-3 py-2 rounded-lg border text-sm font-medium w-full md:w-48 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`}>
                <option value="ALL">All Status</option>
                <option value={StoreStatus.INSTALLATION_ASSIGNED}>Pending</option>
                <option value={StoreStatus.INSTALLATION_SUBMITTED}>Submitted</option>
                <option value={StoreStatus.COMPLETED}>Completed</option>
            </select>
         </div>
      </div>

      {/* CONTENT */}
      {stores.length === 0 && !loading ? (
        <div className={`rounded-xl border p-12 text-center ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
          <Wrench className={`w-16 h-16 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
            {debouncedSearch ? "No stores found" : filterStatus !== "ALL" ? "No stores with this status" : "No installation tasks available"}
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {debouncedSearch 
              ? `No stores match "${debouncedSearch}". Try a different search term.`
              : filterStatus !== "ALL"
                ? `No stores found with status "${filterStatus.replace(/_/g, " ")}". Try selecting a different status.`
                : "There are no installation tasks assigned yet."}
          </p>
          {(debouncedSearch || filterStatus !== "ALL") && (
            <button 
              onClick={() => { setSearchTerm(""); setFilterStatus("ALL"); }}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
      <>
      {viewMode === "card" ? (
          /* MOBILE CARD VIEW */
          <div className="space-y-4">
             {stores.map(store => {
                  const isDone = store.currentStatus === StoreStatus.COMPLETED || store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED;
                  const canSelect = isAdmin && (store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED || store.currentStatus === StoreStatus.COMPLETED);
                  const isSelected = selectedStoreIds.has(store._id);
                  return (
                    <div key={store._id}
                        className={`rounded-xl shadow-sm border overflow-hidden transition-all ${isSelected ? (darkMode ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-300") : darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className={`h-1.5 w-full ${isDone ? "bg-green-500" : "bg-orange-500"}`}></div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                    {canSelect && (
                                      <button onClick={(e) => { e.stopPropagation(); toggleStoreSelection(store._id); }} className="mt-1">
                                        {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />}
                                      </button>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-base ${darkMode ? "text-white" : "text-gray-900"} truncate`}>{store.storeName}</h3>
                                        <p className={`text-xs font-mono mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{store.dealerCode}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${statusColors(store.currentStatus)}`}>
                                    {store.currentStatus.replace(/_/g, " ").replace("INSTALLATION", "")}
                                </span>
                            </div>
                            <div className={`flex items-start gap-2 text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{store.location.address || store.location.city}</span>
                            </div>
                            <button onClick={() => router.push(`/installation/${store._id}`)} className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white ${isDone ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                                {isDone ? <><CheckCircle2 className="h-4 w-4" /> View Details</> : <><Camera className="h-4 w-4" /> Upload Proof</>}
                            </button>
                        </div>
                    </div>
                  );
             })}
          </div>
      ) : (
          /* DESKTOP TABLE VIEW */
          <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
              <div className="overflow-x-auto">
                  <table className="min-w-full">
                      <thead className={darkMode ? "bg-gray-800/80" : "bg-gray-50"}>
                          <tr>
                              {isAdmin && (
                                <th className="px-6 py-3 text-left w-12">
                                  <button onClick={toggleAllSelection}>
                                    {selectedStoreIds.size > 0 && selectedStoreIds.size === stores.filter(s => s.currentStatus === StoreStatus.INSTALLATION_SUBMITTED || s.currentStatus === StoreStatus.COMPLETED).length ? 
                                      <CheckSquare className="h-5 w-5 text-yellow-500" /> : 
                                      <Square className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                                    }
                                  </button>
                                </th>
                              )}
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Store</th>
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Location</th>
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{isAdmin ? "Assigned To" : "Assigned By"}</th>
                              <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Status</th>
                              <th className={`px-6 py-3 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Action</th>
                          </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                          {stores.map(store => {
                               const isDone = store.currentStatus === StoreStatus.COMPLETED || store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED;
                               const canSelect = store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED || store.currentStatus === StoreStatus.COMPLETED;
                               const isSelected = selectedStoreIds.has(store._id);
                               return (
                                   <tr key={store._id} className={`transition-colors border-b ${isSelected ? (darkMode ? "bg-blue-900/30" : "bg-blue-50") : darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}>
                                       {isAdmin && (
                                         <td className="px-6 py-4 whitespace-nowrap">
                                           {canSelect && (
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
                                           {isAdmin ? (
                                             <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                               {(store.workflow?.installationAssignedTo as any)?.name || "-"}
                                             </div>
                                           ) : (
                                             <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                               {(store.workflow?.installationAssignedBy as any)?.name || "-"}
                                             </div>
                                           )}
                                       </td>
                                       <td className="px-6 py-4">
                                           <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors(store.currentStatus)}`}>
                                               {store.currentStatus.replace(/_/g, " ").replace("INSTALLATION", "")}
                                           </span>
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                           <button onClick={() => router.push(`/installation/${store._id}`)} 
                                               className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDone ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                                               {isDone ? <><Eye className="w-3 h-3 mr-1"/> View</> : <><Camera className="w-3 h-3 mr-1"/> Start</>}
                                           </button>
                                       </td>
                                   </tr>
                               );
                          })}
                      </tbody>
                  </table>
              </div>
               {/* Pagination Controls */}
                <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Showing {(page-1)*limit + 1} to {Math.min(page*limit, totalStores)} of {totalStores} entries</span>
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
      )}
      </>
      )}
    </div>
  );
}
