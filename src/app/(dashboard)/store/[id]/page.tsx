"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/src/lib/api";
import { Store } from "@/src/types/store";
import {
  Building2,
  Camera,
  ClipboardCheck,
  Edit2,
  Hammer,
  Image as ImageIcon,
  Info,
  Layers,
  MapPin,
  Package,
  Save,
  StickyNote,
  UserPlus,
  IndianRupee,
  FileSpreadsheet,
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
  EmptyBlock,
  Field,
  InfoGrid,
  LocationCard,
  NextStep,
  NotFound,
  PhotoTile,
  PriorityBadge,
  Section,
  SpecsCard,
  StatusBadge,
  StickyBar,
  Stepper,
  buildSteps,
  WorkHistoryCard,
  InstallComparison,
  formatDate,
  formatINR,
  personName,
  sqft,
  statusMeta,
  timeAgo,
  toFeet,
  useInputClass,
  useLightbox,
  useSurface,
} from "@/src/components/detail";

export default function StoreDetailsPage() {
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const canEdit = user?.roles?.some((r: any) => ["SUPER_ADMIN", "ADMIN"].includes(r?.code));

  useEffect(() => {
    if (!id) return;
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      const { data } = await api.get(`/stores/${id}`);
      setStore(data.store);
      setEditData({
        dealerCode: data.store.dealerCode,
        storeName: data.store.storeName,
        vendorCode: data.store.vendorCode || "",
        clientCode: data.store.clientCode || "",
        location: data.store.location,
        contact: data.store.contact || {},
        commercials: data.store.commercials || {},
        costDetails: data.store.costDetails || {},
        specs: data.store.specs || {},
      });
    } catch (error) {
      toast.error("Failed to load store details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/stores/${id}`, editData);
      toast.success("Store updated successfully");
      setIsEditing(false);
      fetchStore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update store");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!store)
    return <NotFound title="Store not found" hint="It may have been deleted, or the link is wrong." backHref="/stores" backLabel="Back to stores" />;

  const meta = statusMeta(store.currentStatus);
  const photos = (store.recce?.reccePhotos || []) as Array<any>;
  const initialPhotos = store.recce?.initialPhotos || [];
  const installPhotos = (store.installation?.photos || []) as Array<any>;
  const approvedCount = photos.filter((p) => p.approvalStatus === "APPROVED").length;
  const rejectedCount = photos.filter((p) => p.approvalStatus === "REJECTED").length;
  const pendingCount = photos.length - approvedCount - rejectedCount;

  // Same condition the page used before for the installation block and its Assign button.
  const showInstallation =
    !!store.recce &&
    ["RECCE_SUBMITTED", "RECCE_APPROVED", "INSTALLATION_ASSIGNED", "INSTALLATION_SUBMITTED", "COMPLETED"].includes(store.currentStatus);
  const installNotAssigned = !store.workflow?.installationAssignedTo && (!store.installation || !store.installation.submittedDate);
  const canAssignInstall = showInstallation && installNotAssigned && canEdit;
  const hasCommercials = !!(store.commercials?.poNumber || store.commercials?.poMonth || store.commercials?.invoiceNumber || store.commercials?.totalCost);

  const set = (patch: any) => setEditData({ ...editData, ...patch });
  const setIn = (key: string, field: string, value: any) => setEditData({ ...editData, [key]: { ...editData[key], [field]: value } });

  const recceImages = photos.map((p, i) => ({ src: p.photo ? getFullImageUrl(p.photo) : "", caption: `Board ${i + 1} · recce` }));
  const initialImages = initialPhotos.map((p, i) => ({ src: getFullImageUrl(p), caption: `Store photo ${i + 1}` }));

  /* ---------------- next-step actions ---------------- */
  const nextActions = (
    <>
      {canEdit && store.currentStatus === "RECCE_SUBMITTED" && (
        <Btn variant="primary" icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => router.push(`/recce/${store._id}/review`)}>
          Review recce
        </Btn>
      )}
      {canAssignInstall && (
        <Btn
          variant={store.currentStatus === "RECCE_APPROVED" ? "primary" : "secondary"}
          icon={<UserPlus className="h-4 w-4" />}
          onClick={() => router.push(`/stores?status=${store.currentStatus}&search=${encodeURIComponent(store.storeId || store.dealerCode)}`)}
        >
          Assign installer
        </Btn>
      )}
      {store.recce && (
        <Btn variant="secondary" icon={<Camera className="h-4 w-4" />} onClick={() => router.push(`/recce/${store._id}`)}>
          Open recce
        </Btn>
      )}
      {(store.workflow?.installationAssignedTo || store.installation?.submittedDate) && (
        <Btn variant="secondary" icon={<Hammer className="h-4 w-4" />} onClick={() => router.push(`/installation/${store._id}`)}>
          Open installation
        </Btn>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-7xl pb-28">
      <DetailHeader
        backHref="/stores"
        eyebrow="Store"
        title={store.storeName}
        meta={
          <>
            <CopyText value={store.storeId || store.dealerCode} />
            <StatusBadge status={store.currentStatus} />
            <PriorityBadge priority={store.workflow?.priority} />
            {(store.location?.city || store.location?.state) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[store.location?.city, store.location?.state].filter(Boolean).join(", ")}
              </span>
            )}
            {store.updatedAt && <span>Updated {timeAgo(store.updatedAt)}</span>}
          </>
        }
        actions={
          canEdit &&
          (isEditing ? (
            <>
              <Btn variant="ghost" onClick={() => setIsEditing(false)} className="hidden sm:inline-flex">
                Cancel
              </Btn>
              <Btn variant="primary" loading={isSaving} icon={<Save className="h-4 w-4" />} onClick={handleSave}>
                <span className="hidden sm:inline">Save changes</span>
              </Btn>
            </>
          ) : (
            <Btn variant="secondary" icon={<Edit2 className="h-4 w-4" />} onClick={() => setIsEditing(true)}>
              <span className="hidden sm:inline">Edit details</span>
            </Btn>
          ))
        }
      />

      <div className="space-y-4">
        {!isEditing && (
          <NextStep tone={meta.tone} icon={<Info className="h-5 w-5" />} title={meta.label} action={nextActions}>
            {meta.next}
          </NextStep>
        )}

        <Section title="Progress" icon={<Layers className="h-4 w-4" />}>
          <Stepper steps={buildSteps(store)} />
        </Section>

        <WorkHistoryCard store={store} />

        <div className="grid items-start gap-4 lg:grid-cols-3">
          {/* ---------------- main column ---------------- */}
          <div className="space-y-4 lg:col-span-2">
            <Section
              title="Boards"
              icon={<Package className="h-4 w-4" />}
              count={photos.length || undefined}
              subtitle={
                photos.length > 0 ? `${approvedCount} approved · ${pendingCount} pending · ${rejectedCount} rejected` : "Measured during recce"
              }
              action={
                canEdit && store.currentStatus === "RECCE_SUBMITTED" ? (
                  <Btn size="sm" variant="secondary" onClick={() => router.push(`/recce/${store._id}/review`)}>
                    Review
                  </Btn>
                ) : undefined
              }
            >
              {photos.length === 0 ? (
                <EmptyBlock
                  icon={<Camera className="h-8 w-8" />}
                  title="No boards measured yet"
                  hint={store.workflow?.recceAssignedTo ? `Waiting for ${personName(store.workflow.recceAssignedTo) || "the recce user"} to submit the recce.` : "Assign a recce user from Store Operations to get boards measured."}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {photos.map((photo, idx) => {
                    const ft = toFeet(photo.measurements);
                    const area = sqft(photo.measurements);
                    const el = photo.elements?.[0];
                    return (
                      <article key={idx} className={`overflow-hidden rounded-xl border ${s.sunken}`}>
                        <PhotoTile
                          src={photo.photo ? getFullImageUrl(photo.photo) : ""}
                          alt={`Board ${idx + 1}`}
                          onOpen={() => lightbox.open(recceImages, idx)}
                          className="rounded-none border-0"
                          aspect="aspect-video"
                          empty={
                            <>
                              <Building2 className="h-7 w-7 text-blue-400" />
                              <span className="font-medium">Direct installation</span>
                              <span>No recce photo</span>
                            </>
                          }
                          overlay={
                            <>
                              <Badge tone="neutral" className="pointer-events-auto shadow-sm">Board {idx + 1}</Badge>
                              <ApprovalBadge status={photo.approvalStatus} className="shadow-sm" />
                            </>
                          }
                        />
                        <div className="space-y-3 p-3">
                          <InfoGrid
                            items={[
                              { label: "Size", value: `${ft.width.toFixed(2)} × ${ft.height.toFixed(2)} ft` },
                              { label: "Area", value: `${area.toFixed(2)} sq.ft` },
                              { label: "Element", value: el?.elementName },
                              { label: "Quantity", value: el ? String(el.quantity || 1) : "" },
                              { label: "Rate", value: el?.customRate ? `${formatINR(el.customRate)}/sq.ft` : "", hideIfEmpty: true },
                              { label: "Cost", value: el?.customRate ? formatINR(area * el.customRate * (el.quantity || 1)) : "", hideIfEmpty: true },
                            ]}
                          />
                          {photo.rejectionReason && (
                            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                              <span className="font-semibold">Rejected: </span>
                              {photo.rejectionReason}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </Section>

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
              <Section title="Recce remarks" icon={<StickyNote className="h-4 w-4" />}>
                <p className={`whitespace-pre-line text-sm ${s.body}`}>{store.recce.notes}</p>
              </Section>
            )}

            {showInstallation && (
              <Section
                title="Installation"
                icon={<Hammer className="h-4 w-4" />}
                count={installPhotos.length || undefined}
                action={
                  canAssignInstall ? (
                    <Btn size="sm" variant="primary" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => router.push(`/stores?status=${store.currentStatus}&search=${encodeURIComponent(store.storeId || store.dealerCode)}`)}>
                      Assign
                    </Btn>
                  ) : undefined
                }
              >
                {installNotAssigned ? (
                  <EmptyBlock icon={<UserPlus className="h-8 w-8" />} title="No installer assigned" hint="Assign an installation user to proceed." />
                ) : store.installation?.submittedDate ? (
                  <div className="space-y-4">
                    <InfoGrid
                      cols={3}
                      items={[
                        { label: "Installer", value: personName(store.workflow?.installationAssignedTo) },
                        { label: "Submitted", value: formatDate(store.installation.submittedDate) },
                        { label: "Photos", value: String(installPhotos.length) },
                      ]}
                    />
                    <InstallComparison store={store} getUrl={getFullImageUrl} onOpen={(imgs, k) => lightbox.open(imgs, k)} />
                  </div>
                ) : (
                  <InfoGrid
                    items={[
                      { label: "Assigned to", value: personName(store.workflow?.installationAssignedTo) },
                      { label: "Status", value: "Waiting for installation photos" },
                    ]}
                  />
                )}
              </Section>
            )}
          </div>

          {/* ---------------- side column ---------------- */}
          <aside className="space-y-4">
            {isEditing ? (
              <>
                <Section title="Store & dealer" icon={<Building2 className="h-4 w-4" />}>
                  <div className="space-y-3">
                    <Field label="Store name" required>
                      <input className={inputClass} value={editData.storeName} onChange={(e) => set({ storeName: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Dealer code" required>
                        <input className={inputClass} value={editData.dealerCode} onChange={(e) => set({ dealerCode: e.target.value })} />
                      </Field>
                      <Field label="Vendor code">
                        <input className={inputClass} value={editData.vendorCode} onChange={(e) => set({ vendorCode: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="Client code">
                      <input className={inputClass} value={editData.clientCode} onChange={(e) => set({ clientCode: e.target.value })} />
                    </Field>
                  </div>
                </Section>

                <Section title="Location & contact" icon={<MapPin className="h-4 w-4" />}>
                  <div className="space-y-3">
                    <Field label="Address">
                      <textarea rows={2} className={inputClass} value={editData.location?.address || ""} onChange={(e) => setIn("location", "address", e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="City">
                        <input className={inputClass} value={editData.location?.city || ""} onChange={(e) => setIn("location", "city", e.target.value)} />
                      </Field>
                      <Field label="District">
                        <input className={inputClass} value={editData.location?.district || ""} onChange={(e) => setIn("location", "district", e.target.value)} />
                      </Field>
                      <Field label="State">
                        <input className={inputClass} value={editData.location?.state || ""} onChange={(e) => setIn("location", "state", e.target.value)} />
                      </Field>
                      <Field label="Zone">
                        <input className={inputClass} value={editData.location?.zone || ""} onChange={(e) => setIn("location", "zone", e.target.value)} />
                      </Field>
                    </div>
                    <Field label="Mobile number">
                      <input inputMode="tel" className={inputClass} value={editData.contact?.mobile || ""} onChange={(e) => setIn("contact", "mobile", e.target.value)} />
                    </Field>
                  </div>
                </Section>

                <Section title="Board specs" icon={<Package className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type">
                      <input className={inputClass} value={editData.specs?.type || ""} onChange={(e) => setIn("specs", "type", e.target.value)} />
                    </Field>
                    <Field label="Quantity">
                      <input type="number" className={inputClass} value={editData.specs?.qty || ""} onChange={(e) => setIn("specs", "qty", Number(e.target.value))} />
                    </Field>
                    <Field label="Width (ft)">
                      <input type="number" className={inputClass} value={editData.specs?.width || ""} onChange={(e) => setIn("specs", "width", Number(e.target.value))} />
                    </Field>
                    <Field label="Height (ft)">
                      <input type="number" className={inputClass} value={editData.specs?.height || ""} onChange={(e) => setIn("specs", "height", Number(e.target.value))} />
                    </Field>
                  </div>
                </Section>

                <Section title="Commercial" icon={<FileSpreadsheet className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="PO number">
                      <input className={inputClass} value={editData.commercials?.poNumber || ""} onChange={(e) => setIn("commercials", "poNumber", e.target.value)} />
                    </Field>
                    <Field label="PO month">
                      <input className={inputClass} value={editData.commercials?.poMonth || ""} onChange={(e) => setIn("commercials", "poMonth", e.target.value)} />
                    </Field>
                    <Field label="Invoice number">
                      <input className={inputClass} value={editData.commercials?.invoiceNumber || ""} onChange={(e) => setIn("commercials", "invoiceNumber", e.target.value)} />
                    </Field>
                    <Field label="Total cost (₹)">
                      <input type="number" className={inputClass} value={editData.commercials?.totalCost || ""} onChange={(e) => setIn("commercials", "totalCost", Number(e.target.value))} />
                    </Field>
                  </div>
                </Section>

                <Section title="Cost" icon={<IndianRupee className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Board rate (₹/sq.ft)">
                      <input type="number" className={inputClass} value={editData.costDetails?.boardRate || ""} onChange={(e) => setIn("costDetails", "boardRate", Number(e.target.value))} />
                    </Field>
                    <Field label="Angle charges (₹)">
                      <input type="number" className={inputClass} value={editData.costDetails?.angleCharges || ""} onChange={(e) => setIn("costDetails", "angleCharges", Number(e.target.value))} />
                    </Field>
                    <Field label="Scaffolding (₹)">
                      <input type="number" className={inputClass} value={editData.costDetails?.scaffoldingCharges || ""} onChange={(e) => setIn("costDetails", "scaffoldingCharges", Number(e.target.value))} />
                    </Field>
                    <Field label="Transportation (₹)">
                      <input type="number" className={inputClass} value={editData.costDetails?.transportation || ""} onChange={(e) => setIn("costDetails", "transportation", Number(e.target.value))} />
                    </Field>
                  </div>
                </Section>
              </>
            ) : (
              <>
                <LocationCard store={store} />
                <ContactCard store={store} />
                <DealerCard store={store} />
                <SpecsCard store={store} />
                {hasCommercials && <CommercialCard store={store} />}
                <CostCard store={store} />
              </>
            )}
          </aside>
        </div>
      </div>

      {isEditing && (
        <StickyBar>
          <p className={`flex-1 text-sm ${s.muted}`}>
            Editing <span className={`font-semibold ${s.text}`}>{store.storeName}</span>. Changes are saved when you press Save.
          </p>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Btn>
            <Btn variant="primary" loading={isSaving} icon={<Save className="h-4 w-4" />} onClick={handleSave}>
              Save changes
            </Btn>
          </div>
        </StickyBar>
      )}

      {lightbox.node}
    </div>
  );
}
