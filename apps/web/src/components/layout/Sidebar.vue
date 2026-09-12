<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  clearSession,
  getSavedEmployee,
} from "../../services/api";

const route = useRoute();
const router = useRouter();

const employee = computed(() =>
  getSavedEmployee()
);

const roleName = computed(() =>
  employee.value?.role?.name ||
  "Employee"
);

const companyName = computed(() =>
  employee.value?.company?.name ||
  "MemoFlo"
);

const initials = computed(() => {
  const first =
    employee.value?.firstName?.[0] || "";

  const last =
    employee.value?.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "MF";
});

function isActive(name) {
  return route.name === name;
}

function logout() {
  clearSession();

  router.replace({
    name: "login",
  });
}
</script>

<template>
  <aside class="app-sidebar">

    <div class="sidebar-brand">
      <div class="brand-mark">M</div>

      <div>
        <strong>MemoFlo</strong>
        <span>Workflow simplified</span>
      </div>
    </div>

    <div class="tenant-card">
      <span class="tenant-label">
        COMPANY
      </span>

      <strong>{{ companyName }}</strong>
    </div>

    <nav class="sidebar-nav">

      <div class="nav-section">
        <span class="nav-section-title">
          WORKSPACE
        </span>

        <router-link
          to="/modules"
          class="nav-link"
          :class="{ active: isActive('modules') }"
        >
          <span class="nav-icon">◆</span>
          <span>Module Hub</span>
        </router-link>

        <router-link
          to="/memos"
          class="nav-link"
          :class="{ active: isActive('memos') }"
        >
          <span class="nav-icon">▤</span>
          <span>My Memos</span>
        </router-link>

        <router-link
          to="/memos/create"
          class="nav-link"
          :class="{ active: isActive('create-memo') }"
        >
          <span class="nav-icon">＋</span>
          <span>Create Memo</span>
        </router-link>

        <router-link
          to="/approvals"
          class="nav-link"
          :class="{ active: isActive('approvals') }"
        >
          <span class="nav-icon">✓</span>
          <span>Approvals</span>
        </router-link>

        <router-link
          to="/completed"
          class="nav-link"
          :class="{ active: isActive('completed') }"
        >
          <span class="nav-icon">✓</span>
          <span>Completed</span>
        </router-link>
      </div>

      <div class="nav-section">
        <span class="nav-section-title">
          ADMINISTRATION
        </span>

        <router-link
          to="/administration"
          class="nav-link"
          :class="{
            active: isActive('administration')
          }"
        >
          <span class="nav-icon">⚙</span>
          <span>Administration</span>
        </router-link>

        <router-link
          to="/administration/workflows"
          class="nav-link"
          :class="{
            active:
              isActive('workflow-settings')
          }"
        >
          <span class="nav-icon">◇</span>
          <span>Workflow Settings</span>
        </router-link>

        <router-link
          to="/administration/roles"
          class="nav-link"
          :class="{
            active: isActive('roles')
          }"
        >
          <span class="nav-icon">♙</span>
          <span>Roles & Permissions</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-account">

      <div class="account-label">
        SIGNED IN AS
      </div>

      <div class="account-row">
        <div class="avatar">
          {{ initials }}
        </div>

        <div class="account-info">
          <strong>
            {{ employee?.firstName }}
            {{ employee?.lastName }}
          </strong>

          <span>
            {{ roleName }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="logout-button"
        @click="logout"
      >
        Sign out
      </button>

    </div>

  </aside>
</template>