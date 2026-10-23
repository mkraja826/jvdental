import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");

test("journal-specific list CSS cannot target Signature Cases", () => {
  const css = read("../src/app/journal-footer-refinement.css");
  const listing = read("../src/app/journal/page.tsx");
  assert.match(listing, /<main className="journal-listing-page">/);
  const selectors = css.match(/[^{}]+\{/g) ?? [];
  for (const raw of selectors) {
    const selector = raw.replace(/\{$/, "").trim();
    if (!selector.includes(".public-listing-list")) continue;
    assert.match(selector, /\.journal-listing-page\b/, `Unscoped shared listing selector: ${selector}`);
  }
});

test("case image presentation remains scoped to case routes", () => {
  const css = read("../src/app/cases-visual-refinement.css");
  assert.match(css, /\.public-listing-page \.public-case-card/);
  assert.match(css, /\.case-detail-page \.case-stage__media/);
});

test("original hero video and CMS treatment images remain selected", () => {
  const video = read("../src/app/hero-stable.css");
  const treatments = read("../src/app/dental-treatments/[slug]/page.tsx");
  assert.match(video, /object-fit: contain !important/);
  assert.match(treatments, /managedImage\?\.storage_path/);
  assert.match(treatments, /getPublicUrl\(managedImage\.storage_path\)/);
});

test("clinical case stages and images use explicit ascending order", () => {
  const cases = read("../src/app/cases/[slug]/page.tsx");
  const listing = read("../src/app/cases/page.tsx");
  assert.match(cases, /signature_case_stages"\)\.select\([^\n]+\.order\("sort_order", \{ ascending: true \}\)/);
  assert.match(cases, /signature_case_media"\)\.select\([^\n]+\.order\("sort_order", \{ ascending: true \}\)/);
  assert.match(listing, /sort\(\(a, b\) => \(a\.sort_order \?\? 0\) - \(b\.sort_order \?\? 0\)\)/);
});

test("guided case labels require database flags, not keyword guesses", () => {
  const cases = read("../src/app/cases/[slug]/page.tsx");
  assert.match(cases, /item\.dionavi_used \? "DIOnavi guided" : item\.guided_implant \? "Guided" : "Individual treatment plan"/);
});
