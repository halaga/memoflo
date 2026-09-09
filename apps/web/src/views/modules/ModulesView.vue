<script setup>
const modules = [
  ["Memo Management", "LIVE", "Create, route and track business memos."],
  ["Email Signature", "LIVE", "Create and manage company email signatures."],
  ["Leave Management", "IN PROGRESS", "Employee leave requests and approvals."],
  ["Procurement Management", "IN PROGRESS", "Structured procurement workflows."],
  ["Asset Management", "IN PROGRESS", "Track company assets and assignments."],
  ["Expense Management", "IN PROGRESS", "Manage business expenses and approvals."],
  ["Document Management", "IN PROGRESS", "Central document storage and workflows."],
  ["Employee Requests", "IN PROGRESS", "Employee service and request management."],
  ["Meeting & Room Management", "IN PROGRESS", "Manage meetings and shared rooms."],
  ["Visitor Management", "IN PROGRESS", "Track visitors and office access."],
  ["Maintenance Management", "IN PROGRESS", "Track maintenance requests."],
];
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Modules</h1>
        <p>Everything available in the MemoFlo platform.</p>
      </div>
    </div>

    <div class="module-grid">
      <div
        v-for="[name, status, description] in modules"
        :key="name"
        class="card module-card"
      >
        <div class="memo-card-top">
          <h2>{{ name }}</h2>
          <span class="status-badge">{{ status }}</span>
        </div>

        <p>{{ description }}</p>
      </div>
    </div>
  </div>
</template>
