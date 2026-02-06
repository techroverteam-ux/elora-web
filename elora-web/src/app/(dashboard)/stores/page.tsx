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
  MapPin,
  Trash2,
  UserPlus,
  CheckSquare,
  Square,
  Download,
  Eye,
  Edit,
  X,
} from "lucide-react";
import Modal from "@/src/components/ui/Modal";
import toast from "react-hot-toast";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStats, setUploadStats] = useState<any>(null);

  // --- ASSIGNMENT STATE ---
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(
    new Set(),
  );
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignStage, setAssignStage] = useState<"RECCE" | "INSTALLATION">(
    "RECCE",
  );
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Track single store for assignment (bypassing checkboxes)
  const [singleAssignTarget, setSingleAssignTarget] = useState<Store | null>(
    null,
  );

  // Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/stores");
      setStores(data.stores);
    } catch (error) {
      toast.error("Failed to load stores");
    } finally {
      setIsLoading(false);
    }
  };

  // --- DOWNLOAD PPT LOGIC (FIXED) ---
  const downloadPPT = async (
    storeId: string,
    dealerCode: string,
    type: "recce" | "installation",
  ) => {
    try {
      toast.loading(`Generating ${type} PPT...`);
      setOpenMenuId(null); // Close menu

      // Request file as 'blob' (binary data)
      const response = await api.get(`/stores/${storeId}/ppt/${type}`, {
        responseType: "blob",
      });

      // Create hidden download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Naming convention: Recce_101.pptx or Installation_101.pptx
      link.setAttribute(
        "download",
        `${type.charAt(0).toUpperCase() + type.slice(1)}_${dealerCode}.pptx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.dismiss();
      toast.success("PPT Downloaded!");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Failed to download. Ensure data exists.");
    }
  };

  // --- REVIEW RECCE LOGIC ---
  const handleReview = async (
    storeId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    if (!confirm(`Are you sure you want to ${status} this recce?`)) return;

    // Optional: Ask for remarks if rejecting
    let remarks = "";
    if (status === "REJECTED") {
      remarks = prompt("Enter reason for rejection:") || "";
      if (!remarks) return; // Cancel if no reason given
    }

    try {
      await api.post(`/stores/${storeId}/recce/review`, { status, remarks });
      toast.success(`Recce ${status}`);
      setOpenMenuId(null);
      fetchStores(); // Refresh table
    } catch (error: any) {
      toast.error("Action failed");
    }
  };

  // --- CHECKBOX LOGIC ---
  const toggleStoreSelection = (id: string) => {
    const newSet = new Set(selectedStoreIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStoreIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedStoreIds.size === filteredStores.length) {
      setSelectedStoreIds(new Set());
    } else {
      const allIds = filteredStores.map((s) => s._id);
      setSelectedStoreIds(new Set(allIds));
    }
  };

  // --- ASSIGNMENT LOGIC ---
  const openAssignModal = async (
    stage: "RECCE" | "INSTALLATION",
    specificStore?: Store,
  ) => {
    setOpenMenuId(null); // Close any open menu

    if (specificStore) {
      setSingleAssignTarget(specificStore);
    } else {
      if (selectedStoreIds.size === 0)
        return toast.error("Select stores first");
      setSingleAssignTarget(null);
    }

    setAssignStage(stage);
    setSelectedUserId("");
    setIsAssignModalOpen(true);

    try {
      const roleCode = stage === "RECCE" ? "RECCE" : "INSTALLATION";
      const { data } = await api.get(`/users/role/${roleCode}`);
      setAvailableUsers(data.users);
    } catch (error) {
      toast.error(`Failed to fetch ${stage} users`);
      setAvailableUsers([]);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) return toast.error("Please select a user");

    setIsAssigning(true);
    try {
      // Determine if we are assigning One or Many
      const idsToAssign = singleAssignTarget
        ? [singleAssignTarget._id]
        : Array.from(selectedStoreIds);

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

  // --- DELETE LOGIC ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this store?")) return;
    try {
      await api.delete(`/stores/${id}`);
      toast.success("Store deleted");
      fetchStores();
    } catch (error) {
      toast.error("Failed to delete store");
    }
    setOpenMenuId(null);
  };

  // --- UPLOAD LOGIC ---
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
      toast.success(
        `Success: ${data.successCount}, Errors: ${data.errorCount}`,
      );
      if (data.successCount > 0) {
        fetchStores();
        setSelectedFiles([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Helper
  const getStatusColor = (status: StoreStatus) => {
    switch (status) {
      case StoreStatus.UPLOADED:
        return "bg-gray-100 text-gray-800";
      case StoreStatus.RECCE_ASSIGNED:
        return "bg-blue-100 text-blue-800";
      case StoreStatus.RECCE_SUBMITTED:
        return "bg-yellow-100 text-yellow-800";
      case StoreStatus.RECCE_APPROVED:
        return "bg-purple-100 text-purple-800";
      case StoreStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const filteredStores = stores.filter((store) =>
    filterStatus === "ALL" ? true : store.currentStatus === filterStatus,
  );

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Operations</h1>
          <p className="text-sm text-gray-500">
            Manage recce and installation workflow
          </p>
        </div>
        <div className="flex gap-2">
          {/* ASSIGN BUTTONS (Visible when stores are selected) */}
          {selectedStoreIds.size > 0 && (
            <div className="flex gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
              <button
                onClick={() => openAssignModal("RECCE")}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Recce ({selectedStoreIds.size})
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setUploadStats(null);
              setSelectedFiles([]);
              setIsUploadOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Total Stores
          </p>
          <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Unassigned
          </p>
          <p className="text-2xl font-bold text-orange-600">
            {
              stores.filter((s) => s.currentStatus === StoreStatus.UPLOADED)
                .length
            }
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Recce Assigned
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {
              stores.filter(
                (s) => s.currentStatus === StoreStatus.RECCE_ASSIGNED,
              ).length
            }
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-visible">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores..."
              className="pl-10 pr-4 py-2 w-full border rounded-md text-sm focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:ring-blue-500 outline-none bg-white"
          >
            <option value="ALL">All Status</option>
            {Object.values(StoreStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No stores found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border-t border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {/* CHECKBOX HEADER */}
                  <th className="px-6 py-4 text-left w-10">
                    <button
                      onClick={toggleAllSelection}
                      className="flex items-center justify-center text-gray-600 hover:text-black transition-colors"
                    >
                      {selectedStoreIds.size === filteredStores.length &&
                      filteredStores.length > 0 ? (
                        <CheckSquare className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Square className="h-6 w-6" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Store Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => {
                  const isSelected = selectedStoreIds.has(store._id);
                  const isMenuOpen = openMenuId === store._id;

                  return (
                    <tr
                      key={store._id}
                      className={`transition-colors border-b hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
                    >
                      {/* CHECKBOX CELL */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStoreSelection(store._id)}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Square className="h-6 w-6" />
                          )}
                        </button>
                      </td>

                      {/* STORE INFO */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {store.storeName}
                        </div>
                        <div className="text-xs font-medium text-gray-500 mt-1">
                          Dealer:{" "}
                          <span className="text-gray-700">
                            {store.dealerCode}
                          </span>
                        </div>
                      </td>

                      {/* LOCATION */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {store.location.city}
                        </div>
                        <div className="text-xs text-gray-500">
                          {store.location.area}
                        </div>
                      </td>

                      {/* STATUS (CLICKABLE ASSIGNMENT) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (store.currentStatus === StoreStatus.UPLOADED)
                              openAssignModal("RECCE", store);
                            if (
                              store.currentStatus === StoreStatus.RECCE_APPROVED
                            )
                              openAssignModal("INSTALLATION", store);
                          }}
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(store.currentStatus)} ${
                            store.currentStatus === StoreStatus.UPLOADED ||
                            store.currentStatus === StoreStatus.RECCE_APPROVED
                              ? "hover:ring-2 ring-offset-1 ring-blue-400 cursor-pointer"
                              : ""
                          }`}
                        >
                          {store.currentStatus.replace(/_/g, " ")}
                        </button>
                      </td>

                      {/* ASSIGNED TO */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {store.workflow.recceAssignedTo ? (
                          <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-200 w-fit">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {/* Initials */}
                              {typeof store.workflow.recceAssignedTo ===
                              "object"
                                ? (store.workflow.recceAssignedTo as any).name
                                    .substring(0, 2)
                                    .toUpperCase()
                                : "U"}
                            </div>
                            <span
                              className="font-medium text-gray-900"
                              title={
                                (store.workflow.recceAssignedTo as any).name
                              }
                            >
                              {(store.workflow.recceAssignedTo as any).name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs border border-dashed border-gray-300 px-2 py-1 rounded">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* ACTIONS (WITH DROPDOWN) */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : store._id);
                          }}
                          className="text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-300"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {/* --- THE DROPDOWN MENU --- */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-8 top-8 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in-95 origin-top-right text-left"
                          >
                            <div className="py-1">
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Eye className="h-4 w-4 mr-2 text-gray-400" />{" "}
                                View Details
                              </button>

                              {/* DOWNLOAD RECCE PPT */}
                              {(store.currentStatus ===
                                StoreStatus.RECCE_SUBMITTED ||
                                store.currentStatus ===
                                  StoreStatus.RECCE_APPROVED ||
                                store.currentStatus ===
                                  StoreStatus.COMPLETED) && (
                                <button
                                  onClick={() =>
                                    downloadPPT(
                                      store._id,
                                      store.dealerCode,
                                      "recce",
                                    )
                                  }
                                  className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-bold"
                                >
                                  <Download className="h-4 w-4 mr-2" /> Download
                                  Recce PPT
                                </button>
                              )}

                              {/* DOWNLOAD INSTALLATION PPT */}
                              {(store.currentStatus ===
                                StoreStatus.INSTALLATION_SUBMITTED ||
                                store.currentStatus ===
                                  StoreStatus.COMPLETED) && (
                                <button
                                  onClick={() =>
                                    downloadPPT(
                                      store._id,
                                      store.dealerCode,
                                      "installation",
                                    )
                                  }
                                  className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 font-bold"
                                >
                                  <Download className="h-4 w-4 mr-2" /> Download
                                  Install PPT
                                </button>
                              )}

                              {/* APPROVE / REJECT ACTIONS */}
                              {store.currentStatus ===
                                StoreStatus.RECCE_SUBMITTED && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleReview(store._id, "APPROVED")
                                    }
                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-bold"
                                  >
                                    <CheckSquare className="h-4 w-4 mr-2" />{" "}
                                    Approve Recce
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleReview(store._id, "REJECTED")
                                    }
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold"
                                  >
                                    <X className="h-4 w-4 mr-2" /> Reject Recce
                                  </button>
                                </>
                              )}

                              {/* ASSIGN INSTALLATION SHORTCUT */}
                              {store.currentStatus ===
                                StoreStatus.RECCE_APPROVED && (
                                <button
                                  onClick={() =>
                                    openAssignModal("INSTALLATION", store)
                                  }
                                  className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" /> Assign
                                  Installation
                                </button>
                              )}

                              {/* ASSIGN RECCE SHORTCUT */}
                              {store.currentStatus === StoreStatus.UPLOADED && (
                                <button
                                  onClick={() =>
                                    openAssignModal("RECCE", store)
                                  }
                                  className="flex items-center w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" /> Assign
                                  Recce
                                </button>
                              )}

                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => handleDelete(store._id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: ASSIGN USER --- */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign ${assignStage === "RECCE" ? "Recce" : "Installation"} Staff`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800">
            {/* Dynamic Message based on Single or Bulk */}
            {singleAssignTarget ? (
              <span>
                Assigning to <strong>{singleAssignTarget.storeName}</strong>
              </span>
            ) : (
              <span>
                You are assigning <strong>{selectedStoreIds.size}</strong>{" "}
                stores.
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Field Staff
            </label>
            {availableUsers.length === 0 ? (
              <p className="text-sm text-gray-500 italic border p-3 rounded-md bg-gray-50 text-center">
                No users found with role "{assignStage}". <br />
                Please create a user with this role first.
              </p>
            ) : (
              // FIXED DROPDOWN STYLING
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ color: "black" }}
              >
                <option value="" className="text-gray-500 bg-white">
                  -- Choose User --
                </option>
                {availableUsers.map((user) => (
                  <option
                    key={user._id}
                    value={user._id}
                    className="text-gray-900 bg-white py-2"
                  >
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={isAssigning || !selectedUserId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isAssigning && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Confirm Assignment
            </button>
          </div>
        </div>
      </Modal>

      {/* --- MODAL 2: UPLOAD (Keep Existing) --- */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Bulk Store Upload"
      >
        {!uploadStats ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileSpreadsheet className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to add files</span>
                </p>
                <p className="text-xs text-gray-500">.xlsx or .xls</p>
              </div>
              <input
                type="file"
                multiple
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Selected Files ({selectedFiles.length})
                </p>
                <div className="max-h-32 overflow-y-auto border rounded-md divide-y">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 text-sm bg-gray-50"
                    >
                      <span className="truncate max-w-[80%] text-gray-700">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={selectedFiles.length === 0 || isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isUploading && (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                )}
                {isUploading
                  ? "Uploading..."
                  : `Upload ${selectedFiles.length} File(s)`}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">Success</p>
                <p className="text-xl font-bold text-green-800">
                  {uploadStats.successCount}
                </p>
              </div>
              <div className="flex-1 bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">Errors</p>
                <p className="text-xl font-bold text-red-800">
                  {uploadStats.errorCount}
                </p>
              </div>
            </div>

            {uploadStats.errors.length > 0 && (
              <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50 text-sm">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500">
                      <th className="pb-2">Error Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadStats.errors.map((err: any, idx: number) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="py-2 text-red-600 text-xs">
                          {err.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => {
                setIsUploadOpen(false);
                setUploadStats(null);
                setSelectedFiles([]);
              }}
              className="w-full py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Close & Refresh
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
