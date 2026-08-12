"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AssistantConversionClaim() {
  useEffect(() => {
    let cancelled = false;

    async function claim() {
      const visitorToken = window.localStorage.getItem("jv-assistant-visitor");
      if (!visitorToken || window.localStorage.getItem("jv-assistant-claimed") === visitorToken) return;

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !publishableKey) return;

      const response = await fetch(`${url}/functions/v1/claim-assistant-conversion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": publishableKey,
        },
        body: JSON.stringify({ visitorToken }),
      });

      if (response.ok && !cancelled) {
        window.localStorage.setItem("jv-assistant-claimed", visitorToken);
      }
    }

    void claim();
    return () => { cancelled = true; };
  }, []);

  return null;
}
