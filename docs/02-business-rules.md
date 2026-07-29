# MemoFlo Business Rules

Version: 2.0

---

# 1. Company

A company represents one organization using MemoFlo.

Each company has its own:

- users
- logo
- workflow
- branding
- departments
- SBUs
- permissions
- memos

Companies never share data.

---

# 2. Memo Types

MemoFlo supports multiple memo types.

Initially:

## Procurement Memo

Used for purchasing.

Uses a configurable approval workflow.

---

## Basic Memo

Internal communication.

Can be sent directly to one or more recipients.

Examples:

- Circular
- Announcement
- Request
- Reminder
- Notice

No approval workflow is required unless configured.

---

# 3. Memo Status

Draft

Submitted

Pending

Approved

Rejected

Returned

Cancelled

Completed

Archived

---

# 4. Memo Priority

Low

Medium

High

Urgent

---

# 5. Comments

Every workflow participant may add comments.

Comments are immutable.

Comments become part of the audit trail.

---

# 6. Approval Actions

Approve

Reject

Return

Cancel

Forward

Escalate

Delegate

---

# 7. Audit Trail

Every action creates a permanent audit record.

Audit entries cannot be edited.

Audit entries include:

Actor

Action

Comment

Date

IP Address (future)

Device (future)

---

# 8. Attachments

Each memo may contain multiple files.

Supported:

PDF

Word

Excel

Images

Maximum size configurable per company.

---

# 9. Workflow

Workflow is configurable.

Each company defines:

approval steps

roles

conditions

notifications

SLA

MemoFlo never hardcodes workflow.

---

# 10. Notifications

Users receive notifications for:

New memo

Approval required

Returned memo

Rejected memo

Completed memo

Mention

---

# 11. Search

Search by:

Memo Number

Title

Department

SBU

Priority

Status

Date

Creator

Workflow Stage

---

# 12. Security

Every request requires authentication.

Every action requires authorization.

Users only access data belonging to their company.

---

# 13. Soft Delete

Memos are never permanently deleted.

Deleted memos become archived.

Only administrators may restore archived memos.

---

# 14. Version History

Every edit creates a version.

Previous versions remain available.

---

# 15. Dashboard

Dashboard is personalized.

Each user sees only data relevant to them.

Statistics vary by role.