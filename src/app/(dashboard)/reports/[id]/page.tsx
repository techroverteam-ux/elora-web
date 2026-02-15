"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { useTheme } from "@/src/context/ThemeContext";
import { ArrowLeft, Loader2, MapPin, User, Calendar, Package, FileText, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { darkMode } = useTheme();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStoreDetails();
    }
  }, [params.id]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/stores/${params.id}`);
      setStore(data.store);
    } catch (error) {
      toast.error("Failed to load assignment details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Assignment not found</p>
        <button onClick={() => router.back()} className="mt-4 text-yellow-500 hover:text-yellow-600">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            darkMode ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700" : "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Assignment Details
          </h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {store.storeName}
          </p>
        </div>
      </div>

      {/* Store Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <Package className="h-5 w-5 text-yellow-500" /> Store Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Store Name</label>
              <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.storeName}</p>
            </div>
            <div>
              <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Dealer Code</label>
              <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.dealerCode}</p>
            </div>
            <div>
              <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Vendor Code</label>
              <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.vendorCode || "-"}</p>
            </div>
            <div>
              <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Status</label>
              <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
                  {store.currentStatus?.replace(/_/g, " ")}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <MapPin className="h-5 w-5 text-yellow-500" /> Location
          </h3>
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Address</label>
              <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location?.address || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>City</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location?.city || "-"}</p>
              </div>
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>State</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location?.state || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Zone</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location?.zone || "-"}</p>
              </div>
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>District</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.location?.district || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {store.workflow?.recceAssignedTo && (
          <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <User className="h-5 w-5 text-blue-500" /> Recce Assignment
            </h3>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Assigned To</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                  {typeof store.workflow.recceAssignedTo === 'object' ? store.workflow.recceAssignedTo.name : 'N/A'}
                </p>
              </div>
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Assigned Date</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                  {formatDate(store.workflow.recceAssignedDate)}
                </p>
              </div>
              {store.recce?.submittedDate && (
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Submitted Date</label>
                  <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    {formatDate(store.recce.submittedDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {store.workflow?.installationAssignedTo && (
          <div className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <User className="h-5 w-5 text-green-500" /> Installation Assignment
            </h3>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Assigned To</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                  {typeof store.workflow.installationAssignedTo === 'object' ? store.workflow.installationAssignedTo.name : 'N/A'}
                </p>
              </div>
              <div>
                <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Assigned Date</label>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                  {formatDate(store.workflow.installationAssignedDate)}
                </p>
              </div>
              {store.installation?.submittedDate && (
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Submitted Date</label>
                  <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    {formatDate(store.installation.submittedDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Specifications */}
      <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <FileText className="h-5 w-5 text-yellow-500" /> Specifications
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Type</label>
            <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.type || "-"}</p>
          </div>
          <div>
            <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Width</label>
            <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.width || "-"} ft</p>
          </div>
          <div>
            <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Height</label>
            <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.height || "-"} ft</p>
          </div>
          <div>
            <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Quantity</label>
            <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.specs?.qty || "-"}</p>
          </div>
        </div>
      </div>

      {/* Commercials */}
      <div className={`p-4 sm:p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <CheckCircle className="h-5 w-5 text-yellow-500" /> Commercial Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>PO Number</label>
            <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.commercials?.poNumber || "-"}</p>
          </div>
          <div>
            <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>PO Month</label>
            <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{store.commercials?.poMonth || "-"}</p>
          </div>
          <div>
            <label className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total Cost</label>
            <p className={`text-sm font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
              ₹{store.commercials?.totalCost?.toLocaleString() || "0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
