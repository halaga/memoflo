<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getSavedEmployee } from "../../services/api";

const route = useRoute();

const employee = computed(() =>
  getSavedEmployee()
);

const pageTitle = computed(() => {
  const titles = {
    modules: "Module Hub",
    dashboard: "Dashboard",
    memos: "My Memos",
    "create-memo": "Create Memo",
    "memo-detail": "Memo",
    approvals: "Approvals",
    completed: "Completed",
    administration: "Administration",
    "workflow-settings":
      "Workflow Settings",
    roles: "Roles & Permissions",
  };

  return titles[route.name] || "MemoFlo";
});

const initials = computed(() => {
  const first =
    employee.value?.firstName?.[0] || "";

  const last =
    employee.value?.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "MF";
});
</script>

<template>
  <header class="app-topbar">

    <div>
      <h1>{{ pageTitle }}</h1>
    </div>

    <div class="topbar-user">

      <div class="topbar-avatar">
        {{ initials }}
      </div>

      <div>
        <strong>
          {{ employee?.firstName }}
        </strong>

        <span>
          {{ employee?.role?.name || "Employee" }}
        </span>
      </div>

    </div>

  </header>
</template>