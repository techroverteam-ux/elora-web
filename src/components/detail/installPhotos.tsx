"use client";

// Installation photos per board: recce photo, then Before, After and an optional Close-up,
// the same three-photo layout the mobile app uses.

import React from "react";
import { Building2 } from "lucide-react";
import { Store } from "@/src/types/store";
import { Badge, PhotoTile, LightboxImage, useSurface, cx } from "./kit";
import { sqft, toFeet } from "./format";

export type InstallPhotoType = "before" | "after" | "closeup";
export const INSTALL_PHOTO_TYPES: InstallPhotoType[] = ["before", "after", "closeup"];
export const INSTALL_PHOTO_LABEL: Record<InstallPhotoType, string> = { before: "Before", after: "After", closeup: "Close-up" };

type Entry = { reccePhotoIndex: number; installationPhoto: string; photoType?: string };

/**
 * Photos of one board keyed by type. Older records have no photoType: several photos were
 * uploaded in the order before, after, close-up; a single photo is the installed (after) photo.
 * Must match elora-api src/utils/installPhotos.ts.
 */
export const installPhotosByType = (photos: Entry[] | undefined, boardIndex: number): Partial<Record<InstallPhotoType, Entry>> => {
  const list = (photos || []).filter((p) => p && p.reccePhotoIndex === boardIndex);
  const out: Partial<Record<InstallPhotoType, Entry>> = {};
  const untyped: Entry[] = [];
  list.forEach((p) => {
    if (p.photoType && (INSTALL_PHOTO_TYPES as string[]).includes(p.photoType)) out[p.photoType as InstallPhotoType] = p;
    else untyped.push(p);
  });
  if (untyped.length === 1 && !out.after) out.after = untyped[0];
  else
    untyped.forEach((p, i) => {
      const t = INSTALL_PHOTO_TYPES[i];
      if (t && !out[t]) out[t] = p;
    });
  return out;
};

/** Read-only: every board that has installation photos, as Recce | Before | After | Close-up. */
export const InstallComparison = ({
  store,
  getUrl,
  onOpen,
}: {
  store: Store;
  getUrl: (p: string) => string;
  onOpen: (images: LightboxImage[], index: number) => void;
}) => {
  const s = useSurface();
  const photos = (store.installation?.photos || []) as Entry[];
  const recce = (store.recce?.reccePhotos || []) as any[];
  const boards = Array.from(new Set(photos.map((p) => p.reccePhotoIndex))).sort((a, b) => a - b);
  if (!boards.length) return null;

  return (
    <div className="space-y-3">
      {boards.map((idx) => {
        const byType = installPhotosByType(photos, idx);
        const rp = recce[idx];
        const tiles: Array<{ key: string; label: string; src: string; tone: string }> = [
          { key: "recce", label: "Recce", src: rp?.photo ? getUrl(rp.photo) : "", tone: s.muted },
          { key: "before", label: "Before", src: byType.before ? getUrl(byType.before.installationPhoto) : "", tone: "text-amber-600" },
          { key: "after", label: "After", src: byType.after ? getUrl(byType.after.installationPhoto) : "", tone: "text-emerald-600" },
        ];
        if (byType.closeup) tiles.push({ key: "closeup", label: "Close-up", src: getUrl(byType.closeup.installationPhoto), tone: "text-blue-600" });
        const images = tiles.filter((t) => t.src).map((t) => ({ src: t.src, caption: `Board ${idx + 1} · ${t.label}` }));
        const ft = rp?.measurements ? toFeet(rp.measurements) : null;
        return (
          <article key={idx} className={cx("rounded-xl border", s.sunken)}>
            <header className={cx("flex flex-wrap items-center gap-2 border-b px-3 py-2", s.divider)}>
              <span className={cx("text-sm font-bold", s.text)}>Board {idx + 1}</span>
              {rp?.elements?.[0]?.elementName && <Badge tone="brand">{rp.elements[0].elementName}</Badge>}
              {ft && (
                <span className={cx("ml-auto text-xs tabular-nums", s.muted)}>
                  {ft.width.toFixed(2)} × {ft.height.toFixed(2)} ft · {sqft(rp.measurements).toFixed(1)} sq.ft
                </span>
              )}
            </header>
            <div className={cx("grid grid-cols-2 gap-3 p-3", tiles.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
              {tiles.map((t) => (
                <div key={t.key}>
                  <p className={cx("mb-1 text-xs font-semibold", t.tone)}>{t.label}</p>
                  <PhotoTile
                    src={t.src}
                    alt={`Board ${idx + 1} ${t.label}`}
                    onOpen={() => onOpen(images, Math.max(0, images.findIndex((im) => im.src === t.src)))}
                    empty={
                      t.key === "recce" ? (
                        <>
                          <Building2 className="h-6 w-6 text-blue-400" />
                          <span>Direct installation</span>
                        </>
                      ) : (
                        "Not uploaded"
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
};
