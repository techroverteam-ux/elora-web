"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import { ArrowLeft, Camera, CheckCircle2, Loader2, MapPin, Building2, Package, FileSpreadsheet, Ruler, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { Skeleton, CardSkeleton } from "@/src/components/ui/Skeleton";

export default function InstallationSubmissionPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const params = useParams();
  const id = params?.id as string;
  const API_BASE_URL = "http://localhost:5000";

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [installationPhotos, setInstallationPhotos] = useState<{ [key: number]: File | null }>({});
  const [previews, setPreviews] = useState<{ [key: number]: string | null }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 10;

  const isInstallationRole = user?.roles?.some(r => r.name === "INSTALLATION");

  const getPhotoUrl = (path: string | undefined) => {
    if (!path) return null;
    const cleanPath = path.startsWith("/") || path.startsWith("\\") ? path.slice(1) : path;
    return `${API_BASE_URL}/${cleanPath.replace(/\\/g, "/")}`;
  };

  useEffect(() => {
    if (!id) return;

    const fetchStore = async () => {
      const startTime = Date.now();
      try {
        const { data } = await api.get(`/stores/${id}`);
        const s = data.store;
        setStore(s);

        if (s.installation?.photos) {
          const newPreviews: { [key: number]: string | null } = {};
          s.installation.photos.forEach((p: any) => {
            newPreviews[p.reccePhotoIndex] = getPhotoUrl(p.installationPhoto);
          });
          setPreviews(newPreviews);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInstallationPhotos(prev => ({ ...prev, [index]: file }));
      setPreviews(prev => ({ ...prev, [index]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reccePhotosCount = store?.recce?.reccePhotos?.length || 0;
    const uploadedCount = Object.keys(installationPhotos).length + Object.keys(previews).filter(k => previews[parseInt(k)] && !installationPhotos[parseInt(k)]).length;

    if (uploadedCount < reccePhotosCount) {
      return toast.error(`Please upload installation photos for all ${reccePhotosCount} recce photos`);
    }

    setSubmitting(true);
    const formData = new FormData();

    const photosData: Array<{ reccePhotoIndex: number }> = [];
    let fileIndex = 0;

    for (let i = 0; i < reccePhotosCount; i++) {
      if (installationPhotos[i]) {
        formData.append(`installationPhoto${fileIndex}`, installationPhotos[i]!);
        photosData.push({ reccePhotoIndex: i });
        fileIndex++;
      }
    }

    formData.append("installationPhotosData", JSON.stringify(photosData));

    try {
      await api.post(`/stores/${id}/installation`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Installation Marked as Complete!");
      router.push("/installation");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
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
        <CardSkeleton />
      </div>
    </div>
  );

  if (!store) return <div className="p-10 text-center">Store not found</div>;

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <button onClick={() => router.back()} className={`p-2 -ml-2 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}>
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h1 className={`font-bold text-lg leading-tight line-clamp-1 ${darkMode ? "text-white" : "text-gray-900"}`}>{store.storeName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-mono ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>{store.storeId || store.dealerCode}</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}>{store.currentStatus.replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Location</h3>
            </div>
            <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div><span className="text-gray-500">City:</span> {store.location.city || "-"}</div>
              <div><span className="text-gray-500">State:</span> {store.location.state || "-"}</div>
              <div><span className="text-gray-500">Address:</span> {store.location.address || "-"}</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Dealer Info</h3>
            </div>
            <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div><span className="text-gray-500">Code:</span> {store.dealerCode}</div>
              <div><span className="text-gray-500">Contact:</span> {store.contact?.personName || "-"}</div>
              <div><span className="text-gray-500">Mobile:</span> {store.contact?.mobile || "-"}</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Board Specs</h3>
            </div>
            <div className={`space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div><span className="text-gray-500">Type:</span> {store.specs?.type || "-"}</div>
              <div><span className="text-gray-500">Size:</span> {store.specs?.width} x {store.specs?.height} ft</div>
              <div><span className="text-gray-500">Qty:</span> {store.specs?.qty || 1}</div>
            </div>
          </div>
        </div>

        {!isInstallationRole && store.costDetails && (
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="h-5 w-5 text-yellow-500" />
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Cost Details</h3>
            </div>
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div><span className="text-gray-500">Board Rate:</span> ₹{store.costDetails.boardRate || 0}/sq.ft</div>
              <div><span className="text-gray-500">Board Cost:</span> ₹{store.costDetails.totalBoardCost?.toLocaleString() || 0}</div>
              {store.costDetails.angleCharges ? <div><span className="text-gray-500">Angle:</span> ₹{store.costDetails.angleCharges}</div> : null}
              {store.costDetails.scaffoldingCharges ? <div><span className="text-gray-500">Scaffolding:</span> ₹{store.costDetails.scaffoldingCharges}</div> : null}
            </div>
          </div>
        )}

        {store.recce?.initialPhotos && store.recce.initialPhotos.length > 0 && (
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? "bg-blue-900/20 border-blue-700/50" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-blue-500" />
              <h3 className={`font-bold text-lg ${darkMode ? "text-blue-300" : "text-blue-900"}`}>Initial Photos (Uploaded by Recce User)</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {store.recce.initialPhotos.map((photo, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden border-2 border-blue-300 dark:border-blue-700">
                  <img src={getPhotoUrl(photo) || ''} alt={`Initial ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {store.recce?.reccePhotos && store.recce.reccePhotos.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Recce Photos & Installation Upload</h3>
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Total: {store.recce.reccePhotos.length} photos
                </span>
              </div>
              <div className="space-y-6">
                {store.recce.reccePhotos.slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage).map((reccePhoto, idx) => {
                  const index = (currentPage - 1) * photosPerPage + idx;
                  return (
                  <div key={index} className={`p-4 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className={`font-bold mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Recce Photo {index + 1}</h4>
                        <div className="aspect-video rounded-lg overflow-hidden border-2 border-blue-500 mb-3">
                          <img src={getPhotoUrl(reccePhoto.photo) || ''} alt={`Recce ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Ruler className="h-4 w-4 text-yellow-500" />
                            <span className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Measurements:</span>
                          </div>
                          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {reccePhoto.measurements.width} x {reccePhoto.measurements.height} {reccePhoto.measurements.unit}
                          </p>
                          {reccePhoto.elements && reccePhoto.elements.length > 0 && (
                            <>
                              <div className="flex items-center gap-2 mt-3 mb-2">
                                <FileText className="h-4 w-4 text-yellow-500" />
                                <span className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Elements:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {reccePhoto.elements.map((el, i) => (
                                  <span key={i} className={`px-2 py-1 rounded text-xs ${darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}>
                                    {el.elementName} (Qty: {el.quantity})
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className={`font-bold mb-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>Installation Photo {index + 1}</h4>
                        <label className="block cursor-pointer group">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, index)} />
                          <div className={`aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${previews[index] ? "border-green-500 bg-green-50 dark:bg-green-900/20" : darkMode ? "border-gray-600 bg-gray-700 hover:bg-gray-600" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}>
                            {previews[index] ? (
                              <img src={previews[index]!} alt={`Installation ${index + 1}`} className="h-full w-full object-cover" />
                            ) : (
                              <>
                                <Camera className={`h-8 w-8 mb-2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                                <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Upload Installation Photo</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {store.recce.reccePhotos.length > photosPerPage && (
                <div className={`flex items-center justify-between mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                  >
                    Previous
                  </button>
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Page {currentPage} of {Math.ceil((store.recce?.reccePhotos?.length || 0) / photosPerPage)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil((store.recce?.reccePhotos?.length || 0) / photosPerPage), p + 1))}
                    disabled={currentPage === Math.ceil((store.recce?.reccePhotos?.length || 0) / photosPerPage)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === Math.ceil((store.recce?.reccePhotos?.length || 0) / photosPerPage) ? "opacity-50 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100">
              {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Complete Installation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
