"use client";

// Download a store's recce / installation report as PDF, PPT or Excel.
// Uses the same endpoints as the Recce and Installation lists.

import React, { useEffect, useRef, useState } from "react";
import { Download, FileText, Presentation, FileSpreadsheet, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/src/lib/api";
import { Btn, useSurface, cx } from "./kit";

export type ReportType = "recce" | "installation";
export type ReportFormat = "pdf" | "ppt" | "excel";

const EXT: Record<ReportFormat, string> = { pdf: "pdf", ppt: "pptx", excel: "xlsx" };
const LABEL: Record<ReportFormat, string> = { pdf: "PDF", ppt: "PPT", excel: "Excel" };

/** Same calls the list pages make: POST /stores/{pdf|ppt}/bulk, GET /stores/:id/excel/:type. */
export const downloadStoreReport = async (storeId: string, dealerCode: string, type: ReportType, format: ReportFormat) => {
  const toastId = toast.loading(`Generating ${type} ${LABEL[format]}...`);
  try {
    const response =
      format === "excel"
        ? await api.get(`/stores/${storeId}/excel/${type}`, { responseType: "blob" })
        : await api.post(`/stores/${format}/bulk`, { storeIds: [storeId], type }, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    let filename = `${type.charAt(0).toUpperCase() + type.slice(1)}_${dealerCode || storeId}.${EXT[format]}`;
    const cd = response.headers?.["content-disposition"];
    const m = cd?.match(/filename="?(.+?)"?$/i);
    if (m) filename = m[1];
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    toast.success(`${LABEL[format]} downloaded`, { id: toastId });
  } catch (error: any) {
    // Error bodies come back as a Blob because of responseType: "blob".
    let message = `Failed to download ${LABEL[format]}.`;
    try {
      const data = error?.response?.data;
      if (data instanceof Blob) message = JSON.parse(await data.text())?.message || message;
      else if (data?.message) message = data.message;
    } catch {}
    toast.error(message, { id: toastId });
  }
};

/** "Download" button with a menu of report types and formats. */
export const ReportDownloadMenu = ({
  storeId,
  dealerCode,
  types = ["installation", "recce"],
  formats = ["pdf", "ppt", "excel"],
  notes,
  label = "Download",
}: {
  storeId: string;
  dealerCode: string;
  types?: ReportType[];
  formats?: ReportFormat[];
  /** Optional hint under a report heading, e.g. "No installed photos yet". */
  notes?: Partial<Record<ReportType, string>>;
  label?: string;
}) => {
  const s = useSurface();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (type: ReportType, format: ReportFormat) => {
    setOpen(false);
    setBusy(`${type}-${format}`);
    await downloadStoreReport(storeId, dealerCode, type, format);
    setBusy(null);
  };

  const icon = (f: ReportFormat) =>
    f === "pdf" ? <FileText className="h-4 w-4 text-red-500" /> : f === "ppt" ? <Presentation className="h-4 w-4 text-orange-500" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;

  return (
    <div className="relative" ref={ref}>
      <Btn
        variant="secondary"
        icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        disabled={!!busy}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="hidden sm:inline">{busy ? "Generating..." : label}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 sm:inline" />
      </Btn>
      {open && (
        <div
          role="menu"
          className={cx("absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border py-1 shadow-xl", s.dark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white")}
        >
          {types.map((t, ti) => (
            <div key={t} className={cx(ti > 0 && cx("mt-1 border-t pt-1", s.divider))}>
              <p className={cx("px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide", s.muted)}>{t === "installation" ? "Installation report" : "Recce report"}</p>
              {notes?.[t] && <p className={cx("px-3 pb-1 text-xs", s.faint)}>{notes[t]}</p>}
              {formats.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="menuitem"
                  onClick={() => run(t, f)}
                  className={cx("flex w-full items-center gap-2 px-3 py-2 text-left text-sm", s.body, s.hover)}
                >
                  {icon(f)}
                  {LABEL[f]}
                  <span className={cx("ml-auto text-xs", s.faint)}>.{EXT[f]}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
