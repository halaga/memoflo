<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  clearSession,
  getSavedEmployee,
} from "../../services/api";

const router = useRouter();
const route = useRoute();

const employee = computed(() => getSavedEmployee());

const navItems = [
  {
    label: "Dashboard",
    route: "/dashboard",
    icon: "▦",
  },
  {
    label: "My Memos",
    route: "/memos",
    icon: "▤",
  },
  {
    label: "Create Memo",
    route: "/memos/create",
    icon: "+",
  },
  {
    label: "Approvals",
    route: "/approvals",
    icon: "✓",
  },
  {
    label: "Completed",
    route: "/completed",
    icon: "✓",
  },
];

const workspaceItems = [
  {
    label: "Modules",
    route: "/modules",
    icon: "◈",
  },
];

const adminItems = [
  {
    label: "Administration",
    route: "/administration",
    icon: "⚙",
  },
];

function employeeName(user) {
  if (!user) return "Unknown User";

  return (
    [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user.name ||
    user.fullName ||
    "Unknown User"
  );
}

function employeeRole(user) {
  return (
    user?.position?.title ||
    user?.position?.name ||
    user?.designation?.name ||
    user?.role ||
    "Employee"
  );
}

function initials(user) {
  const name = employeeName(user);

  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function isActive(path) {
  if (path === "/dashboard") {
    return route.path === "/dashboard";
  }

  return route.path === path ||
    route.path.startsWith(`${path}/`);
}

function logout() {
  clearSession();

  router.replace("/login");
}
</script>

<template>
  <aside class="sidebar">

    <!-- BRAND -->

    <div class="brand">
      <div class="brand-mark">
        M
      </div>

      <div>
        <div class="brand-name">
          MemoFlo
        </div>

        <div class="brand-tag">
          Workflow simplified
        </div>
      </div>
    </div>

    <!-- MAIN -->

    <div class="sidebar-section">
      <div class="sidebar-label">
        WORKSPACE
      </div>

      <nav class="nav">
        <button
          v-for="item in navItems"
          :key="item.route"
          class="nav-item"
          :class="{
            active: isActive(item.route),
          }"
          @click="router.push(item.route)"
        >
          <span class="nav-icon">
            {{ item.icon }}
          </span>

          <span>
            {{ item.label }}
          </span>
        </button>
      </nav>
    </div>

    <!-- PLATFORM -->

    <div class="sidebar-section">
      <div class="sidebar-label">
        MEMOFLO
      </div>

      <nav class="nav">
        <button
          v-for="item in workspaceItems"
          :key="item.route"
          class="nav-item"
          :class="{
            active: isActive(item.route),
          }"
          @click="router.push(item.route)"
        >
          <span class="nav-icon">
            {{ item.icon }}
          </span>

          <span>
            {{ item.label }}
          </span>
        </button>
      </nav>
    </div>

    <!-- ADMIN -->

    <div class="sidebar-section">
      <div class="sidebar-label">
        ADMINISTRATION
      </div>

      <nav class="nav">
        <button
          v-for="item in adminItems"
          :key="item.route"
          class="nav-item"
          :class="{
            active: isActive(item.route),
          }"
          @click="router.push(item.route)"
        >
          <span class="nav-icon">
            {{ item.icon }}
          </span>

          <span>
            {{ item.label }}
          </span>
        </button>
      </nav>
    </div>

    <!-- USER -->

    <div class="sidebar-bottom">

      <div class="demo-label">
        SIGNED IN AS
      </div>

      <div class="user-card">

        <div class="avatar">
          {{ initials(employee) }}
        </div>

        <div class="user-info">
          <strong>
            {{ employeeName(employee) }}
          </strong>

          <span>
            {{ employeeRole(employee) }}
          </span>
        </div>

      </div>

      <button
        class="logout-button"
        @click="logout"
      >
        Sign out
      </button>

    </div>

  </aside>
</template>