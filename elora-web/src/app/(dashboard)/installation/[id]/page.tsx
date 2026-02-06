"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import { ArrowLeft, Camera, CheckCircle2, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function InstallationSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // File State
  const [finalPhoto, setFinalPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data } = await api.get(`/stores/${id}`);
        setStore(data.store);
      } catch (error) {
        toast.error("Failed to load store details");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFinalPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalPhoto)
      return toast.error("Please upload the final installation photo");

    setSubmitting(true);
    const formData = new FormData();
    // The backend expects the field name 'final'
    formData.append("final", finalPhoto);

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
          <p className="text-xs text-gray-500">Submit Installation Proof</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Instruction Card */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Board Details:</p>
            <p>
              {store.specs?.boardSize} — {store.specs?.type || "Standard Board"}
            </p>
            <p className="mt-2 text-xs opacity-80">
              Please upload a clear photo of the board after installation is
              complete.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PHOTO UPLOAD */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-blue-600" /> Final Photo
            </h3>

            <label className="flex-1 relative block cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                className={`h-64 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden
                        ${preview ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
                    `}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-500">
                      Tap to Capture
                    </span>
                  </>
                )}
              </div>
            </label>
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
              Complete Installation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
