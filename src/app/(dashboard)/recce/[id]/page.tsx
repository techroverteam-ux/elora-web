"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import {
  Camera,
  ClipboardCheck,
  ImagePlus,
  Info,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Ruler,
  StickyNote,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/context/AuthContext";
import { useImageService } from "@/src/hooks/useImageService";
import {
  ApprovalBadge,
  Badge,
  Btn,
  CommercialCard,
  ContactCard,
  CopyText,
  CostCard,
  DealerCard,
  DetailHeader,
  DetailSkeleton,
  Dialog,
  Field,
  IconBtn,
  LocationCard,
  NextStep,
  NotFound,
  PhotoTile,
  ProgressBar,
  Section,
  SpecsCard,
  StatusBadge,
  StickyBar,
  Stepper,
  buildSteps,
  cx,
  useInputClass,
  useLightbox,
  useSurface,
} from "@/src/components/detail";

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
  const { user } = useAuth();
  const params = useParams();
  const id = params?.id as string;

  const { getFullImageUrl } = useImageService();
  const s = useSurface();
  const inputClass = useInputClass();
  const lightbox = useLightbox();

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
      try {
        const { data } = await api.get(`/stores/${id}`);
        const s = data.store;
        setStore(s);

        // Fetch client elements
        if (s.clientId) {
          try {
            const clientRes = await api.get(`/clients/${s.clientId}`);
            setClientElements(clientRes.data?.elements || []);
          } catch (err) {
            console.error("Failed to fetch client elements:", err);
          }
        }

        if (s.recce && s.recce.submittedDate) {
          if (s.recce.notes) setNotes(s.recce.notes);
          if (s.recce.initialPhotos && s.recce.initialPhotos.length > 0) {
            setInitialPreviews(s.recce.initialPhotos.map((p: string) => getFullImageUrl(p)));
          }
          if (s.recce.reccePhotos && s.recce.reccePhotos.length > 0) {
            const loaded = s.recce.reccePhotos.map((rp: any) => ({
              file: null,
              preview: getFullImageUrl(rp.photo),
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
        setLoading(false);
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
          photo: rp.preview?.replace(getFullImageUrl(''), ""),
          width: rp.width,
          height: rp.height,
          unit: rp.unit,
          elements: [{ elementId: rp.elementId, elementName: rp.elementName, quantity: 1 }],
        }));
      formData.append("existingReccePhotos", JSON.stringify(existingReccePhotos));
      
      const existingInitialPhotos = initialPreviews
        .filter(preview => !initialPhotos.some(file => URL.createObjectURL(file) === preview))
        .map(preview => preview.replace(getFullImageUrl(''), ""));
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
      const { data } = await api.post(`/stores/${id}/recce/photos/${selectedPhotoIndex}/review`, {
        status: newStatus,
        rejectionReason: newStatus === "REJECTED" ? rejectionReason : undefined,
      });
      toast.success(`Photo ${selectedPhotoIndex + 1} ${newStatus.toLowerCase()}`);
      setShowStatusModal(false);
      setSelectedPhotoIndex(null);
      setRejectionReason("");
      // Refresh store data
      if (data?.store) {
        setStore(data.store);
      } else {
        const { data: resData } = await api.get(`/stores/${id}`);
        setStore(resData.store);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!store)
    return <NotFound title="Store not found" hint="It may have been deleted, or the link is wrong." backHref="/recce" backLabel="Back to recce" />;

  /* ---------------- derived display state (no side effects) ---------------- */
  const submitted = !!store.recce?.submittedDate;
  const serverPhotos = (store.recce?.reccePhotos || []) as Array<any>;
  const approvedCount = serverPhotos.filter((p) => p.approvalStatus === "APPROVED").length;
  const rejectedCount = serverPhotos.filter((p) => p.approvalStatus === "REJECTED").length;
  const pendingCount = serverPhotos.length - approvedCount - rejectedCount;

  // A board counts as ready when it passes the same checks handleSubmit runs.
  const isReady = (rp: ReccePhoto) => !!(rp.file || rp.preview) && !!rp.width && !!rp.height && !!rp.elementId;
  const readyCount = reccePhotos.filter(isReady).length;
  const missing = (rp: ReccePhoto) => {
    const m: string[] = [];
    if (!rp.file && !rp.preview) m.push("photo");
    if (!rp.width || !rp.height) m.push("size");
    if (!rp.elementId) m.push("element");
    return m;
  };

  const boardImages = reccePhotos.map((rp, i) => ({ src: rp.preview || "", caption: `Board ${i + 1}` }));
  const initialImages = initialPreviews.map((p, i) => ({ src: p, caption: `Store photo ${i + 1}` }));

  const banner = !submitted
    ? {
        tone: "brand" as const,
        title: "Measure every board, then submit",
        body: "Each board needs a photo, its width and height, and the element to be installed. Store photos are optional.",
      }
    : rejectedCount > 0
    ? {
        tone: "danger" as const,
        title: `${rejectedCount} of ${serverPhotos.length} boards rejected`,
        body: "Read the reason on each red board, replace the photo or correct the size, then press Update recce.",
      }
    : pendingCount > 0
    ? {
        tone: "warning" as const,
        title: "Submitted · waiting for review",
        body: `${approvedCount} of ${serverPhotos.length} boards reviewed so far. You can still correct a board and update the recce.`,
      }
    : {
        tone: "success" as const,
        title: "All boards approved",
        body: "This recce is complete. The store moves on to installation.",
      };

  return (
    <div className="mx-auto max-w-7xl pb-32">
      <DetailHeader
        backHref="/recce"
        eyebrow="Recce"
        title={store.storeName}
        meta={
          <>
            <CopyText value={store.storeId || store.dealerCode} />
            <StatusBadge status={store.currentStatus} />
            {store.location?.city && <span>{[store.location.city, store.location.state].filter(Boolean).join(", ")}</span>}
          </>
        }
        actions={
          isAdmin && submitted ? (
            <Btn variant="secondary" icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => router.push(`/recce/${id}/review`)}>
              <span className="hidden sm:inline">Review photos</span>
            </Btn>
          ) : undefined
        }
      />

      <div className="space-y-4">
        <NextStep tone={banner.tone} title={banner.title} icon={banner.tone === "danger" ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}>
          {banner.body}
        </NextStep>

        <Section title="Progress" icon={<Layers className="h-4 w-4" />} collapsible defaultOpen={false} subtitle="Where this store is in the workflow">
          <Stepper steps={buildSteps(store)} />
        </Section>

        <div className="grid items-start gap-4 lg:grid-cols-3">
          {/* ---------------- form ---------------- */}
          <form id="recce-form" onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
            {/* Step 1: store photos */}
            <Section
              title="1 · Store photos"
              icon={<Camera className="h-4 w-4" />}
              count={`${initialPreviews.length}/10`}
              subtitle="Optional. Shop front and surroundings, up to 10."
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {initialPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <PhotoTile src={preview} alt={`Store photo ${index + 1}`} aspect="aspect-square" onOpen={() => lightbox.open(initialImages, index)} />
                    <button
                      type="button"
                      onClick={() => removeInitialPhoto(index)}
                      aria-label={`Remove store photo ${index + 1}`}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {initialPhotos.length < 10 && (
                  <label
                    className={cx(
                      "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-xs font-medium transition-colors",
                      s.dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-300 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleInitialPhotoChange} />
                    <ImagePlus className="h-6 w-6" />
                    Add photos
                  </label>
                )}
              </div>
            </Section>

            {/* Step 2: boards */}
            <Section
              title="2 · Boards"
              icon={<Ruler className="h-4 w-4" />}
              count={reccePhotos.length}
              subtitle={`${readyCount} of ${reccePhotos.length} ready to submit`}
              bodyClassName="space-y-4"
            >
              {clientElements.length > 0 ? (
                <p className={`text-xs ${s.muted}`}>
                  Elements for this client:{" "}
                  <span className={s.body}>{clientElements.map((el: any) => el.elementName).join(", ")}</span>
                </p>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  No elements are set up for this client, so a board cannot be submitted. Ask an admin to add elements in Client Management.
                </p>
              )}

              {reccePhotos.map((reccePhoto, index) => {
                const server = store?.recce?.reccePhotos?.[index];
                const status = server?.approvalStatus;
                const rejected = status === "REJECTED";
                const gaps = missing(reccePhoto);
                const w = parseFloat(reccePhoto.width);
                const h = parseFloat(reccePhoto.height);
                const ftW = reccePhoto.unit === "in" ? w / 12 : w;
                const ftH = reccePhoto.unit === "in" ? h / 12 : h;
                return (
                  <article
                    key={index}
                    className={cx(
                      "rounded-xl border",
                      rejected ? (s.dark ? "border-red-800 bg-red-950/30" : "border-red-300 bg-red-50/40") : s.sunken
                    )}
                  >
                    <header className={cx("flex flex-wrap items-center gap-2 border-b px-3 py-2", s.divider)}>
                      <span className={`text-sm font-bold ${s.text}`}>Board {index + 1}</span>
                      {status && <ApprovalBadge status={status} />}
                      {!status && (gaps.length === 0 ? <Badge tone="success" dot>Ready</Badge> : <Badge tone="neutral">Needs {gaps.join(", ")}</Badge>)}
                      <div className="ml-auto flex items-center gap-1">
                        {isAdmin && submitted && (
                          <Btn
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedPhotoIndex(index);
                              setNewStatus("APPROVED");
                              setShowStatusModal(true);
                            }}
                          >
                            Change status
                          </Btn>
                        )}
                        {reccePhotos.length > 1 && !submitted && (
                          <IconBtn label={`Remove board ${index + 1}`} onClick={() => removeReccePhoto(index)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </IconBtn>
                        )}
                      </div>
                    </header>

                    {server?.rejectionReason && (
                      <p className="mx-3 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        <span className="font-semibold">Why it was rejected: </span>
                        {server.rejectionReason}
                      </p>
                    )}

                    <div className="grid gap-4 p-3 md:grid-cols-[minmax(0,240px)_1fr]">
                      {/* photo */}
                      <div>
                        {reccePhoto.preview ? (
                          <div className="space-y-2">
                            <PhotoTile src={reccePhoto.preview} alt={`Board ${index + 1}`} onOpen={() => lightbox.open(boardImages, index)} />
                            <div className="flex gap-2">
                              <label
                                className={cx(
                                  "inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold",
                                  s.dark ? "border-gray-700 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                )}
                              >
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReccePhotoChange(index, e)} />
                                <RefreshCw className="h-3.5 w-3.5" /> Replace
                              </label>
                              <Btn
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => {
                                  const newReccePhotos = [...reccePhotos];
                                  newReccePhotos[index].file = null;
                                  newReccePhotos[index].preview = null;
                                  setReccePhotos(newReccePhotos);
                                }}
                              >
                                Remove
                              </Btn>
                            </div>
                          </div>
                        ) : (
                          <label
                            className={cx(
                              "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors",
                              s.dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-300 text-gray-500 hover:bg-white"
                            )}
                          >
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReccePhotoChange(index, e)} />
                            <Camera className="h-8 w-8" />
                            <span className="text-sm font-semibold">Add board photo</span>
                            <span className="text-xs">Tap to take or choose a photo</span>
                          </label>
                        )}
                      </div>

                      {/* details */}
                      <div className="space-y-3">
                        {clientElements.length > 0 && (
                          <Field label="Element" required>
                            <select
                              value={reccePhoto.elementId}
                              onChange={(e) => {
                                const selectedElement = clientElements.find((el) => el.elementId.toString() === e.target.value);
                                const newReccePhotos = [...reccePhotos];
                                newReccePhotos[index].elementId = e.target.value;
                                newReccePhotos[index].elementName = selectedElement?.elementName || "";
                                setReccePhotos(newReccePhotos);
                              }}
                              className={inputClass}
                            >
                              <option value="">Select an element</option>
                              {clientElements.map((element: any) => (
                                <option key={element.elementId} value={element.elementId.toString()}>
                                  {element.elementName}
                                </option>
                              ))}
                            </select>
                          </Field>
                        )}

                        <div className="grid grid-cols-[1fr_1fr_88px] gap-3">
                          <Field label={`Width (${reccePhoto.unit})`} required error={index === reccePhotos.length - 1 && showValidationError && !reccePhoto.width ? "Required" : undefined}>
                            <input
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              className={cx(inputClass, "font-semibold")}
                              value={reccePhoto.width}
                              onChange={(e) => {
                                updateReccePhoto(index, "width", e.target.value);
                                if (index === reccePhotos.length - 1 && showValidationError) setShowValidationError(false);
                              }}
                              placeholder="0.0"
                            />
                          </Field>
                          <Field label={`Height (${reccePhoto.unit})`} required error={index === reccePhotos.length - 1 && showValidationError && !reccePhoto.height ? "Required" : undefined}>
                            <input
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              className={cx(inputClass, "font-semibold")}
                              value={reccePhoto.height}
                              onChange={(e) => {
                                updateReccePhoto(index, "height", e.target.value);
                                if (index === reccePhotos.length - 1 && showValidationError) setShowValidationError(false);
                              }}
                              placeholder="0.0"
                            />
                          </Field>
                          <Field label="Unit">
                            <select value={reccePhoto.unit} onChange={(e) => updateReccePhoto(index, "unit", e.target.value)} className={inputClass}>
                              <option value="in">in</option>
                              <option value="ft">ft</option>
                            </select>
                          </Field>
                        </div>

                        <div className={cx("flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-sm", s.dark ? "border-gray-800 bg-gray-900" : "border-blue-100 bg-blue-50/60")}>
                          <span className={s.muted}>In feet</span>
                          {reccePhoto.width && reccePhoto.height ? (
                            <>
                              <span className={`font-bold tabular-nums ${s.text}`}>
                                {ftW.toFixed(2)} × {ftH.toFixed(2)} ft
                              </span>
                              <span className={`tabular-nums ${s.muted}`}>{(ftW * ftH).toFixed(2)} sq.ft</span>
                            </>
                          ) : (
                            <span className={s.faint}>Enter width and height</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <Btn variant="secondary" block icon={<Plus className="h-4 w-4" />} onClick={addReccePhoto} className="border-dashed">
                Add another board
              </Btn>
            </Section>

            {/* Step 3: remarks */}
            <Section title="3 · Remarks" icon={<StickyNote className="h-4 w-4" />} subtitle="Optional. Anything the installer should know.">
              <textarea
                className={cx(inputClass, "min-h-[96px]")}
                placeholder="For example: obstruction above the shutter, no power point nearby, landlord permission needed"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Section>
          </form>

          {/* ---------------- store facts ---------------- */}
          <aside className="space-y-4">
            <LocationCard store={store} />
            <ContactCard store={store} />
            <DealerCard store={store} />
            <SpecsCard store={store} />
            <CommercialCard store={store} />
            {!isRecceUser && <CostCard store={store} />}
          </aside>
        </div>
      </div>

      <StickyBar>
        <div className="flex-1 space-y-1.5">
          <p className={`text-sm ${s.body}`}>
            <span className={`font-bold ${s.text}`}>
              {readyCount} of {reccePhotos.length}
            </span>{" "}
            boards ready
            {initialPreviews.length > 0 && <span className={s.muted}> · {initialPreviews.length} store photos</span>}
          </p>
          <ProgressBar total={reccePhotos.length} segments={[{ value: readyCount, tone: readyCount === reccePhotos.length ? "success" : "brand" }]} />
        </div>
        <Btn type="submit" form="recce-form" variant="primary" size="lg" loading={submitting} icon={<CheckCircle2 className="h-5 w-5" />} className="sm:min-w-[220px]">
          {submitted ? "Update recce" : "Submit recce"}
        </Btn>
      </StickyBar>

      {/* Status change (admin) */}
      <Dialog
        open={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedPhotoIndex(null);
          setRejectionReason("");
        }}
        title={`Change status · Board ${selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : ""}`}
        description="The recce user sees a rejected board and its reason, and must re-shoot it."
        footer={
          <>
            <Btn
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedPhotoIndex(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Btn>
            <Btn
              variant={newStatus === "APPROVED" ? "success" : "danger"}
              className="flex-1"
              loading={updatingStatus}
              disabled={newStatus === "REJECTED" && !rejectionReason.trim()}
              onClick={handleStatusChange}
            >
              {newStatus === "APPROVED" ? "Approve board" : "Reject board"}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="New status">
            {(["APPROVED", "REJECTED"] as const).map((opt) => {
              const active = newStatus === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setNewStatus(opt)}
                  className={cx(
                    "flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? opt === "APPROVED"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-red-600 bg-red-50 text-red-800"
                      : s.dark
                      ? "border-gray-700 text-gray-300"
                      : "border-gray-200 text-gray-600"
                  )}
                >
                  {opt === "APPROVED" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {opt === "APPROVED" ? "Approve" : "Reject"}
                </button>
              );
            })}
          </div>
          {newStatus === "REJECTED" && (
            <Field label="Reason for rejection" required hint="Be specific, for example: photo is blurred, width does not match.">
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className={cx(inputClass, "min-h-[96px]")} />
            </Field>
          )}
        </div>
      </Dialog>

      {lightbox.node}
    </div>
  );
}
