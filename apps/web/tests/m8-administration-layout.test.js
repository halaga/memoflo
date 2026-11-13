import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("home cards reflow to available width without shrinking their content columns", async () => {
  const css = await read("../src/style.css");
  assert.match(css, /\.experience-shell \.home-stat-grid\s*\{[^}]*auto-fit[^}]*248px/s);
  assert.match(css, /\.experience-shell \.home-stat-card\s*\{[^}]*grid-template-columns:\s*44px minmax\(0, 1fr\) 18px/s);
});

test("administration cards and forms constrain long labels and actions", async () => {
  const css = await read("../src/style.css");
  assert.match(css, /\.experience-shell \.admin-control-grid\s*\{[^}]*auto-fit/s);
  assert.match(css, /\.experience-shell :where\(\.form-actions, \.modal-actions, \.inline-actions, \.table-actions, \.inventory-actions\)[\s\S]*?flex-wrap:\s*wrap/s);
  assert.match(css, /\.experience-shell \.modal-card \.form-grid\s*\{[^}]*minmax\(0, 1fr\)/s);
});

test("inventory add and edit scroll to and focus the actual form", async () => {
  const view = await read("../src/views/administration/InventoryView.vue");
  assert.match(view, /async function revealInventoryForm\(\)/);
  assert.match(view, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(view, /async function startCreate\(\)[\s\S]*?await revealInventoryForm\(\)/);
  assert.match(view, /async function edit\(item\)[\s\S]*?await revealInventoryForm\(\)/);
  assert.match(view, /ref="inventoryFormSection"/);
});
