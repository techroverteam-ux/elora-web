// One place for store-status wording and colour, shared by every detail page.

export type Tone =
  | "neutral"
  | "info"
  | "warning"
  | "violet"
  | "success"
  | "danger"
  | "brand";

export interface StatusMeta {
  label: string;
  tone: Tone;
  /** Plain-language "what happens next" line shown under the status. */
  next: string;
  /** A few words for table cells: who has to act now. */
  short: string;
  /** Who acts at this stage. */
  owner: string;
}

const STATUS: Record<string, StatusMeta> = {
  UPLOADED: {
    label: "New store",
    tone: "neutral",
    next: "Assign a recce user so the site can be measured.",
    short: "Needs a recce user",
    owner: "Admin",
  },
  MANUALLY_ADDED: {
    label: "New store",
    tone: "neutral",
    next: "Assign a recce user so the site can be measured.",
    short: "Needs a recce user",
    owner: "Admin",
  },
  RECCE_ASSIGNED: {
    label: "Recce assigned",
    tone: "info",
    next: "Waiting for the recce user to visit the store and submit photos.",
    short: "Recce visit pending",
    owner: "Recce user",
  },
  RECCE_SUBMITTED: {
    label: "Recce submitted",
    tone: "warning",
    next: "Recce photos are waiting for admin review.",
    short: "Waiting for admin review",
    owner: "Admin",
  },
  RECCE_APPROVED: {
    label: "Recce approved",
    tone: "violet",
    next: "Recce is approved. Assign an installer to put up the boards.",
    short: "Needs an installer",
    owner: "Admin",
  },
  RECCE_REJECTED: {
    label: "Recce rejected",
    tone: "danger",
    next: "Some boards were rejected. The recce user needs to re-shoot and resubmit.",
    short: "Recce user to re-shoot",
    owner: "Recce user",
  },
  INSTALLATION_ASSIGNED: {
    label: "Installation assigned",
    tone: "info",
    next: "Waiting for the installer to upload installed photos.",
    short: "Installation pending",
    owner: "Installer",
  },
  INSTALLATION_SUBMITTED: {
    label: "Installation submitted",
    tone: "warning",
    next: "Installed photos are uploaded and waiting for a final check.",
    short: "Waiting for final check",
    owner: "Admin",
  },
  INSTALLATION_REJECTED: {
    label: "Installation rejected",
    tone: "danger",
    next: "The installation was rejected. The installer needs to redo and re-upload.",
    short: "Installer to redo",
    owner: "Installer",
  },
  COMPLETED: {
    label: "Completed",
    tone: "success",
    next: "All work on this store is done. No action needed.",
    short: "Done",
    owner: "Nobody",
  },
};

export const humanize = (value?: string) =>
  (value || "Unknown")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

export const statusMeta = (status?: string): StatusMeta =>
  STATUS[status || ""] || { label: humanize(status), tone: "neutral", next: "", short: "", owner: "" };

export type ApprovalState = "APPROVED" | "REJECTED" | "HOLD" | "PENDING";

export const approvalMeta = (status?: string): { label: string; tone: Tone } => {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", tone: "success" };
    case "REJECTED":
      return { label: "Rejected", tone: "danger" };
    case "HOLD":
      return { label: "On hold", tone: "warning" };
    default:
      return { label: "Pending review", tone: "neutral" };
  }
};

/** Tailwind classes per tone. Two sets because the app toggles dark mode by state, not by the `dark:` variant. */
export const toneClasses = (tone: Tone, dark: boolean) => {
  const map: Record<Tone, { light: ToneSet; dark: ToneSet }> = {
    neutral: {
      light: { badge: "bg-gray-100 text-gray-700 ring-gray-200", soft: "bg-gray-50 border-gray-200 text-gray-800", dot: "bg-gray-400", text: "text-gray-700", bar: "bg-gray-400" },
      dark: { badge: "bg-gray-800 text-gray-200 ring-gray-700", soft: "bg-gray-800/60 border-gray-700 text-gray-200", dot: "bg-gray-400", text: "text-gray-300", bar: "bg-gray-400" },
    },
    info: {
      light: { badge: "bg-blue-50 text-blue-800 ring-blue-200", soft: "bg-blue-50 border-blue-200 text-blue-900", dot: "bg-blue-500", text: "text-blue-700", bar: "bg-blue-500" },
      dark: { badge: "bg-blue-950 text-blue-200 ring-blue-800", soft: "bg-blue-950/60 border-blue-900 text-blue-100", dot: "bg-blue-400", text: "text-blue-300", bar: "bg-blue-400" },
    },
    warning: {
      light: { badge: "bg-amber-50 text-amber-900 ring-amber-200", soft: "bg-amber-50 border-amber-200 text-amber-950", dot: "bg-amber-500", text: "text-amber-700", bar: "bg-amber-500" },
      dark: { badge: "bg-amber-950 text-amber-200 ring-amber-800", soft: "bg-amber-950/60 border-amber-900 text-amber-100", dot: "bg-amber-400", text: "text-amber-300", bar: "bg-amber-400" },
    },
    violet: {
      light: { badge: "bg-violet-50 text-violet-800 ring-violet-200", soft: "bg-violet-50 border-violet-200 text-violet-950", dot: "bg-violet-500", text: "text-violet-700", bar: "bg-violet-500" },
      dark: { badge: "bg-violet-950 text-violet-200 ring-violet-800", soft: "bg-violet-950/60 border-violet-900 text-violet-100", dot: "bg-violet-400", text: "text-violet-300", bar: "bg-violet-400" },
    },
    success: {
      light: { badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", soft: "bg-emerald-50 border-emerald-200 text-emerald-950", dot: "bg-emerald-500", text: "text-emerald-700", bar: "bg-emerald-500" },
      dark: { badge: "bg-emerald-950 text-emerald-200 ring-emerald-800", soft: "bg-emerald-950/60 border-emerald-900 text-emerald-100", dot: "bg-emerald-400", text: "text-emerald-300", bar: "bg-emerald-400" },
    },
    danger: {
      light: { badge: "bg-red-50 text-red-800 ring-red-200", soft: "bg-red-50 border-red-200 text-red-950", dot: "bg-red-500", text: "text-red-700", bar: "bg-red-500" },
      dark: { badge: "bg-red-950 text-red-200 ring-red-800", soft: "bg-red-950/60 border-red-900 text-red-100", dot: "bg-red-400", text: "text-red-300", bar: "bg-red-400" },
    },
    brand: {
      light: { badge: "bg-yellow-50 text-yellow-900 ring-yellow-300", soft: "bg-yellow-50 border-yellow-200 text-yellow-950", dot: "bg-yellow-500", text: "text-yellow-700", bar: "bg-yellow-500" },
      dark: { badge: "bg-yellow-950 text-yellow-200 ring-yellow-800", soft: "bg-yellow-950/50 border-yellow-900 text-yellow-100", dot: "bg-yellow-400", text: "text-yellow-300", bar: "bg-yellow-400" },
    },
  };
  return dark ? map[tone].dark : map[tone].light;
};

interface ToneSet {
  badge: string;
  soft: string;
  dot: string;
  text: string;
  bar: string;
}

/* ------------------------------------------------------------------ */
/* The store lifecycle as stages, used by the stage strip and the guide */
/* ------------------------------------------------------------------ */

export interface Stage {
  key: string;
  label: string;
  statuses: string[];
  tone: Tone;
  owner: string;
  what: string;
}

export const STAGES: Stage[] = [
  { key: "new", label: "New", statuses: ["UPLOADED", "MANUALLY_ADDED"], tone: "neutral", owner: "Admin", what: "Store is added by upload or by hand. Admin assigns a recce user." },
  { key: "recceAssigned", label: "Recce assigned", statuses: ["RECCE_ASSIGNED"], tone: "info", owner: "Recce user", what: "Recce user visits the store, photographs and measures each board." },
  { key: "recceSubmitted", label: "Recce submitted", statuses: ["RECCE_SUBMITTED"], tone: "warning", owner: "Admin", what: "Admin reviews each board photo and approves, rejects or holds it." },
  { key: "recceApproved", label: "Recce approved", statuses: ["RECCE_APPROVED"], tone: "violet", owner: "Admin", what: "All boards approved. Admin assigns an installer." },
  { key: "installAssigned", label: "Install assigned", statuses: ["INSTALLATION_ASSIGNED"], tone: "info", owner: "Installer", what: "Installer puts up the boards and uploads an installed photo per board." },
  { key: "installSubmitted", label: "Install submitted", statuses: ["INSTALLATION_SUBMITTED"], tone: "warning", owner: "Admin", what: "Admin does a final check of the installed photos." },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"], tone: "success", owner: "Nobody", what: "Work is finished. The store is ready for reports and billing." },
];

export const REDO_STAGES: Stage[] = [
  { key: "recceRejected", label: "Recce rejected", statuses: ["RECCE_REJECTED"], tone: "danger", owner: "Recce user", what: "One or more boards were rejected. The recce user re-shoots them and resubmits." },
  { key: "installRejected", label: "Install rejected", statuses: ["INSTALLATION_REJECTED"], tone: "danger", owner: "Installer", what: "The installation was rejected. The installer redoes it and uploads again." },
];

/* ------------------------------------------------------------------ */
/* Other entities                                                      */
/* ------------------------------------------------------------------ */

export const enquiryMeta = (status?: string): { label: string; tone: Tone; next: string } => {
  switch (status) {
    case "NEW":
      return { label: "New", tone: "brand", next: "Not opened yet" };
    case "READ":
      return { label: "Read", tone: "info", next: "Opened, not contacted" };
    case "CONTACTED":
      return { label: "Contacted", tone: "violet", next: "Waiting for outcome" };
    case "RESOLVED":
      return { label: "Resolved", tone: "success", next: "Closed" };
    default:
      return { label: humanize(status), tone: "neutral", next: "" };
  }
};

export const activeMeta = (active?: boolean): { label: string; tone: Tone; next: string } =>
  active ? { label: "Active", tone: "success", next: "Can sign in" } : { label: "Inactive", tone: "neutral", next: "Cannot sign in" };

/** Status names used by Reports' assignment rows (sometimes with spaces, sometimes short). */
export const assignmentMeta = (status?: string): { label: string; tone: Tone } => {
  const s = (status || "").toUpperCase().replace(/ /g, "_");
  if (STATUS[s]) return { label: STATUS[s].label, tone: STATUS[s].tone };
  if (s === "SUBMITTED") return { label: "Submitted", tone: "warning" };
  if (s === "APPROVED") return { label: "Approved", tone: "violet" };
  if (s === "ASSIGNED") return { label: "Assigned", tone: "info" };
  if (s === "REJECTED") return { label: "Rejected", tone: "danger" };
  return { label: humanize(status), tone: "neutral" };
};
