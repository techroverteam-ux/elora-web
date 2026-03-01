"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { Store, StoreStatus } from "@/src/types/store";
import { Search, Loader2, FileSpreadsheet, Eye, ChevronLeft, ChevronRight, Filter, CheckSquare, Square } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RFQGenerationPage() {
  const { darkMode } = useTheme();
  const router = useRouter();

  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterZone, setFilterZone] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterVendorCode, setFilterVendorCode] = useState("");
  const [filterDealerCode, setFilterDealerCode] = useState("");
  const [filterPONumber, setFilterPONumber] = useState("");
  const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
  const [filterClientCode, setFilterClientCode] = useState("");
  const [filterCity, setFilterCity] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchStores();
  }, [page, limit, debouncedSearch, filterStatus, filterZone, filterState, filterDistrict, filterVendorCode, filterDealerCode, filterPONumber, filterInvoiceNo, filterClientCode, filterCity]);

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

      const { data } = await api.get(`/stores?${params.toString()}`);
      
      let filteredStores = data.stores || [];
      
      if (filterZone) filteredStores = filteredStores.filter((s: Store) => s.location.zone?.toLowerCase().includes(filterZone.toLowerCase()));
      if (filterState) filteredStores = filteredStores.filter((s: Store) => s.location.state?.toLowerCase().includes(filterState.toLowerCase()));
      if (filterDistrict) filteredStores = filteredStores.filter((s: Store) => s.location.district?.toLowerCase().includes(filterDistrict.toLowerCase()));
      if (filterVendorCode) filteredStores = filteredStores.filter((s: Store) => s.vendorCode?.toLowerCase().includes(filterVendorCode.toLowerCase()));
      if (filterDealerCode) filteredStores = filteredStores.filter((s: Store) => s.dealerCode?.toLowerCase().includes(filterDealerCode.toLowerCase()));
      if (filterPONumber) filteredStores = filteredStores.filter((s: Store) => s.commercials?.poNumber?.toLowerCase().includes(filterPONumber.toLowerCase()));
      if (filterInvoiceNo) filteredStores = filteredStores.filter((s: Store) => s.commercials?.invoiceNumber?.toLowerCase().includes(filterInvoiceNo.toLowerCase()));
      if (filterClientCode) filteredStores = filteredStores.filter((s: Store) => s.clientCode?.toLowerCase().includes(filterClientCode.toLowerCase()));

      setStores(filteredStores);
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
      setSelectedStoreIds(new Set(stores.map((s) => s._id)));
    }
  };

  const handleGenerateRFQ = async () => {
    if (selectedStoreIds.size === 0) {
      return toast.error("Please select at least one store");
    }

    setIsGenerating(true);
    try {
      const response = await api.post("/rfq/generate", { storeIds: Array.from(selectedStoreIds) }, { responseType: "blob" });
      
      const skippedStores = response.headers["x-skipped-stores"];
      if (skippedStores) {
        const skipped = JSON.parse(skippedStores);
        if (skipped.length > 0) {
          toast.error(`${skipped.length} store(s) skipped: ${skipped.map((s: any) => s.reason).join(", ")}`, { duration: 5000 });
        }
      }

      const contentType = response.headers["content-type"];
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || (contentType?.includes("zip") ? "RFQs.zip" : `RFQ_${Date.now()}.xlsx`);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("RFQ generated successfully!");
      setSelectedStoreIds(new Set());
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate RFQ");
    } finally {
      setIsGenerating(false);
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

  const inputClass = `px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"} focus:outline-none focus:border-yellow-500`;

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>RFQ Generation</h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Create Request for Quotation for selected stores</p>
        </div>
        {selectedStoreIds.size > 0 && (
          <button onClick={handleGenerateRFQ} disabled={isGenerating} className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm disabled:opacity-50">
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Generate RFQ ({selectedStoreIds.size})
          </button>
        )}
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
          <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
            <input type="text" placeholder="Search stores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 ${inputClass}`} />
          </div>
          <input type="text" placeholder="Zone" value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className={inputClass} />
          <input type="text" placeholder="State" value={filterState} onChange={(e) => setFilterState(e.target.value)} className={inputClass} />
          <input type="text" placeholder="District" value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Vendor Code" value={filterVendorCode} onChange={(e) => setFilterVendorCode(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Dealer Code" value={filterDealerCode} onChange={(e) => setFilterDealerCode(e.target.value)} className={inputClass} />
          <input type="text" placeholder="PO Number" value={filterPONumber} onChange={(e) => setFilterPONumber(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Invoice No" value={filterInvoiceNo} onChange={(e) => setFilterInvoiceNo(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Client Code" value={filterClientCode} onChange={(e) => setFilterClientCode(e.target.value)} className={inputClass} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass}>
            <option value="ALL">All Status</option>
            {Object.values(StoreStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden shadow-sm ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
        {isLoading ? (
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          </div>
        ) : stores.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No stores found matching filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
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
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dealer Code</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Store Name</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>City</th>
                    <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</th>
                    <th className={`px-4 py-4 text-right text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700 bg-gray-900" : "divide-gray-200 bg-white"}`}>
                  {stores.map((store) => {
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
                          <div className={`text-sm font-mono ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{store.dealerCode}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{store.storeName}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location.city || "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${getStatusColor(store.currentStatus)}`}>
                            {store.currentStatus.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button onClick={() => router.push(`/store/${store._id}`)} className="p-1.5 rounded hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-blue-600" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
              <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalStores)} of {totalStores}
              </div>
              <div className="flex items-center gap-2">
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={`text-xs font-medium rounded border px-2 py-1 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"}`}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`px-2 text-sm font-medium flex items-center ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{page}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`p-1 rounded ${darkMode ? "text-gray-200 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" : "text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"}`}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
