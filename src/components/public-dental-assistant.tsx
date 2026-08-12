"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ChatMessage = {
  role: "assistant" | "user";
  body: string;
};

type AssistantResponse = {
  visitorToken: string;
  answer: string;
  action?: { label: string; href: string } | null;
  quickReplies?: string[];
  error?: string;
};

const DEFAULT_REPLIES = [
  "Dental implants",
  "DIOnavi guided implants",
  "International patients",
  "Treatment costs",
];

export default function PublicDentalAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{ label: string; href: string } | null>(null);
  const [quickReplies, setQuickReplies] = useState(DEFAULT_REPLIES);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      body: "Hello. I can help with JV Dental, dental implants, DIOnavi guided implant treatment, international-patient planning and general dental questions.",
    },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  const hidden = pathname.startsWith("/patient") || pathname.startsWith("/clinic") || pathname.startsWith("/auth");

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  if (hidden) return null;

  async function ask(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;

    setMessages((current) => [...current, { role: "user", body: trimmed }]);
    setInput("");
    setAction(null);
    setBusy(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("missing_endpoint");

      const visitorToken = window.localStorage.getItem("jv-assistant-visitor") ?? undefined;
      const response = await fetch(`${supabaseUrl}/functions/v1/public-dental-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorToken,
          message: trimmed,
          locale: navigator.language || "en",
        }),
      });
      const payload = (await response.json()) as AssistantResponse;
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "assistant_error");

      window.localStorage.setItem("jv-assistant-visitor", payload.visitorToken);
      setMessages((current) => [...current, { role: "assistant", body: payload.answer }]);
      setAction(payload.action ?? null);
      if (payload.quickReplies?.length) setQuickReplies(payload.quickReplies.slice(0, 4));
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          body: "The digital assistant is temporarily unavailable. You can still start an implant assessment or use the patient portal to contact the clinic team.",
        },
      ]);
      setAction({ label: "Start implant assessment", href: "/patient/login?next=/patient/intake" });
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <div className={`public-assistant${open ? " public-assistant--open" : ""}`}>
      {open ? (
        <section className="public-assistant__panel" aria-label="JV Dental digital assistant">
          <header className="public-assistant__header">
            <div>
              <span className="public-assistant__eyebrow">JV Dental</span>
              <strong>Digital patient assistant</strong>
            </div>
            <button type="button" className="public-assistant__close" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </header>

          <div className="public-assistant__log" ref={logRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`public-assistant__message public-assistant__message--${message.role}`} key={`${message.role}-${index}`}>
                {message.body.split("\n").map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}
              </div>
            ))}
            {busy ? <div className="public-assistant__thinking">Reviewing approved information…</div> : null}
          </div>

          {action ? <Link className="public-assistant__action" href={action.href}>{action.label}<span aria-hidden="true">→</span></Link> : null}

          <div className="public-assistant__quick" aria-label="Suggested questions">
            {quickReplies.map((reply) => (
              <button type="button" key={reply} onClick={() => void ask(reply)} disabled={busy}>{reply}</button>
            ))}
          </div>

          <form className="public-assistant__form" onSubmit={submit}>
            <label className="sr-only" htmlFor="jv-assistant-input">Ask JV Dental</label>
            <textarea
              id="jv-assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about implants, guided surgery or planning treatment in Hyderabad…"
              maxLength={2000}
              rows={2}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send question">Send</button>
          </form>

          <p className="public-assistant__disclaimer">General information only. The assistant does not diagnose, interpret your scans or prescribe medication. Personal recommendations require clinician review.</p>
        </section>
      ) : null}

      <button className="public-assistant__launcher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="public-assistant__mark" aria-hidden="true">JV</span>
        <span>Ask JV Dental</span>
      </button>
    </div>
  );
}
