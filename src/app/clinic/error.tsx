"use client";

import PortalErrorBoundary from "@/components/portal-error-boundary";

export default function ClinicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalErrorBoundary error={error} reset={reset} surface="clinic" />;
}
