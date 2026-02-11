"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Info,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function InstallationSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const API_BASE_URL = "http://localhost:5000";

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [photos, setPhotos] = useState<{
    after1: File | null;
    after2: File | null;
  }>({
    after1: null,
    after2: null,
  });

  const [previews, setPreviews] = useState<{
    after1: string | null;
    after2: string | null;
  }>({
    after1: null,
    after2: null,
  });

  const [reccePhotoUrl, setReccePhotoUrl] = useState<string | null>(null);

  // Helper to construct clean URLs
  const getPhotoUrl = (path: string | undefined) => {
    if (!path) return null;
    // Remove any leading slash from the path to avoid double slashes
    const cleanPath =
      path.startsWith("/") || path.startsWith("\\") ? path.slice(1) : path;
    // Ensure standard URL formatting
    return `${API_BASE_URL}/${cleanPath.replace(/\\/g, "/")}`;
  };

  useEffect(() => {
    if (!id) return;

    const fetchStore = async () => {
      try {
        const { data } = await api.get(`/stores/${id}`);
        const s = data.store;
        setStore(s);

        // 1. Get Recce Photo (Read-Only)
        const recceImg =
          s.recce?.photos?.front ||
          s.recce?.photos?.closeUp ||
          s.recce?.photos?.side;

        if (recceImg) {
          setReccePhotoUrl(getPhotoUrl(recceImg));
        }

        // 2. Pre-fill existing Installation photos
        setPreviews({
          after1: getPhotoUrl(s.installation?.photos?.after1),
          after2: getPhotoUrl(s.installation?.photos?.after2),
        });
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
    type: "after1" | "after2",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotos((prev) => ({ ...prev, [type]: file }));
      setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (!photos.after1 && !previews.after1) ||
      (!photos.after2 && !previews.after2)
    ) {
      return toast.error(
        "Please upload BOTH installation photos (View 1 & View 2).",
      );
    }

    setSubmitting(true);
    const formData = new FormData();

    if (photos.after1) formData.append("after1", photos.after1);
    if (photos.after2) formData.append("after2", photos.after2);

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

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  if (!store) return <div className="p-10 text-center">Store not found</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
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
          <p className="text-xs text-gray-500">Installation Proof</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Board Details:</p>
            <p>
              {store.specs?.boardSize} — {store.specs?.type || "Standard Board"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 opacity-90">
            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-gray-500" /> Reference: Before
              (Recce)
            </h3>
            <div className="h-48 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
              {reccePhotoUrl ? (
                <img
                  src={reccePhotoUrl}
                  alt="Recce Ref"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <span className="text-xs text-gray-400">
                    No Recce Image Available
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-3 pl-1">
              Upload Installation Photos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <label className="block cursor-pointer group relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "after1")}
                  />
                  <div
                    className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all
                    ${previews.after1 ? "border-green-500 bg-green-50" : "border-blue-300 bg-blue-50 hover:bg-blue-100"}`}
                  >
                    {previews.after1 ? (
                      <img
                        src={previews.after1}
                        alt="After 1"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="h-8 w-8 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-600 font-medium">
                    After View 1
                  </p>
                </label>
              </div>

              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <label className="block cursor-pointer group relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "after2")}
                  />
                  <div
                    className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all
                    ${previews.after2 ? "border-green-500 bg-green-50" : "border-blue-300 bg-blue-50 hover:bg-blue-100"}`}
                  >
                    {previews.after2 ? (
                      <img
                        src={previews.after2}
                        alt="After 2"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="h-8 w-8 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-600 font-medium">
                    After View 2
                  </p>
                </label>
              </div>
            </div>
          </div>

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
              Complete Installation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
