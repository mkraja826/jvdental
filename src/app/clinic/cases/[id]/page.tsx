import Link from "next/link";
import { notFound } from "next/navigation";
import { setCasePublication } from "@/app/clinic/cases/actions";
import CaseMediaUploader from "@/app/clinic/cases/[id]/CaseMediaUploader";
import SavedCaseMediaEditor from "@/app/clinic/cases/[id]/SavedCaseMediaEditor";
import DeleteDraftButton from "@/app/clinic/cases/[id]/DeleteDraftButton";
import { requireClinicalPublisher } from "@/lib/content/permissions";

export default async function SignatureCaseEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireClinicalPublisher();
  const { data: item } = await supabase.from("signature_cases").select("id,title,slug,treatment_type,publication_status").eq("id", id).maybeSingle();
  if (!item) notFound();

  const { data: caseMedia } = await supabase.from("signature_case_media").select("id,storage_path,caption,sort_order").eq("signature_case_id", id).order("sort_order", { ascending: true });
  const photoCount = caseMedia?.length ?? 0;
  const explainedCount = (caseMedia ?? []).filter((photo) => photo.caption?.trim()).length;
  const readyToPublish = photoCount > 0 && explainedCount === photoCount;

  return <main className="portal-shell">
    <header className="portal-header"><Link className="wordmark" href="/clinic"><span>JV</span><span>Clinic</span></Link><div className="portal-header__right"><Link className="text-link" href="/clinic/cases">Back to cases</Link></div></header>
    <div className="portal-layout">
      <aside className="portal-sidebar"><nav aria-label="Case navigation"><Link href="/clinic/cases">All cases</Link>{item.publication_status === "published" ? <Link href={`/cases/${item.slug}`}>View live case</Link> : null}</nav></aside>
      <section className="portal-main">
        <p className="portal-overline">Patient case</p><h1 className="portal-title">{item.title}</h1><p className="portal-subtitle">{item.treatment_type}</p>

        <article className="portal-card" style={{ marginTop: 22 }}><div className="portal-card__header"><h2>Your case journey</h2><span className="status-pill">{item.publication_status === "published" ? "Published" : "In progress"}</span></div><div className="portal-card__body"><div className="status-list">
          <div className="status-row"><strong>1. Photos & explanations</strong><span>{photoCount ? `${explainedCount}/${photoCount} explained` : "Add photos"}</span><span className="status-pill">{readyToPublish ? "Done" : "Next"}</span></div>
          <div className="status-row"><strong>2. Publish</strong><span>{readyToPublish ? "Ready" : "Complete the photos first"}</span><span className="status-pill">{item.publication_status}</span></div>
        </div></div></article>

        {query.error === "delete_storage_failed" || query.error === "delete_failed" ? <p style={{ color: "var(--danger)", marginTop: 18 }}>The draft could not be deleted completely. Please try again.</p> : null}
        {query.error === "delete_not_allowed" ? <p style={{ color: "var(--danger)", marginTop: 18 }}>Only private drafts can be permanently deleted.</p> : null}

        <article className="portal-card" style={{ marginTop: 24 }}><div className="portal-card__header"><h2>1 · Build the treatment story</h2><span className="status-pill">{photoCount} saved</span></div><div className="portal-card__body">
          <p style={{ color: "var(--muted)", marginTop: 0 }}>Add photos in treatment order and explain each one. Visitors will see the same sequence and explanations.</p>
          {photoCount > 0 ? <SavedCaseMediaEditor items={caseMedia ?? []} /> : null}
          <div style={{ marginTop: photoCount ? 24 : 0 }}><CaseMediaUploader caseId={item.id} stages={[]} /></div>
        </div></article>

        <article className="portal-card" style={{ marginTop: 24, marginBottom: item.publication_status === "draft" ? 16 : 32 }}><div className="portal-card__header"><h2>2 · Publish</h2><span className="status-pill">{item.publication_status}</span></div><div className="portal-card__body">
          <p style={{ color: "var(--muted)", marginTop: 0 }}>{readyToPublish ? "The photo story is complete. Publish when you are happy with it." : "Add a short explanation to every photo before publishing."}</p>
          {item.publication_status === "published" ? <div style={{ marginBottom: 18 }}><Link className="button button--ghost" href={`/cases/${item.slug}`}>View on website →</Link></div> : null}
          <form action={setCasePublication} style={{ display: "grid", gap: 12 }}><input type="hidden" name="case_id" value={item.id} /><label>Case status<select name="publication_status" defaultValue={item.publication_status}><option value="draft">Keep as draft</option><option value="review">Ready for doctor review</option><option value="published" disabled={!readyToPublish}>Publish on website</option><option value="archived">Remove from website</option></select></label><button className="button" type="submit">Save case status</button></form>
        </div></article>

        {item.publication_status === "draft" ? <article className="portal-card" style={{ marginBottom: 32, borderColor: "color-mix(in srgb, var(--danger) 28%, var(--clinic-border))" }}><div className="portal-card__header"><h2>Delete this draft</h2><span className="status-pill">Draft only</span></div><div className="portal-card__body"><p style={{ color: "var(--muted)", marginTop: 0 }}>Use this only if the case was created by mistake or you want to start again.</p><DeleteDraftButton caseId={item.id} caseTitle={item.title} /></div></article> : null}
      </section>
    </div>
  </main>;
}
