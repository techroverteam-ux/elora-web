"use client";

// Shared building blocks for the store detail pages (Store, Recce, Recce review, Installation).
// Every piece reads dark mode from ThemeContext, because the app toggles dark mode with state
// rather than Tailwind's `dark:` variant.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";
import { Tone, statusMeta, toneClasses, approvalMeta } from "./status";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Surface tokens                                                      */
/* ------------------------------------------------------------------ */

export const useSurface = () => {
  const { darkMode } = useTheme();
  return {
    dark: darkMode,
    page: darkMode ? "bg-gray-950" : "bg-gray-50",
    card: darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
    sunken: darkMode ? "bg-gray-950/60 border-gray-800" : "bg-gray-50 border-gray-200",
    divider: darkMode ? "border-gray-800" : "border-gray-100",
    text: darkMode ? "text-gray-100" : "text-gray-900",
    body: darkMode ? "text-gray-300" : "text-gray-700",
    muted: darkMode ? "text-gray-400" : "text-gray-500",
    faint: darkMode ? "text-gray-500" : "text-gray-400",
    hover: darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100",
    input: darkMode
      ? "bg-gray-950 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/30"
      : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-yellow-500 focus:ring-yellow-500/30",
  };
};

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type BtnVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "ghost";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  block?: boolean;
}

export const Btn = ({
  variant = "secondary",
  size = "md",
  loading,
  icon,
  block,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: BtnProps) => {
  const s = useSurface();
  const variants: Record<BtnVariant, string> = {
    // Dark text on yellow: white on yellow-500 fails contrast.
    primary: "bg-yellow-400 text-gray-950 hover:bg-yellow-300 border-yellow-400 shadow-sm",
    secondary: s.dark
      ? "bg-gray-900 text-gray-100 border-gray-700 hover:bg-gray-800"
      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",
    success: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm",
    danger: "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm",
    warning: s.dark
      ? "bg-amber-950 text-amber-200 border-amber-800 hover:bg-amber-900"
      : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100",
    ghost: s.dark
      ? "bg-transparent text-gray-300 border-transparent hover:bg-gray-800"
      : "bg-transparent text-gray-600 border-transparent hover:bg-gray-100",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-5 text-base gap-2",
  };
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center rounded-lg border font-semibold transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        block && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};

export const IconBtn = ({
  label,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => {
  const s = useSurface();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500",
        s.muted,
        s.hover,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export const Badge = ({
  tone = "neutral",
  children,
  dot,
  icon,
  size = "sm",
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) => {
  const { dark } = useSurface();
  const t = toneClasses(tone, dark);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        t.badge,
        className
      )}
    >
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", t.dot)} />}
      {icon}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, size }: { status?: string; size?: "sm" | "md" }) => {
  const m = statusMeta(status);
  return (
    <Badge tone={m.tone} dot size={size}>
      {m.label}
    </Badge>
  );
};

export const ApprovalBadge = ({ status, className }: { status?: string; className?: string }) => {
  const m = approvalMeta(status);
  return (
    <Badge tone={m.tone} dot className={className}>
      {m.label}
    </Badge>
  );
};

export const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  const tone: Tone = priority === "HIGH" ? "danger" : priority === "MEDIUM" ? "warning" : "neutral";
  return <Badge tone={tone}>{priority.charAt(0) + priority.slice(1).toLowerCase()} priority</Badge>;
};

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export const CopyText = ({ value, children, mono = true }: { value?: string; children?: React.ReactNode; mono?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const s = useSurface();
  if (!value) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className={cx(
        "group inline-flex items-center gap-1 rounded px-1 -mx-1 transition-colors",
        mono && "font-mono",
        s.hover
      )}
      title="Copy"
      aria-label={`Copy ${value}`}
    >
      {children ?? value}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className={cx("h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity", s.faint)} />
      )}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export const DetailHeader = ({
  eyebrow,
  title,
  meta,
  actions,
  backHref,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  backHref: string;
}) => {
  const router = useRouter();
  const s = useSurface();
  const goBack = () => {
    // Opened from a shared link or a new tab there is no history to go back to.
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(backHref);
  };
  return (
    <div
      className={cx(
        // Sits under the app header (h-20) and bleeds to the edge of <main>'s p-6.
        "sticky top-20 z-20 -mx-6 -mt-6 mb-5 border-b px-4 sm:px-6 py-3 backdrop-blur",
        s.dark ? "bg-gray-950/90 border-gray-800" : "bg-white/90 border-gray-200"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <IconBtn label="Back" onClick={goBack} className="-ml-2 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </IconBtn>
        <div className="min-w-0 flex-1">
          {eyebrow && <p className={cx("text-xs font-medium", s.muted)}>{eyebrow}</p>}
          <h1 className={cx("truncate text-lg font-bold leading-tight sm:text-xl", s.text)}>{title}</h1>
          {meta && <div className={cx("mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", s.muted)}>{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Next-step banner                                                    */
/* ------------------------------------------------------------------ */

export const NextStep = ({
  tone,
  title,
  children,
  action,
  icon,
}: {
  tone: Tone;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  const { dark } = useSurface();
  const t = toneClasses(tone, dark);
  return (
    <div className={cx("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center", t.soft)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {icon && <div className={cx("mt-0.5 shrink-0", t.text)}>{icon}</div>}
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {children && <div className="mt-0.5 text-sm opacity-90">{children}</div>}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Workflow stepper                                                    */
/* ------------------------------------------------------------------ */

export interface Step {
  key: string;
  label: string;
  state: "done" | "current" | "todo" | "error" | "skipped";
  who?: string;
  when?: string;
}

export const Stepper = ({ steps }: { steps: Step[] }) => {
  const s = useSurface();
  const circle = (state: Step["state"], i: number) => {
    const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2";
    if (state === "done") return <span className={cx(base, "bg-emerald-500 text-white ring-emerald-500")}><Check className="h-4 w-4" /></span>;
    if (state === "error") return <span className={cx(base, "bg-red-500 text-white ring-red-500")}><X className="h-4 w-4" /></span>;
    if (state === "current")
      return <span className={cx(base, "bg-yellow-400 text-gray-950 ring-yellow-400 shadow-[0_0_0_4px_rgba(250,204,21,0.25)]")}>{i + 1}</span>;
    if (state === "skipped")
      return <span className={cx(base, s.dark ? "bg-gray-900 text-gray-600 ring-gray-800" : "bg-gray-50 text-gray-300 ring-gray-200")}>–</span>;
    return <span className={cx(base, s.dark ? "bg-gray-900 text-gray-500 ring-gray-700" : "bg-white text-gray-400 ring-gray-200")}>{i + 1}</span>;
  };
  const line = (state: Step["state"]) =>
    state === "done" ? "bg-emerald-500" : s.dark ? "bg-gray-800" : "bg-gray-200";

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:gap-0">
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex items-start gap-3 lg:flex-1 lg:flex-col lg:items-start lg:gap-2 lg:pr-3">
          <div className="flex w-auto items-center lg:w-full">
            {circle(step.state, i)}
            {i < steps.length - 1 && <span className={cx("ml-2 hidden h-0.5 flex-1 rounded lg:block", line(step.state))} />}
          </div>
          <div className="min-w-0">
            <p
              className={cx(
                "text-sm font-semibold leading-tight",
                step.state === "todo" || step.state === "skipped" ? s.faint : step.state === "error" ? "text-red-600" : s.text
              )}
            >
              {step.label}
            </p>
            {(step.who || step.when) && (
              <p className={cx("mt-0.5 text-xs leading-snug", s.muted)}>
                {step.who}
                {step.who && step.when ? " · " : ""}
                {step.when}
              </p>
            )}
            {step.state === "skipped" && <p className={cx("mt-0.5 text-xs", s.faint)}>Skipped</p>}
          </div>
        </li>
      ))}
    </ol>
  );
};

/* ------------------------------------------------------------------ */
/* Section card                                                        */
/* ------------------------------------------------------------------ */

export const Section = ({
  title,
  icon,
  count,
  action,
  children,
  collapsible,
  defaultOpen = true,
  className,
  bodyClassName,
  subtitle,
  id,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string;
  action?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  bodyClassName?: string;
  subtitle?: React.ReactNode;
  id?: string;
}) => {
  const s = useSurface();
  const [open, setOpen] = useState(defaultOpen);
  const Head = collapsible ? "button" : "div";
  return (
    <section id={id} className={cx("rounded-xl border", s.card, className)}>
      <div className={cx("flex items-center gap-3 px-4 py-3", open && "border-b", s.divider)}>
        <Head
          {...(collapsible ? { type: "button" as const, onClick: () => setOpen((o) => !o), "aria-expanded": open } : {})}
          className={cx("flex min-w-0 flex-1 items-center gap-2 text-left", collapsible && "cursor-pointer")}
        >
          {icon && <span className="shrink-0 text-yellow-500">{icon}</span>}
          <span className="min-w-0">
            <span className={cx("flex items-center gap-2 text-sm font-bold", s.text)}>
              {title}
              {count !== undefined && (
                <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold", s.dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600")}>
                  {count}
                </span>
              )}
            </span>
            {subtitle && <span className={cx("block text-xs font-normal", s.muted)}>{subtitle}</span>}
          </span>
          {collapsible && <ChevronDown className={cx("ml-auto h-4 w-4 transition-transform", s.muted, open ? "rotate-180" : "")} />}
        </Head>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {open && <div className={cx("p-4", bodyClassName)}>{children}</div>}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Label / value grid                                                  */
/* ------------------------------------------------------------------ */

export interface InfoItem {
  label: string;
  value?: React.ReactNode;
  copy?: string;
  mono?: boolean;
  full?: boolean;
  hideIfEmpty?: boolean;
}

const isEmpty = (v: React.ReactNode) => v === undefined || v === null || v === "" || v === "-";

export const InfoGrid = ({ items, cols = 2 }: { items: InfoItem[]; cols?: 1 | 2 | 3 }) => {
  const s = useSurface();
  const visible = items.filter((it) => !(it.hideIfEmpty && isEmpty(it.value)));
  return (
    <dl className={cx("grid gap-x-4 gap-y-3", cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
      {visible.map((it) => (
        <div key={it.label} className={cx("min-w-0", it.full && "col-span-full")}>
          <dt className={cx("text-xs font-medium", s.muted)}>{it.label}</dt>
          <dd className={cx("mt-0.5 break-words text-sm font-medium", isEmpty(it.value) ? s.faint : s.text, it.mono && "font-mono")}>
            {isEmpty(it.value) ? "Not set" : it.copy ? <CopyText value={it.copy} mono={it.mono}>{it.value}</CopyText> : it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

/* ------------------------------------------------------------------ */
/* Contact + map                                                       */
/* ------------------------------------------------------------------ */

export const ContactActions = ({ mobile }: { mobile?: string }) => {
  if (!mobile) return null;
  const digits = mobile.replace(/\D/g, "");
  const wa = digits.length === 10 ? `91${digits}` : digits;
  return (
    <div className="flex gap-2">
      <a
        href={`tel:${mobile}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        <Phone className="h-3.5 w-3.5" /> Call
      </a>
      <a
        href={`https://wa.me/${wa}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-600 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </a>
    </div>
  );
};

export const mapsUrl = (loc?: { coordinates?: { lat?: number; lng?: number }; address?: string; city?: string }) => {
  if (!loc) return "";
  const lat = loc.coordinates?.lat;
  const lng = loc.coordinates?.lng;
  if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`;
  const q = [loc.address, loc.city].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "";
};

export const MapLink = ({ href }: { href: string }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-600 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
    >
      <MapPin className="h-3.5 w-3.5" /> Open map <ExternalLink className="h-3 w-3" />
    </a>
  );
};

/* ------------------------------------------------------------------ */
/* Money rows                                                          */
/* ------------------------------------------------------------------ */

export const MoneyRows = ({
  rows,
  total,
}: {
  rows: Array<{ label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode }>;
  total?: { label: string; value: React.ReactNode };
}) => {
  const s = useSurface();
  return (
    <div className="text-sm">
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className={s.body}>{r.label}</span>
              {r.hint && <span className={cx("block text-xs", s.muted)}>{r.hint}</span>}
            </span>
            <span className={cx("shrink-0 font-semibold tabular-nums", s.text)}>{r.value}</span>
          </li>
        ))}
      </ul>
      {total && (
        <div className={cx("mt-3 flex items-center justify-between border-t pt-3", s.divider)}>
          <span className={cx("font-semibold", s.text)}>{total.label}</span>
          <span className="text-base font-bold tabular-nums text-emerald-600">{total.value}</span>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export const ProgressBar = ({
  segments,
  total,
  height = "h-2",
}: {
  segments: Array<{ value: number; tone: Tone; label?: string }>;
  total: number;
  height?: string;
}) => {
  const { dark } = useSurface();
  return (
    <div className={cx("flex w-full overflow-hidden rounded-full", height, dark ? "bg-gray-800" : "bg-gray-200")} role="progressbar">
      {segments.map((seg, i) =>
        seg.value > 0 && total > 0 ? (
          <div
            key={i}
            title={seg.label ? `${seg.label}: ${seg.value}` : undefined}
            className={cx("h-full transition-all", toneClasses(seg.tone, dark).bar)}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ) : null
      )}
    </div>
  );
};

export const StatTiles = ({
  items,
  onSelect,
  active,
}: {
  items: Array<{ key: string; label: string; value: number | string; tone: Tone }>;
  onSelect?: (key: string) => void;
  active?: string;
}) => {
  const s = useSurface();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => {
        const t = toneClasses(it.tone, s.dark);
        const isActive = active === it.key;
        const Comp = onSelect ? "button" : "div";
        return (
          <Comp
            key={it.key}
            {...(onSelect ? { type: "button" as const, onClick: () => onSelect(it.key), "aria-pressed": isActive } : {})}
            className={cx(
              "rounded-lg border px-3 py-2 text-left transition-colors",
              isActive ? "border-yellow-400 ring-2 ring-yellow-400/40" : s.dark ? "border-gray-800" : "border-gray-200",
              onSelect && (s.dark ? "hover:bg-gray-800" : "hover:bg-gray-50"),
              s.dark ? "bg-gray-900" : "bg-white"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className={cx("h-2 w-2 rounded-full", t.dot)} />
              <span className={cx("text-xs font-medium", s.muted)}>{it.label}</span>
            </span>
            <span className={cx("mt-0.5 block text-xl font-bold tabular-nums", s.text)}>{it.value}</span>
          </Comp>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

export interface LightboxImage {
  src: string;
  caption?: string;
}

export const Lightbox = ({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) => {
  const open = index !== null && images[index] !== undefined;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index! < images.length - 1) onIndex(index! + 1);
      if (e.key === "ArrowLeft" && index! > 0) onIndex(index! - 1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, index, images.length, onClose, onIndex]);
  if (!open || typeof document === "undefined") return null;
  const img = images[index!];
  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm">
          <span className="font-semibold">{img.caption}</span>
          <span className="ml-2 text-white/60">
            {index! + 1} / {images.length}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <a href={img.src} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 hover:bg-white/10" aria-label="Open original">
            <ExternalLink className="h-5 w-5" />
          </a>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt={img.caption || "Photo"} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        {index! > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex(index! - 1);
            }}
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {index! < images.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex(index! + 1);
            }}
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

/** Lightbox state in one hook: `open(images, index)` and render `node` once on the page. */
export const useLightbox = () => {
  const [images, setImages] = useState<LightboxImage[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const open = useCallback((imgs: LightboxImage[], i = 0) => {
    setImages(imgs.filter((im) => !!im.src));
    setIndex(i);
  }, []);
  const close = useCallback(() => setIndex(null), []);
  const node = <Lightbox images={images} index={index} onClose={close} onIndex={setIndex} />;
  return { open, node };
};

export const PhotoTile = ({
  src,
  alt,
  onOpen,
  overlay,
  aspect = "aspect-[4/3]",
  className,
  empty = "No photo",
}: {
  src?: string;
  alt: string;
  onOpen?: () => void;
  overlay?: React.ReactNode;
  aspect?: string;
  className?: string;
  empty?: React.ReactNode;
}) => {
  const s = useSurface();
  return (
    <div className={cx("relative overflow-hidden rounded-lg border", aspect, s.dark ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-gray-100", className)}>
      {src ? (
        <button type="button" onClick={onOpen} className="group block h-full w-full" aria-label={`View ${alt}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        </button>
      ) : (
        <div className={cx("flex h-full w-full flex-col items-center justify-center gap-1 p-3 text-center text-xs", s.faint)}>{empty}</div>
      )}
      {overlay && <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">{overlay}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  const s = useSurface();
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        // Keep keyboard focus inside the dialog.
        const f = panelRef.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>("textarea, input, select") || panelRef.current?.querySelector<HTMLElement>("button");
      target?.focus();
    }, 20);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  // Portal to <body>: a parent with backdrop-blur (like the sticky header) would otherwise trap `fixed` inside it.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cx("w-full max-w-md rounded-t-2xl border shadow-2xl sm:rounded-2xl", s.card)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("flex items-start gap-3 border-b px-5 py-4", s.divider)}>
          {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            <h3 className={cx("text-base font-bold", s.text)}>{title}</h3>
            {description && <p className={cx("mt-1 text-sm", s.muted)}>{description}</p>}
          </div>
          <IconBtn label="Close" onClick={onClose} className="-mr-2 -mt-1">
            <X className="h-5 w-5" />
          </IconBtn>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && <div className={cx("flex gap-2 border-t px-5 py-3", s.divider, s.dark ? "bg-gray-950/40" : "bg-gray-50")}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/* Form bits                                                           */
/* ------------------------------------------------------------------ */

export const Field = ({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean }) => {
  const s = useSurface();
  return (
    <label className="block">
      <span className={cx("mb-1 block text-xs font-semibold", s.body)}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : hint ? <span className={cx("mt-1 block text-xs", s.muted)}>{hint}</span> : null}
    </label>
  );
};

export const useInputClass = () => {
  const s = useSurface();
  return cx("w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2", s.input);
};

/* ------------------------------------------------------------------ */
/* Sticky action bar + empty + skeleton                                */
/* ------------------------------------------------------------------ */

export const StickyBar = ({ children }: { children: React.ReactNode }) => {
  const s = useSurface();
  return (
    // md:left-72 keeps it clear of the fixed sidebar.
    <div className={cx("fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 backdrop-blur md:left-72 sm:px-6", s.dark ? "bg-gray-950/95 border-gray-800" : "bg-white/95 border-gray-200")}>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center">{children}</div>
    </div>
  );
};

export const EmptyBlock = ({ icon, title, hint, action }: { icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) => {
  const s = useSurface();
  return (
    <div className={cx("flex flex-col items-center rounded-lg border border-dashed px-4 py-8 text-center", s.dark ? "border-gray-800" : "border-gray-200")}>
      {icon && <div className={cx("mb-2", s.faint)}>{icon}</div>}
      <p className={cx("text-sm font-semibold", s.body)}>{title}</p>
      {hint && <p className={cx("mt-1 max-w-sm text-sm", s.muted)}>{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

const Bone = ({ className }: { className: string }) => {
  const { dark } = useSurface();
  return <div className={cx("animate-pulse rounded", dark ? "bg-gray-800" : "bg-gray-200", className)} />;
};

export const DetailSkeleton = () => {
  const s = useSurface();
  return (
    <div className="pb-24">
      <div className={cx("-mx-6 -mt-6 mb-5 border-b px-6 py-4", s.dark ? "border-gray-800" : "border-gray-200")}>
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Bone className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Bone className="h-5 w-64" />
            <Bone className="h-4 w-40" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-4">
        <Bone className="h-16 w-full rounded-xl" />
        <Bone className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Bone className="h-72 w-full rounded-xl" />
            <Bone className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Bone className="h-56 w-full rounded-xl" />
            <Bone className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotFound = ({ title, hint, backHref, backLabel }: { title: string; hint?: string; backHref: string; backLabel: string }) => {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md py-16">
      <EmptyBlock title={title} hint={hint} action={<Btn variant="secondary" onClick={() => router.push(backHref)}>{backLabel}</Btn>} />
    </div>
  );
};

export { cx };
