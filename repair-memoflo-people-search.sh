#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

for f in apps/web/src/views/HomeView.vue apps/web/src/views/PeopleView.vue apps/web/src/services/api.js apps/api/src/modules/employee/employee.service.js apps/web/src/router/index.js apps/web/src/style.css; do
  [[ -f "$f" ]] || { echo "ERROR: missing expected file: $f"; exit 1; }
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=".git/memoflo-patch-backups/people-search-${STAMP}"
if [[ -d .git ]]; then
  mkdir -p "$BACKUP"
  for f in apps/web/src/views/HomeView.vue apps/web/src/views/PeopleView.vue apps/web/src/services/api.js apps/api/src/modules/employee/employee.service.js apps/web/src/router/index.js apps/web/src/style.css; do
    mkdir -p "$BACKUP/$(dirname "$f")"
    cp -p "$f" "$BACKUP/$f"
  done
fi

mkdir -p apps/web/src/components/ui apps/web/src/utils
cp "$ROOT/.memoflo-patch/HomeView.vue" apps/web/src/views/HomeView.vue
cp "$ROOT/.memoflo-patch/PeopleView.vue" apps/web/src/views/PeopleView.vue
cp "$ROOT/.memoflo-patch/EmployeeProfileView.vue" apps/web/src/views/EmployeeProfileView.vue
cp "$ROOT/.memoflo-patch/AppIcon.vue" apps/web/src/components/ui/AppIcon.vue
cp "$ROOT/.memoflo-patch/dataTransfer.js" apps/web/src/utils/dataTransfer.js
cat "$ROOT/.memoflo-patch/style-overrides.css" >> apps/web/src/style.css

node --input-type=module <<'NODE'
import fs from "fs";
const apiPath = "apps/web/src/services/api.js";
let api = fs.readFileSync(apiPath, "utf8");
if (!api.includes("getEmployee(id)")) {
  const marker = "  createEmployee(data) {";
  if (!api.includes(marker)) throw new Error("Could not find createEmployee API method");
  api = api.replace(marker, "  getEmployee(id) {\n    return request(`/employees/${id}`);\n  },\n\n" + marker);
  fs.writeFileSync(apiPath, api);
}

const servicePath = "apps/api/src/modules/employee/employee.service.js";
let service = fs.readFileSync(servicePath, "utf8");
service = service.replace(
  /const filter = \{ company: companyId, active: true, isActive: true, employmentStatus: "Active", loginEnabled: true \};/,
  'const filter = { company: companyId, active: true, deletedAt: null, employmentStatus: "Active" };'
);
fs.writeFileSync(servicePath, service);

const routerPath = "apps/web/src/router/index.js";
let router = fs.readFileSync(routerPath, "utf8");
if (!router.includes('name: "employee-profile"')) {
  const marker = /      \{\r?\n        path: "company",/;
  const route = `      {\n        path: "people/:id",\n        name: "employee-profile",\n        component: () => import("../views/EmployeeProfileView.vue"),\n      },\n      {\n        path: "company",`;
  if (marker.test(router)) router = router.replace(marker, route);
  else throw new Error("Could not find People route insertion point in router/index.js");
}
fs.writeFileSync(routerPath, router);
NODE

# Ensure the local API import/export style remains compatible with both forms.
if ! grep -q '^export default api;' apps/web/src/services/api.js; then
  printf '\nexport default api;\n' >> apps/web/src/services/api.js
fi

# Validate JavaScript files touched by the patch.
node --check apps/api/src/modules/employee/employee.service.js
node --check apps/web/src/services/api.js
node --check apps/web/src/router/index.js

# Validate Vue script blocks without needing Python.
node --input-type=module <<'NODE'
import fs from "fs";
import { execFileSync } from "child_process";
const files = [
  "apps/web/src/views/HomeView.vue",
  "apps/web/src/views/PeopleView.vue",
  "apps/web/src/views/EmployeeProfileView.vue",
  "apps/web/src/components/ui/AppIcon.vue",
  "apps/web/src/utils/dataTransfer.js",
];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/<script setup[^>]*>([\s\S]*?)<\/script>/);
  if (match) {
    const tmp = `.memoflo-check-${Math.random().toString(36).slice(2)}.mjs`;
    fs.writeFileSync(tmp, match[1]);
    try { execFileSync(process.execPath, ["--check", tmp], { stdio: "inherit" }); }
    finally { fs.rmSync(tmp, { force: true }); }
  }
}
NODE

echo
echo "MemoFlo People/Search repair applied successfully."
[[ -d "$BACKUP" ]] && echo "Backup: $BACKUP"
echo "Next: cd apps/web && npm run build"
echo "Then: cd ../api && npm run dev"
