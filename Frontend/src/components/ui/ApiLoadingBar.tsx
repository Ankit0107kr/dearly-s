"use client";

import { useApiLoading } from "@/lib/useApiLoading";

export function ApiLoadingBar() {
  const loading = useApiLoading();
  if (!loading) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-accent-200/80"
      role="progressbar"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="api-loading-bar h-full w-1/3 bg-accent-600" />
    </div>
  );
}
