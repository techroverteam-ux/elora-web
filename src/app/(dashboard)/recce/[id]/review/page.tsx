"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import { useImageService } from "@/src/hooks/useImageService";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  CheckSquare,
  PauseCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";

export default function RecceReviewPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const params = useParams();
  const id = params?.id as string;
  const { getFullImageUrl } = useImageService();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [rejectPhotoIndex, setRejectPhotoIndex] = useState<number | null>(null);
  const [holdPhotoIndex, setHoldPhotoIndex] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [approveAllConfirmOpen, setApproveAllConfirmOpen] = useState(false);
  const [heldPhotos, setHeldPhotos] = useState<Record<number, string>>({});
  const [activeFilter, setActiveFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "HOLD" | "ALL">("ALL");

  // Load held photos from localStorage on mount
  useEffect(() => {
    if (!id) return;
    try {
      const stored = localStorage.getItem(`held_photos_${id}`);
      if (stored) setHeldPhotos(JSON.parse(stored));
    } catch {}
  }, [id]);

  const saveHeldPhotos = (updated: Record<number, string>) => {
    setHeldPhotos(updated);
    try {
      localStorage.setItem(`held_photos_${id}`, JSON.stringify(updated));
    } catch {}
  };;

  useEffect(() => {
    if (!id) return;
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/stores/${id}`);
      setStore(data.store);
    } catch (error) {
      toast.error("Failed to load store details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePhoto = async (photoIndex: number) => {
    setProcessing(true);
    try {
      await api.post(`/stores/${id}/recce/photos/${photoIndex}/review`, {
        status: "APPROVED",
      });
      // Remove from held if it was held
      if (heldPhotos[photoIndex] !== undefined) {
        const updated = { ...heldPhotos };
        delete updated[photoIndex];
        saveHeldPhotos(updated);
      }
      toast.success(`Photo ${photoIndex + 1} approved`);
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve photo");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPhoto = async () => {
    if (rejectPhotoIndex === null) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/stores/${id}/recce/photos/${rejectPhotoIndex}/review`, {
        status: "REJECTED",
        rejectionReason,
      });
      toast.success(`Photo ${rejectPhotoIndex + 1} rejected`);
      // Remove from held if it was held
      if (heldPhotos[rejectPhotoIndex] !== undefined) {
        const updated = { ...heldPhotos };
        delete updated[rejectPhotoIndex];
        saveHeldPhotos(updated);
      }
      setShowRejectModal(false);
      setRejectPhotoIndex(null);
      setRejectionReason("");
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject photo");
    } finally {
      setProcessing(false);
    }
  };

  const handleHoldPhoto = () => {
    if (holdPhotoIndex === null) return;
    const updated = { ...heldPhotos, [holdPhotoIndex]: holdReason.trim() || "On hold" };
    saveHeldPhotos(updated);
    toast.success(`Photo ${holdPhotoIndex + 1} put on hold`);
    setShowHoldModal(false);
    setHoldPhotoIndex(null);
    setHoldReason("");
  };

  const handleApproveAll = async () => {
    // Prevent multiple confirmation dialogs
    if (approveAllConfirmOpen) return;

    setApproveAllConfirmOpen(true);

    toast(
      (t) => (
        <div
          className={`rounded-xl shadow-2xl border-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          <div
            className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <p
              className={`font-bold text-base ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Approve all pending photos?
            </p>
          </div>
          <div className="px-6 py-4">
            <p
              className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              This action cannot be undone. All pending photos will be
              approved and marked as ready.
            </p>
          </div>
          <div
            className={`px-6 py-4 flex gap-3 justify-end border-t ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}
          >
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setApproveAllConfirmOpen(false);
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all border-2 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"}`}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setApproveAllConfirmOpen(false);
                confirmApproveAll();
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 border-2 border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 transition-all shadow-lg shadow-green-500/20"
            >
              Approve All
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "bottom-center",
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
          maxWidth: "420px",
        },
      }
    );
  };

  const confirmApproveAll = async () => {
    setProcessing(true);
    try {
      await api.post(`/stores/${id}/recce/approve-all`);
      toast.success("All photos approved");
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve all");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    }
    if (status === "HOLD") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
          <PauseCircle className="w-3 h-3" /> On Hold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!store || !store.recce?.reccePhotos) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>No recce data found</p>
        </div>
      </div>
    );
  }

  const approved = store.recce.approvedPhotosCount || 0;
  const rejected = store.recce.rejectedPhotosCount || 0;
  const onHold = Object.keys(heldPhotos).length;
  const pending = store.recce.reccePhotos.filter(
    (photo: any, idx: number) => !heldPhotos[idx] && (!photo.approvalStatus || photo.approvalStatus === "PENDING")
  ).length;

  const getEffectiveStatus = (photo: any, index: number) => {
    if (heldPhotos[index]) return "HOLD";
    return photo.approvalStatus;
  };

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 px-4 py-3 border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Review Recce Photos</h1>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{store.storeName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Filter Buttons */}
        <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              {([
                { key: "ALL",      label: "All",      count: store.recce.reccePhotos.length, color: "gray" },
                { key: "PENDING",  label: "Pending",  count: pending,   color: "yellow" },
                { key: "APPROVED", label: "Approved", count: approved,  color: "green" },
                { key: "REJECTED", label: "Rejected", count: rejected,  color: "red" },
                { key: "HOLD",     label: "On Hold",  count: onHold,    color: "orange" },
              ] as const).map(({ key, label, count, color }) => {
                const isActive = activeFilter === key;
                const colorMap = {
                  gray:   { active: "bg-gray-600 text-white border-gray-600",     inactive: darkMode ? "bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",   num: darkMode ? "text-gray-300" : "text-gray-500" },
                  yellow: { active: "bg-yellow-500 text-white border-yellow-500", inactive: darkMode ? "bg-yellow-900/20 text-yellow-400 border-yellow-700/50 hover:bg-yellow-900/40" : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100", num: "text-yellow-500" },
                  green:  { active: "bg-green-600 text-white border-green-600",   inactive: darkMode ? "bg-green-900/20 text-green-400 border-green-700/50 hover:bg-green-900/40" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",   num: "text-green-600" },
                  red:    { active: "bg-red-600 text-white border-red-600",       inactive: darkMode ? "bg-red-900/20 text-red-400 border-red-700/50 hover:bg-red-900/40" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",             num: "text-red-600" },
                  orange: { active: "bg-orange-500 text-white border-orange-500", inactive: darkMode ? "bg-orange-900/20 text-orange-400 border-orange-700/50 hover:bg-orange-900/40" : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", num: "text-orange-500" },
                };
                const c = colorMap[color];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 h-8 sm:h-10 px-2 sm:w-28 rounded-lg border text-xs sm:text-sm font-semibold transition-all ${
                      isActive ? c.active : c.inactive
                    }`}
                  >
                    <span className={`font-black ${isActive ? "text-white" : c.num}`}>{count}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            {pending > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Approve All Remaining</span>
                <span className="sm:hidden">Approve All</span>
              </button>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        {(() => {
          const hasAny = store.recce.reccePhotos.some((photo: any, idx: number) => {
            const status = getEffectiveStatus(photo, idx);
            if (activeFilter === "ALL") return true;
            if (activeFilter === "PENDING") return !status || status === "PENDING";
            return status === activeFilter;
          });
          if (!hasAny) {
            return (
              <div className={`p-10 rounded-xl border text-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No photos in this category</p>
              </div>
            );
          }
          return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.recce.reccePhotos.map((photo: any, index: number) => {
                const status = getEffectiveStatus(photo, index);
                const matches = activeFilter === "ALL" ? true
                  : activeFilter === "PENDING" ? (!status || status === "PENDING")
                  : status === activeFilter;
                if (!matches) return null;
                return (
                  <div key={index} className={`rounded-xl border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="relative">
                      <img src={getFullImageUrl(photo.photo)} alt={`Recce ${index + 1}`} className="w-full h-48 object-cover" />
                      <div className="absolute top-2 right-2">{getStatusBadge(getEffectiveStatus(photo, index))}</div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Photo {index + 1}</div>
                        <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {photo.measurements.width} × {photo.measurements.height} {photo.measurements.unit}
                        </div>
                        {photo.elements?.[0] && (
                          <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Element: {photo.elements[0].elementName}
                          </div>
                        )}
                      </div>

                      {photo.rejectionReason && (
                        <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <div className="text-xs font-medium text-red-800 dark:text-red-400">Rejection Reason:</div>
                          <div className="text-xs text-red-700 dark:text-red-300 mt-1">{photo.rejectionReason}</div>
                        </div>
                      )}

                      {heldPhotos[index] && (
                        <div className="p-2 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                          <div className="text-xs font-medium text-orange-800 dark:text-orange-400">Hold Reason:</div>
                          <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">{heldPhotos[index]}</div>
                        </div>
                      )}

                      {(!getEffectiveStatus(photo, index) || getEffectiveStatus(photo, index) === "PENDING") && (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleApprovePhoto(index)}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => { setHoldPhotoIndex(index); setShowHoldModal(true); }}
                              disabled={processing}
                              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all"
                            >
                              <PauseCircle className="w-4 h-4" />
                              Hold
                            </button>
                            <button
                              onClick={() => { setRejectPhotoIndex(index); setShowRejectModal(true); }}
                              disabled={processing}
                              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {getEffectiveStatus(photo, index) === "HOLD" && (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleApprovePhoto(index)}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectPhotoIndex(index); setShowRejectModal(true); }}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Reject Photo {rejectPhotoIndex !== null ? rejectPhotoIndex + 1 : ""}
              </h3>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>This photo will be marked as rejected and sent back for re-submission.</p>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (required)..."
                className={`w-full p-3 border rounded-lg text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"}`}
              />
            </div>
            <div className={`px-6 py-4 flex gap-3 border-t ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
              <button
                onClick={() => { setShowRejectModal(false); setRejectPhotoIndex(null); setRejectionReason(""); }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPhoto}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-red-600 transition-all"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${darkMode ? "bg-orange-900/40" : "bg-orange-100"}`}>
                  <PauseCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Hold Photo {holdPhotoIndex !== null ? holdPhotoIndex + 1 : ""}
                  </h3>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    This photo will be put on hold. It can be approved or rejected later.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Reason for holding (optional)..."
                className={`w-full p-3 border rounded-lg text-sm min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"}`}
              />
            </div>
            <div className={`px-6 py-4 flex gap-3 border-t ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
              <button
                onClick={() => { setShowHoldModal(false); setHoldPhotoIndex(null); setHoldReason(""); }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleHoldPhoto}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 flex items-center justify-center gap-2 border-2 border-orange-500 transition-all"
              >
                <PauseCircle className="w-4 h-4" /> Put on Hold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
