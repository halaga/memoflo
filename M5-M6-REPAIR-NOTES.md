MemoFlo M5-M6 Repair Patch

Apply this archive over the existing MemoFlo repository. It contains only files changed for this milestone; it does not include .git, node_modules, .env, or dist.

Main fixes:
- First unauthenticated page is /login.
- Successful login goes to the company Module Hub.
- Ringo is treated as the development tenant with all catalogue modules enabled.
- Roles & Permissions route is registered and surfaced in the sidebar.
- Duplicate role API method removed.
- RBAC wildcard/system-admin handling corrected.
- Create Memo fixed: requestingSbu naming mismatch, SBU selector, valid priority values, workflow selection/defaulting.
- Added SBU read endpoints under the existing organization/sbu structure.
- Memo workflowInstance is persisted and populated.
- Memo APIs are company-scoped.
- Workflow start fixed: resource type normalization and submit-step ownership.
- Workflow completion/rejection/cancellation/resubmission synchronization fixed.
- Workflow step validator now supports all actions in the model.
- Workflow builder correctly reads the {workflow, steps} API response and appends steps safely.
- Employee repository duplicate methods removed and employee mutations made company-scoped.
- Enterprise-style UI refresh across login, workspace, module hub, memos, workflow settings and roles.

Validation:
- API JavaScript syntax check passed.
- Vue/Vite source transformation and production build passed with minification disabled in the inspection environment. The uploaded Windows node_modules contains a platform-specific lightningcss binary, so normal local npm run build should be used on Windows.

Suggested next product improvement:
After this milestone, make Module Catalogue + Company Subscription a real backend concept rather than the current Ringo development fallback. Keep Subscription as the commercial plan layer and add module entitlements at the company level. Then drive both module visibility and backend authorization from those entitlements.
