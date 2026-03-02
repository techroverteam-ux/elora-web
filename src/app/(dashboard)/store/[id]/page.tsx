"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Package,
  IndianRupee,
  FileSpreadsheet,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  Calendar,
  User,
  CheckCircle,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { Skeleton, CardSkeleton } from "@/src/components/ui/Skeleton";

export default function StoreDetailsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const params = useParams();
  const id = params?.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const canEdit = user?.roles?.some((r: any) => 
    ["SUPER_ADMIN", "ADMIN"].includes(r?.code)
  );

  useEffect(() => {
    if (!id) return;
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    const startTime = Date.now();
    try {
      const { data } = await api.get(`/stores/${id}`);
      setStore(data.store);
      setEditData({
        dealerCode: data.store.dealerCode,
        storeName: data.store.storeName,
        vendorCode: data.store.vendorCode || "",
        clientCode: data.store.clientCode || "",
        location: data.store.location,
        contact: data.store.contact || {},
        commercials: data.store.commercials || {},
        costDetails: data.store.costDetails || {},
        specs: data.store.specs || {},
      });
    } catch (error) {
      toast.error("Failed to load store details");
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        setTimeout(() => setLoading(false), 800 - elapsed);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/stores/${id}`, editData);
      toast.success("Store updated successfully");
      setIsEditing(false);
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update store");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className={`min-h-screen pb-20 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className={`sticky top-0 z-10 px-4 py-3 border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  if (!store) return <div className="p-10 text-center">Store not found</div>;

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`;

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 px-4 py-3 border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className={`p-2 -ml-2 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={`font-bold text-base sm:text-lg leading-tight truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
              {store.storeName}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-mono ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>{store.storeId || store.dealerCode}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}>{store.currentStatus.replace(/_/g, " ")}</span>
            </div>
          </div>
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap">
              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className={`p-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-700"}`}>
                <X className="h-4 w-4" />
              </button>
              <button onClick={handleSave} disabled={isSaving} className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-xs sm:text-sm flex items-center gap-1">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Store Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Location Card */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-yellow-500" />
                <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Location</h3>
              </div>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input placeholder="Zone" value={editData.location?.zone || ""} onChange={(e) => setEditData({...editData, location: {...editData.location, zone: e.target.value}})} className={inputClass} />
                <input placeholder="State" value={editData.location?.state || ""} onChange={(e) => setEditData({...editData, location: {...editData.location, state: e.target.value}})} className={inputClass} />
                <input placeholder="District" value={editData.location?.district || ""} onChange={(e) => setEditData({...editData, location: {...editData.location, district: e.target.value}})} className={inputClass} />
                <input placeholder="City" value={editData.location?.city || ""} onChange={(e) => setEditData({...editData, location: {...editData.location, city: e.target.value}})} className={inputClass} />
                <textarea placeholder="Address" value={editData.location?.address || ""} onChange={(e) => setEditData({...editData, location: {...editData.location, address: e.target.value}})} className={inputClass} rows={2} />
              </div>
            ) : (
              <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <div><span className="text-gray-500">Zone:</span> {store.location.zone || "-"}</div>
                <div><span className="text-gray-500">State:</span> {store.location.state || "-"}</div>
                <div><span className="text-gray-500">District:</span> {store.location.district || "-"}</div>
                <div><span className="text-gray-500">City:</span> {store.location.city || "-"}</div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Address:</span>
                  <p className="mt-1">{store.location.address || "-"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Dealer Info Card */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Dealer Info</h3>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input placeholder="Dealer Code" value={editData.dealerCode} onChange={(e) => setEditData({...editData, dealerCode: e.target.value})} className={inputClass} />
                <input placeholder="Store Name" value={editData.storeName} onChange={(e) => setEditData({...editData, storeName: e.target.value})} className={inputClass} />
                <input placeholder="Vendor Code" value={editData.vendorCode} onChange={(e) => setEditData({...editData, vendorCode: e.target.value})} className={inputClass} />
                <input placeholder="Client Code" value={editData.clientCode} onChange={(e) => setEditData({...editData, clientCode: e.target.value})} className={inputClass} />
              </div>
            ) : (
              <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <div><span className="text-gray-500">Code:</span> {store.dealerCode}</div>
                <div><span className="text-gray-500">Vendor:</span> {store.vendorCode || "-"}</div>
                <div><span className="text-gray-500">Client:</span> {store.clientCode || "-"}</div>
              </div>
            )}
          </div>

          {/* Commercial Details Card - Only show if PO details exist */}
          {(store.commercials?.poNumber || store.commercials?.poMonth || store.commercials?.invoiceNumber || store.commercials?.totalCost) && (
            <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="h-5 w-5 text-yellow-500" />
                <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Commercial</h3>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <input placeholder="PO Number" value={editData.commercials?.poNumber || ""} onChange={(e) => setEditData({...editData, commercials: {...editData.commercials, poNumber: e.target.value}})} className={inputClass} />
                  <input placeholder="PO Month" value={editData.commercials?.poMonth || ""} onChange={(e) => setEditData({...editData, commercials: {...editData.commercials, poMonth: e.target.value}})} className={inputClass} />
                  <input placeholder="Invoice Number" value={editData.commercials?.invoiceNumber || ""} onChange={(e) => setEditData({...editData, commercials: {...editData.commercials, invoiceNumber: e.target.value}})} className={inputClass} />
                  <input type="number" placeholder="Total Cost" value={editData.commercials?.totalCost || ""} onChange={(e) => setEditData({...editData, commercials: {...editData.commercials, totalCost: Number(e.target.value)}})} className={inputClass} />
                </div>
              ) : (
                <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <div><span className="text-gray-500">PO Number:</span> {store.commercials?.poNumber || "-"}</div>
                  <div><span className="text-gray-500">PO Month:</span> {store.commercials?.poMonth || "-"}</div>
                  <div><span className="text-gray-500">Invoice:</span> {store.commercials?.invoiceNumber || "-"}</div>
                  <div><span className="text-gray-500">Total Cost:</span> ₹{store.commercials?.totalCost?.toLocaleString() || 0}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Board Specs & Costs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Board Specifications</h3>
            </div>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Type" value={editData.specs?.type || ""} onChange={(e) => setEditData({...editData, specs: {...editData.specs, type: e.target.value}})} className={inputClass} />
                <input type="number" placeholder="Qty" value={editData.specs?.qty || ""} onChange={(e) => setEditData({...editData, specs: {...editData.specs, qty: Number(e.target.value)}})} className={inputClass} />
                <input type="number" placeholder="Width (ft)" value={editData.specs?.width || ""} onChange={(e) => setEditData({...editData, specs: {...editData.specs, width: Number(e.target.value)}})} className={inputClass} />
                <input type="number" placeholder="Height (ft)" value={editData.specs?.height || ""} onChange={(e) => setEditData({...editData, specs: {...editData.specs, height: Number(e.target.value)}})} className={inputClass} />
              </div>
            ) : (
              <div className={`grid grid-cols-2 gap-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <div><span className="text-gray-500">Type:</span> {store.specs?.type || "-"}</div>
                <div><span className="text-gray-500">Qty:</span> {store.specs?.qty || 1}</div>
                <div><span className="text-gray-500">Width:</span> {store.specs?.width} ft</div>
                <div><span className="text-gray-500">Height:</span> {store.specs?.height} ft</div>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Cost Details</h3>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input type="number" placeholder="Board Rate" value={editData.costDetails?.boardRate || ""} onChange={(e) => setEditData({...editData, costDetails: {...editData.costDetails, boardRate: Number(e.target.value)}})} className={inputClass} />
                <input type="number" placeholder="Angle Charges" value={editData.costDetails?.angleCharges || ""} onChange={(e) => setEditData({...editData, costDetails: {...editData.costDetails, angleCharges: Number(e.target.value)}})} className={inputClass} />
                <input type="number" placeholder="Scaffolding" value={editData.costDetails?.scaffoldingCharges || ""} onChange={(e) => setEditData({...editData, costDetails: {...editData.costDetails, scaffoldingCharges: Number(e.target.value)}})} className={inputClass} />
                <input type="number" placeholder="Transportation" value={editData.costDetails?.transportation || ""} onChange={(e) => setEditData({...editData, costDetails: {...editData.costDetails, transportation: Number(e.target.value)}})} className={inputClass} />
              </div>
            ) : (
              <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <div className="flex justify-between"><span className="text-gray-500">Board Rate:</span> <span>₹{store.costDetails?.boardRate || 0}/sq.ft</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Board Cost:</span> <span>₹{store.costDetails?.totalBoardCost?.toLocaleString() || 0}</span></div>
                {store.costDetails?.angleCharges ? <div className="flex justify-between"><span className="text-gray-500">Angle:</span> <span>₹{store.costDetails.angleCharges}</span></div> : null}
                {store.costDetails?.scaffoldingCharges ? <div className="flex justify-between"><span className="text-gray-500">Scaffolding:</span> <span>₹{store.costDetails.scaffoldingCharges}</span></div> : null}
                {store.costDetails?.transportation ? <div className="flex justify-between"><span className="text-gray-500">Transport:</span> <span>₹{store.costDetails.transportation}</span></div> : null}
              </div>
            )}
          </div>
        </div>

        {/* Recce Details */}
        {store.recce && (
          <div className={`p-3 sm:p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <h3 className={`font-bold text-sm sm:text-base ${darkMode ? "text-white" : "text-gray-900"}`}>Recce Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <span>Submitted: {store.recce.submittedDate ? new Date(store.recce.submittedDate).toLocaleDateString() : "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <span>By: {store.recce.submittedBy || "-"}</span>
                </div>
                {store.recce.notes && (
                  <div className="mt-3 p-2 rounded bg-gray-100 dark:bg-gray-700">
                    <p className="text-xs font-semibold mb-1">Notes:</p>
                    <p className="text-xs">{store.recce.notes}</p>
                  </div>
                )}
              </div>
              {store.recce.reccePhotos && store.recce.reccePhotos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Recce Photos ({store.recce.reccePhotos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {store.recce.reccePhotos.slice(0, 6).map((photo: any, idx: number) => (
                      <a key={idx} href={photo.photo} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 hover:opacity-80">
                        <img src={photo.photo} alt={`Recce ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Installation Details */}
        {store.installation && (
          <div className={`p-3 sm:p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <h3 className={`font-bold text-sm sm:text-base ${darkMode ? "text-white" : "text-gray-900"}`}>Installation Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <span>Submitted: {store.installation.submittedDate ? new Date(store.installation.submittedDate).toLocaleDateString() : "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <span>By: {store.installation.submittedBy || "-"}</span>
                </div>
              </div>
              {store.installation.photos && store.installation.photos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Installation Photos ({store.installation.photos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {store.installation.photos.slice(0, 6).map((photo: any, idx: number) => (
                      <a key={idx} href={photo.installationPhoto} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 hover:opacity-80">
                        <img src={photo.installationPhoto} alt={`Installation ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
