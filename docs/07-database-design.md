# MemoFlo Database Design

Version 2.0

---

## Database

MongoDB

Collections

- companies
- users
- roles
- permissions
- departments
- sbus
- workflows
- workflowSteps
- memoTypes
- memos
- memoVersions
- memoAttachments
- comments
- auditLogs
- notifications
- settings

---

## Companies

Fields

_id

name

slug

logo

theme

timezone

subscription

createdAt

updatedAt

---

## Users

Fields

companyId

roleId

departmentId

sbuId

firstName

lastName

email

phone

password

avatar

status

lastLogin

createdAt

updatedAt

---

## Roles

companyId

name

description

permissions

---

## Departments

companyId

name

description

---

## SBUs

companyId

name

description

---

## Workflows

companyId

name

memoType

status

---

## Workflow Steps

workflowId

order

roleId

departmentId

approvalType

slaHours

escalationRole

conditions

---

## Memo Types

companyId

name

description

workflowId

---

## Memos

companyId

memoNumber

memoTypeId

workflowId

currentStep

currentApprover

title

description

priority

status

createdBy

submittedAt

completedAt

---

## Memo Versions

memoId

version

editedBy

changes

createdAt

---

## Memo Attachments

memoId

filename

originalName

size

mimeType

uploadedBy

createdAt

---

## Comments

memoId

userId

comment

action

createdAt

---

## Audit Logs

memoId

userId

action

comment

metadata

createdAt

---

## Notifications

companyId

userId

type

title

message

isRead

createdAt

---

## Settings

companyId

branding

workflow

security

storage

email

notifications
