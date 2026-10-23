import { publishWebsiteTheme } from "@/app/clinic/website/theme-actions";
import { websiteThemes } from "@/content/website-themes";

export default function WebsiteThemePicker({ currentTheme }: { currentTheme: string }) {
  return (
    <section className="website-theme-panel" aria-labelledby="website-theme-heading">
      <div className="website-theme-panel__heading">
        <div>
          <p className="portal-overline">Website art</p>
          <h2 id="website-theme-heading">Theme presets</h2>
          <p>Choose one complete palette. Colours are locked together so contrast, buttons, cards, navigation and footer styling remain coordinated.</p>
        </div>
      </div>

      <div className="website-theme-grid">
        {websiteThemes.map((theme) => {
          const active = theme.key === currentTheme;
          return (
            <article className="website-theme-card" data-active={active ? "true" : undefined} key={theme.key}>
              <div
                className="website-theme-preview"
                aria-hidden="true"
                style={{
                  background: theme.colors.offWhite,
                  borderColor: theme.colors.line,
                  color: theme.colors.navy,
                }}
              >
                <div className="website-theme-preview__nav" style={{ background: theme.colors.navy }}>
                  <span style={{ background: theme.colors.accent }} />
                  <i style={{ background: theme.colors.offWhite }} />
                  <i style={{ background: theme.colors.offWhite }} />
                </div>
                <div className="website-theme-preview__body">
                  <div>
                    <span className="website-theme-preview__kicker" style={{ background: theme.colors.accent }} />
                    <strong style={{ background: theme.colors.navy }} />
                    <strong style={{ background: theme.colors.navy, width: "72%" }} />
                    <small style={{ background: theme.colors.muted }} />
                    <button type="button" tabIndex={-1} style={{ background: theme.colors.navy }} />
                  </div>
                  <div className="website-theme-preview__visual" style={{ background: theme.colors.mist }}>
                    <span style={{ borderColor: theme.colors.accent }} />
                  </div>
                </div>
              </div>

              <div className="website-theme-card__meta">
                <div>
                  <h3>{theme.name}</h3>
                  <p>{theme.description}</p>
                </div>
                {active ? <span className="status-pill">Current theme</span> : null}
              </div>

              <div className="website-theme-swatches" aria-label={`${theme.name} palette`}>
                {[theme.colors.navy, theme.colors.accent, theme.colors.mist, theme.colors.offWhite].map((color) => (
                  <span key={color} style={{ background: color }} title={color} />
                ))}
              </div>

              <form action={publishWebsiteTheme}>
                <input type="hidden" name="theme_key" value={theme.key} />
                <button className={active ? "button button--ghost" : "button"} disabled={active} type="submit">
                  {active ? "Applied" : "Apply theme"}
                </button>
              </form>
            </article>
          );
        })}
      </div>
      <p className="website-theme-note">JV Dental Default always remains available as the safe restore option. Individual colours cannot be edited from the admin panel.</p>
    </section>
  );
}
