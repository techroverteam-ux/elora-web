"use client";

import { ListPageSkeleton } from "@/src/components/ui/Skeleton";

// Shown while a page's code loads, instead of a blank screen. Follows the app's dark-mode toggle.
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <ListPageSkeleton actions={2} filters={2} rows={6} cols={6} />
    </div>
  );
}
