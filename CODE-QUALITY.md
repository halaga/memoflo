# MemoFlo Code Quality Baseline

MemoFlo is structured as a tenant-aware business workflow platform with a
separation between the API and web application.

## Backend conventions

- Controllers handle HTTP concerns only.
- Services contain business rules and validation orchestration.
- Repositories contain database access.
- Routes define authentication and authorization boundaries.
- Company-scoped data access must include the authenticated company id.
- Password hashes are never returned to the client.
- Environment secrets belong in `.env`, never in source control.

## Frontend conventions

- Views own page-level state and orchestration.
- API communication is centralized in `src/services/api.js`.
- Router guards enforce authentication, permissions and module entitlements.
- Module Hub is platform-level; module-specific navigation belongs inside the
  module workspace.
- Company branding is data-driven rather than hard-coded into the layout.

## Formatting

The repository uses the root `.prettierrc.json` configuration. Keep source
files formatted before committing.

Recommended checks:

```bash
cd apps/api
npm run lint
npm run format
```

For the web application, run Prettier from the repository root after the
Prettier dependency is installed in your development environment.

## Security note

The development seed may create predictable demo accounts. Use only in a
local development database and set `SEED_ADMIN_PASSWORD` when required.
Never reuse development credentials in production.
