"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export default function PendingSubmit({ label, pendingLabel = "Saving…", className = "button" }: PendingSubmitProps) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      data-state={pending ? "pending" : "idle"}
    >
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}
