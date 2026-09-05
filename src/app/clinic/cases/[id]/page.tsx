import Link from "next/link";
import { notFound } from "next/navigation";
import { setCasePublication } from "@/app/clinic/cases/actions";
import CaseMediaUploader from "@/app/clinic/cases/[id]/CaseMediaUploader";
import DeleteDraftButton from "@/app/clinic/cases/[id]/DeleteDraftButton";
import { requireClinicalPublisher } from "@/lib/content/permissions";

export default async function SignatureCaseEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireClinicalPublisher();
  const { data: item } = await supabase.from("signature_cases").select("id,title,slug,treatment_type,publication_status,consent_for_website").eq("id", id).maybeSingle();
  if (!item) notFound();

  const { data: caseMedia } = await supabase.from("signature_case_media").select("id,caption").eq("signature_case_id", id).order("sort_order", { ascending: true });
  const photoCount = caseMedia?.length ?? 0;
  const explainedCount = (caseMedia ?? []).filter((photo) => photo.caption?.trim()).length;
  const readyToReview = photoCount > 0 && explainedCount === photoCount;

  return <main className="portal-shell">
    <header className="portal-header"><Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link><div className="portal-header__right"><Link className="text-link" href="/clinic/cases">Back to cases</Link></div></header>
    <div className="portal-layout">
      <aside className="portal-sidebar"><nav aria-label="Case navigation"><Link href="/clinic/cases">All cases</Link>{item.publication_status === "published" ? <Link href={`/cases/${item.slug}`}>View live case</Link> : null}</nav></aside>
      <section className="portal-main">
        <p className="portal-overline">Patient case</p><h1 className="portal-title">{item.title}</h1><p className="portal-subtitle">{item.treatment_type}</p>

        <article className="portal-card" style={{ marginTop: 22 }}><div className="portal-card__header"><h2>Your case journey</h2><span className="status-pill">{item.publication_status === "published" ? "Published" : "Draft"}</span></div><div className="portal-card__body"><div className="status-list">
          <div className="status-row"><strong>1. Photos & explanations</strong><span>{photoCount ? `${explainedCount}/${photoCount} explained` : "Add photos"}</span><span className="status-pill">{readyToReview ? "Done" : "Next"}</span></div>
          <div className="status-row"><strong>2. Review & publish</strong><span>{readyToReview ? "Ready" : "Complete the photos first"}</span><span className="status-pill">{item.publication_status}</span></div>
        </div></div></article>

        {query.error === "consent_required" ? <p style={{ color: "var(--danger)", marginTop: 18 }}>Patient website consent must be recorded before publishing.</p> : null}
        {query.error === "delete_storage_failed" || query.error === "delete_failed" ? <p style={{ color: "var(--danger)", marginTop: 18 }}>The draft could not be deleted completely. Please try again.</p> : null}
        {query.error === "delete_not_allowed" ? <p style={{ color: "var(--danger)", marginTop: 18 }}>Only private drafts can be permanently deleted.</p> : null}

        <article className="portal-card" style={{ marginTop: 24 }}><div className="portal-card__header"><h2>1 · Build the treatment story</h2><span className="status-pill">{photoCount} saved</span></div><div className="portal-card__body">
          <p style={{ color: "var(--muted)", marginTop: 0 }}>Add the treatment photos in order and write a short explanation for every photo. The website will automatically turn them into the patient case journey.</p>
          <CaseMediaUploader caseId={item.id} stages={[]} />
          {photoCount > 0 ? <p style={{ marginTop: 18 }}><strong>{photoCount} photos saved.</strong> Their explanations will appear directly below the corresponding photos on the website.</p> : null}
        </div></article>

        <article className="portal-card" style={{ marginTop: 24, marginBottom: item.publication_status === "draft" ? 16 : 32 }}><div className="portal-card__header"><h2>2 · Review & publish</h2><span className="status-pill">{item.publication_status}</span></div><div className="portal-card__body">
          <p style={{ color: "var(--muted)", marginTop: 0 }}>When the story is complete, review it and publish it for website visitors.</p>
          {item.publication_status === "published" ? <div style={{ marginBottom: 18 }}><Link className="button button--ghost" href={`/cases/${item.slug}`}>View on website →</Link></div> : <p style={{ color: "var(--muted)" }}>Website preview becomes available when the case is published. The case remains private until then.</p>}
          <p>Patient website consent: <strong>{item.consent_for_website ? "Recorded ✓" : "Not recorded"}</strong></p>
          <form action={setCasePublication} style={{ display: "grid", gap: 12 }}><input type="hidden" name="case_id" value={item.id} /><label>What would you like to do?<select name="publication_status" defaultValue={item.publication_status}><option value="draft">Keep as draft</option><option value="review">Send for doctor review</option><option value="published">Publish on website</option><option value="archived">Remove from website</option></select></label><button className="button" type="submit" disabled={!readyToReview && item.publication_status === "draft"}>Save</button></form>
        </div></article>

        {item.publication_status === "draft" ? <article className="portal-card" style={{ marginBottom: 32, borderColor: "color-mix(in srgb, var(--danger) 28%, var(--clinic-border))" }}><div className="portal-card__header"><h2>Delete this draft</h2><span className="status-pill">Draft only</span></div><div className="portal-card__body"><p style={{ color: "var(--muted)", marginTop: 0 }}>Use this only if the case was created by mistake or you want to start again.</p><DeleteDraftButton caseId={item.id} caseTitle={item.title} /></div></article> : null}
      </section>
    </div>
  </main>;
}
