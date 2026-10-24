"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FolderOpen,
  ImageOff,
  Images,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import api from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { isAdminRole } from "@/src/lib/roles";
import { compressImage } from "@/src/lib/imageCompress";
import { Badge, Btn, NotFound, PageIntro, ProgressBar, Section, StatTiles, cx, formatINR, useSurface } from "@/src/components/detail";

/* Same rules as the API: names compare on letters/digits only, extension ignored. */
const squash = (v: any) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const photoKey = (name: string) => squash(name.replace(/\.[a-z0-9]{2,5}$/i, ""));
const dealerOf = (row: Record<string, any>) => {
  const k = Object.keys(row).find((h) => squash(h) === "dealercode");
  return k ? String(row[k] ?? "").trim() : "";
};

type VBoard = {
  rowNumber: number;
  boardNo: string;
  elementName: string;
  width: number;
  height: number;
  unit: string;
  quantity: number;
  sqft: number;
  rate?: number;
  cost?: number;
  photoKeys: string[];
};
type VStore = {
  key: string;
  dealerCode: string;
  storeName: string;
  clientCode: string;
  clientName: string;
  city: string;
  district: string;
  installerName: string;
  rowNumbers: number[];
  boards: VBoard[];
  totalSqft: number;
  totalCost?: number;
  errors: string[];
};
type Validation = { stores: VStore[]; errors: Array<{ row: number; message: string }>; rowCount: number };
type Outcome = {
  state: "waiting" | "working" | "done" | "failed";
  message?: string;
  storeDbId?: string;
  failedBoards?: Array<{ index: number; boardNo: string; keys: string[] }>;
};

export default function DirectInstallationUploadPage() {
  const s = useSurface();
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const showMoney = isAdminRole(user);

  const [excelName, setExcelName] = useState("");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [skippedExamples, setSkippedExamples] = useState(0);
  const [photos, setPhotos] = useState<Map<string, File>>(new Map());
  const [validation, setValidation] = useState<Validation | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [importing, setImporting] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [batchId, setBatchId] = useState("");

  /* ---------------- step 1: template ---------------- */
  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/direct-installations/template", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "Direct_Installation_Template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the template");
    } finally {
      setDownloading(false);
    }
  };

  /* ---------------- step 2: excel ---------------- */
  const onExcel = async (file?: File) => {
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets["Direct Installation"] || wb.Sheets[wb.SheetNames[0]];
      // blankrows keeps indexes aligned with Excel row numbers (header = row 1)
      const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "", raw: false, blankrows: true });
      const withRows = raw.map((r, i) => ({ ...r, __rowNumber: i + 2 }));
      const examples = withRows.filter((r) => squash(dealerOf(r)) === "demo001");
      const real = withRows.filter((r) => squash(dealerOf(r)) !== "demo001" && Object.entries(r).some(([k, v]) => k !== "__rowNumber" && String(v).trim()));
      if (real.length === 0) {
        toast.error("No rows found in the sheet");
        return;
      }
      setExcelName(file.name);
      setRows(real);
      setSkippedExamples(examples.length);
      setValidation(null);
      setOutcomes({});
      await validate(real);
    } catch (e) {
      console.error(e);
      toast.error("Could not read this Excel file");
    }
  };

  const validate = async (data = rows) => {
    setChecking(true);
    try {
      const { data: res } = await api.post("/direct-installations/validate", { rows: data });
      setValidation(res);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not check the file");
    } finally {
      setChecking(false);
    }
  };

  /* ---------------- step 3: photos ---------------- */
  const onPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    setPhotos((prev) => {
      const next = new Map(prev);
      Array.from(files)
        .filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name))
        .forEach((f) => next.set(photoKey(f.name), f));
      return next;
    });
  };
  const fileFor = (b: VBoard) => b.photoKeys.map((k) => photos.get(k)).find(Boolean);

  /* ---------------- summary ---------------- */
  const summary = useMemo(() => {
    const stores = validation?.stores || [];
    const boards = stores.flatMap((st) => st.boards);
    const missing = boards.filter((b) => !fileFor(b)).length;
    return {
      stores: stores.length,
      boards: boards.length,
      errors: validation?.errors.length || 0,
      missing,
      cost: stores.reduce((a, st) => a + (st.totalCost || 0), 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation, photos]);

  const ready = !!validation && summary.stores > 0 && summary.errors === 0 && summary.missing === 0;
  const doneCount = Object.values(outcomes).filter((o) => o.state === "done").length;
  const failedCount = Object.values(outcomes).filter((o) => o.state === "failed").length;
  const finished = !importing && Object.keys(outcomes).length > 0;

  /* ---------------- import ---------------- */
  const uploadBoardPhotos = async (storeDbId: string, boards: Array<{ index: number; boardNo: string; keys: string[] }>) => {
    const failed: typeof boards = [];
    const queue = [...boards];
    const worker = async () => {
      while (queue.length) {
        const b = queue.shift()!;
        const file = b.keys.map((k) => photos.get(k)).find(Boolean);
        try {
          if (!file) throw new Error("photo not selected");
          const fd = new FormData();
          fd.append("photo", await compressImage(file), file.name.replace(/\.[^.]+$/, "") + ".jpg");
          await api.post(`/direct-installations/${storeDbId}/boards/${b.index}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } catch {
          failed.push(b);
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    return failed;
  };

  const runImport = async (only?: string[]) => {
    if (!validation) return;
    const id = batchId || `DI-${Date.now()}`;
    setBatchId(id);
    setImporting(true);
    const targets = validation.stores.filter((st) => !only || only.includes(st.key));
    for (const st of targets) {
      setOutcomes((o) => ({ ...o, [st.key]: { ...o[st.key], state: "working", message: undefined } }));
      const prev = outcomes[st.key];
      try {
        let storeDbId = prev?.storeDbId;
        let boards = prev?.failedBoards;
        if (!storeDbId) {
          const storeRows = rows.filter((r) => dealerOf(r).toLowerCase() === st.key);
          const { data } = await api.post("/direct-installations", { rows: storeRows, batchId: id });
          storeDbId = data.store._id as string;
          boards = (data.boards || []).map((b: any) => ({ index: b.index, boardNo: b.boardNo, keys: b.photoKeys }));
        }
        const failedBoards = await uploadBoardPhotos(storeDbId!, boards || []);
        setOutcomes((o) => ({
          ...o,
          [st.key]: failedBoards.length
            ? { state: "failed", storeDbId, failedBoards, message: `Store created, but ${failedBoards.length} photo${failedBoards.length === 1 ? "" : "s"} failed: board ${failedBoards.map((b) => b.boardNo).join(", ")}` }
            : { state: "done", storeDbId },
        }));
      } catch (e: any) {
        setOutcomes((o) => ({ ...o, [st.key]: { ...o[st.key], state: "failed", message: e?.response?.data?.message || e?.message || "Failed" } }));
      }
    }
    setImporting(false);
  };

  const failedKeys = Object.entries(outcomes).filter(([, o]) => o.state === "failed").map(([k]) => k);
  const reset = () => {
    setExcelName("");
    setRows([]);
    setPhotos(new Map());
    setValidation(null);
    setOutcomes({});
    setBatchId("");
  };

  const toggle = (k: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const stepCard = (n: number, done: boolean, title: string, hint: string, body: React.ReactNode) => (
    <div className={cx("rounded-xl border p-4", s.card)}>
      <div className="flex items-start gap-3">
        <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold", done ? "bg-emerald-500 text-white" : "bg-yellow-400 text-gray-950")}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cx("font-semibold", s.text)}>{title}</p>
          <p className={cx("mt-0.5 text-sm", s.muted)}>{hint}</p>
          <div className="mt-3">{body}</div>
        </div>
      </div>
    </div>
  );

  if (!hasPermission("stores", "create")) {
    return <NotFound title="You can't upload stores" hint="Ask an admin for permission to create stores." backHref="/direct-installation" backLabel="Back to Direct Installation" />;
  }

  return (
    <div className="space-y-5 pb-28">
      <button type="button" onClick={() => router.push("/direct-installation")} className={cx("inline-flex items-center gap-1 text-sm font-semibold", s.muted)}>
        <ArrowLeft className="h-4 w-4" /> Direct Installation
      </button>
      <PageIntro
        icon={<Zap className="h-6 w-6 text-yellow-500" />}
        title="Upload direct installations"
        description="One row per board, plus one recce photo per board. Each store is created with its recce submitted and approved, and assigned to the installer you name."
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {stepCard(
          1,
          false,
          "Download the template",
          "It lists your clients, their elements and the installer names to use.",
          <Btn icon={<Download className="h-4 w-4" />} loading={downloading} onClick={downloadTemplate}>
            Template (.xlsx)
          </Btn>
        )}
        {stepCard(
          2,
          !!validation,
          "Choose the filled Excel",
          "We check every row before anything is saved.",
          <div className="space-y-2">
            <label className={cx("inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold", s.dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50", importing && "pointer-events-none opacity-50")}>
              <FileSpreadsheet className="h-4 w-4" /> {excelName ? "Choose another file" : "Choose Excel"}
              <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => { onExcel(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            {excelName && (
              <p className={cx("text-sm", s.body)}>
                {excelName} · {rows.length} row{rows.length === 1 ? "" : "s"}
                {skippedExamples > 0 && <span className={s.muted}> (example rows skipped)</span>}
              </p>
            )}
          </div>
        )}
        {stepCard(
          3,
          !!validation && summary.missing === 0 && summary.boards > 0,
          "Add the recce photos",
          "Name each photo DEALERCODE_BOARDNO, e.g. D1023_1.jpg, or use the Photo File Name column.",
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <label className={cx("inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold", s.dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50", importing && "pointer-events-none opacity-50")}>
                <Images className="h-4 w-4" /> Choose photos
                <input type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
              </label>
              <label className={cx("inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold", s.dark ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50", importing && "pointer-events-none opacity-50")}>
                <FolderOpen className="h-4 w-4" /> Choose folder
                {/* @ts-expect-error webkitdirectory is supported by Chrome, Edge and Safari */}
                <input type="file" webkitdirectory="" multiple className="sr-only" onChange={(e) => { onPhotos(e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            {photos.size > 0 && (
              <p className={cx("text-sm", s.body)}>
                {photos.size} photo{photos.size === 1 ? "" : "s"} selected{" "}
                <button type="button" className={cx("ml-1 text-xs font-semibold underline", s.muted)} onClick={() => setPhotos(new Map())} disabled={importing}>
                  clear
                </button>
              </p>
            )}
          </div>
        )}
      </div>

      {checking && (
        <p className={cx("flex items-center gap-2 text-sm", s.muted)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Checking rows…
        </p>
      )}

      {validation && (
        <>
          <StatTiles
            items={[
              { key: "stores", label: "Stores", value: summary.stores, tone: "info" },
              { key: "boards", label: "Boards", value: summary.boards, tone: "violet" },
              { key: "errors", label: "Row errors", value: summary.errors, tone: summary.errors ? "danger" : "success" },
              { key: "missing", label: "Photos missing", value: summary.missing, tone: summary.missing ? "warning" : "success" },
              ...(showMoney ? [{ key: "cost", label: "Board cost", value: formatINR(summary.cost), tone: "brand" as const }] : []),
            ]}
          />

          {summary.errors > 0 && (
            <Section title={`Fix ${summary.errors} problem${summary.errors === 1 ? "" : "s"} in the Excel`} icon={<AlertTriangle className="h-4 w-4 text-red-500" />}>
              <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
                {validation.errors.map((e, i) => (
                  <li key={i} className={s.body}>
                    <span className="mr-2 inline-block min-w-[4.5rem] font-mono text-xs font-semibold text-red-600">Row {e.row}</span>
                    {e.message}
                  </li>
                ))}
              </ul>
              <p className={cx("mt-3 text-sm", s.muted)}>Fix the file, then choose it again.</p>
            </Section>
          )}

          {/* Stores preview */}
          <div className={cx("overflow-hidden rounded-xl border", s.card)}>
            <ul className={cx("divide-y", s.dark ? "divide-gray-800" : "divide-gray-100")}>
              {validation.stores.map((st) => {
                const matched = st.boards.filter((b) => fileFor(b)).length;
                const o = outcomes[st.key];
                const open = expanded.has(st.key);
                return (
                  <li key={st.key}>
                    <button type="button" onClick={() => toggle(st.key)} className={cx("flex w-full items-center gap-3 px-4 py-3 text-left", s.hover)}>
                      <ChevronDown className={cx("h-4 w-4 shrink-0 transition-transform", open && "rotate-180", s.muted)} />
                      <div className="min-w-0 flex-1">
                        <p className={cx("truncate font-semibold", s.text)}>
                          {st.storeName || "—"} <span className={cx("font-normal", s.muted)}>· {st.dealerCode}</span>
                        </p>
                        <p className={cx("truncate text-xs", s.muted)}>
                          {st.clientName || st.clientCode} · {[st.city, st.district].filter(Boolean).join(", ")} · Installer: {st.installerName || "—"} · rows{" "}
                          {st.rowNumbers.join(", ")}
                        </p>
                        {o?.message && <p className={cx("mt-0.5 text-xs font-medium", o.state === "failed" ? "text-red-600" : s.muted)}>{o.message}</p>}
                      </div>
                      <span className={cx("hidden text-sm tabular-nums sm:block", s.body)}>
                        {st.boards.length} board{st.boards.length === 1 ? "" : "s"}
                      </span>
                      {o ? (
                        o.state === "done" ? (
                          <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>Imported</Badge>
                        ) : o.state === "working" ? (
                          <Badge tone="info" icon={<Loader2 className="h-3 w-3 animate-spin" />}>Uploading</Badge>
                        ) : o.state === "failed" ? (
                          <Badge tone="danger" icon={<XCircle className="h-3 w-3" />}>Failed</Badge>
                        ) : (
                          <Badge tone="neutral">Waiting</Badge>
                        )
                      ) : st.errors.length ? (
                        <Badge tone="danger">{st.errors.length} error{st.errors.length === 1 ? "" : "s"}</Badge>
                      ) : (
                        <Badge tone={matched === st.boards.length ? "success" : "warning"}>
                          {matched}/{st.boards.length} photos
                        </Badge>
                      )}
                    </button>
                    {open && (
                      <div className={cx("border-t px-4 py-3", s.dark ? "border-gray-800 bg-gray-950/40" : "border-gray-100 bg-gray-50/60")}>
                        {st.errors.length > 0 && (
                          <ul className="mb-3 space-y-0.5 text-sm text-red-600">
                            {st.errors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[560px] text-sm">
                            <thead>
                              <tr className={cx("text-left text-xs", s.muted)}>
                                <th className="py-1 pr-3">Board</th>
                                <th className="py-1 pr-3">Element</th>
                                <th className="py-1 pr-3">Size</th>
                                <th className="py-1 pr-3">Qty</th>
                                <th className="py-1 pr-3">Sq.ft</th>
                                {showMoney && <th className="py-1 pr-3">Cost</th>}
                                <th className="py-1">Photo</th>
                              </tr>
                            </thead>
                            <tbody className={s.body}>
                              {st.boards.map((b) => {
                                const f = fileFor(b);
                                return (
                                  <tr key={b.boardNo}>
                                    <td className="py-1 pr-3 font-semibold">{b.boardNo}</td>
                                    <td className="py-1 pr-3">{b.elementName || "—"}</td>
                                    <td className="py-1 pr-3 tabular-nums">{b.width} × {b.height} {b.unit}</td>
                                    <td className="py-1 pr-3 tabular-nums">{b.quantity}</td>
                                    <td className="py-1 pr-3 tabular-nums">{b.sqft}</td>
                                    {showMoney && <td className="py-1 pr-3 tabular-nums">{formatINR(b.cost)}</td>}
                                    <td className="py-1">
                                      {f ? (
                                        <span className="text-emerald-600">{f.name}</span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-amber-600">
                                          <ImageOff className="h-3.5 w-3.5" /> needs {b.photoKeys[b.photoKeys.length - 1].toUpperCase()}.jpg
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {/* Sticky action bar */}
      {validation && (
        <div className={cx("fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 backdrop-blur md:left-72 sm:px-6", s.dark ? "bg-gray-950/95 border-gray-800" : "bg-white/95 border-gray-200")}>
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 text-sm">
              {importing || finished ? (
                <>
                  <p className={s.body}>
                    {importing ? "Uploading… " : "Finished. "}
                    {doneCount} of {Object.keys(outcomes).length} stores imported{failedCount > 0 && `, ${failedCount} failed`}.
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar
                      total={Math.max(1, Object.keys(outcomes).length)}
                      segments={[
                        { value: doneCount, tone: "success", label: "Imported" },
                        { value: failedCount, tone: "danger", label: "Failed" },
                      ]}
                    />
                  </div>
                </>
              ) : summary.errors > 0 ? (
                <p className="font-medium text-red-600">Fix the Excel errors above, then choose the file again.</p>
              ) : summary.missing > 0 ? (
                <p className="font-medium text-amber-600">
                  {summary.missing} board{summary.missing === 1 ? " has" : "s have"} no photo yet. Every board needs its recce photo.
                </p>
              ) : (
                <p className={s.body}>
                  Ready: {summary.stores} store{summary.stores === 1 ? "" : "s"}, {summary.boards} board{summary.boards === 1 ? "" : "s"}. Recce will be marked approved and sent to the installers.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {finished ? (
                <>
                  {failedCount > 0 && (
                    <Btn icon={<RotateCcw className="h-4 w-4" />} onClick={() => runImport(failedKeys)}>
                      Retry failed
                    </Btn>
                  )}
                  <Btn onClick={reset}>Upload another</Btn>
                  <Btn variant="primary" onClick={() => router.push(`/direct-installation?batch=${encodeURIComponent(batchId)}`)}>
                    View uploaded stores
                  </Btn>
                </>
              ) : (
                <Btn
                  variant="primary"
                  icon={<Upload className="h-4 w-4" />}
                  loading={importing}
                  disabled={!ready}
                  onClick={() => {
                    setOutcomes(Object.fromEntries(validation.stores.map((st) => [st.key, { state: "waiting" } as Outcome])));
                    runImport();
                  }}
                >
                  Import {summary.stores} store{summary.stores === 1 ? "" : "s"}
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
