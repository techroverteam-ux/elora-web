"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import { Camera, CheckCircle2, Building2, Image as ImageIcon, Info, Layers, RefreshCw, Hammer, Store as StoreIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/context/AuthContext";
import { useImageService } from "@/src/hooks/useImageService";
import {
  Badge,
  Btn,
  CopyText,
  DetailHeader,
  DetailSkeleton,
  EmptyBlock,
  NextStep,
  NotFound,
  PhotoTile,
  ProgressBar,
  Section,
  StatusBadge,
  StickyBar,
  Stepper,
  StoreFacts,
  WorkHistoryCard,
  RecceBoardsSection,
  INSTALL_PHOTO_LABEL,
  INSTALL_PHOTO_TYPES,
  InstallPhotoType,
  installPhotosByType,
  ReportDownloadMenu,
  buildSteps,
  cx,
  formatDate,
  toFeet,
  sqft,
  useLightbox,
  useSurface,
} from "@/src/components/detail";

export default function InstallationSubmissionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const id = params?.id as string;

  const { getFullImageUrl } = useImageService();
  const s = useSurface();
  const lightbox = useLightbox();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // New photos picked on this page, keyed "<board index>:<before|after|closeup>".
  const [newFiles, setNewFiles] = useState<Record<string, File>>({});
  const [newPreviews, setNewPreviews] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 10;

  const isInstallationRole = user?.roles?.some(r => r.name === "INSTALLATION");
  // Same rule as the Installation list, which shows report downloads to admins only.
  const isAdmin = !!user?.roles?.some((r: any) => r?.code === "SUPER_ADMIN" || r?.code === "ADMIN");

  useEffect(() => {
    if (!id) return;

    const fetchStore = async () => {
      try {
        const { data } = await api.get(`/stores/${id}`);
        const s = data.store;
        setStore(s);
      } catch (error) {
        toast.error("Failed to load store details");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  const keyOf = (index: number, type: InstallPhotoType) => `${index}:${type}`;

  /** Photo already saved on the server for this board + type. */
  const savedUrl = (index: number, type: InstallPhotoType) => {
    const p = installPhotosByType(store?.installation?.photos as any, index)[type];
    return p ? getFullImageUrl(p.installationPhoto) : "";
  };
  const slotSrc = (index: number, type: InstallPhotoType) => newPreviews[keyOf(index, type)] || savedUrl(index, type);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, type: InstallPhotoType) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const k = keyOf(index, type);
    setNewFiles((prev) => ({ ...prev, [k]: file }));
    setNewPreviews((prev) => {
      if (prev[k]) URL.revokeObjectURL(prev[k]);
      return { ...prev, [k]: URL.createObjectURL(file) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const approvedReccePhotos = (store?.recce?.reccePhotos || [])
      .map((p: any, originalIndex: number) => ({ ...p, originalIndex }))
      .filter((p: any) => p.approvalStatus === "APPROVED");

    if (approvedReccePhotos.length === 0) {
      return toast.error("No approved recce photos found");
    }

    // Same rule as the mobile app: every approved board needs a Before and an After photo.
    const missing = approvedReccePhotos
      .map((b: any) => {
        const need = [!slotSrc(b.originalIndex, "before") && "Before", !slotSrc(b.originalIndex, "after") && "After"].filter(Boolean);
        return need.length ? `Board ${b.originalIndex + 1}: ${need.join(" & ")}` : null;
      })
      .filter(Boolean);
    if (missing.length) {
      return toast.error(`Each board needs a Before and an After photo. Missing: ${missing.slice(0, 3).join("; ")}${missing.length > 3 ? ` and ${missing.length - 3} more` : ""}`);
    }

    const formData = new FormData();
    const photosData: Array<{ reccePhotoIndex: number; photoType: InstallPhotoType }> = [];
    let fileIndex = 0;
    approvedReccePhotos.forEach((b: any) => {
      INSTALL_PHOTO_TYPES.forEach((type) => {
        const file = newFiles[keyOf(b.originalIndex, type)];
        if (!file) return;
        formData.append(`installationPhoto${fileIndex}`, file);
        photosData.push({ reccePhotoIndex: b.originalIndex, photoType: type });
        fileIndex++;
      });
    });
    const alreadySubmitted = !!store?.installation?.submittedDate;
    // Already submitted and nothing replaced: nothing to save (the button is disabled in this case too).
    if (fileIndex === 0 && alreadySubmitted) return;
    // Not submitted yet but every photo is already on the server: submit with no new files.
    // The API keeps the saved photos and marks the installation as submitted.
    formData.append("installationPhotosData", JSON.stringify(photosData));

    setSubmitting(true);
    try {
      await api.post(`/stores/${id}/installation`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(alreadySubmitted ? "Installation photos updated" : "Installation marked as complete!");
      router.push("/installation");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!store)
    return <NotFound title="Store not found" hint="It may have been deleted, or the link is wrong." backHref="/installation" backLabel="Back to installation" />;

  /* ---------------- derived display state ---------------- */
  const approvedBoards = (store.recce?.reccePhotos || [])
    .map((p: any, originalIndex: number) => ({ ...p, originalIndex }))
    .filter((p: any) => p.approvalStatus === "APPROVED");
  const approvedTotal = approvedBoards.length;
  const doneCount = approvedBoards.filter((b: any) => !!slotSrc(b.originalIndex, "before") && !!slotSrc(b.originalIndex, "after")).length;
  const newCount = Object.keys(newFiles).length;
  const totalPages = Math.ceil(approvedTotal / photosPerPage);
  const submitted = !!store.installation?.submittedDate;
  const initialPhotos = store.recce?.initialPhotos || [];
  const initialImages = initialPhotos.map((p, i) => ({ src: getFullImageUrl(p), caption: `Store photo ${i + 1}` }));

  const banner = submitted
    ? { tone: "success" as const, title: `Installation submitted ${formatDate(store.installation?.submittedDate)}`, body: "Photos are uploaded. You can replace any photo and submit again; the other photos stay as they are." }
    : approvedTotal === 0
    ? { tone: "warning" as const, title: "No approved boards yet", body: "Boards appear here once the recce is approved. Check with the admin." }
    : doneCount === approvedTotal
    ? { tone: "success" as const, title: "All photos added", body: "Press Complete installation to submit." }
    : { tone: "brand" as const, title: `Add Before and After photos for each board (${doneCount} of ${approvedTotal} ready)`, body: "Before: the spot as you find it. After: the installed board from the same angle as the recce photo. Close-up is optional." };

  return (
    <div className="mx-auto max-w-7xl pb-32">
      <DetailHeader
        backHref="/installation"
        eyebrow="Installation"
        title={store.storeName}
        meta={
          <>
            <CopyText value={store.storeId || store.dealerCode} />
            <StatusBadge status={store.currentStatus} />
            {store.location?.city && <span>{[store.location.city, store.location.state].filter(Boolean).join(", ")}</span>}
          </>
        }
        actions={
          <>
            {isAdmin && (
              <ReportDownloadMenu
                storeId={store._id}
                dealerCode={store.dealerCode}
                types={store.recce?.submittedDate ? ["installation", "recce"] : ["installation"]}
                notes={submitted ? undefined : { installation: "Installed photos are not submitted yet, so the report shows recce boards only." }}
              />
            )}
            {!isInstallationRole && (
              <Btn variant="secondary" icon={<StoreIcon className="h-4 w-4" />} onClick={() => router.push(`/store/${id}`)}>
                <span className="hidden sm:inline">Store details</span>
              </Btn>
            )}
          </>
        }
      />

      <div className="space-y-4">
        <NextStep tone={banner.tone} title={banner.title} icon={<Info className="h-5 w-5" />}>
          {banner.body}
        </NextStep>

        <Section title="Progress" icon={<Layers className="h-4 w-4" />} collapsible subtitle="Where this store is in the workflow">
          <Stepper steps={buildSteps(store)} />
        </Section>

        <WorkHistoryCard store={store} />

        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {store.recce?.reccePhotos && store.recce.reccePhotos.length > 0 ? (
              <form id="installation-form" onSubmit={handleSubmit}>
                <Section
                  title="Boards to install"
                  icon={<Hammer className="h-4 w-4" />}
                  count={approvedTotal}
                  subtitle="Recce photo, then Before and After from the site (Close-up optional), like the mobile app"
                  bodyClassName="space-y-4"
                >
                  {approvedTotal === 0 && <EmptyBlock icon={<Hammer className="h-8 w-8" />} title="No approved boards" hint="Only boards approved in the recce review need an installed photo." />}

                  {approvedBoards.slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage).map((reccePhoto: any) => {
                    const originalIndex = reccePhoto.originalIndex;
                    const hasBefore = !!slotSrc(originalIndex, "before");
                    const hasAfter = !!slotSrc(originalIndex, "after");
                    const done = hasBefore && hasAfter;
                    const ft = toFeet(reccePhoto.measurements);
                    const recceSrc = reccePhoto.photo ? getFullImageUrl(reccePhoto.photo) : "";
                    const boardImages = [
                      { src: recceSrc, caption: `Board ${originalIndex + 1} · Recce` },
                      ...INSTALL_PHOTO_TYPES.map((t) => ({ src: slotSrc(originalIndex, t), caption: `Board ${originalIndex + 1} · ${INSTALL_PHOTO_LABEL[t]}` })),
                    ].filter((im) => !!im.src);
                    const openAt = (src: string) => lightbox.open(boardImages, Math.max(0, boardImages.findIndex((im) => im.src === src)));
                    const slot = (type: InstallPhotoType) => {
                      const src = slotSrc(originalIndex, type);
                      const isNew = !!newPreviews[keyOf(originalIndex, type)];
                      const required = type !== "closeup";
                      const tone = type === "before" ? "text-amber-600" : type === "after" ? "text-emerald-600" : "text-blue-600";
                      return (
                        <div key={type}>
                          <p className={cx("mb-1 flex items-center gap-1 text-xs font-semibold", tone)}>
                            {INSTALL_PHOTO_LABEL[type]}
                            {!required && <span className={cx("font-normal", s.faint)}>(optional)</span>}
                            {isNew && <span className={cx("ml-auto font-normal", s.muted)}>new</span>}
                          </p>
                          {src ? (
                            <div className="space-y-2">
                              <PhotoTile src={src} alt={`Board ${originalIndex + 1} ${INSTALL_PHOTO_LABEL[type]}`} onOpen={() => openAt(src)} />
                              <label
                                className={cx(
                                  "inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold",
                                  s.dark ? "border-gray-700 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                )}
                              >
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, originalIndex, type)} />
                                <RefreshCw className="h-3.5 w-3.5" /> Replace
                              </label>
                            </div>
                          ) : (
                            <label
                              className={cx(
                                "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-2 text-center transition-colors",
                                required
                                  ? s.dark
                                    ? "border-yellow-600/60 text-gray-300 hover:bg-gray-800"
                                    : "border-yellow-400 bg-yellow-50/40 text-gray-600 hover:bg-yellow-50"
                                  : s.dark
                                  ? "border-gray-700 text-gray-400 hover:bg-gray-800"
                                  : "border-gray-300 text-gray-500 hover:bg-white"
                              )}
                            >
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, originalIndex, type)} />
                              <Camera className="h-6 w-6" />
                              <span className="text-xs font-semibold">Add {INSTALL_PHOTO_LABEL[type].toLowerCase()}</span>
                              <span className="text-[11px] opacity-80">{required ? "Required" : "Optional"}</span>
                            </label>
                          )}
                        </div>
                      );
                    };
                    return (
                      <article key={originalIndex} className={cx("rounded-xl border", done ? (s.dark ? "border-emerald-900 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50/30") : s.sunken)}>
                        <header className={cx("flex flex-wrap items-center gap-2 border-b px-3 py-2", s.divider)}>
                          <span className={`text-sm font-bold ${s.text}`}>Board {originalIndex + 1}</span>
                          {done ? (
                            <Badge tone="success" dot>Ready</Badge>
                          ) : (
                            <Badge tone="neutral">Needs {[!hasBefore && "before", !hasAfter && "after"].filter(Boolean).join(" & ")}</Badge>
                          )}
                          <span className={`ml-auto text-xs tabular-nums ${s.muted}`}>
                            {reccePhoto.measurements.width} × {reccePhoto.measurements.height} {reccePhoto.measurements.unit} · {ft.width.toFixed(2)} × {ft.height.toFixed(2)} ft · {sqft(reccePhoto.measurements).toFixed(1)} sq.ft
                          </span>
                        </header>
                        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
                          <div>
                            <p className={`mb-1 text-xs font-semibold ${s.muted}`}>Recce</p>
                            <PhotoTile
                              src={recceSrc}
                              alt={`Board ${originalIndex + 1} recce`}
                              onOpen={() => openAt(recceSrc)}
                              empty={
                                <>
                                  <Building2 className="h-7 w-7 text-blue-400" />
                                  <span className="font-medium">Direct installation</span>
                                  <span>Measurements only</span>
                                </>
                              }
                            />
                          </div>
                          {INSTALL_PHOTO_TYPES.map((type) => slot(type))}
                        </div>
                        {reccePhoto.elements && reccePhoto.elements.length > 0 && (
                          <div className="flex flex-wrap gap-2 px-3 pb-3">
                            {reccePhoto.elements.map((el: any, i: number) => (
                              <Badge key={i} tone="brand">
                                {el.elementName} × {el.quantity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}

                  {approvedTotal > photosPerPage && (
                    <div className={cx("flex items-center justify-between border-t pt-4", s.divider)}>
                      <Btn variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                        Previous
                      </Btn>
                      <span className={`text-sm ${s.muted}`}>
                        Boards {(currentPage - 1) * photosPerPage + 1}–{Math.min(currentPage * photosPerPage, approvedTotal)} of {approvedTotal}
                      </span>
                      <Btn variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                        Next
                      </Btn>
                    </div>
                  )}
                </Section>
              </form>
            ) : (
              <Section title="Boards to install" icon={<Hammer className="h-4 w-4" />}>
                <EmptyBlock icon={<Hammer className="h-8 w-8" />} title="No recce boards on this store" hint="Boards appear once a recce is submitted and approved." />
              </Section>
            )}

            <RecceBoardsSection
              store={store}
              getUrl={getFullImageUrl}
              onOpen={(imgs, i) => lightbox.open(imgs, i)}
              title="All recce boards"
              collapsible
            />

            {initialPhotos.length > 0 && (
              <Section title="Store photos" icon={<ImageIcon className="h-4 w-4" />} count={initialPhotos.length} subtitle="Taken by the recce user on arrival" collapsible>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {initialImages.map((img, idx) => (
                    <PhotoTile key={idx} src={img.src} alt={img.caption} aspect="aspect-square" onOpen={() => lightbox.open(initialImages, idx)} />
                  ))}
                </div>
              </Section>
            )}

            {store.recce?.notes && (
              <Section title="Recce remarks" icon={<Info className="h-4 w-4" />}>
                <p className={`whitespace-pre-line text-sm ${s.body}`}>{store.recce.notes}</p>
              </Section>
            )}
          </div>

          <aside>
            <StoreFacts store={store} showMoney={!isInstallationRole} />
          </aside>
        </div>
      </div>

      {store.recce?.reccePhotos && store.recce.reccePhotos.length > 0 && (
        <StickyBar>
          <div className="flex-1 space-y-1.5">
            <p className={`text-sm ${s.body}`}>
              <span className={`font-bold ${s.text}`}>
                {doneCount} of {approvedTotal}
              </span>{" "}
              boards ready
              {submitted
                ? newCount > 0
                  ? ` · ${newCount} replaced photo${newCount > 1 ? "s" : ""} to save`
                  : ` · submitted ${formatDate(store.installation?.submittedDate)}. Replace a photo to update it.`
                : newCount > 0
                ? ` · ${newCount} new photo${newCount > 1 ? "s" : ""} to send`
                : ""}
            </p>
            <ProgressBar total={approvedTotal || 1} segments={[{ value: doneCount, tone: doneCount === approvedTotal && approvedTotal > 0 ? "success" : "brand" }]} />
          </div>
          <Btn
            type="submit"
            form="installation-form"
            variant="success"
            size="lg"
            loading={submitting}
            disabled={submitting || (submitted && newCount === 0)}
            icon={<CheckCircle2 className="h-5 w-5" />}
            className="sm:min-w-[240px]"
          >
            {submitted ? "Save changes" : "Complete installation"}
          </Btn>
        </StickyBar>
      )}

      {lightbox.node}
    </div>
  );
}
