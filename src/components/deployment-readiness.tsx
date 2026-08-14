type ReadinessItem = {
  label: string;
  configured: boolean;
  note: string;
};

function isSet(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export default function DeploymentReadiness() {
  const core: ReadinessItem[] = [
    {
      label: "Public site URL",
      configured: isSet(process.env.NEXT_PUBLIC_SITE_URL) && process.env.NEXT_PUBLIC_SITE_URL !== "http://localhost:3000",
      note: "Required for production redirects and canonical app links.",
    },
    {
      label: "Supabase project URL",
      configured: isSet(process.env.NEXT_PUBLIC_SUPABASE_URL),
      note: "Required for authentication, patient portal and clinic data.",
    },
    {
      label: "Supabase publishable key",
      configured: isSet(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      note: "Required by browser-side Supabase sessions.",
    },
    {
      label: "Supabase service-role key",
      configured: isSet(process.env.SUPABASE_SERVICE_ROLE_KEY),
      note: "Server-only. Required by protected booking and payment server APIs.",
    },
  ];

  const optional: ReadinessItem[] = [
    {
      label: "Razorpay",
      configured: isSet(process.env.RAZORPAY_KEY_ID) && isSet(process.env.RAZORPAY_KEY_SECRET),
      note: "Optional for now. Booking requests still work when payment is not configured.",
    },
    {
      label: "Razorpay webhook",
      configured: isSet(process.env.RAZORPAY_WEBHOOK_SECRET),
      note: "Enable with production payment credentials for server-to-server reconciliation.",
    },
    {
      label: "Clinic consultation fee",
      configured: isSet(process.env.RAZORPAY_CLINIC_CONSULTATION_FEE_PAISE),
      note: "Configured in paise when paid clinic booking is enabled.",
    },
    {
      label: "Video consultation fee",
      configured: isSet(process.env.RAZORPAY_VIDEO_CONSULTATION_FEE_PAISE),
      note: "Configured in paise when paid video consultation is enabled.",
    },
  ];

  const coreReady = core.every((item) => item.configured);

  return (
    <article className="portal-card" style={{ marginTop: 24 }}>
      <div className="portal-card__header">
        <h2>Deployment readiness</h2>
        <span className="status-pill">{coreReady ? "Core ready" : "Needs configuration"}</span>
      </div>
      <div className="portal-card__body">
        <p>
          Presence checks only. Secret values are never rendered, logged or sent to the browser as data.
        </p>
        <div className="status-list" style={{ marginTop: 16 }}>
          {[...core, ...optional].map((item) => (
            <div className="status-row" key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.configured ? "Configured" : "Not configured"}</span>
              <span>{item.note}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
