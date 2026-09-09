<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getSavedEmployee } from "../../services/api";

const route = useRoute();

const employee = getSavedEmployee();

const pageTitle = computed(() => {
  return route.name === "dashboard"
    ? "Dashboard"
    : route.name === "memos"
      ? "My Memos"
      : route.name === "create-memo"
        ? "Create Memo"
        : route.name === "memo-detail"
          ? "Memo Details"
          : route.name === "approvals"
            ? "Approvals"
            : route.name === "completed"
              ? "Completed"
              : route.name === "modules"
                ? "Modules"
                : route.name === "administration"
                  ? "Administration"
                  : route.name === "workflow-settings"
                    ? "Workflow Settings"
                    : "MemoFlo";
});

const initials = computed(() => {
  const first = employee?.firstName?.[0] || "";
  const last = employee?.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "MF";
});
</script>

<template>
  <header class="topbar">
    <div>
      <h2>{{ pageTitle }}</h2>
    </div>

    <div class="topbar-user">
      <span class="avatar">{{ initials }}</span>

      <span>
        {{ employee?.firstName || "User" }}
      </span>
    </div>
  </header>
</template>
