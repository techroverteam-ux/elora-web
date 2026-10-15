"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import { useImageService } from "@/src/hooks/useImageService";
import { CheckCircle2, XCircle, Loader2, CheckSquare, PauseCircle, Building2, Store as StoreIcon, Info } from "lucide-react";
import toast from "react-hot-toast";
import {
  ApprovalBadge,
  Badge,
  Btn,
  CopyText,
  DetailHeader,
  DetailSkeleton,
  Dialog,
  EmptyBlock,
  Field,
  NotFound,
  PhotoTile,
  ProgressBar,
  Section,
  StatTiles,
  StatusBadge,
  cx,
  formatDate,
  toFeet,
  sqft,
  useInputClass,
  useLightbox,
  useSurface,
} from "@/src/components/detail";

export default function RecceReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { getFullImageUrl } = useImageService();
  const s = useSurface();
  const inputClass = useInputClass();
  const lightbox = useLightbox();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [rejectPhotoIndex, setRejectPhotoIndex] = useState<number | null>(null);
  const [holdPhotoIndex, setHoldPhotoIndex] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [approveAllConfirmOpen, setApproveAllConfirmOpen] = useState(false);
  const [heldPhotos, setHeldPhotos] = useState<Record<number, string>>({});
  const [activeFilter, setActiveFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "HOLD" | "ALL">("ALL");

  // Load held photos from localStorage on mount
  useEffect(() => {
    if (!id) return;
    try {
      const stored = localStorage.getItem(`held_photos_${id}`);
      if (stored) setHeldPhotos(JSON.parse(stored));
    } catch {}
  }, [id]);

  const saveHeldPhotos = (updated: Record<number, string>) => {
    setHeldPhotos(updated);
    try {
      localStorage.setItem(`held_photos_${id}`, JSON.stringify(updated));
    } catch {}
  };;

  useEffect(() => {
    if (!id) return;
    fetchStore(true);
  }, [id]);

  const fetchStore = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const { data } = await api.get(`/stores/${id}`);
      if (data?.store) {
        setStore(data.store);
      }
    } catch (error) {
      toast.error("Failed to load store details");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleApprovePhoto = async (photoIndex: number) => {
    setProcessing(true);
    try {
      const { data } = await api.post(`/stores/${id}/recce/photos/${photoIndex}/review`, {
        status: "APPROVED",
      });
      // Remove from held if it was held
      if (heldPhotos[photoIndex] !== undefined) {
        const updated = { ...heldPhotos };
        delete updated[photoIndex];
        saveHeldPhotos(updated);
      }
      if (data?.store) {
        setStore(data.store);
      } else {
        await fetchStore(false);
      }
      toast.success(`Photo ${photoIndex + 1} approved`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve photo");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPhoto = async () => {
    if (rejectPhotoIndex === null) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const { data } = await api.post(`/stores/${id}/recce/photos/${rejectPhotoIndex}/review`, {
        status: "REJECTED",
        rejectionReason,
      });
      // Remove from held if it was held
      if (heldPhotos[rejectPhotoIndex] !== undefined) {
        const updated = { ...heldPhotos };
        delete updated[rejectPhotoIndex];
        saveHeldPhotos(updated);
      }
      setShowRejectModal(false);
      setRejectPhotoIndex(null);
      setRejectionReason("");
      if (data?.store) {
        setStore(data.store);
      } else {
        await fetchStore(false);
      }
      toast.success(`Photo ${rejectPhotoIndex + 1} rejected`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject photo");
    } finally {
      setProcessing(false);
    }
  };

  const handleHoldPhoto = () => {
    if (holdPhotoIndex === null) return;
    const updated = { ...heldPhotos, [holdPhotoIndex]: holdReason.trim() || "On hold" };
    saveHeldPhotos(updated);
    toast.success(`Photo ${holdPhotoIndex + 1} put on hold`);
    setShowHoldModal(false);
    setHoldPhotoIndex(null);
    setHoldReason("");
  };

  const handleApproveAll = () => {
    // Opens the confirm dialog; confirmApproveAll does the work.
    if (approveAllConfirmOpen) return;
    setApproveAllConfirmOpen(true);
  };

  const confirmApproveAll = async () => {
    setProcessing(true);
    try {
      // Approve all recce photos together via review endpoint
      const { data } = await api.post(`/stores/${id}/recce/review`, {
        status: "APPROVED",
      });
      saveHeldPhotos({});
      if (data?.store) {
        setStore(data.store);
      } else {
        await fetchStore(false);
      }
      toast.success("All photos approved");
    } catch (error: any) {
      // Fallback: try /approve-all route
      try {
        const { data: fallbackData } = await api.post(`/stores/${id}/recce/approve-all`);
        saveHeldPhotos({});
        if (fallbackData?.store) {
          setStore(fallbackData.store);
        } else {
          await fetchStore(false);
        }
        toast.success("All photos approved");
      } catch (fallbackError: any) {
        toast.error(fallbackError.response?.data?.message || error.response?.data?.message || "Failed to approve all");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!store || !store.recce?.reccePhotos) {
    return (
      <NotFound
        title="No recce to review"
        hint="This store has no submitted recce yet."
        backHref={store ? `/store/${id}` : "/recce"}
        backLabel={store ? "Open store" : "Back to recce"}
      />
    );
  }

  const approved = store.recce.reccePhotos.filter(
    (photo: any) => photo.approvalStatus === "APPROVED"
  ).length;
  const rejected = store.recce.reccePhotos.filter(
    (photo: any) => photo.approvalStatus === "REJECTED"
  ).length;
  const onHold = Object.keys(heldPhotos).length;
  const pending = store.recce.reccePhotos.filter(
    (photo: any, idx: number) => !heldPhotos[idx] && (!photo.approvalStatus || photo.approvalStatus === "PENDING")
  ).length;

  const getEffectiveStatus = (photo: any, index: number) => {
    if (heldPhotos[index] && (!photo.approvalStatus || photo.approvalStatus === "PENDING")) {
      return "HOLD";
    }
    return photo.approvalStatus || "PENDING";
  };


  const total = store.recce.reccePhotos.length;
  const reviewed = approved + rejected;
  const allImages = store.recce.reccePhotos.map((p: any, i: number) => ({ src: p.photo ? getFullImageUrl(p.photo) : "", caption: `Board ${i + 1}` }));
  // Lightbox skips boards without a photo, so map board index to its position in the photo list.
  const photoPos: Record<number, number> = {};
  let pos = 0;
  allImages.forEach((im, i) => {
    if (im.src) photoPos[i] = pos++;
  });

  const matchesFilter = (photo: any, index: number) => {
    const status = getEffectiveStatus(photo, index);
    if (activeFilter === "ALL") return true;
    if (activeFilter === "PENDING") return !status || status === "PENDING";
    return status === activeFilter;
  };
  const hasAny = store.recce.reccePhotos.some((photo: any, idx: number) => matchesFilter(photo, idx));

  const filterLabel: Record<string, string> = { ALL: "", PENDING: "pending", APPROVED: "approved", REJECTED: "rejected", HOLD: "on hold" };

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <DetailHeader
        backHref="/recce"
        eyebrow="Recce review"
        title={store.storeName}
        meta={
          <>
            <CopyText value={store.storeId || store.dealerCode} />
            <StatusBadge status={store.currentStatus} />
            {store.recce.submittedDate && <span>Submitted {formatDate(store.recce.submittedDate)}</span>}
            {store.workflow?.recceAssignedTo?.name && <span>by {store.workflow.recceAssignedTo.name}</span>}
          </>
        }
        actions={
          <Btn variant="secondary" icon={<StoreIcon className="h-4 w-4" />} onClick={() => router.push(`/store/${id}`)}>
            <span className="hidden sm:inline">Store details</span>
          </Btn>
        }
      />

      <div className="space-y-4">
        <Section
          title={
            <span>
              {reviewed} of {total} boards reviewed
            </span>
          }
          icon={<CheckSquare className="h-4 w-4" />}
          action={
            pending > 0 ? (
              <Btn variant="success" size="sm" icon={<CheckSquare className="h-4 w-4" />} disabled={processing} onClick={handleApproveAll}>
                Approve {pending} remaining
              </Btn>
            ) : undefined
          }
          bodyClassName="space-y-4"
        >
          <ProgressBar
            total={total}
            height="h-2.5"
            segments={[
              { value: approved, tone: "success", label: "Approved" },
              { value: rejected, tone: "danger", label: "Rejected" },
              { value: onHold, tone: "warning", label: "On hold" },
            ]}
          />
          <StatTiles
            active={activeFilter}
            onSelect={(k) => setActiveFilter(k as typeof activeFilter)}
            items={[
              { key: "ALL", label: "All boards", value: total, tone: "neutral" },
              { key: "PENDING", label: "To review", value: pending, tone: "brand" },
              { key: "APPROVED", label: "Approved", value: approved, tone: "success" },
              { key: "REJECTED", label: "Rejected", value: rejected, tone: "danger" },
              { key: "HOLD", label: "On hold", value: onHold, tone: "warning" },
            ]}
          />
          {onHold > 0 && (
            <p className={cx("flex items-start gap-2 text-xs", s.muted)}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              On-hold marks are saved in this browser only. Other admins and the recce user do not see them.
            </p>
          )}
        </Section>

        {!hasAny ? (
          <EmptyBlock
            title={`No ${filterLabel[activeFilter]} boards`}
            hint="Pick another filter above to see the rest."
            action={
              <Btn size="sm" variant="secondary" onClick={() => setActiveFilter("ALL")}>
                Show all boards
              </Btn>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {store.recce.reccePhotos.map((photo: any, index: number) => {
              if (!matchesFilter(photo, index)) return null;
              const status = getEffectiveStatus(photo, index);
              const ft = toFeet(photo.measurements);
              const canAct = !status || status === "PENDING" || status === "HOLD";
              return (
                <article
                  key={index}
                  className={cx(
                    "flex flex-col overflow-hidden rounded-xl border",
                    s.card,
                    status === "REJECTED" && (s.dark ? "border-red-800" : "border-red-300"),
                    status === "APPROVED" && (s.dark ? "border-emerald-900" : "border-emerald-200")
                  )}
                >
                  <PhotoTile
                    src={photo.photo ? getFullImageUrl(photo.photo) : ""}
                    alt={`Board ${index + 1}`}
                    onOpen={() => lightbox.open(allImages, photoPos[index] ?? 0)}
                    className="rounded-none border-0"
                    empty={
                      <>
                        <Building2 className="h-7 w-7 text-blue-400" />
                        <span className="font-medium">Direct installation</span>
                        <span>No photo</span>
                      </>
                    }
                    overlay={
                      <>
                        <Badge tone="neutral" className="shadow-sm">Board {index + 1}</Badge>
                        <ApprovalBadge status={status} className="shadow-sm" />
                      </>
                    }
                  />
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <div>
                        <dt className={`text-xs ${s.muted}`}>Measured</dt>
                        <dd className={`font-semibold tabular-nums ${s.text}`}>
                          {photo.measurements.width} × {photo.measurements.height} {photo.measurements.unit}
                        </dd>
                      </div>
                      <div>
                        <dt className={`text-xs ${s.muted}`}>In feet</dt>
                        <dd className={`font-semibold tabular-nums ${s.text}`}>
                          {ft.width.toFixed(2)} × {ft.height.toFixed(2)} · {sqft(photo.measurements).toFixed(1)} sq.ft
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className={`text-xs ${s.muted}`}>Element</dt>
                        <dd className={cx("font-semibold", photo.elements?.[0] ? s.text : s.faint)}>{photo.elements?.[0]?.elementName || "Not set"}</dd>
                      </div>
                    </dl>

                    {photo.rejectionReason && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        <span className="font-semibold">Rejected: </span>
                        {photo.rejectionReason}
                      </p>
                    )}
                    {heldPhotos[index] && (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        <span className="font-semibold">On hold: </span>
                        {heldPhotos[index]}
                      </p>
                    )}

                    {canAct && (
                      <div className="mt-auto grid grid-cols-3 gap-2 pt-1">
                        <Btn variant="success" className="col-span-3" disabled={processing} icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => handleApprovePhoto(index)}>
                          Approve
                        </Btn>
                        {status !== "HOLD" && (
                          <Btn
                            variant="warning"
                            disabled={processing}
                            icon={<PauseCircle className="h-4 w-4" />}
                            onClick={() => {
                              setHoldPhotoIndex(index);
                              setShowHoldModal(true);
                            }}
                          >
                            Hold
                          </Btn>
                        )}
                        <Btn
                          variant="secondary"
                          className={cx("text-red-700", status === "HOLD" ? "col-span-3" : "col-span-2")}
                          disabled={processing}
                          icon={<XCircle className="h-4 w-4" />}
                          onClick={() => {
                            setRejectPhotoIndex(index);
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </Btn>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject */}
      <Dialog
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectPhotoIndex(null);
          setRejectionReason("");
        }}
        icon={<XCircle className="h-5 w-5 text-red-600" />}
        title={`Reject board ${rejectPhotoIndex !== null ? rejectPhotoIndex + 1 : ""}`}
        description="The recce user will see this reason and must re-shoot the board."
        footer={
          <>
            <Btn
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowRejectModal(false);
                setRejectPhotoIndex(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Btn>
            <Btn variant="danger" className="flex-1" loading={processing} disabled={!rejectionReason.trim()} icon={<XCircle className="h-4 w-4" />} onClick={handleRejectPhoto}>
              Reject board
            </Btn>
          </>
        }
      >
        <Field label="Reason" required hint="Be specific, for example: photo is blurred, board edges cut off.">
          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className={cx(inputClass, "min-h-[100px] resize-none")} />
        </Field>
      </Dialog>

      {/* Hold */}
      <Dialog
        open={showHoldModal}
        onClose={() => {
          setShowHoldModal(false);
          setHoldPhotoIndex(null);
          setHoldReason("");
        }}
        icon={<PauseCircle className="h-5 w-5 text-amber-500" />}
        title={`Hold board ${holdPhotoIndex !== null ? holdPhotoIndex + 1 : ""}`}
        description="Park this board to decide later. The hold is saved in this browser only."
        footer={
          <>
            <Btn
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowHoldModal(false);
                setHoldPhotoIndex(null);
                setHoldReason("");
              }}
            >
              Cancel
            </Btn>
            <Btn variant="warning" className="flex-1" icon={<PauseCircle className="h-4 w-4" />} onClick={handleHoldPhoto}>
              Put on hold
            </Btn>
          </>
        }
      >
        <Field label="Reason" hint="Optional.">
          <textarea value={holdReason} onChange={(e) => setHoldReason(e.target.value)} className={cx(inputClass, "min-h-[90px] resize-none")} />
        </Field>
      </Dialog>

      {/* Approve all */}
      <Dialog
        open={approveAllConfirmOpen}
        onClose={() => setApproveAllConfirmOpen(false)}
        icon={<CheckSquare className="h-5 w-5 text-emerald-600" />}
        title={`Approve all ${pending} remaining boards?`}
        description="Every board that is still pending is approved. This cannot be undone from here."
        footer={
          <>
            <Btn variant="secondary" className="flex-1" onClick={() => setApproveAllConfirmOpen(false)}>
              Cancel
            </Btn>
            <Btn
              variant="success"
              className="flex-1"
              icon={processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
              disabled={processing}
              onClick={() => {
                setApproveAllConfirmOpen(false);
                confirmApproveAll();
              }}
            >
              Approve all
            </Btn>
          </>
        }
      />

      {lightbox.node}
    </div>
  );
}
