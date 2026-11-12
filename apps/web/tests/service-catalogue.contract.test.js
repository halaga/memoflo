import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFileSync(resolve(here, path), "utf8");
const catalogue = read("../src/views/ServicesView.vue");
const action = read("../src/views/ServiceActionView.vue");
const styles = read("../src/style.css");

test("legacy business-purchase slugs resolve to one canonical service", () => {
  assert.match(catalogue, /"business-purchase": "business-purchase-request"/);
  assert.match(catalogue, /"laptop-request": "business-purchase-request"/);
  assert.match(catalogue, /const bySlug = new Map\(\)/);
});

test("workplace requests are grouped under Business Services", () => {
  assert.match(catalogue, /"workplace", "business services"/);
  assert.match(action, /service\.value\.category = "Business Services"/);
});

test("fuel, vehicle repair and furniture requests have dedicated fields", () => {
  for (const slug of ["fuel-request", "vehicle-repair", "office-furniture"]) {
    assert.ok(action.includes(`serviceSlug === '${slug}'`), `${slug} form is present`);
  }
  assert.match(action, /const workplaceDetails = \[/);
  assert.match(action, /isWorkplaceService\.value \? workplaceDetails/);
});

test("dashboard cards keep a usable minimum width with an expanded sidebar", () => {
  assert.match(styles, /grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 248px\), 1fr\)\)/);
});

test("dark mode uses muted surfaces and readable secondary text", () => {
  assert.match(styles, /--mf-surface: #192638/);
  assert.match(styles, /--mf-muted: #a5b3c7/);
  assert.doesNotMatch(styles, /\.theme-dark \.experience-shell h1[\s\S]{0,400}color: #fff;/);
});
