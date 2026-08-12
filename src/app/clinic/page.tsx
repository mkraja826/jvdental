import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { requireStaff } from "@/lib/auth/guards";

const metrics = [
  { label: "International enquiries", value: "—" },
  { label: "Awaiting doctor review", value: "—" },
  { label: "Consultations", value: "—" },
  { label: "Low-stock items", value: "—" },
];

export default async function ClinicDashboard() {
  const { staff } = await requireStaff();

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link className="wordmark" href="/clinic">
          <span>JV</span>
          <span>Clinic</span>
        </Link>
        <div className="portal-header__right">
          <span>{staff.full_name ?? "JV Dental staff"}</span>
          <span className="status-pill">{staff.role}</span>
          <form action={signOut}>
            <button
              className="text-link"
              type="submit"
              style={{ background: "none", border: 0, cursor: "pointer" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav aria-label="Clinic portal navigation">
            <Link href="/clinic">Overview</Link>
            <Link href="/clinic#patients">Patients</Link>
            <Link href="/clinic#cases">Cases</Link>
            <Link href="/clinic#inbox">Inbox</Link>
            <Link href="/clinic/inventory">Inventory</Link>
            <Link href="/clinic#estimates">Estimates</Link>
            <Link href="/clinic#reports">Reports</Link>
          </nav>
        </aside>

        <section className="portal-main">
          <p className="portal-overline">Clinic operations</p>
          <h1 className="portal-title">A precise view of today.</h1>
          <p className="portal-subtitle">
            Clinical, international-patient and inventory workflows will meet here without
            exposing patient data to the public website.
          </p>

          <div className="metric-grid">
            {metrics.map((metric) => (
              <article className="metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="portal-grid">
            <article className="portal-card" id="patients">
              <div className="portal-card__header">
                <h2>International patient pipeline</h2>
                <span className="status-pill">CRM foundation</span>
              </div>
              <div className="portal-card__body">
                <div className="status-list">
                  <div className="status-row">
                    <strong>New enquiries</strong>
                    <span>—</span>
                    <span className="status-pill">Awaiting data</span>
                  </div>
                  <div className="status-row">
                    <strong>Doctor review required</strong>
                    <span>—</span>
                    <span className="status-pill">Clinical</span>
                  </div>
                  <div className="status-row">
                    <strong>Travel confirmed</strong>
                    <span>—</span>
                    <span className="status-pill">International</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="portal-card">
              <div className="portal-card__header">
                <h2>Inventory attention</h2>
              </div>
              <div className="portal-card__body">
                <p>
                  Low-stock, expiring implant components and recent stock movements will be
                  surfaced here once inventory records are connected.
                </p>
                <Link className="button button--ghost" href="/clinic/inventory">
                  Open inventory →
                </Link>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
