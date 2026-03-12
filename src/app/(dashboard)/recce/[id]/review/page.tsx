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
  const [rejectPhotoIndex, setRejectPhotoIndex] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  const handleApproveAll = async () => {
    if (!confirm("Approve all pending photos?")) return;
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
  const pending = store.recce.pendingPhotosCount || store.recce.reccePhotos.length;

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
        {/* Summary Card */}
        <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold text-green-600">{approved}</div>
                <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{rejected}</div>
                <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Rejected</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{pending}</div>
                <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</div>
              </div>
            </div>
            {pending > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <CheckSquare className="w-4 h-4" />
                Approve All Remaining
              </button>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.recce.reccePhotos.map((photo: any, index: number) => (
            <div key={index} className={`rounded-xl border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="relative">
                <img src={getFullImageUrl(photo.photo)} alt={`Recce ${index + 1}`} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2">{getStatusBadge(photo.approvalStatus)}</div>
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

                {(!photo.approvalStatus || photo.approvalStatus === "PENDING") && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprovePhoto(index)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectPhotoIndex(index);
                        setShowRejectModal(true);
                      }}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Reject Photo {rejectPhotoIndex !== null ? rejectPhotoIndex + 1 : ""}
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className={`w-full p-3 border rounded-lg text-sm min-h-[100px] ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"}`}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectPhotoIndex(null);
                  setRejectionReason("");
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPhoto}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
