"use client";

import PortalErrorBoundary from "@/components/portal-error-boundary";

export default function PatientError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalErrorBoundary error={error} reset={reset} surface="patient" />;
}
