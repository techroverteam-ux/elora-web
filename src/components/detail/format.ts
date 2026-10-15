// Small display helpers shared by the detail pages. Pure functions, no API calls.

export const formatDate = (value?: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const timeAgo = (value?: string | Date | null) => {
  if (!value) return "";
  const t = new Date(value).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const day = 86400000;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < day) return `${Math.floor(diff / 3600000)} h ago`;
  if (diff < day * 30) return `${Math.floor(diff / day)} d ago`;
  return formatDate(value);
};

export const formatINR = (value?: number | null) => {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

interface Measurements {
  width?: number | string;
  height?: number | string;
  unit?: string;
}

/** Width and height in feet, the same conversion the pages already used (inches ÷ 12). */
export const toFeet = (m?: Measurements) => {
  const w = Number(m?.width || 0);
  const h = Number(m?.height || 0);
  const isInches = (m?.unit || "").toLowerCase() === "in";
  return { width: isInches ? w / 12 : w, height: isInches ? h / 12 : h };
};

export const sqft = (m?: Measurements) => {
  const { width, height } = toFeet(m);
  return width * height;
};

export const nameOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "name" in value) return String((value as { name?: string }).name || "");
  return "";
};
