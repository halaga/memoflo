# MemoFlo reconciliation report

## Source and recovery

- Source inspected: `MemoFlo-current(7).zip`.
- The uploaded archive is byte-for-byte identical to the `MemoFlo-current(6).zip` archive available in this session.
- The source archive still contains its hidden M18, M19, M20, M21 and M22 backup folders.
- Earlier M23.1/M23.2 patch archives were also available in this session. Their employee biodata/document and inventory artifacts were used as recovery references, then reconciled with the current API instead of copied blindly.
- This is a targeted overlay. It does not replace the whole project, `.env`, package lockfiles, or user data.

## Milestones restored / implemented in this reconciliation

- **Global search:** one global search field in the top bar. It searches available employees, services, memos, service requests, procurement requests, leave requests, inventory, notifications, departments, workflows and roles. The search source registry is documented in `apps/web/src/views/SearchView.vue` for future modules.
- **Home:** removed the second Home search box; greeting changes with local time; home cards use SVG icons and open the corresponding areas.
- **Services:** categorized service cards with SVG icons; Laptop Request belongs to Business Purchase; IT includes IT Support, IT Maintenance, Software Installation and Internet Subscription; service detail actions route to Email Signature, Leave, Procurement, People, Approvals or the correct service-action form.
- **My Work:** includes memos, notifications, service requests, procurement and leave requests; each item links to its relevant detail/action page.
- **Simple memos:** can be sent to multiple recipients simultaneously; the API validates every recipient against the same company and creates one notification per recipient. The legacy singular `recipient` field is retained for compatibility. Direct memos do not offer a Start Approval Workflow action.
- **People & HR:** employee directory endpoint no longer filters out employees merely because they do not have login access; profile route and editable employee contact/employment fields restored; biodata schema, avatar upload, required document upload/download/removal restored; CSV import/export and import template included.
- **Inventory:** persistent MongoDB inventory records with company scoping, owner department, custodian, item/serial code, quantities, location, purchase date, status and notes; Admin/IT department presets; CSV import/export/template; retiring an item retains its record as Retired.
- **Navigation and presentation:** sidebar collapse/mobile rail control is inside the sidebar; no top-bar hamburger was added; desktop/tablet/mobile spacing and text sizing overrides added; SVG icons used in the reconciled views; dark/light mode toggle persists; portfolio link and “Workflow, simplified.” tagline included.
- **Routing and recovery:** Search, Employee Profile, Inventory, Service Request Detail, Access Denied and Not Found routes/views are defined explicitly instead of silently redirecting missing pages to Home.

## Static validation performed

- 139 API/web JavaScript files (including the API test file) passed `node --check`.
- 49 Vue `<script>` blocks passed `node --check` across 50 Vue single-file components.
- All relative imports in the API/web source tree resolved.
- All statically referenced router components were defined.
- All `api.*()` methods used by Vue views exist in `src/services/api.js`.
- A template-tag balance check passed across Vue components.
- CSV parser test passed for commas, escaped quotes and embedded newlines.
- The production Vite build could not be executed in this isolated environment because dependencies were not installed and the npm cache was missing a required package (`webpack-virtual-modules`). The final local `npm run build` remains necessary after applying the patch.

## Apply safely

From the MemoFlo root in Git Bash:

```bash
bash apply-memoflo-reconciled.sh
```

The script backs up each existing target file into `.memoflo-backup-reconciled-<timestamp>` before copying the reconciled version. It uses Bash and Node only; Python is not required.

Then run:

```bash
cd apps/web
npm run build
```

And in a second terminal:

```bash
cd apps/api
npm run dev
```

If your API has a MongoDB connection configured, it should proceed to its normal startup checks. Do not run a seed or database reset merely to apply these source changes.
