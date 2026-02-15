"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import {
  ArrowLeft,
  Camera,
  Ruler,
  FileText,
  CheckCircle2,
  Loader2,
  MapPin,
  Building2,
  Package,
  IndianRupee,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";
import { Skeleton, CardSkeleton } from "@/src/components/ui/Skeleton";

export default function RecceSubmissionPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const params = useParams();
  const id = params?.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState("ft");
  const [notes, setNotes] = useState("");

  // File State
  const [photos, setPhotos] = useState<{
    front: File | null;
    side: File | null;
    closeUp: File | null;
  }>({ front: null, side: null, closeUp: null });

  // Previews
  const [previews, setPreviews] = useState<{
    front: string | null;
    side: string | null;
    closeUp: string | null;
  }>({ front: null, side: null, closeUp: null });

  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    if (!id) return;

    const fetchStore = async () => {
      const startTime = Date.now();
      try {
        const { data } = await api.get(`/stores/${id}`);
        const s = data.store;
        setStore(s);

        if (s.recce && s.recce.submittedDate) {
          if (s.recce.sizes) {
            setWidth(String(s.recce.sizes.width));
            setHeight(String(s.recce.sizes.height));
            setUnit(s.recce.sizes.unit || "ft");
          }
          if (s.recce.notes) {
            setNotes(s.recce.notes);
          }
          setPreviews({
            front: s.recce.photos?.front
              ? `${API_BASE_URL}/${s.recce.photos.front}`
              : null,
            side: s.recce.photos?.side
              ? `${API_BASE_URL}/${s.recce.photos.side}`
              : null,
            closeUp: s.recce.photos?.closeUp
              ? `${API_BASE_URL}/${s.recce.photos.closeUp}`
              : null,
          });
        } else {
          if (s.specs?.boardSize) {
            const parts = s.specs.boardSize.toLowerCase().split("x");
            if (parts.length === 2) {
              setWidth(parts[0].trim());
              setHeight(parts[1].trim());
            }
          }
        }
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
    fetchStore();
  }, [id]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "side" | "closeUp",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotos((prev) => ({ ...prev, [type]: file }));

      const url = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [type]: url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!width || !height) return toast.error("Please enter board dimensions");
    if (!photos.front || !photos.side || !photos.closeUp)
      return toast.error("Please upload all 3 site photos (Front View, Side View, and Close-Up) with visible measurements for accurate recce documentation");

    setSubmitting(true);
    const formData = new FormData();
    formData.append("width", width);
    formData.append("height", height);
    formData.append("unit", unit);
    formData.append("notes", notes);

    formData.append("front", photos.front);
    formData.append("side", photos.side);
    formData.append("closeUp", photos.closeUp);

    try {
      await api.post(`/stores/${id}/recce`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Recce Submitted Successfully!");
      router.push("/recce");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
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
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  if (!store) return <div className="p-10 text-center">Store not found</div>;

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <button
          onClick={() => router.back()}
          className={`p-2 -ml-2 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h1 className={`font-bold text-lg leading-tight line-clamp-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {store.storeName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-mono ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>{store.storeId || store.dealerCode}</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}>{store.currentStatus.replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Store Details Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Location Card */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-yellow-500" />
                <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Location</h3>
              </div>
              {(store.location.coordinates?.lat && store.location.coordinates?.lng) || store.location.address ? (
                <button
                  onClick={() => {
                    const lat = store.location.coordinates?.lat;
                    const lng = store.location.coordinates?.lng;
                    const address = store.location.address;
                    const url = lat && lng 
                      ? `https://www.google.com/maps?q=${lat},${lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
                    window.open(url, '_blank');
                  }}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                >
                  Open in Map
                </button>
              ) : null}
            </div>
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
          </div>

          {/* Dealer Info Card */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Dealer Info</h3>
            </div>
            <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div><span className="text-gray-500">Code:</span> {store.dealerCode}</div>
              <div><span className="text-gray-500">Vendor:</span> {store.vendorCode || "-"}</div>
              <div><span className="text-gray-500">Contact:</span> {store.contact?.personName || "-"}</div>
              <div><span className="text-gray-500">Mobile:</span> {store.contact?.mobile || "-"}</div>
            </div>
          </div>

          {/* Commercial Details Card */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Commercial</h3>
            </div>
            <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div><span className="text-gray-500">PO Number:</span> {store.commercials?.poNumber || "-"}</div>
              <div><span className="text-gray-500">PO Month:</span> {store.commercials?.poMonth || "-"}</div>
              <div><span className="text-gray-500">Invoice:</span> {store.commercials?.invoiceNumber || "-"}</div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Remarks:</span>
                <p className="mt-1 text-xs">{store.commercials?.invoiceRemarks || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Board Specs & Costs */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Board Specifications */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Board Specifications</h3>
            </div>
            <div className={`grid grid-cols-2 gap-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div><span className="text-gray-500">Type:</span> {store.specs?.type || "-"}</div>
              <div><span className="text-gray-500">Qty:</span> {store.specs?.qty || 1}</div>
              <div><span className="text-gray-500">Width:</span> {store.specs?.width} ft</div>
              <div><span className="text-gray-500">Height:</span> {store.specs?.height} ft</div>
              <div className="col-span-2"><span className="text-gray-500">Board Size:</span> {store.specs?.boardSize || "-"} sq.ft</div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Cost Details</h3>
            </div>
            <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div className="flex justify-between"><span className="text-gray-500">Board Rate:</span> <span>₹{store.costDetails?.boardRate || 0}/sq.ft</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Board Cost:</span> <span>₹{store.costDetails?.totalBoardCost?.toLocaleString() || 0}</span></div>
              {store.costDetails?.angleCharges ? <div className="flex justify-between"><span className="text-gray-500">Angle:</span> <span>₹{store.costDetails.angleCharges}</span></div> : null}
              {store.costDetails?.scaffoldingCharges ? <div className="flex justify-between"><span className="text-gray-500">Scaffolding:</span> <span>₹{store.costDetails.scaffoldingCharges}</span></div> : null}
              {store.costDetails?.transportation ? <div className="flex justify-between"><span className="text-gray-500">Transport:</span> <span>₹{store.costDetails.transportation}</span></div> : null}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-bold text-green-600">
                <span>Total Cost:</span> <span>₹{store.commercials?.totalCost?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recce Form */}
        <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
          {/* SECTION 1: MEASUREMENTS */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`font-bold flex items-center gap-2 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Ruler className="h-5 w-5 text-yellow-500" /> Measurements
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Width
                </label>
                <input
                  type="number"
                  step="0.1"
                  className={`w-full p-3 border rounded-lg text-lg font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Height
                </label>
                <input
                  type="number"
                  step="0.1"
                  className={`w-full p-3 border rounded-lg text-lg font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`w-full p-3 border rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
              >
                <option value="ft">Feet (ft)</option>
                <option value="m">Meters (m)</option>
              </select>
            </div>
          </div>

          {/* SECTION 2: PHOTOS */}
          <div className={`p-4 rounded-xl border md:row-span-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`font-bold flex items-center gap-2 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Camera className="h-5 w-5 text-yellow-500" /> Site Photos
            </h3>

            <div className="space-y-4">
              {["front", "side", "closeUp"].map((type) => (
                <div key={type} className="flex items-center gap-4">
                  <label className="flex-1 relative block cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, type as any)}
                    />
                    <div
                      className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden ${
                        previews[type as keyof typeof previews] 
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                          : darkMode 
                            ? "border-gray-600 bg-gray-700 hover:bg-gray-600" 
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {previews[type as keyof typeof previews] ? (
                        <img
                          src={previews[type as keyof typeof previews]!}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <Camera className={`h-6 w-6 mb-1 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                          <span className={`text-xs font-medium capitalize ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {type} View
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: NOTES */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`font-bold flex items-center gap-2 mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <FileText className="h-5 w-5 text-yellow-500" /> Remarks
            </h3>
            <textarea
              className={`w-full p-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500 min-h-[80px] ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"}`}
              placeholder="Any obstruction? Electrical issues?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          </div>
          {/* SUBMIT BUTTON */}
          <div className="pt-2 md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-yellow-200 hover:bg-yellow-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
            >
              {submitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle2 />
              )}
              Submit Recce Report
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
