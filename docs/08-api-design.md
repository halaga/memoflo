# MemoFlo REST API

Version 2.0

Base URL

/api/v1

---

Authentication

POST /auth/login

POST /auth/logout

POST /auth/refresh

POST /auth/forgot-password

POST /auth/reset-password

---

Companies

GET /companies

POST /companies

PUT /companies/:id

DELETE /companies/:id

---

Users

GET /users

POST /users

GET /users/:id

PUT /users/:id

DELETE /users/:id

---

Roles

GET /roles

POST /roles

PUT /roles/:id

DELETE /roles/:id

---

Departments

GET /departments

POST /departments

PUT /departments/:id

DELETE /departments/:id

---

SBUs

GET /sbus

POST /sbus

PUT /sbus/:id

DELETE /sbus/:id

---

Memo Types

GET /memo-types

POST /memo-types

PUT /memo-types/:id

DELETE /memo-types/:id

---

Workflows

GET /workflows

POST /workflows

PUT /workflows/:id

DELETE /workflows/:id

---

Workflow Steps

GET /workflow-steps

POST /workflow-steps

PUT /workflow-steps/:id

DELETE /workflow-steps/:id

---

Memos

GET /memos

POST /memos

GET /memos/:id

PUT /memos/:id

DELETE /memos/:id

POST /memos/:id/action

GET /memos/:id/timeline

POST /memos/:id/comment

POST /memos/:id/attachment

---

Notifications

GET /notifications

PUT /notifications/:id/read

---

Dashboard

GET /dashboard

GET /dashboard/stats

GET /dashboard/recent-activity