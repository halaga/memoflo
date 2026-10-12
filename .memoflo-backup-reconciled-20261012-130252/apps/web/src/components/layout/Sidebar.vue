<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSavedEmployee } from "../../services/api";

const router = useRouter();
const route = useRoute();
const employee = computed(() => getSavedEmployee());
const company = computed(() => employee.value?.company || {});
const permissions = computed(
  () => employee.value?.role?.permissions || [],
);
const open = ref(true);

function can(permission) {
  return (
    permissions.value.includes("*") ||
    permissions.value.includes(permission)
  );
}

const isAdmin = computed(
  () =>
    can("administration.view") ||
    /admin/i.test(employee.value?.role?.code || "") ||
    /admin/i.test(employee.value?.role?.name || ""),
);

const initials = computed(
  () =>
    `${employee.value?.firstName?.[0] || ""}${
      employee.value?.lastName?.[0] || ""
    }`.toUpperCase() || "MF",
);

const nav = [
  { label: "Home", route: "/home", icon: "⌂" },
  { label: "My Work", route: "/work", icon: "✓" },
  { label: "Services", route: "/services", icon: "◈" },
  { label: "People", route: "/people", icon: "◎" },
  { label: "Company", route: "/company", icon: "▦" },
];

function active(path) {
  return (
    route.path === path ||
    route.path.startsWith(`${path}/`)
  );
}

function syncSidebarState() {
  const shell = document.querySelector(".experience-shell");
  shell?.classList.toggle("sidebar-hidden", !open.value);
}

function toggleSidebar() {
  open.value = !open.value;
  syncSidebarState();
}

function handleToggle() {
  toggleSidebar();
}

function go(path) {
  router.push(path);

  if (window.innerWidth <= 780) {
    open.value = false;
    syncSidebarState();
  }
}

onMounted(() => {
  syncSidebarState();
  window.addEventListener(
    "memoflo:toggle-sidebar",
    handleToggle,
  );
});

onUnmounted(() => {
  window.removeEventListener(
    "memoflo:toggle-sidebar",
    handleToggle,
  );
});
</script>

<template>
  <div
    v-if="open"
    class="sidebar-overlay"
    @click="toggleSidebar"
  ></div>

  <aside
    class="sidebar experience-sidebar"
    :class="{ 'sidebar-collapsed': !open }"
  >
    <button
      class="mf-brand"
      type="button"
      @click="go('/home')"
    >
      <span class="mf-logo">
        <img
          :src="
            company?.branding?.logo ||
            company?.logo ||
            '/signatures/ringologo.png'
          "
          alt=""
        />
      </span>

      <span>
        <strong>MemoFlo</strong>
        <small>{{ company?.name || "Workspace" }}</small>
        <em>Workflow, simplified.</em>
      </span>
    </button>

    <nav class="experience-nav" aria-label="Main navigation">
      <button
        v-for="item in nav"
        :key="item.route"
        type="button"
        class="experience-nav-item"
        :class="{ active: active(item.route) }"
        @click="go(item.route)"
      >
        <span>{{ item.icon }}</span>
        <strong>{{ item.label }}</strong>
      </button>
    </nav>

    <div class="sidebar-divider"></div>

    <div class="sidebar-shortcuts">
      <span class="sidebar-caption">SHORTCUTS</span>

      <button
        v-if="can('inventory.view')"
        type="button"
        @click="go('/administration/inventory')"
      >
        Inventory
      </button>

      <button type="button" @click="go('/memos')">
        Memos
      </button>

      <button type="button" @click="go('/notifications')">
        Notifications
      </button>
    </div>

    <div class="sidebar-spacer"></div>

    <button
      v-if="isAdmin"
      type="button"
      class="admin-entry"
      @click="go('/administration')"
    >
      <span>⚙</span>
      <span>
        <b>Administration</b>
        <small>Shape the workspace</small>
      </span>
      <i>→</i>
    </button>

    <button
      type="button"
      class="sidebar-profile"
      @click="go('/people')"
    >
      <span class="top-avatar">{{ initials }}</span>
      <span>
        <b>{{ employee?.firstName || "Employee" }}</b>
        <small>{{ employee?.role?.name || "Employee" }}</small>
      </span>
    </button>
  </aside>
</template>
