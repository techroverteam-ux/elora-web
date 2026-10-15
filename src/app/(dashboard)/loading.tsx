// Shown while a page's code loads, instead of a blank screen.
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-gray-200/70" />
      <div className="h-4 w-80 rounded bg-gray-200/70" />
      <div className="h-24 w-full rounded-xl bg-gray-200/60" />
      <div className="h-80 w-full rounded-xl bg-gray-200/50" />
    </div>
  );
}
