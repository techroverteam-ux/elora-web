"use client";

// Pieces for list pages and the app shell that explain where stores are in the workflow.

import React, { useEffect, useState } from "react";
import { ArrowRight, HelpCircle, Info, RotateCcw, X } from "lucide-react";
import api from "@/src/lib/api";
import { Badge, Dialog, useSurface, cx } from "./kit";
import { REDO_STAGES, STAGES, Stage, Tone, statusMeta, toneClasses, enquiryMeta, activeMeta, assignmentMeta } from "./status";

/* ------------------------------------------------------------------ */
/* Page intro                                                          */
/* ------------------------------------------------------------------ */

export const PageIntro = ({
  title,
  description,
  actions,
  icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  const s = useSurface();
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <h1 className={cx("flex items-center gap-2 text-2xl font-bold", s.text)}>
          {icon}
          {title}
        </h1>
        {description && <p className={cx("mt-1 max-w-2xl text-sm", s.muted)}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
};

/** One line telling the user what the list is showing, and how to see more. */
export const ScopeNote = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => {
  const s = useSurface();
  return (
    <div
      className={cx(
        "flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center",
        s.dark ? "border-blue-900 bg-blue-950/40 text-blue-100" : "border-blue-200 bg-blue-50 text-blue-900"
      )}
    >
      <Info className="hidden h-4 w-4 shrink-0 sm:block" />
      <p className="flex-1">{children}</p>
      {action}
    </div>
  );
};

export const LinkBtn = ({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) => (
  <button type="button" onClick={onClick} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold underline-offset-2 hover:underline">
    {icon ?? <RotateCcw className="h-3.5 w-3.5" />}
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Status cells                                                        */
/* ------------------------------------------------------------------ */

/** Store status badge with the "who acts next" line underneath. */
export const StatusCell = ({ status, hideNext }: { status?: string; hideNext?: boolean }) => {
  const m = statusMeta(status);
  const s = useSurface();
  return (
    <div className="flex flex-col items-start gap-1" title={m.next}>
      <Badge tone={m.tone} dot>
        {m.label}
      </Badge>
      {!hideNext && m.short && <span className={cx("text-xs", s.muted)}>{m.short}</span>}
    </div>
  );
};

export const EnquiryStatus = ({ status, showNext }: { status?: string; showNext?: boolean }) => {
  const m = enquiryMeta(status);
  const s = useSurface();
  return (
    <span className="inline-flex flex-col items-start gap-0.5" title={m.next}>
      <Badge tone={m.tone} dot>
        {m.label}
      </Badge>
      {showNext && m.next && <span className={cx("text-xs", s.muted)}>{m.next}</span>}
    </span>
  );
};

export const ActiveBadge = ({ active }: { active?: boolean }) => {
  const m = activeMeta(active);
  return (
    <span title={m.next}>
      <Badge tone={m.tone} dot>
        {m.label}
      </Badge>
    </span>
  );
};

export const AssignmentStatus = ({ status }: { status?: string }) => {
  const m = assignmentMeta(status);
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
};

/* ------------------------------------------------------------------ */
/* Stage counts                                                        */
/* ------------------------------------------------------------------ */

/**
 * Store counts per status, from the dashboard stats endpoint the app already uses.
 * Read-only; if it fails the strip simply shows no numbers.
 */
export const useStatusCounts = (enabled = true) => {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    api
      .get("/dashboard/stats")
      .then(({ data }) => {
        if (!alive || !Array.isArray(data?.statusBreakdown)) return;
        const map: Record<string, number> = {};
        data.statusBreakdown.forEach((r: { _id?: string; count?: number }) => {
          if (r?._id) map[r._id] = Number(r.count || 0);
        });
        setCounts(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return counts;
};

const sumFor = (stage: Stage, counts?: Record<string, number> | null) =>
  counts ? stage.statuses.reduce((n, st) => n + (counts[st] || 0), 0) : undefined;

/* ------------------------------------------------------------------ */
/* Stage strip                                                         */
/* ------------------------------------------------------------------ */

/**
 * The store lifecycle as a row of stages. Stages outside `scope` are dimmed, `selected`
 * statuses are highlighted, and with `onSelect` each stage filters the list.
 */
export const StageStrip = ({
  counts,
  scope,
  selected = [],
  onSelect,
  title = "Where stores are",
  hint,
  showClear,
}: {
  counts?: Record<string, number> | null;
  scope?: string[];
  selected?: string[];
  onSelect?: (statuses: string[]) => void;
  title?: string;
  hint?: React.ReactNode;
  showClear?: boolean;
}) => {
  const s = useSurface();
  const inScope = (st: Stage) => !scope || st.statuses.some((x) => scope.includes(x));
  const isSel = (st: Stage) => selected.length > 0 && st.statuses.every((x) => selected.includes(x));

  const pill = (st: Stage, i: number, arrow: boolean) => {
    const t = toneClasses(st.tone, s.dark);
    const n = sumFor(st, counts);
    const enabled = inScope(st);
    const active = isSel(st);
    const Comp = onSelect && enabled ? "button" : "div";
    return (
      <React.Fragment key={st.key}>
        <Comp
          {...(onSelect && enabled ? { type: "button" as const, onClick: () => onSelect(active ? [] : st.statuses), "aria-pressed": active } : {})}
          title={`${st.label}: ${st.what} (${st.owner} acts)`}
          className={cx(
            "group flex min-w-[118px] flex-1 flex-col rounded-lg border px-3 py-2 text-left transition-colors",
            enabled ? "" : "opacity-40",
            active ? "border-yellow-400 ring-2 ring-yellow-400/40" : s.dark ? "border-gray-800" : "border-gray-200",
            s.dark ? "bg-gray-900" : "bg-white",
            onSelect && enabled && (s.dark ? "hover:bg-gray-800" : "hover:bg-gray-50")
          )}
        >
          <span className="flex items-center gap-1.5">
            <span className={cx("h-2 w-2 shrink-0 rounded-full", t.dot)} />
            <span className={cx("truncate text-xs font-semibold", s.body)}>{st.label}</span>
          </span>
          <span className="mt-0.5 flex items-baseline gap-1.5">
            {n !== undefined && <span className={cx("text-lg font-bold tabular-nums", s.text)}>{n}</span>}
            <span className={cx("truncate text-[11px]", s.muted)}>{st.owner === "Nobody" ? "done" : `${st.owner} acts`}</span>
          </span>
        </Comp>
        {arrow && <ArrowRight className={cx("hidden h-4 w-4 shrink-0 self-center xl:block", s.faint)} />}
      </React.Fragment>
    );
  };

  return (
    <section className={cx("rounded-xl border p-3", s.card)} aria-label={title}>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        <h2 className={cx("text-sm font-bold", s.text)}>{title}</h2>
        {hint && <span className={cx("text-xs", s.muted)}>{hint}</span>}
        {onSelect && (showClear ?? selected.length > 0) && (
          <button type="button" onClick={() => onSelect([])} className={cx("ml-auto inline-flex items-center gap-1 text-xs font-semibold", s.muted)}>
            <X className="h-3.5 w-3.5" /> Clear stage
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 xl:overflow-visible">
        {STAGES.map((st, i) => pill(st, i, i < STAGES.length - 1))}
      </div>
      {REDO_STAGES.some(inScope) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
          <span className={cx("text-xs font-semibold", s.muted)}>Sent back for redo:</span>
          {REDO_STAGES.filter(inScope).map((st) => {
            const n = sumFor(st, counts);
            const active = isSel(st);
            const Comp = onSelect ? "button" : "span";
            return (
              <Comp
                key={st.key}
                {...(onSelect ? { type: "button" as const, onClick: () => onSelect(active ? [] : st.statuses), "aria-pressed": active } : {})}
                title={st.what}
                className={cx("rounded-full", active && "ring-2 ring-yellow-400/60")}
              >
                <Badge tone="danger" dot>
                  {st.label}
                  {n !== undefined && <span className="tabular-nums">· {n}</span>}
                </Badge>
              </Comp>
            );
          })}
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* "How it works" guide                                                */
/* ------------------------------------------------------------------ */

export const HowItWorks = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const s = useSurface();
  const row = (st: Stage, n: number | string) => {
    const t = toneClasses(st.tone, s.dark);
    return (
      <li key={st.key} className="flex gap-3">
        <span className={cx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", t.badge)}>{n}</span>
        <div className="min-w-0">
          <p className={cx("text-sm font-semibold", s.text)}>
            {st.label} <span className={cx("font-normal", s.muted)}>· {st.owner === "Nobody" ? "done" : `${st.owner} acts`}</span>
          </p>
          <p className={cx("text-sm", s.muted)}>{st.what}</p>
        </div>
      </li>
    );
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<HelpCircle className="h-5 w-5 text-yellow-500" />}
      title="How a store moves through Elora"
      description="Every store goes through these stages. The coloured status on each page tells you which stage it is in and who has to act."
    >
      <ol className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">{STAGES.map((st, i) => row(st, i + 1))}</ol>
      <div className={cx("mt-4 border-t pt-3", s.divider)}>
        <p className={cx("mb-2 text-xs font-semibold uppercase tracking-wide", s.muted)}>If work is rejected</p>
        <ol className="space-y-3">{REDO_STAGES.map((st) => row(st, "!"))}</ol>
      </div>
    </Dialog>
  );
};

