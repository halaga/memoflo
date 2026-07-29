# MemoFlo Domain Model

Version 2.0

---

# Overview

MemoFlo is composed of business entities.

Each entity has one responsibility.

Relationships are intentionally loose to improve scalability.

---

# Company

Represents an organization.

Properties

- id
- name
- logo
- slug
- email
- phone
- address
- theme
- timezone
- subscription
- createdAt

Relationships

Company
├── Users
├── Departments
├── SBUs
├── Workflows
├── Memo Types
├── Memos

---

# User

Represents an employee.

Properties

- id
- firstName
- lastName
- email
- phone
- avatar
- password
- status

Relationships

User

belongs to

Company

belongs to

Department

belongs to

SBU

has one

Role

creates

Memos

receives

Notifications

---

# Role

Examples

Administrator

CEO

Finance Head

ICC

Manager

Staff

Permissions come from Roles.

---

# Department

Examples

IT

HR

Finance

Legal

Marketing

Operations

---

# Strategic Business Unit (SBU)

Examples

Retail

Wholesale

Corporate

Digital

---

# Memo Type

Examples

Procurement

Basic

Travel

Leave

Expense

Contract

---

# Memo

Properties

Number

Title

Description

Priority

Status

Created By

Current Step

Workflow

Due Date

Relationships

Memo

has many

Comments

Attachments

Versions

Audit Logs

Notifications

---

# Workflow

Defines approval logic.

Workflow

contains

Workflow Steps

---

# Workflow Step

Properties

Order

Role

Department

Conditions

Escalation

SLA

---

# Memo Version

Stores every modification.

Allows comparison.

---

# Memo Attachment

Stores uploaded files.

PDF

Excel

Images

Word

ZIP

---

# Comment

Created by users.

Immutable.

---

# Audit Log

Records every action.

Created

Approved

Rejected

Returned

Forwarded

Cancelled

Downloaded

Viewed

---

# Notification

Represents system alerts.

Email

SMS

In-app

Push

---

# Settings

Stores company configuration.

Brand

Theme

Workflow

Email

Storage

Security

---

# Relationships

Company

↓

Departments

↓

SBUs

↓

Users

↓

Roles

↓

Workflow

↓

Memo

↓

Comment

↓

Audit Log

↓

Notification