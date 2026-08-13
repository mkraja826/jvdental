export default function ClinicLoading() {
  return (
    <main className="clinic-loading" aria-live="polite" aria-busy="true">
      <div className="clinic-loading__topbar">
        <div className="clinic-loading__brand" />
        <div className="clinic-loading__identity" />
      </div>
      <div className="clinic-loading__layout">
        <aside className="clinic-loading__sidebar" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="clinic-loading__nav" key={index} />
          ))}
        </aside>
        <section className="clinic-loading__main">
          <div className="clinic-loading__eyebrow" />
          <div className="clinic-loading__title" />
          <div className="clinic-loading__subtitle" />
          <div className="clinic-loading__metrics">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="clinic-loading__metric" key={index} />
            ))}
          </div>
          <div className="clinic-loading__cards">
            <div className="clinic-loading__card" />
            <div className="clinic-loading__card" />
          </div>
          <span className="sr-only">Loading clinic workspace</span>
        </section>
      </div>
    </main>
  );
}
