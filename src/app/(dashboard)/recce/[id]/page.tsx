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
  FileSpreadsheet,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { Skeleton, CardSkeleton } from "@/src/components/ui/Skeleton";

interface ReccePhoto {
  file: File | null;
  preview: string | null;
  width: string;
  height: string;
  unit: string;
  elementId: string;
  elementName: string;
}

export default function RecceSubmissionPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const params = useParams();
  const id = params?.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientElements, setClientElements] = useState<any[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [rejectionReason, setRejectionReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showValidationError, setShowValidationError] = useState(false);

  const isRecceUser = user?.roles?.some((r: any) => r.code === "RECCE" || r.name === "RECCE");
  const isAdmin = user?.roles?.some((r: any) => r.code === "SUPER_ADMIN" || r.code === "ADMIN");

  const [notes, setNotes] = useState("");
  const [initialPhotos, setInitialPhotos] = useState<File[]>([]);
  const [initialPreviews, setInitialPreviews] = useState<string[]>([]);
  const [reccePhotos, setReccePhotos] = useState<ReccePhoto[]>([
    { file: null, preview: null, width: "", height: "", unit: "in", elementId: "", elementName: "" },
  ]);

  useEffect(() => {
    if (!id) return;

    const fetchStore = async () => {
      const startTime = Date.now();
      try {
        const { data } = await api.get(`/stores/${id}`);
        const s = data.store;
        setStore(s);

        // Fetch client elements
        if (s.clientId) {
          try {
            const clientRes = await api.get(`/clients/${s.clientId}`);
            console.log("Client response:", clientRes.data);
            setClientElements(clientRes.data?.elements || []);
          } catch (err) {
            console.error("Failed to fetch client elements:", err);
          }
        }

        if (s.recce && s.recce.submittedDate) {
          if (s.recce.notes) setNotes(s.recce.notes);
          if (s.recce.initialPhotos && s.recce.initialPhotos.length > 0) {
            // Images are stored as relative paths, prepend CDN URL
            setInitialPreviews(s.recce.initialPhotos.map((p: string) => `https://storage.enamorimpex.com/${p}`));
          }
          if (s.recce.reccePhotos && s.recce.reccePhotos.length > 0) {
            const loaded = s.recce.reccePhotos.map((rp: any) => ({
              file: null,
              preview: `https://storage.enamorimpex.com/${rp.photo}`,
              width: String(rp.measurements.width || ""),
              height: String(rp.measurements.height || ""),
              unit: rp.measurements.unit || "in",
              elementId: rp.elements?.[0]?.elementId || "",
              elementName: rp.elements?.[0]?.elementName || "",
            }));
            setReccePhotos(loaded);
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

  const handleInitialPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalPhotos = initialPhotos.length + filesArray.length;
      
      if (totalPhotos > 10) {
        toast.error("Maximum 10 initial photos allowed");
        return;
      }

      setInitialPhotos([...initialPhotos, ...filesArray]);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setInitialPreviews([...initialPreviews, ...newPreviews]);
    }
  };

  const removeInitialPhoto = (index: number) => {
    setInitialPhotos(initialPhotos.filter((_, i) => i !== index));
    setInitialPreviews(initialPreviews.filter((_, i) => i !== index));
  };

  const handleReccePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newReccePhotos = [...reccePhotos];
      newReccePhotos[index].file = file;
      newReccePhotos[index].preview = URL.createObjectURL(file);
      setReccePhotos(newReccePhotos);
    }
  };

  const removeReccePhoto = (index: number) => {
    if (reccePhotos.length === 1) {
      toast.error("At least one recce photo is required");
      return;
    }
    setReccePhotos(reccePhotos.filter((_, i) => i !== index));
  };

  const addReccePhoto = () => {
    // Check if the last recce photo has width and height filled
    const lastPhoto = reccePhotos[reccePhotos.length - 1];
    if (!lastPhoto.width || !lastPhoto.height) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    setReccePhotos([...reccePhotos, { file: null, preview: null, width: "", height: "", unit: "in", elementId: "", elementName: "" }]);
  };

  const updateReccePhoto = (index: number, field: keyof ReccePhoto, value: any) => {
    const newReccePhotos = [...reccePhotos];
    (newReccePhotos[index] as any)[field] = value;
    setReccePhotos(newReccePhotos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if this is a resubmission (already has submitted data)
    const isResubmission = store?.recce?.submittedDate;
    
    if (reccePhotos.length === 0) {
      return toast.error("At least one recce photo is required");
    }

    for (let i = 0; i < reccePhotos.length; i++) {
      if (!reccePhotos[i].file && !reccePhotos[i].preview) {
        return toast.error(`Please upload photo for recce photo ${i + 1}`);
      }
      if (!reccePhotos[i].width || !reccePhotos[i].height) {
        return toast.error(`Please enter measurements for recce photo ${i + 1}`);
      }
      if (!reccePhotos[i].elementId) {
        return toast.error(`Please select an element for recce photo ${i + 1}`);
      }
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("notes", notes);
    formData.append("initialPhotosCount", String(initialPhotos.length));

    initialPhotos.forEach((photo, index) => {
      formData.append(`initialPhoto${index}`, photo);
    });

    const reccePhotosData = reccePhotos
      .filter(rp => rp.file)
      .map((rp) => ({
        width: rp.width,
        height: rp.height,
        unit: rp.unit,
        elements: [{ elementId: rp.elementId, elementName: rp.elementName, quantity: 1 }],
      }));
    formData.append("reccePhotosData", JSON.stringify(reccePhotosData));

    let photoIndex = 0;
    reccePhotos.forEach((rp) => {
      if (rp.file) {
        formData.append(`reccePhoto${photoIndex}`, rp.file);
        photoIndex++;
      }
    });

    // For resubmission, send existing photos data
    if (isResubmission) {
      const existingReccePhotos = reccePhotos
        .filter(rp => !rp.file && rp.preview)
        .map((rp) => ({
          photo: rp.preview?.replace('https://storage.enamorimpex.com/', ""),
          width: rp.width,
          height: rp.height,
          unit: rp.unit,
          elements: [{ elementId: rp.elementId, elementName: rp.elementName, quantity: 1 }],
        }));
      formData.append("existingReccePhotos", JSON.stringify(existingReccePhotos));
      
      const existingInitialPhotos = initialPreviews
        .filter(preview => !initialPhotos.some(file => URL.createObjectURL(file) === preview))
        .map(preview => preview.replace('https://storage.enamorimpex.com/', ""));
      formData.append("existingInitialPhotos", JSON.stringify(existingInitialPhotos));
    }

    try {
      await api.post(`/stores/${id}/recce`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(isResubmission ? "Recce Updated Successfully!" : "Recce Submitted Successfully!");
      router.push("/recce");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (selectedPhotoIndex === null) return;
    if (newStatus === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setUpdatingStatus(true);
    try {
      await api.post(`/stores/${id}/recce/photos/${selectedPhotoIndex}/review`, {
        status: newStatus,
        rejectionReason: newStatus === "REJECTED" ? rejectionReason : undefined,
      });
      toast.success(`Photo ${selectedPhotoIndex + 1} ${newStatus.toLowerCase()}`);
      setShowStatusModal(false);
      setSelectedPhotoIndex(null);
      setRejectionReason("");
      // Refresh store data
      const { data } = await api.get(`/stores/${id}`);
      setStore(data.store);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" /> Approved
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
        <div className={`grid ${isRecceUser ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4 mb-6`}>
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

          {/* Cost Breakdown - Hidden for recce users */}
          {!isRecceUser && (
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
          )}
        </div>

        {/* Client Elements */}
        {clientElements.length > 0 && (
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Available Elements for This Client</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {clientElements.map((element: any) => (
                <div key={element.elementId} className={`p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{element.elementName}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recce Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Initial Photos Section */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`font-bold flex items-center gap-2 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Camera className="h-5 w-5 text-yellow-500" /> Initial Store Photos (Optional - Max 10)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              {initialPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Initial ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeInitialPhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {initialPhotos.length < 10 && (
              <label className={`block cursor-pointer border-2 border-dashed rounded-lg p-4 text-center ${darkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"}`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleInitialPhotoChange}
                />
                <Camera className={`h-8 w-8 mx-auto mb-2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Upload Initial Photos ({initialPhotos.length}/10)
                </span>
              </label>
            )}
          </div>

          {/* Recce Photos */}
          {reccePhotos.map((reccePhoto, index) => (
            <div key={index} className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className={`font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    <Ruler className="h-5 w-5 text-yellow-500" /> Recce Photo {index + 1}
                  </h3>
                  {store?.recce?.reccePhotos?.[index]?.approvalStatus && (
                    <div>{getStatusBadge(store.recce.reccePhotos[index].approvalStatus)}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && store?.recce?.submittedDate && (
                    <button
                      onClick={() => {
                        setSelectedPhotoIndex(index);
                        setNewStatus("APPROVED");
                        setShowStatusModal(true);
                      }}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Change Status
                    </button>
                  )}
                  {reccePhotos.length > 1 && !store?.recce?.submittedDate && (
                    <button
                      type="button"
                      onClick={() => removeReccePhoto(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {store?.recce?.reccePhotos?.[index]?.rejectionReason && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="text-xs font-medium text-red-800 dark:text-red-400">Rejection Reason:</div>
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">{store.recce.reccePhotos[index].rejectionReason}</div>
                </div>
              )}

              {/* Element Selection */}
              {clientElements.length > 0 && (
                <div className="mb-4">
                  <label className={`block text-xs font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Select Element *
                  </label>
                  <select
                    value={reccePhoto.elementId}
                    onChange={(e) => {
                      const selectedElement = clientElements.find(el => el.elementId.toString() === e.target.value);
                      const newReccePhotos = [...reccePhotos];
                      newReccePhotos[index].elementId = e.target.value;
                      newReccePhotos[index].elementName = selectedElement?.elementName || "";
                      setReccePhotos(newReccePhotos);
                    }}
                    className={`w-full p-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                  >
                    <option value="">-- Select an element --</option>
                    {clientElements.map((element: any) => (
                      <option key={element.elementId} value={element.elementId.toString()}>
                        {element.elementName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Photo Upload */}
              <div className="mb-4">
                {reccePhoto.preview ? (
                  <div className="relative inline-block">
                    <img src={reccePhoto.preview} alt={`Recce ${index + 1}`} className="w-full max-w-xs h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        const newReccePhotos = [...reccePhotos];
                        newReccePhotos[index].file = null;
                        newReccePhotos[index].preview = null;
                        setReccePhotos(newReccePhotos);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`block cursor-pointer border-2 border-dashed rounded-lg p-8 text-center ${darkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReccePhotoChange(index, e)}
                    />
                    <Camera className={`h-12 w-12 mx-auto mb-2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Upload Recce Photo
                    </span>
                  </label>
                )}
              </div>

              {/* Measurements */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Width (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className={`w-full p-2.5 border rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                    value={reccePhoto.width}
                    onChange={(e) => {
                      updateReccePhoto(index, "width", e.target.value);
                      if (index === reccePhotos.length - 1 && showValidationError) {
                        setShowValidationError(false);
                      }
                    }}
                    placeholder="0.0"
                  />
                  {index === reccePhotos.length - 1 && showValidationError && !reccePhoto.width && (
                    <p className="text-xs text-red-500 mt-1">Required</p>
                  )}
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Height (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className={`w-full p-2.5 border rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                    value={reccePhoto.height}
                    onChange={(e) => {
                      updateReccePhoto(index, "height", e.target.value);
                      if (index === reccePhotos.length - 1 && showValidationError) {
                        setShowValidationError(false);
                      }
                    }}
                    placeholder="0.0"
                  />
                  {index === reccePhotos.length - 1 && showValidationError && !reccePhoto.height && (
                    <p className="text-xs text-red-500 mt-1">Required</p>
                  )}
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Unit
                  </label>
                  <select
                    value={reccePhoto.unit}
                    onChange={(e) => updateReccePhoto(index, "unit", e.target.value)}
                    className={`w-full p-2.5 border rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                  >
                    <option value="in">in</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    In Feet
                  </label>
                  <div className={`w-full p-2.5 border rounded-lg text-base font-bold ${darkMode ? "bg-gray-800 border-gray-600 text-yellow-400" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
                    {reccePhoto.width && reccePhoto.height ? (
                      <span>
                        {reccePhoto.unit === "in" 
                          ? `${(parseFloat(reccePhoto.width) / 12).toFixed(2)} × ${(parseFloat(reccePhoto.height) / 12).toFixed(2)}`
                          : `${parseFloat(reccePhoto.width).toFixed(2)} × ${parseFloat(reccePhoto.height).toFixed(2)}`
                        }
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Recce Photo Button */}
          <button
            type="button"
            onClick={addReccePhoto}
            className={`w-full p-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 ${darkMode ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-300 text-gray-500 hover:bg-gray-50"}`}
          >
            <Plus className="h-5 w-5" />
            Add Another Recce Photo
          </button>

          {/* Notes */}
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

          {/* Submit Button */}
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
        </form>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Change Status - Photo {selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : ""}
            </h3>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as "APPROVED" | "REJECTED")}
                className={`w-full p-3 border rounded-lg text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"}`}
              >
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {newStatus === "REJECTED" && (
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className={`w-full p-3 border rounded-lg text-sm min-h-[100px] ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"}`}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedPhotoIndex(null);
                  setRejectionReason("");
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={updatingStatus || (newStatus === "REJECTED" && !rejectionReason.trim())}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${newStatus === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
