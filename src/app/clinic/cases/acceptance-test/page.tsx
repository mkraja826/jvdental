import Link from "next/link";
import { runCaseAcceptanceTest } from "@/app/clinic/cases/actions";
import { requireClinicalPublisher } from "@/lib/content/permissions";

export default async function CaseAcceptanceTestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireClinicalPublisher();
  const params = await searchParams;

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link>
        <Link className="text-link" href="/clinic/cases">Back to cases</Link>
      </header>
      <section className="portal-main" style={{ maxWidth: 760, margin: "0 auto" }}>
        <p className="portal-overline">QA only</p>
        <h1 className="portal-title">Case workflow acceptance test</h1>
        <p className="portal-subtitle">This creates one private draft with 13 generated test images, the same ordering model and 13 photo summaries. It exercises the authenticated case record, Supabase Storage upload, media metadata, ordering and saved-story editor without publishing anything publicly.</p>

        {params.error ? <p style={{ color: "var(--danger)", marginTop: 20 }}>The automated test stopped before completion. No partial test case should remain.</p> : null}

        <article className="portal-card" style={{ marginTop: 24 }}>
          <div className="portal-card__header"><h2>One-click test</h2><span className="status-pill">Private draft</span></div>
          <div className="portal-card__body">
            <p style={{ color: "var(--muted)", marginTop: 0 }}>Run this once. If successful you will be taken to the generated draft, where the page should show <strong>13/13 explained</strong>. You can then delete the draft using the normal Delete draft action.</p>
            <form action={runCaseAcceptanceTest}>
              <button className="button" type="submit">Run case workflow test →</button>
            </form>
          </div>
        </article>
      </section>
    </main>
  );
}
