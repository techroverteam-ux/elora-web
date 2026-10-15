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
  const [installationPhotos, setInstallationPhotos] = useState<{ [key: number]: File | null }>({});
  const [previews, setPreviews] = useState<{ [key: number]: string | null }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 10;

  const isInstallationRole = user?.roles?.some(r => r.name === "INSTALLATION");

  useEffect(() => {
    if (!id) return;

    const fetchStore = async () => {
      try {
        const { data } = await api.get(`/stores/${id}`);
        const s = data.store;
        setStore(s);

        if (s.installation?.photos) {
          const newPreviews: { [key: number]: string | null } = {};
          s.installation.photos.forEach((p: any) => {
            newPreviews[p.reccePhotoIndex] = getFullImageUrl(p.installationPhoto);
          });
          setPreviews(newPreviews);
        }
      } catch (error) {
        toast.error("Failed to load store details");
      } finally {
        setLoading(false);
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

    const approvedReccePhotos = (store?.recce?.reccePhotos || [])
      .map((p: any, originalIndex: number) => ({ ...p, originalIndex }))
      .filter((p: any) => p.approvalStatus === "APPROVED");
    const approvedCount = approvedReccePhotos.length;
    
    if (approvedCount === 0) {
      return toast.error("No approved recce photos found");
    }

    const uploadedCount = Object.keys(installationPhotos).length + Object.keys(previews).filter(k => previews[parseInt(k)] && !installationPhotos[parseInt(k)]).length;

    if (uploadedCount < approvedCount) {
      return toast.error(`Please upload installation photos for all ${approvedCount} approved recce photos`);
    }

    setSubmitting(true);
    const formData = new FormData();

    const photosData: Array<{ reccePhotoIndex: number }> = [];
    let fileIndex = 0;

    approvedReccePhotos.forEach((reccePhoto: any) => {
      const originalIndex = reccePhoto.originalIndex;
      if (installationPhotos[originalIndex]) {
        formData.append(`installationPhoto${fileIndex}`, installationPhotos[originalIndex]!);
        photosData.push({ reccePhotoIndex: originalIndex });
        fileIndex++;
      }
    });

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

  if (loading) return <DetailSkeleton />;
  if (!store)
    return <NotFound title="Store not found" hint="It may have been deleted, or the link is wrong." backHref="/installation" backLabel="Back to installation" />;

  /* ---------------- derived display state ---------------- */
  const approvedBoards = (store.recce?.reccePhotos || [])
    .map((p: any, originalIndex: number) => ({ ...p, originalIndex }))
    .filter((p: any) => p.approvalStatus === "APPROVED");
  const approvedTotal = approvedBoards.length;
  const doneCount = approvedBoards.filter((b: any) => !!previews[b.originalIndex]).length;
  const totalPages = Math.ceil(approvedTotal / photosPerPage);
  const submitted = !!store.installation?.submittedDate;
  const initialPhotos = store.recce?.initialPhotos || [];
  const initialImages = initialPhotos.map((p, i) => ({ src: getFullImageUrl(p), caption: `Store photo ${i + 1}` }));
  const recceImages = approvedBoards.map((b: any) => ({ src: b.photo ? getFullImageUrl(b.photo) : "", caption: `Board ${b.originalIndex + 1} · before` }));
  const afterImages = approvedBoards.map((b: any) => ({ src: previews[b.originalIndex] || "", caption: `Board ${b.originalIndex + 1} · installed` }));
  // Lightbox drops empty slots, so work out each board's position among the photos that exist.
  const posIn = (list: Array<{ src: string }>, i: number) => list.slice(0, i).filter((x) => !!x.src).length;

  const banner = submitted
    ? { tone: "success" as const, title: `Installation submitted ${formatDate(store.installation?.submittedDate)}`, body: "Photos are uploaded. You can replace a photo and submit again if needed." }
    : approvedTotal === 0
    ? { tone: "warning" as const, title: "No approved boards yet", body: "Boards appear here once the recce is approved. Check with the admin." }
    : doneCount === approvedTotal
    ? { tone: "success" as const, title: "All photos added", body: "Press Complete installation to submit." }
    : { tone: "brand" as const, title: `Add an installed photo for each board (${doneCount} of ${approvedTotal} done)`, body: "Match each photo to the recce photo on its left so the admin can compare before and after." };

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
          !isInstallationRole ? (
            <Btn variant="secondary" icon={<StoreIcon className="h-4 w-4" />} onClick={() => router.push(`/store/${id}`)}>
              <span className="hidden sm:inline">Store details</span>
            </Btn>
          ) : undefined
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
                  subtitle="Before (recce) on the left, your installed photo on the right"
                  bodyClassName="space-y-4"
                >
                  {approvedTotal === 0 && <EmptyBlock icon={<Hammer className="h-8 w-8" />} title="No approved boards" hint="Only boards approved in the recce review need an installed photo." />}

                  {approvedBoards.slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage).map((reccePhoto: any, sliceIdx: number) => {
                    const originalIndex = reccePhoto.originalIndex;
                    const listIdx = (currentPage - 1) * photosPerPage + sliceIdx;
                    const done = !!previews[originalIndex];
                    const ft = toFeet(reccePhoto.measurements);
                    return (
                      <article key={originalIndex} className={cx("rounded-xl border", done ? (s.dark ? "border-emerald-900 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50/30") : s.sunken)}>
                        <header className={cx("flex flex-wrap items-center gap-2 border-b px-3 py-2", s.divider)}>
                          <span className={`text-sm font-bold ${s.text}`}>Board {originalIndex + 1}</span>
                          {done ? <Badge tone="success" dot>Photo added</Badge> : <Badge tone="neutral">Needs photo</Badge>}
                          <span className={`ml-auto text-xs tabular-nums ${s.muted}`}>
                            {reccePhoto.measurements.width} × {reccePhoto.measurements.height} {reccePhoto.measurements.unit} · {ft.width.toFixed(2)} × {ft.height.toFixed(2)} ft · {sqft(reccePhoto.measurements).toFixed(1)} sq.ft
                          </span>
                        </header>
                        <div className="grid grid-cols-2 gap-3 p-3">
                          <div>
                            <p className={`mb-1 text-xs font-semibold ${s.muted}`}>Before (recce)</p>
                            <PhotoTile
                              src={reccePhoto.photo ? getFullImageUrl(reccePhoto.photo) : ""}
                              alt={`Board ${originalIndex + 1} recce`}
                              onOpen={() => lightbox.open(recceImages, posIn(recceImages, listIdx))}
                              empty={
                                <>
                                  <Building2 className="h-7 w-7 text-blue-400" />
                                  <span className="font-medium">Direct installation</span>
                                  <span>Measurements only</span>
                                </>
                              }
                            />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-emerald-600">After (installed)</p>
                            {previews[originalIndex] ? (
                              <div className="space-y-2">
                                <PhotoTile src={previews[originalIndex]!} alt={`Board ${originalIndex + 1} installed`} onOpen={() => lightbox.open(afterImages, posIn(afterImages, listIdx))} />
                                <label
                                  className={cx(
                                    "inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold",
                                    s.dark ? "border-gray-700 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                  )}
                                >
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, originalIndex)} />
                                  <RefreshCw className="h-3.5 w-3.5" /> Replace photo
                                </label>
                              </div>
                            ) : (
                              <label
                                className={cx(
                                  "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors",
                                  s.dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-300 text-gray-500 hover:bg-white"
                                )}
                              >
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, originalIndex)} />
                                <Camera className="h-8 w-8" />
                                <span className="text-sm font-semibold">Add installed photo</span>
                                <span className="text-xs">Same angle as the recce photo</span>
                              </label>
                            )}
                          </div>
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
              installed photos added
            </p>
            <ProgressBar total={approvedTotal || 1} segments={[{ value: doneCount, tone: doneCount === approvedTotal && approvedTotal > 0 ? "success" : "brand" }]} />
          </div>
          <Btn type="submit" form="installation-form" variant="success" size="lg" loading={submitting} icon={<CheckCircle2 className="h-5 w-5" />} className="sm:min-w-[240px]">
            Complete installation
          </Btn>
        </StickyBar>
      )}

      {lightbox.node}
    </div>
  );
}
