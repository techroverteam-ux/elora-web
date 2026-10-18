"use client";

import { FormSkeleton, PageHeaderSkeleton } from "@/src/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeaderSkeleton actions={1} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FormSkeleton sections={4} fields={4} />
        </div>
        <FormSkeleton sections={1} fields={5} />
      </div>
    </div>
  );
}
