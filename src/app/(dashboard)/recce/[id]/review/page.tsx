"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import { useImageService } from "@/src/hooks/useImageService";
import { useAuth } from "@/src/context/AuthContext";
import { isAdminRole } from "@/src/lib/roles";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  CheckSquare,
  PauseCircle,
  Building2,
  Store as StoreIcon,
  Info,
  UserPlus,
  Search,
  AlertTriangle,
  Camera,
  ClipboardList,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Keyboard,
  ExternalLink,
} from "lucide-react";
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
  InfoGrid,
  NextStep,
  NotFound,
  PhotoTile,
  PriorityBadge,
  ProgressBar,
  Section,
  StatTiles,
  StatusBadge,
  StickyBar,
  Stepper,
  StoreFacts,
  WorkHistoryCard,
  buildSteps,
  cx,
  formatDateTime,
  personName,
  timeAgo,
  toFeet,
  sqft,
  useInputClass,
  useLightbox,
  useSurface,
} from "@/src/components/detail";

type Filter = "PENDING" | "APPROVED" | "REJECTED" | "HOLD" | "ALL";

// One-tap reasons so rejections are quick and the recce user gets consistent instructions.
const REJECT_REASONS = [
  "Photo is blurred",
  "Board edges are cut off",
  "Measurement looks wrong",
  "Wrong element selected",
  "Photo taken from too far",
  "Wrong board or location",
];

/** Date and time with a relative hint, e.g. "18 Oct 2026, 07:30 pm (2 h ago)". */
const when = (v?: string) => (v ? `${formatDateTime(v)} (${timeAgo(v)})` : "");

/** Things on a board worth a second look before approving. Display only. */
const boardWarnings = (photo: any): string[] => {
  const w: string[] = [];
  const width = Number(photo?.measurements?.width || 0);
  const height = Number(photo?.measurements?.height || 0);
  if (!width || !height) {
    w.push("Width or height is 0");
  } else {
    const area = sqft(photo.measurements);
    if (area > 500) w.push(`Very large board: ${area.toFixed(0)} sq.ft`);
    if (area < 1) w.push(`Very small board: ${area.toFixed(2)} sq.ft`);
    if (Math.max(width, height) / Math.min(width, height) > 20) w.push("Unusual shape, check width and height");
  }
  if (!photo?.elements?.length || !photo.elements[0]?.elementName) w.push("No element set");
  return w;
};

const appendReason = (prev: string, r: string) => {
  const t = prev.trim();
  if (!t) return r;
  if (t.toLowerCase().includes(r.toLowerCase())) return prev;
  return `${t}, ${r.charAt(0).toLowerCase()}${r.slice(1)}`;
};

export default function RecceReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { getFullImageUrl } = useImageService();
  const s = useSurface();
  const inputClass = useInputClass();
  const lightbox = useLightbox();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user);

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
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL");
  const filterInitialised = useRef(false);

  // Review viewer: one board at a time, full screen, with keyboard shortcuts.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerRejecting, setViewerRejecting] = useState(false);
  const [viewerReason, setViewerReason] = useState("");

  // Assign installation popup (Super Admin / Admin only)
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installUsers, setInstallUsers] = useState<any[]>([]);
  const [installUsersLoading, setInstallUsersLoading] = useState(false);
  const [installUserSearch, setInstallUserSearch] = useState("");
  const [selectedInstallUserId, setSelectedInstallUserId] = useState("");
  const [assigningInstall, setAssigningInstall] = useState(false);

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
  };

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

  // Open on "To review" when there is still something to review.
  useEffect(() => {
    if (!store?.recce?.reccePhotos || filterInitialised.current) return;
    filterInitialised.current = true;
    const hasPending = store.recce.reccePhotos.some((p: any) => !p.approvalStatus || p.approvalStatus === "PENDING");
    if (hasPending) setActiveFilter("PENDING");
  }, [store]);

  const installerMissing = (st: Store | null) =>
    !!st && !st.workflow?.installationAssignedTo && (!st.installation || !st.installation.submittedDate);

  /** Applies a store returned by a review call; when that finishes the recce, offers the installer popup. */
  const applyReviewedStore = (next: Store | null | undefined, prevStatus?: string) => {
    if (!next) return;
    setStore(next);
    if (isAdmin && prevStatus !== "RECCE_APPROVED" && next.currentStatus === "RECCE_APPROVED" && installerMissing(next)) {
      setViewerIndex(null);
      toast.success("All boards approved. Pick an installer.");
      openInstallModal();
    }
  };

  const approveBoard = async (photoIndex: number): Promise<boolean> => {
    setProcessing(true);
    const prevStatus = store?.currentStatus;
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
        applyReviewedStore(data.store, prevStatus);
      } else {
        await fetchStore(false);
      }
      toast.success(`Board ${photoIndex + 1} approved`);
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve photo");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const rejectBoard = async (photoIndex: number, reason: string): Promise<boolean> => {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return false;
    }
    setProcessing(true);
    try {
      const { data } = await api.post(`/stores/${id}/recce/photos/${photoIndex}/review`, {
        status: "REJECTED",
        rejectionReason: reason,
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
      toast.success(`Board ${photoIndex + 1} rejected`);
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject photo");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const holdBoard = (photoIndex: number, reason: string) => {
    const updated = { ...heldPhotos, [photoIndex]: reason.trim() || "On hold" };
    saveHeldPhotos(updated);
    toast.success(`Board ${photoIndex + 1} put on hold`);
  };

  const handleRejectPhoto = async () => {
    if (rejectPhotoIndex === null) return;
    const ok = await rejectBoard(rejectPhotoIndex, rejectionReason);
    if (ok) {
      setShowRejectModal(false);
      setRejectPhotoIndex(null);
      setRejectionReason("");
    }
  };

  const handleHoldPhoto = () => {
    if (holdPhotoIndex === null) return;
    holdBoard(holdPhotoIndex, holdReason);
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
    const prevStatus = store?.currentStatus;
    try {
      // Approve all recce photos together via review endpoint
      const { data } = await api.post(`/stores/${id}/recce/review`, {
        status: "APPROVED",
      });
      saveHeldPhotos({});
      if (data?.store) {
        applyReviewedStore(data.store, prevStatus);
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
          applyReviewedStore(fallbackData.store, prevStatus);
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

  /* ---------------- assign installation ---------------- */

  const openInstallModal = async () => {
    setInstallModalOpen(true);
    setSelectedInstallUserId("");
    setInstallUserSearch("");
    setInstallUsersLoading(true);
    try {
      const { data } = await api.get(`/users/role/INSTALLATION`);
      setInstallUsers(data?.users || []);
    } catch {
      toast.error("Failed to fetch installation users");
      setInstallUsers([]);
    } finally {
      setInstallUsersLoading(false);
    }
  };

  const closeInstallModal = () => {
    if (assigningInstall) return;
    setInstallModalOpen(false);
    setSelectedInstallUserId("");
    setInstallUserSearch("");
  };

  const handleAssignInstallation = async () => {
    if (!selectedInstallUserId) return toast.error("Please select a user");
    setAssigningInstall(true);
    try {
      await api.post("/stores/assign", {
        storeIds: [id],
        userId: selectedInstallUserId,
        stage: "INSTALLATION",
      });
      toast.success("Installation assigned successfully");
      setInstallModalOpen(false);
      setSelectedInstallUserId("");
      setInstallUserSearch("");
      await fetchStore(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigningInstall(false);
    }
  };

  /* ---------------- derived ---------------- */

  const photos: any[] = store?.recce?.reccePhotos || [];
  const total = photos.length;

  const getEffectiveStatus = useCallback(
    (photo: any, index: number) => {
      if (heldPhotos[index] && (!photo.approvalStatus || photo.approvalStatus === "PENDING")) {
        return "HOLD";
      }
      return photo.approvalStatus || "PENDING";
    },
    [heldPhotos]
  );

  const isOpen = (index: number) => {
    const st = photos[index] ? getEffectiveStatus(photos[index], index) : "";
    return st === "PENDING" || st === "HOLD";
  };

  /** Next board still waiting for a decision after `from`, wrapping around; null when none is left. */
  const nextOpenAfter = (from: number) => {
    for (let k = 1; k < total; k++) {
      const j = (from + k) % total;
      if (isOpen(j)) return j;
    }
    return null;
  };

  const firstOpen = () => {
    for (let j = 0; j < total; j++) if (isOpen(j) && getEffectiveStatus(photos[j], j) === "PENDING") return j;
    for (let j = 0; j < total; j++) if (isOpen(j)) return j;
    return total ? 0 : null;
  };

  /* ---------------- review viewer ---------------- */

  const openViewer = (index: number | null) => {
    if (index === null) return;
    setViewerRejecting(false);
    setViewerReason("");
    setViewerIndex(index);
  };
  const closeViewer = () => {
    setViewerIndex(null);
    setViewerRejecting(false);
    setViewerReason("");
  };
  const goViewer = (i: number) => {
    if (i < 0 || i >= total) return;
    setViewerRejecting(false);
    setViewerReason("");
    setViewerIndex(i);
  };
  const advanceFrom = (i: number) => {
    const next = nextOpenAfter(i);
    if (next === null) {
      toast.success("Every board has a decision now");
      closeViewer();
    } else goViewer(next);
  };

  const viewerApprove = async () => {
    if (viewerIndex === null || processing || !isOpen(viewerIndex)) return;
    const i = viewerIndex;
    if (await approveBoard(i)) advanceFrom(i);
  };
  const viewerHold = () => {
    if (viewerIndex === null || processing || getEffectiveStatus(photos[viewerIndex], viewerIndex) !== "PENDING") return;
    const i = viewerIndex;
    holdBoard(i, "");
    advanceFrom(i);
  };
  const viewerReject = async () => {
    if (viewerIndex === null || processing) return;
    const i = viewerIndex;
    if (await rejectBoard(i, viewerReason)) advanceFrom(i);
  };

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "TEXTAREA" || tag === "INPUT";
      if (e.key === "Escape") {
        if (viewerRejecting) setViewerRejecting(false);
        else closeViewer();
        return;
      }
      if (typing) return;
      if (e.key === "ArrowRight") goViewer(viewerIndex + 1);
      else if (e.key === "ArrowLeft") goViewer(viewerIndex - 1);
      else if (e.key.toLowerCase() === "a") viewerApprove();
      else if (e.key.toLowerCase() === "h") viewerHold();
      else if (e.key.toLowerCase() === "r" && isOpen(viewerIndex)) {
        e.preventDefault();
        setViewerRejecting(true);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  });

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

  const approved = photos.filter((photo: any) => photo.approvalStatus === "APPROVED").length;
  const rejected = photos.filter((photo: any) => photo.approvalStatus === "REJECTED").length;
  const onHold = photos.filter((photo: any, idx: number) => getEffectiveStatus(photo, idx) === "HOLD").length;
  const pending = photos.filter((photo: any, idx: number) => getEffectiveStatus(photo, idx) === "PENDING").length;
  const reviewed = approved + rejected;
  const flagged = photos.filter((p: any, i: number) => isOpen(i) && boardWarnings(p).length > 0).length;
  const totalArea = photos.reduce((sum: number, p: any) => sum + (p?.measurements ? sqft(p.measurements) : 0), 0);

  const recceUser = personName(store.workflow?.recceAssignedTo);
  const submittedBy = personName(store.recce.submittedBy) || recceUser;
  const installer = personName(store.workflow?.installationAssignedTo);
  const initialPhotos = store.recce.initialPhotos || [];
  const initialImages = initialPhotos.map((p, i) => ({ src: getFullImageUrl(p), caption: `Store photo ${i + 1}` }));

  // Same rule as the store details page: recce submitted/approved and no installer yet.
  const canAssignInstall = isAdmin && installerMissing(store) && ["RECCE_SUBMITTED", "RECCE_APPROVED"].includes(String(store.currentStatus));
  const q = installUserSearch.trim().toLowerCase();
  const filteredInstallUsers = q
    ? installUsers.filter((u: any) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
    : installUsers;

  const matchesFilter = (photo: any, index: number) => {
    const status = getEffectiveStatus(photo, index);
    if (activeFilter === "ALL") return true;
    return status === activeFilter;
  };
  const hasAny = photos.some((photo: any, idx: number) => matchesFilter(photo, idx));
  const filterLabel: Record<string, string> = { ALL: "", PENDING: "pending", APPROVED: "approved", REJECTED: "rejected", HOLD: "on hold" };

  const assignBtn = (variant: "primary" | "secondary" = "primary") => (
    <Btn variant={variant} icon={<UserPlus className="h-4 w-4" />} onClick={openInstallModal}>
      Assign installation
    </Btn>
  );

  /* ---------------- what happens next ---------------- */
  let next: React.ReactNode = null;
  if (installer) {
    next = (
      <NextStep tone="info" icon={<UserPlus className="h-5 w-5" />} title={`Installation assigned to ${installer}`}>
        {[
          store.installation?.assignedDate && `Assigned ${when(store.installation.assignedDate)}`,
          personName(store.workflow?.installationAssignedBy) && `by ${personName(store.workflow?.installationAssignedBy)}`,
          store.installation?.submittedDate && `· Installation submitted ${when(store.installation.submittedDate)}`,
        ]
          .filter(Boolean)
          .join(" ")}
      </NextStep>
    );
  } else if (pending > 0) {
    next = (
      <NextStep
        tone="brand"
        icon={<ClipboardList className="h-5 w-5" />}
        title={`${pending} of ${total} boards waiting for your review`}
        action={
          <Btn variant="primary" icon={<Maximize2 className="h-4 w-4" />} onClick={() => openViewer(firstOpen())}>
            Review one by one
          </Btn>
        }
      >
        Submitted {when(store.recce.submittedDate) || "date not recorded"}
        {submittedBy ? ` by ${submittedBy}` : ""}.{flagged > 0 ? ` ${flagged} board${flagged > 1 ? "s need" : " needs"} a second look.` : ""}
      </NextStep>
    );
  } else if (onHold > 0) {
    next = (
      <NextStep
        tone="warning"
        icon={<PauseCircle className="h-5 w-5" />}
        title={`${onHold} board${onHold > 1 ? "s are" : " is"} on hold`}
        action={
          <Btn variant="secondary" onClick={() => setActiveFilter("HOLD")}>
            Show held boards
          </Btn>
        }
      >
        Approve or reject them to finish the review.
      </NextStep>
    );
  } else if (rejected > 0) {
    next = (
      <NextStep
        tone="danger"
        icon={<XCircle className="h-5 w-5" />}
        title={`${rejected} board${rejected > 1 ? "s" : ""} rejected`}
        action={canAssignInstall ? assignBtn("secondary") : undefined}
      >
        Sent back to {recceUser || "the recce user"} to re-shoot. {approved} approved board{approved === 1 ? "" : "s"} stay approved.
      </NextStep>
    );
  } else if (total > 0) {
    next = (
      <NextStep tone="success" icon={<CheckCircle2 className="h-5 w-5" />} title="All boards approved" action={canAssignInstall ? assignBtn() : undefined}>
        {canAssignInstall ? "Next: assign an installer so work can start." : "The recce is complete."}
      </NextStep>
    );
  }

  const viewerPhoto = viewerIndex !== null ? photos[viewerIndex] : null;

  return (
    <div className="mx-auto max-w-7xl pb-32">
      <DetailHeader
        backHref="/recce"
        eyebrow="Recce review"
        title={store.storeName}
        meta={
          <>
            <CopyText value={store.storeId || store.dealerCode} />
            <StatusBadge status={store.currentStatus} />
            <PriorityBadge priority={store.workflow?.priority} />
            {store.location?.city && <span>{store.location.city}</span>}
            {store.recce.submittedDate && <span title={formatDateTime(store.recce.submittedDate)}>Submitted {when(store.recce.submittedDate)}</span>}
            {submittedBy && <span>by {submittedBy}</span>}
            {installer && <span>Installer: {installer}</span>}
          </>
        }
        actions={
          <>
            {canAssignInstall && (
              <Btn
                variant={store.currentStatus === "RECCE_APPROVED" ? "primary" : "secondary"}
                icon={<UserPlus className="h-4 w-4" />}
                onClick={openInstallModal}
              >
                <span className="hidden sm:inline">Assign installation</span>
                <span className="sm:hidden">Install</span>
              </Btn>
            )}
            <Btn variant="secondary" icon={<StoreIcon className="h-4 w-4" />} onClick={() => router.push(`/store/${id}`)}>
              <span className="hidden sm:inline">Store details</span>
            </Btn>
          </>
        }
      />

      <div className="space-y-4">
        {next}

        <Section title="Progress" icon={<Layers className="h-4 w-4" />} collapsible>
          <Stepper steps={buildSteps(store)} />
        </Section>

        <div className="grid items-start gap-4 lg:grid-cols-3">
          {/* ---------------- boards ---------------- */}
          <div className="space-y-4 lg:col-span-2">
            <Section
              title={
                <span>
                  {reviewed} of {total} boards reviewed
                </span>
              }
              icon={<CheckSquare className="h-4 w-4" />}
              subtitle={`${totalArea.toFixed(1)} sq.ft in total`}
              action={
                total > 0 ? (
                  <Btn variant="secondary" size="sm" icon={<Maximize2 className="h-4 w-4" />} onClick={() => openViewer(firstOpen())}>
                    <span className="hidden sm:inline">Review one by one</span>
                    <span className="sm:hidden">Review</span>
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
                onSelect={(k) => setActiveFilter(k as Filter)}
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
                hint={activeFilter === "PENDING" ? "Every board has a decision. Pick another filter to see them." : "Pick another filter above to see the rest."}
                action={
                  <Btn size="sm" variant="secondary" onClick={() => setActiveFilter("ALL")}>
                    Show all boards
                  </Btn>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {photos.map((photo: any, index: number) => {
                  if (!matchesFilter(photo, index)) return null;
                  const status = getEffectiveStatus(photo, index);
                  const ft = toFeet(photo.measurements);
                  const canAct = status === "PENDING" || status === "HOLD";
                  const warnings = boardWarnings(photo);
                  const reviewer = personName(photo.approvedBy);
                  return (
                    <article
                      key={index}
                      className={cx(
                        "flex flex-col overflow-hidden rounded-xl border",
                        s.card,
                        status === "REJECTED" && (s.dark ? "border-red-800" : "border-red-300"),
                        status === "APPROVED" && (s.dark ? "border-emerald-900" : "border-emerald-200"),
                        canAct && warnings.length > 0 && (s.dark ? "border-amber-700" : "border-amber-300")
                      )}
                    >
                      <PhotoTile
                        src={photo.photo ? getFullImageUrl(photo.photo) : ""}
                        alt={`Board ${index + 1}`}
                        onOpen={() => openViewer(index)}
                        className="rounded-none border-0"
                        empty={
                          <button type="button" onClick={() => openViewer(index)} className="flex flex-col items-center gap-1">
                            <Building2 className="h-7 w-7 text-blue-400" />
                            <span className="font-medium">Direct installation</span>
                            <span>No photo</span>
                          </button>
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
                              {photo.measurements?.width} × {photo.measurements?.height} {photo.measurements?.unit}
                            </dd>
                          </div>
                          <div>
                            <dt className={`text-xs ${s.muted}`}>In feet</dt>
                            <dd className={`font-semibold tabular-nums ${s.text}`}>
                              {ft.width.toFixed(2)} × {ft.height.toFixed(2)} · {sqft(photo.measurements).toFixed(1)} sq.ft
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className={`text-xs ${s.muted}`}>Element{(photo.elements?.length || 0) > 1 ? "s" : ""}</dt>
                            <dd className={cx("font-semibold", photo.elements?.[0] ? s.text : s.faint)}>
                              {photo.elements?.length
                                ? photo.elements.map((el: any) => `${el.elementName}${el.quantity > 1 ? ` × ${el.quantity}` : ""}`).join(", ")
                                : "Not set"}
                            </dd>
                          </div>
                          {photo.approvedAt && (status === "APPROVED" || status === "REJECTED") && (
                            <div className="col-span-2">
                              <dt className={`text-xs ${s.muted}`}>{status === "APPROVED" ? "Approved" : "Rejected"}</dt>
                              <dd className={cx("text-sm", s.body)}>
                                {when(photo.approvedAt)}
                                {reviewer ? ` · by ${reviewer}` : ""}
                              </dd>
                            </div>
                          )}
                        </dl>

                        {canAct && warnings.length > 0 && (
                          <ul className={cx("space-y-1 rounded-lg border px-3 py-2 text-sm", s.dark ? "border-amber-800 bg-amber-950/40 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-900")}>
                            {warnings.map((w) => (
                              <li key={w} className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        )}

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
                            <Btn variant="success" className="col-span-3" disabled={processing} icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => approveBoard(index)}>
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

          {/* ---------------- context ---------------- */}
          <aside className="space-y-4">
            <Section title="Recce details" icon={<ClipboardList className="h-4 w-4" />}>
              <InfoGrid
                items={[
                  { label: "Recce user", value: recceUser },
                  { label: "Assigned by", value: personName(store.workflow?.recceAssignedBy) },
                  { label: "Assigned on", value: when(store.recce.assignedDate), full: true },
                  { label: "Submitted on", value: when(store.recce.submittedDate), full: true },
                  { label: "Submitted by", value: submittedBy },
                  { label: "Priority", value: store.workflow?.priority ? store.workflow.priority.charAt(0) + store.workflow.priority.slice(1).toLowerCase() : "" },
                  { label: "Boards", value: String(total) },
                  { label: "Total area", value: `${totalArea.toFixed(1)} sq.ft` },
                  { label: "Store added on", value: when(store.createdAt), full: true },
                  { label: "Last updated", value: when(store.updatedAt), full: true },
                  { label: "Recce notes", value: store.recce.notes, full: true },
                ]}
              />
            </Section>

            <Section title="Store photos" icon={<Camera className="h-4 w-4" />} count={initialPhotos.length}>
              {initialPhotos.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {initialImages.map((im, i) => (
                    <PhotoTile key={i} src={im.src} alt={im.caption} aspect="aspect-square" onOpen={() => lightbox.open(initialImages, i)} />
                  ))}
                </div>
              ) : (
                <p className={cx("text-sm", s.faint)}>The recce user did not add store photos.</p>
              )}
            </Section>

            <StoreFacts store={store} showMoney={isAdmin} />
          </aside>
        </div>

        <WorkHistoryCard store={store} />
      </div>

      {/* Always-visible actions */}
      <StickyBar>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden w-40 sm:block">
            <ProgressBar
              total={total}
              segments={[
                { value: approved, tone: "success", label: "Approved" },
                { value: rejected, tone: "danger", label: "Rejected" },
                { value: onHold, tone: "warning", label: "On hold" },
              ]}
            />
          </div>
          <p className={cx("text-sm", s.body)}>
            <span className={cx("font-semibold", s.text)}>
              {reviewed}/{total} reviewed
            </span>
            {pending > 0 && ` · ${pending} to review`}
            {onHold > 0 && ` · ${onHold} on hold`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(pending > 0 || onHold > 0) && (
            <Btn variant="secondary" icon={<Maximize2 className="h-4 w-4" />} onClick={() => openViewer(firstOpen())}>
              Review one by one
            </Btn>
          )}
          {pending + onHold > 0 && (
            <Btn variant="success" icon={<CheckSquare className="h-4 w-4" />} disabled={processing} onClick={handleApproveAll}>
              Approve {pending + onHold} remaining
            </Btn>
          )}
          {canAssignInstall && assignBtn(store.currentStatus === "RECCE_APPROVED" ? "primary" : "secondary")}
        </div>
      </StickyBar>

      {/* Review viewer */}
      {viewerPhoto &&
        viewerIndex !== null &&
        typeof document !== "undefined" &&
        createPortal(
          (() => {
            const status = getEffectiveStatus(viewerPhoto, viewerIndex);
            const canAct = status === "PENDING" || status === "HOLD";
            const ft = toFeet(viewerPhoto.measurements);
            const warnings = boardWarnings(viewerPhoto);
            const src = viewerPhoto.photo ? getFullImageUrl(viewerPhoto.photo) : "";
            const reviewer = personName(viewerPhoto.approvedBy);
            return (
              <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white lg:flex-row" role="dialog" aria-modal="true" aria-label="Review boards">
                {/* photo */}
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm">
                      <span className="font-semibold">Board {viewerIndex + 1}</span>
                      <span className="ml-2 text-white/60">
                        of {total} · {pending} to review
                      </span>
                    </p>
                    <div className="flex items-center gap-1">
                      {src && (
                        <a href={src} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 hover:bg-white/10" aria-label="Open original">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                      <button type="button" onClick={closeViewer} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close">
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={`Board ${viewerIndex + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/60">
                        <Building2 className="h-10 w-10" />
                        <span className="font-medium">Direct installation, no photo</span>
                      </div>
                    )}
                    {viewerIndex > 0 && (
                      <button type="button" onClick={() => goViewer(viewerIndex - 1)} className="absolute left-3 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="Previous board">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    )}
                    {viewerIndex < total - 1 && (
                      <button type="button" onClick={() => goViewer(viewerIndex + 1)} className="absolute right-3 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="Next board">
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                </div>

                {/* details + decision */}
                <div className="flex max-h-[50vh] w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-white/10 bg-gray-950 p-4 lg:max-h-none lg:w-96 lg:border-l lg:border-t-0">
                  <div className="flex items-center gap-2">
                    <ApprovalBadge status={status} />
                    {heldPhotos[viewerIndex] && <span className="text-xs text-amber-300">{heldPhotos[viewerIndex]}</span>}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-white/50">Measured</dt>
                      <dd className="font-semibold tabular-nums">
                        {viewerPhoto.measurements?.width} × {viewerPhoto.measurements?.height} {viewerPhoto.measurements?.unit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-white/50">In feet</dt>
                      <dd className="font-semibold tabular-nums">
                        {ft.width.toFixed(2)} × {ft.height.toFixed(2)} · {sqft(viewerPhoto.measurements).toFixed(1)} sq.ft
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-white/50">Element</dt>
                      <dd className="font-semibold">
                        {viewerPhoto.elements?.length
                          ? viewerPhoto.elements.map((el: any) => `${el.elementName}${el.quantity > 1 ? ` × ${el.quantity}` : ""}`).join(", ")
                          : "Not set"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-white/50">Submitted</dt>
                      <dd>{when(store.recce?.submittedDate) || "Not recorded"}</dd>
                    </div>
                    {viewerPhoto.approvedAt && !canAct && (
                      <div className="col-span-2">
                        <dt className="text-xs text-white/50">{status === "APPROVED" ? "Approved" : "Rejected"}</dt>
                        <dd>
                          {when(viewerPhoto.approvedAt)}
                          {reviewer ? ` · by ${reviewer}` : ""}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {canAct && warnings.length > 0 && (
                    <ul className="space-y-1 rounded-lg border border-amber-700 bg-amber-950/50 px-3 py-2 text-sm text-amber-200">
                      {warnings.map((w) => (
                        <li key={w} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  )}
                  {viewerPhoto.rejectionReason && (
                    <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
                      <span className="font-semibold">Rejected: </span>
                      {viewerPhoto.rejectionReason}
                    </p>
                  )}

                  {canAct && !viewerRejecting && (
                    <div className="grid grid-cols-2 gap-2">
                      <Btn variant="success" className="col-span-2" disabled={processing} loading={processing} icon={<CheckCircle2 className="h-4 w-4" />} onClick={viewerApprove}>
                        Approve <kbd className="ml-1 rounded bg-white/20 px-1.5 text-xs">A</kbd>
                      </Btn>
                      {status !== "HOLD" ? (
                        <Btn variant="warning" disabled={processing} icon={<PauseCircle className="h-4 w-4" />} onClick={viewerHold}>
                          Hold <kbd className="ml-1 rounded bg-black/10 px-1.5 text-xs">H</kbd>
                        </Btn>
                      ) : (
                        <span />
                      )}
                      <Btn variant="danger" disabled={processing} icon={<XCircle className="h-4 w-4" />} onClick={() => setViewerRejecting(true)}>
                        Reject <kbd className="ml-1 rounded bg-white/20 px-1.5 text-xs">R</kbd>
                      </Btn>
                    </div>
                  )}

                  {canAct && viewerRejecting && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Why is board {viewerIndex + 1} rejected?</p>
                      <div className="flex flex-wrap gap-2">
                        {REJECT_REASONS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setViewerReason((prev) => appendReason(prev, r))}
                            className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <textarea
                        autoFocus
                        value={viewerReason}
                        onChange={(e) => setViewerReason(e.target.value)}
                        placeholder="The recce user sees this reason"
                        className="min-h-[90px] w-full resize-none rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-yellow-500 focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Btn variant="secondary" onClick={() => setViewerRejecting(false)}>
                          Cancel
                        </Btn>
                        <Btn variant="danger" loading={processing} disabled={!viewerReason.trim() || processing} icon={<XCircle className="h-4 w-4" />} onClick={viewerReject}>
                          Reject board
                        </Btn>
                      </div>
                    </div>
                  )}

                  {!canAct && (
                    <p className="text-sm text-white/60">This board already has a decision. Use the arrows to move to another board.</p>
                  )}

                  <p className="mt-auto hidden items-center gap-2 text-xs text-white/40 lg:flex">
                    <Keyboard className="h-3.5 w-3.5" /> A approve · H hold · R reject · ← → move · Esc close
                  </p>
                </div>
              </div>
            );
          })(),
          document.body
        )}

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
        <div className="mb-3 flex flex-wrap gap-2">
          {REJECT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRejectionReason((prev) => appendReason(prev, r))}
              className={cx("rounded-full border px-3 py-1 text-xs", s.dark ? "border-gray-700 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100")}
            >
              {r}
            </button>
          ))}
        </div>
        <Field label="Reason" required hint="Tap a reason above or write your own.">
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
        title={`Approve all ${pending + onHold} remaining boards?`}
        description={`Every board that is still pending${onHold > 0 ? " or on hold" : ""} is approved. This cannot be undone from here.`}
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
      >
        {flagged > 0 && (
          <p className={cx("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", s.dark ? "border-amber-800 bg-amber-950/40 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-900")}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {flagged} of these board{flagged > 1 ? "s have" : " has"} a warning (missing element or unusual size). Check them first if you are unsure.
          </p>
        )}
      </Dialog>

      {/* Assign installation */}
      <Dialog
        open={installModalOpen}
        onClose={closeInstallModal}
        icon={<UserPlus className="h-5 w-5 text-blue-600" />}
        title="Assign installation"
        description={`Pick the installation user for ${store.storeName}${store.location?.city ? `, ${store.location.city}` : ""}.`}
        footer={
          <>
            <Btn variant="secondary" className="flex-1" disabled={assigningInstall} onClick={closeInstallModal}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              className="flex-1"
              loading={assigningInstall}
              disabled={!selectedInstallUserId || assigningInstall}
              icon={<UserPlus className="h-4 w-4" />}
              onClick={handleAssignInstallation}
            >
              {assigningInstall ? "Assigning..." : "Assign"}
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <p className={cx("text-xs", s.muted)}>
            {approved} of {total} boards approved · {totalArea.toFixed(1)} sq.ft · recce submitted {when(store.recce.submittedDate) || "date not recorded"}
          </p>
          <div className="relative">
            <Search className={cx("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", s.muted)} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={installUserSearch}
              onChange={(e) => setInstallUserSearch(e.target.value)}
              className={cx(inputClass, "pl-9")}
            />
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {installUsersLoading ? (
              <div className={cx("flex items-center justify-center gap-2 py-6 text-sm", s.muted)}>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
              </div>
            ) : filteredInstallUsers.length === 0 ? (
              <p className={cx("py-6 text-center text-sm", s.muted)}>No installation users found.</p>
            ) : (
              filteredInstallUsers.map((u: any) => {
                const selected = selectedInstallUserId === u._id;
                return (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => setSelectedInstallUserId(u._id)}
                    className={cx(
                      "flex w-full items-center rounded-lg border p-3 text-left transition-all",
                      selected
                        ? s.dark
                          ? "border-blue-500 bg-blue-900/20"
                          : "border-blue-500 bg-blue-50"
                        : s.dark
                        ? "border-gray-600 hover:bg-gray-700"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <span
                      className={cx(
                        "mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        selected ? "bg-blue-500 text-white" : s.dark ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {(u.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx("block truncate text-sm font-medium", s.text)}>{u.name}</span>
                      <span className={cx("block truncate text-xs", s.muted)}>{u.email}</span>
                    </span>
                    {selected && <CheckSquare className="h-5 w-5 shrink-0 text-blue-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Dialog>

      {lightbox.node}
    </div>
  );
}
