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
