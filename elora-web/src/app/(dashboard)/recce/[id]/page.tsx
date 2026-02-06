"use client";

import React, { useEffect, useState, use } from "react"; // Added 'use'
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import {
  ArrowLeft,
  Camera,
  Upload,
  Ruler,
  FileText,
  CheckCircle2,
  Loader2,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

// Unwrap params using React.use() for Next.js 15+
export default function RecceSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  // Unwrap the params promise
  const { id } = use(params);

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
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

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data } = await api.get(`/stores/${id}`);
        setStore(data.store);

        // If dimensions exist (e.g. from Excel), pre-fill them
        if (data.store.specs?.boardSize) {
          // Simple parser: "10 x 5" -> width=10, height=5
          const parts = data.store.specs.boardSize.toLowerCase().split("x");
          if (parts.length === 2) {
            setWidth(parts[0].trim());
            setHeight(parts[1].trim());
          }
        }
      } catch (error) {
        toast.error("Failed to load store details");
      } finally {
        setLoading(false);
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

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [type]: url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!width || !height) return toast.error("Please enter board dimensions");
    if (!photos.front || !photos.side || !photos.closeUp)
      return toast.error("All 3 photos are required");

    setSubmitting(true);
    const formData = new FormData();
    formData.append("width", width);
    formData.append("height", height);
    formData.append("notes", notes);

    // Append files
    formData.append("front", photos.front);
    formData.append("side", photos.side);
    formData.append("closeUp", photos.closeUp);

    try {
      // NOTE: Using the route we created earlier: /stores/:id/recce
      await api.post(`/stores/${id}/recce`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Recce Submitted Successfully!");
      router.push("/recce"); // Go back to list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  if (!store) return <div className="p-10 text-center">Store not found</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
            {store.storeName}
          </h1>
          <p className="text-xs text-gray-500">{store.dealerCode}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Store Info Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex gap-3 text-sm text-gray-600 mb-2">
            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
            <p>
              {store.location.address ||
                `${store.location.city}, ${store.location.area}`}
            </p>
          </div>
          <div className="bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-lg mt-3">
            <strong>Instruction:</strong>{" "}
            {store.specs?.type || "Standard Board"}. Capture clear images from
            all angles.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: MEASUREMENTS */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Ruler className="h-5 w-5 text-blue-600" /> Measurements (ft)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PHOTOS */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-purple-600" /> Site Photos
            </h3>

            <div className="space-y-4">
              {/* Helper Component for Upload Box */}
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
                      className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden
                                    ${previews[type as keyof typeof previews] ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
                                `}
                    >
                      {previews[type as keyof typeof previews] ? (
                        <img
                          src={previews[type as keyof typeof previews]!}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-gray-400 mb-1" />
                          <span className="text-xs font-medium text-gray-500 capitalize">
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
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-orange-600" /> Remarks
            </h3>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder="Any obstruction? Electrical issues?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
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
  );
}
