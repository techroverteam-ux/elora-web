"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, ChevronLeft, ChevronRight, Download, ImageOff, ImagePlus, Search, Upload, X, Zap } from "lucide-react";
import api from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useImageService } from "@/src/hooks/useImageService";
import { isAdminRole } from "@/src/lib/roles";
import { compressImage } from "@/src/lib/imageCompress";
import FilterDropdown from "@/src/components/ui/FilterDropdown";
import { ListSkeleton, RefreshBar } from "@/src/components/ui/Skeleton";
import {
  Badge,
  Btn,
  EmptyBlock,
  PageIntro,
  PhotoTile,
  ScopeNote,
  StatTiles,
  StatusBadge,
  cx,
  formatDate,
  formatINR,
  useInputClass,
  useLightbox,
  useSurface,
} from "@/src/components/detail";

type Board = {
  index: number;
  boardNo: string;
  photo: string;
  elementName: string;
  width: number;
  height: number;
  unit: string;
  quantity: number;
  sqft: number;
  remark: string;
  installedPhotos: number;
  rate?: number;
  cost?: number;
};
type DIStore = {
  _id: string;
  storeId: string;
  dealerCode: string;
  storeName: string;
  clientCode: string;
  clientName: string;
  location?: { city?: string; state?: string; district?: string; address?: string };
  currentStatus: string;
  installer: { _id: string; name: string } | null;
  createdBy: { name: string } | null;
  createdAt: string;
  installedAt?: string;
  boards: Board[];
  boardCount: number;
  photosMissing: number;
  totalSqft: number;
  totalCost?: number;
};
type Options = { clientCodes: string[]; cities: string[]; states: string[]; installers: Array<{ _id: string; name: string }> };

const STATUS_TILES = [
  { key: "", label: "All" },
  { key: "INSTALLATION_ASSIGNED", label: "To install" },
  { key: "INSTALLATION_SUBMITTED", label: "Installed, to review" },
  { key: "COMPLETED", label: "Completed" },
  { key: "INSTALLATION_REJECTED", label: "Installation rejected" },
] as const;
const TILE_TONE: Record<string, any> = {
  "": "neutral",
  INSTALLATION_ASSIGNED: "info",
  INSTALLATION_SUBMITTED: "violet",
  COMPLETED: "success",
  INSTALLATION_REJECTED: "danger",
};

// useSearchParams needs a Suspense boundary in the app router
export default function DirectInstallationPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={8} cols={8} />}>
      <DirectInstallationList />
    </Suspense>
  );
}

function DirectInstallationList() {
  const s = useSurface();
  const inputClass = useInputClass();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { getFullImageUrl } = useImageService();
  const lightbox = useLightbox();
  const showMoney = isAdminRole(user);
  const canUpload = hasPermission("stores", "create");
  const canEdit = hasPermission("stores", "edit");

  const [stores, setStores] = useState<DIStore[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [options, setOptions] = useState<Options>({ clientCodes: [], cities: [], states: [], installers: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Filters (batch comes from the upload page: "view what I just uploaded")
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [clients, setClients] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [installerNames, setInstallerNames] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [photosMissing, setPhotosMissing] = useState(false);
  const [batchId, setBatchId] = useState(searchParams.get("batch") || "");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    api.get("/direct-installations/filters").then((r) => setOptions(r.data)).catch(() => {});
  }, []);

  const installerIds = useMemo(
    () => options.installers.filter((u) => installerNames.includes(u.name)).map((u) => u._id),
    [options.installers, installerNames]
  );

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (status) p.set("status", status);
    if (clients.length) p.set("clientCode", clients.join(","));
    if (cities.length) p.set("city", cities.join(","));
    if (states.length) p.set("state", states.join(","));
    if (installerIds.length) p.set("installer", installerIds.join(","));
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (photosMissing) p.set("photos", "missing");
    if (batchId) p.set("batchId", batchId);
    return p;
  }, [search, status, clients, cities, states, installerIds, from, to, photosMissing, batchId]);

  // Any filter change goes back to page 1
  const filterKey = params.toString();
  const lastKey = useRef(filterKey);
  useEffect(() => {
    if (lastKey.current !== filterKey) {
      lastKey.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  const fetchStores = useCallback(async () => {
    setRefreshing(true);
    try {
      const p = new URLSearchParams(params);
      p.set("page", String(page));
      p.set("limit", String(limit));
      const { data } = await api.get(`/direct-installations?${p.toString()}`);
      setStores(data.stores || []);
      setStatusCounts(data.statusCounts || {});
      setPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load direct installations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params, page, limit]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const activeFilters =
    [search, status, from, to, batchId].filter(Boolean).length + clients.length + cities.length + states.length + installerNames.length + (photosMissing ? 1 : 0);
  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setClients([]);
    setCities([]);
    setStates([]);
    setInstallerNames([]);
    setFrom("");
    setTo("");
    setPhotosMissing(false);
    setBatchId("");
    if (searchParams.get("batch")) router.replace("/direct-installation");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/direct-installations/export?${params.toString()}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Direct_Installation_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Add or replace one board's recce photo
  const [uploadingKey, setUploadingKey] = useState("");
  const uploadPhoto = async (store: DIStore, board: Board, file: File) => {
    const key = `${store._id}:${board.index}`;
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("photo", await compressImage(file), file.name.replace(/\.[^.]+$/, "") + ".jpg");
      const { data } = await api.post(`/direct-installations/${store._id}/boards/${board.index}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStores((prev) =>
        prev.map((st) =>
          st._id !== store._id
            ? st
            : {
                ...st,
                boards: st.boards.map((b) => (b.index === board.index ? { ...b, photo: data.photo } : b)),
                photosMissing: st.boards.filter((b) => (b.index === board.index ? false : !b.photo)).length,
              }
        )
      );
      toast.success(`Photo saved for board ${board.boardNo}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Photo upload failed");
    } finally {
      setUploadingKey("");
    }
  };

  const tiles = STATUS_TILES.map((t) => ({
    key: t.key || "ALL",
    label: t.label,
    tone: TILE_TONE[t.key],
    value: t.key ? statusCounts[t.key] || 0 : Object.values(statusCounts).reduce((a, b) => a + b, 0),
  }));

  return (
    <div className="space-y-5 pb-10">
      <RefreshBar active={refreshing && !loading} />
      <PageIntro
        icon={<Zap className="h-6 w-6 text-yellow-500" />}
        title="Direct Installation"
        description="Stores whose recce was done outside the app. Their boards come in through Excel, already approved, and go straight to the installer."
        actions={
          <>
            <Btn icon={<Download className="h-4 w-4" />} loading={exporting} onClick={handleExport} disabled={total === 0}>
              Export Excel
            </Btn>
            {canUpload && (
              <Btn variant="primary" icon={<Upload className="h-4 w-4" />} onClick={() => router.push("/direct-installation/upload")}>
                Bulk upload
              </Btn>
            )}
          </>
        }
      />

      {batchId && (
        <ScopeNote action={<button type="button" className="text-sm font-semibold underline-offset-2 hover:underline" onClick={resetFilters}>Show all</button>}>
          Showing only the stores from your last upload.
        </ScopeNote>
      )}

      <StatTiles items={tiles} active={status || "ALL"} onSelect={(k) => setStatus(k === "ALL" ? "" : k)} />

      {/* Filters */}
      <div className={cx("rounded-xl border p-3", s.card)}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className={cx("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", s.faint)} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search store, dealer code, store ID, city…"
              className={cx(inputClass, "pl-9")}
              aria-label="Search"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterDropdown label="Client" options={options.clientCodes} selected={clients} onChange={setClients} />
            <FilterDropdown label="State" options={options.states} selected={states} onChange={setStates} />
            <FilterDropdown label="City" options={options.cities} selected={cities} onChange={setCities} />
            <FilterDropdown label="Installer" options={options.installers.map((u) => u.name)} selected={installerNames} onChange={setInstallerNames} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <label className={cx("flex items-center gap-2", s.muted)}>
            Uploaded from
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={cx(inputClass, "w-auto py-1.5")} />
          </label>
          <label className={cx("flex items-center gap-2", s.muted)}>
            to
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={cx(inputClass, "w-auto py-1.5")} />
          </label>
          <label className={cx("ml-1 flex cursor-pointer items-center gap-2", s.body)}>
            <input type="checkbox" checked={photosMissing} onChange={(e) => setPhotosMissing(e.target.checked)} className="h-4 w-4 accent-yellow-500" />
            Missing recce photos only
          </label>
          {activeFilters > 0 && (
            <button type="button" onClick={resetFilters} className={cx("ml-auto inline-flex items-center gap-1 font-semibold", s.muted)}>
              <X className="h-3.5 w-3.5" /> Reset filters ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={8} cols={8} />
      ) : stores.length === 0 ? (
        <EmptyBlock
          icon={<Zap className="h-8 w-8" />}
          title={activeFilters ? "No direct installations match these filters" : "No direct installations yet"}
          hint={activeFilters ? "Try removing a filter." : "Upload an Excel sheet with one row per board and a photo for each board."}
          action={
            activeFilters ? (
              <Btn onClick={resetFilters}>Reset filters</Btn>
            ) : canUpload ? (
              <Btn variant="primary" icon={<Upload className="h-4 w-4" />} onClick={() => router.push("/direct-installation/upload")}>
                Bulk upload
              </Btn>
            ) : undefined
          }
        />
      ) : (
        <div className={cx("overflow-hidden rounded-xl border", s.card)}>
          <ul className={cx("divide-y", s.dark ? "divide-gray-800" : "divide-gray-100")}>
            {stores.map((st) => {
              const open = expanded.has(st._id);
              return (
                <li key={st._id}>
                  {/* Store row */}
                  <div className="grid grid-cols-[auto_1fr] gap-3 px-3 py-3 sm:px-4 lg:grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
                    <button
                      type="button"
                      onClick={() => toggle(st._id)}
                      aria-expanded={open}
                      aria-label={open ? "Hide boards" : "Show boards"}
                      className={cx("mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border lg:mt-0", s.dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50")}
                    >
                      <ChevronDown className={cx("h-4 w-4 transition-transform", open && "rotate-180")} />
                    </button>
                    <div className="min-w-0">
                      <Link href={`/store/${st._id}`} className={cx("block truncate font-semibold hover:underline", s.text)}>
                        {st.storeName || "Unnamed store"}
                      </Link>
                      <p className={cx("truncate text-xs", s.muted)}>
                        {st.dealerCode}
                        {st.storeId && <> · {st.storeId}</>} · {st.clientName || st.clientCode}
                      </p>
                    </div>
                    <div className={cx("col-start-2 text-sm lg:col-start-auto", s.body)}>
                      <p className="truncate">{[st.location?.city, st.location?.state].filter(Boolean).join(", ") || "—"}</p>
                      <p className={cx("truncate text-xs", s.muted)}>Installer: {st.installer?.name || "—"}</p>
                    </div>
                    <div className="col-start-2 text-sm lg:col-start-auto">
                      <p className={s.body}>
                        <span className="font-semibold tabular-nums">{st.boardCount}</span> board{st.boardCount === 1 ? "" : "s"} ·{" "}
                        <span className="tabular-nums">{st.totalSqft}</span> sq.ft
                      </p>
                      {st.photosMissing > 0 ? (
                        <Badge tone="warning" icon={<ImageOff className="h-3 w-3" />}>
                          {st.photosMissing} photo{st.photosMissing === 1 ? "" : "s"} missing
                        </Badge>
                      ) : (
                        <p className={cx("text-xs", s.muted)}>All recce photos in</p>
                      )}
                    </div>
                    <div className="col-start-2 lg:col-start-auto">
                      <StatusBadge status={st.currentStatus} />
                      <p className={cx("mt-1 text-xs", s.muted)}>
                        Uploaded {formatDate(st.createdAt)}
                        {st.createdBy?.name && <> by {st.createdBy.name}</>}
                      </p>
                    </div>
                    <div className={cx("col-start-2 text-sm font-semibold tabular-nums lg:col-start-auto lg:text-right", s.text)}>
                      {showMoney && st.totalCost !== undefined ? formatINR(st.totalCost) : null}
                    </div>
                  </div>

                  {/* Boards */}
                  {open && (
                    <div className={cx("border-t px-3 py-3 sm:px-4", s.dark ? "border-gray-800 bg-gray-950/40" : "border-gray-100 bg-gray-50/60")}>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {st.boards.map((b) => {
                          const busy = uploadingKey === `${st._id}:${b.index}`;
                          const src = b.photo ? getFullImageUrl(b.photo) : "";
                          return (
                            <div key={b.index} className={cx("overflow-hidden rounded-lg border", s.card)}>
                              <PhotoTile
                                src={src}
                                alt={`Board ${b.boardNo}`}
                                onOpen={() =>
                                  lightbox.open(
                                    st.boards.filter((x) => x.photo).map((x) => ({ src: getFullImageUrl(x.photo), caption: `Board ${x.boardNo} · ${x.elementName}` })),
                                    st.boards.filter((x) => x.photo).findIndex((x) => x.index === b.index)
                                  )
                                }
                                className="rounded-none border-0"
                                empty={
                                  <>
                                    <ImageOff className="h-5 w-5" />
                                    No recce photo
                                  </>
                                }
                                overlay={<Badge tone="neutral">Board {b.boardNo}</Badge>}
                              />
                              <div className="space-y-1 p-3 text-sm">
                                <p className={cx("font-semibold", s.text)}>{b.elementName || "—"}</p>
                                <p className={s.muted}>
                                  {b.width} × {b.height} {b.unit} · Qty {b.quantity} · {b.sqft} sq.ft
                                </p>
                                {showMoney && b.rate !== undefined && (
                                  <p className={s.muted}>
                                    {formatINR(b.rate)}/sq.ft · <span className={cx("font-semibold", s.text)}>{formatINR(b.cost)}</span>
                                  </p>
                                )}
                                {b.remark && <p className={cx("text-xs", s.muted)}>{b.remark}</p>}
                                <p className={cx("text-xs", s.muted)}>
                                  {b.installedPhotos > 0 ? `${b.installedPhotos} installation photo${b.installedPhotos === 1 ? "" : "s"}` : "Not installed yet"}
                                </p>
                                {canEdit && (
                                  <label
                                    className={cx(
                                      "mt-1 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold",
                                      busy ? "opacity-60" : "hover:underline",
                                      b.photo ? s.body : "text-amber-600"
                                    )}
                                  >
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    {busy ? "Uploading…" : b.photo ? "Replace photo" : "Add photo"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      disabled={busy}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        e.target.value = "";
                                        if (f) uploadPhoto(st, b, f);
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          <div className={cx("flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm", s.divider, s.muted)}>
            <span>
              {total} store{total === 1 ? "" : "s"} · page {page} of {pages}
            </span>
            <div className="flex items-center gap-2">
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={cx(inputClass, "w-auto py-1.5")} aria-label="Rows per page">
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
              <Btn size="sm" icon={<ChevronLeft className="h-4 w-4" />} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Btn>
              <Btn size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Btn>
            </div>
          </div>
        </div>
      )}
      {lightbox.node}
    </div>
  );
}
