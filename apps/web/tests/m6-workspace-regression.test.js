import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("collapsed workspace main column has no legacy left offset", async () => {
  const css = await read("../src/style.css");
  assert.match(
    css,
    /\.experience-shell\.sidebar-collapsed\s+\.main\s*\{[^}]*margin-left:\s*0\s*!important/s,
  );
});

test("employee create, invite and edit actions reveal the form", async () => {
  const view = await read("../src/views/administration/EmployeesView.vue");
  assert.match(view, /async function revealEmployeeForm\(\)/);
  assert.match(view, /async function openCreate\(\)[\s\S]*?await revealEmployeeForm\(\)/);
  assert.match(view, /async function openInvite\(\)[\s\S]*?await revealEmployeeForm\(\)/);
  assert.match(view, /async function openEdit\(employee\)[\s\S]*?await revealEmployeeForm\(\)/);
});

test("inventory create and edit actions reveal the form", async () => {
  const view = await read("../src/views/administration/InventoryView.vue");
  assert.match(view, /async function revealInventoryForm\(\)/);
  assert.match(view, /async function startCreate\(\)[\s\S]*?await revealInventoryForm\(\)/);
  assert.match(view, /async function edit\(item\)[\s\S]*?await revealInventoryForm\(\)/);
});

test("dark theme uses balanced surface and text tokens", async () => {
  const css = await read("../src/style.css");
  assert.match(css, /\.theme-dark \.experience-shell \.workspace-panel[\s\S]*?background-color:\s*#182437/);
  assert.match(css, /\.theme-dark \.experience-shell \.muted[\s\S]*?color:\s*#a5b3c7/);
});
