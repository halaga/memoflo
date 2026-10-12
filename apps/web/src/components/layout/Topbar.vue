<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, clearSession, getSavedEmployee } from "../../services/api";
import AppIcon from "../ui/AppIcon.vue";

const route = useRoute();
const router = useRouter();
const employee = computed(() => getSavedEmployee());
const unread = ref(0);
const search = ref(String(route.query.q || ""));
const darkMode = ref(false);

const titles = {
  home: "Home", "my-work": "My Work", services: "Services", people: "People",
  company: "Company", notifications: "Notifications", administration: "Administration",
  "workflow-settings": "Workflow Settings", roles: "Roles & Permissions",
  employees: "Employees", "organization-structure": "Organization Structure",
  "module-access": "Module Access", "company-branding": "Company Branding",
  "service-catalogue": "Service Catalogue", "service-detail": "Service Details",
  "service-action": "Service Request", "global-search": "Search",
  "employee-profile": "Employee Profile", inventory: "Inventory",
  memos: "Memos", "create-memo": "Create Memo", "memo-detail": "Memo Details",
  approvals: "Approvals", completed: "Completed", "email-signature": "Email Signature",
};
const title = computed(() => titles[route.name] || "MemoFlo");
const initials = computed(() => `${employee.value?.firstName?.[0] || ""}${employee.value?.lastName?.[0] || ""}`.toUpperCase() || "MF");

async function loadNotifications() {
  try {
    const result = await api.listNotifications();
    const list = Array.isArray(result) ? result : result?.data || [];
    unread.value = result?.unreadCount ?? list.filter((item) => !item.readAt && !item.read).length;
  } catch {
    unread.value = 0;
  }
}

function runSearch() {
  const query = search.value.trim();
  router.push(query ? { name: "global-search", query: { q: query } } : { name: "global-search" });
}

function applyTheme(isDark) {
  darkMode.value = isDark;
  document.documentElement.classList.toggle("theme-dark", isDark);
  localStorage.setItem("memoflo_theme", isDark ? "dark" : "light");
}

function toggleTheme() {
  applyTheme(!darkMode.value);
}

function logout() {
  clearSession();
  router.replace("/login");
}

watch(() => route.query.q, (value) => {
  search.value = String(value || "");
});

onMounted(() => {
  applyTheme(localStorage.getItem("memoflo_theme") === "dark");
  loadNotifications();
});
</script>

<template>
  <header class="topbar experience-topbar">
    <div class="topbar-title">
      <div><span class="topbar-context">MEMOFLO · WORKSPACE</span><h2>{{ title }}</h2></div>
    </div>

    <form class="topbar-command" role="search" @submit.prevent="runSearch">
      <AppIcon name="search" :size="19" />
      <input v-model="search" placeholder="Search anything across MemoFlo…" aria-label="Search everything in MemoFlo" />
      <kbd>Enter ↵</kbd>
    </form>

    <div class="topbar-actions">
      <button class="icon-button topbar-icon-button" type="button" :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'" :title="darkMode ? 'Light mode' : 'Dark mode'" @click="toggleTheme">
        <AppIcon :name="darkMode ? 'sun' : 'moon'" :size="19" />
      </button>
      <button class="icon-button topbar-icon-button notification-button" type="button" aria-label="Notifications" @click="router.push('/notifications')">
        <AppIcon name="bell" :size="20" /><b v-if="unread">{{ unread > 9 ? "9+" : unread }}</b>
      </button>
      <button class="topbar-user" type="button" @click="router.push('/people')">
        <span class="top-avatar">{{ initials }}</span>
        <span><strong>{{ employee?.firstName || "User" }}</strong><small>{{ employee?.role?.name || "Employee" }}</small></span>
      </button>
      <button class="topbar-signout" type="button" @click="logout">Sign out</button>
    </div>
  </header>
</template>
