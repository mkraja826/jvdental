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
    <button className={className} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
