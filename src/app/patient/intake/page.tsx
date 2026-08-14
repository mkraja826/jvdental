import Link from "next/link";
import { redirect } from "next/navigation";
import PatientNavigation from "@/components/patient-navigation";
import PendingSubmit from "@/components/pending-submit";
import { createClient } from "@/lib/supabase/server";
import { savePatientIntake } from "./actions";
import styles from "./page.module.css";

type IntakePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const treatmentOptions = [
  "Single implant",
  "Multiple implants",
  "Full-mouth rehabilitation",
  "All-on-4 / All-on-6",
  "Second opinion",
  "Not sure yet",
];

export default async function PatientIntakePage({ searchParams }: IntakePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/patient/login");
  }

  const [{ data: profile }, { data: medical }, { data: dental }] = await Promise.all([
    supabase.from("patient_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("medical_histories").select("*").eq("patient_id", user.id).maybeSingle(),
    supabase.from("dental_intakes").select("*").eq("patient_id", user.id).maybeSingle(),
  ]);

  const hasError = typeof params.error === "string";
  const preferredMonth = dental?.preferred_treatment_month
    ? String(dental.preferred_treatment_month).slice(0, 7)
    : "";

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/patient">
          <span>JV</span>
          <span>Dental</span>
        </Link>
        <div className="portal-header__right">
          <span>{user.email}</span>
          <span className="status-pill">Patient intake</span>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <PatientNavigation />
        </aside>

        <section className="portal-main">
          <div className={styles.shell}>
            <Link className={styles.back} href="/patient">
              ← Back to patient overview
            </Link>

            <p className="portal-overline">Pre-consultation information</p>
            <h1 className="portal-title">Help the clinical team understand your case.</h1>
            <p className="portal-subtitle">
              This information supports case preparation. It does not replace an in-person
              clinical examination or the diagnostic records your dentist may request.
            </p>

            {hasError ? (
              <p className={styles.notice}>
                Some information could not be saved. Review the required fields and try again.
                If the problem continues, contact JV Dental.
              </p>
            ) : null}

            <form className={styles.form} action={savePatientIntake}>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span>01 · About you</span>
                  <h2>Personal & contact details</h2>
                  <p>We use these details to identify your case and plan communication across time zones.</p>
                </div>

                <div className={styles.grid}>
                  <div className={`${styles.field} ${styles.full}`}>
                    <label htmlFor="full_name">Full name *</label>
                    <input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} required />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="date_of_birth">Date of birth</label>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      defaultValue={profile?.date_of_birth ?? ""}
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" name="gender" defaultValue={profile?.gender ?? ""}>
                      <option value="">Prefer not to say</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="country">Country *</label>
                    <input id="country" name="country" defaultValue={profile?.country ?? ""} required />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="city">City</label>
                    <input id="city" name="city" defaultValue={profile?.city ?? ""} />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="phone">Phone</label>
                    <input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="whatsapp">WhatsApp</label>
                    <input id="whatsapp" name="whatsapp" type="tel" defaultValue={profile?.whatsapp ?? ""} />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="preferred_language">Preferred language</label>
                    <input
                      id="preferred_language"
                      name="preferred_language"
                      defaultValue={profile?.preferred_language ?? "en"}
                      placeholder="English"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="preferred_contact_method">Preferred contact</label>
                    <select
                      id="preferred_contact_method"
                      name="preferred_contact_method"
                      defaultValue={profile?.preferred_contact_method ?? "portal"}
                    >
                      <option value="portal">Secure portal</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span>02 · Medical history</span>
                  <h2>Health information relevant to treatment planning</h2>
                  <p>
                    Select conditions that apply and add medications, allergies or other health
                    information the clinical team should know before reviewing your case.
                  </p>
                </div>

                <div className={styles.checkGrid}>
                  <label className={styles.check}>
                    <input name="diabetes" type="checkbox" defaultChecked={medical?.diabetes ?? false} />
                    Diabetes
                  </label>
                  <label className={styles.check}>
                    <input
                      name="hypertension"
                      type="checkbox"
                      defaultChecked={medical?.hypertension ?? false}
                    />
                    High blood pressure
                  </label>
                  <label className={styles.check}>
                    <input
                      name="heart_condition"
                      type="checkbox"
                      defaultChecked={medical?.heart_condition ?? false}
                    />
                    Heart condition
                  </label>
                  <label className={styles.check}>
                    <input
                      name="blood_thinners"
                      type="checkbox"
                      defaultChecked={medical?.blood_thinners ?? false}
                    />
                    Blood-thinning medication
                  </label>
                </div>

                <div className={styles.grid} style={{ marginTop: 22 }}>
                  <div className={`${styles.field} ${styles.full}`}>
                    <label htmlFor="current_medications">Current medications</label>
                    <textarea
                      id="current_medications"
                      name="current_medications"
                      defaultValue={medical?.current_medications ?? ""}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="allergies">Allergies</label>
                    <textarea id="allergies" name="allergies" defaultValue={medical?.allergies ?? ""} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="smoking_status">Smoking / tobacco</label>
                    <textarea
                      id="smoking_status"
                      name="smoking_status"
                      defaultValue={medical?.smoking_status ?? ""}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="previous_surgeries">Previous surgeries</label>
                    <textarea
                      id="previous_surgeries"
                      name="previous_surgeries"
                      defaultValue={medical?.previous_surgeries ?? ""}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="other_conditions">Other conditions</label>
                    <textarea
                      id="other_conditions"
                      name="other_conditions"
                      defaultValue={medical?.other_conditions ?? ""}
                    />
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span>03 · Dental concern</span>
                  <h2>Tell us what you would like help with</h2>
                  <p>
                    Plain language is fine. The implantologist will use your description together
                    with appropriate photographs and radiographs later in the review process.
                  </p>
                </div>

                <div className={styles.grid}>
                  <div className={`${styles.field} ${styles.full}`}>
                    <label htmlFor="primary_concern">Main dental concern</label>
                    <textarea
                      id="primary_concern"
                      name="primary_concern"
                      defaultValue={dental?.primary_concern ?? ""}
                      placeholder="For example: several missing upper teeth and difficulty eating..."
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="missing_teeth">Missing teeth / areas</label>
                    <textarea id="missing_teeth" name="missing_teeth" defaultValue={dental?.missing_teeth ?? ""} />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="previous_implants">Previous implant treatment</label>
                    <textarea
                      id="previous_implants"
                      name="previous_implants"
                      defaultValue={dental?.previous_implants ?? ""}
                    />
                  </div>

                  <div className={`${styles.field} ${styles.full}`}>
                    <label htmlFor="pain_or_infection">Current pain, swelling or infection</label>
                    <textarea
                      id="pain_or_infection"
                      name="pain_or_infection"
                      defaultValue={dental?.pain_or_infection ?? ""}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <p className={styles.label}>Current dental situation</p>
                  <div className={styles.checkGrid}>
                    <label className={styles.check}>
                      <input name="loose_teeth" type="checkbox" defaultChecked={dental?.loose_teeth ?? false} />
                      Loose teeth
                    </label>
                    <label className={styles.check}>
                      <input
                        name="existing_dentures"
                        type="checkbox"
                        defaultChecked={dental?.existing_dentures ?? false}
                      />
                      Wearing dentures
                    </label>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span>04 · Treatment goals</span>
                  <h2>What are you exploring?</h2>
                  <p>You do not need to know the correct procedure before speaking with the doctor.</p>
                </div>

                <div className={styles.checkGrid}>
                  {treatmentOptions.map((option) => (
                    <label className={styles.check} key={option}>
                      <input
                        name="treatment_interest"
                        type="checkbox"
                        value={option}
                        defaultChecked={dental?.treatment_interest?.includes(option) ?? false}
                      />
                      {option}
                    </label>
                  ))}
                </div>

                <div className={styles.grid} style={{ marginTop: 22 }}>
                  <div className={styles.field}>
                    <label htmlFor="preferred_treatment_month">Preferred treatment month</label>
                    <input
                      id="preferred_treatment_month"
                      name="preferred_treatment_month"
                      type="month"
                      defaultValue={preferredMonth}
                    />
                  </div>
                  <div className={`${styles.field} ${styles.full}`}>
                    <label htmlFor="notes">Anything else you want the clinic to know?</label>
                    <textarea id="notes" name="notes" defaultValue={dental?.notes ?? ""} />
                  </div>
                </div>
              </section>

              <div className={styles.submitBar}>
                <div>
                  <label className={styles.check} style={{ border: 0, padding: 0, minHeight: 0 }}>
                    <input type="checkbox" required />
                    I confirm the information I have provided is accurate to the best of my knowledge.
                  </label>
                  <p style={{ marginTop: 10 }}>
                    Submitting this form does not create a diagnosis or guarantee treatment suitability.
                  </p>
                </div>
                <PendingSubmit label="Save & continue →" pendingLabel="Saving…" className="button" />
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
