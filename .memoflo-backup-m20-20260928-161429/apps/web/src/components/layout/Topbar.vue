<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, clearSession, getSavedEmployee } from "../../services/api";

const route = useRoute();
const router = useRouter();
const employee = computed(() => getSavedEmployee());
const unread = ref(0);
const search = ref("");

const titles = {
  home: "Home",
  "my-work": "My Work",
  services: "Services",
  people: "People",
  company: "Company",
  notifications: "Notifications",
  administration: "Administration",
  "workflow-settings": "Workflow Definitions",
  roles: "Roles & Permissions",
  employees: "Employees",
  "organization-structure": "Organization Structure",
  "module-access": "Module Access",
  "company-branding": "Company Branding",
  memos: "Memos",
  "create-memo": "Create Memo",
  "memo-detail": "Memo Details",
  approvals: "Approvals",
  completed: "Completed",
  "email-signature": "Email Signature",
};

const title = computed(() => titles[route.name] || "MemoFlo");
const initials = computed(() => `${employee.value?.firstName?.[0] || ""}${employee.value?.lastName?.[0] || ""}`.toUpperCase() || "MF");

async function loadNotifications() {
  try {
    const result = await api.listNotifications();
    unread.value = result?.unreadCount || (Array.isArray(result) ? result.filter((item) => !item.readAt && !item.read).length : 0);
  } catch { unread.value = 0; }
}

function runSearch() {
  const value = search.value.trim();
  if (!value) return;
  router.push({ name: "my-work", query: { q: value } });
  search.value = "";
}

function logout() {
  clearSession();
  router.replace("/login");
}

onMounted(loadNotifications);
</script>

<template>
  <header class="topbar experience-topbar">
    <div class="topbar-title"><span class="mobile-menu-mark">MF</span><div><span class="topbar-context">MEMOFLO</span><h2>{{ title }}</h2></div></div>
    <form class="topbar-command" @submit.prevent="runSearch"><span>⌕</span><input v-model="search" placeholder="Search…" aria-label="Search MemoFlo" /><kbd>⌘ K</kbd></form>
    <div class="topbar-actions">
      <button class="notification-button" type="button" aria-label="Notifications" @click="router.push('/notifications')">◔<b v-if="unread">{{ unread > 9 ? "9+" : unread }}</b></button>
      <button class="topbar-user" type="button" @click="router.push('/people')"><span class="top-avatar">{{ initials }}</span><span><strong>{{ employee?.firstName || "User" }}</strong><small>{{ employee?.role?.name || "Employee" }}</small></span></button>
      <button class="topbar-signout" type="button" @click="logout">Sign out</button>
    </div>
  </header>
</template>
