<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, clearSession, getSavedEmployee } from "../../services/api";
import AppIcon from "../ui/AppIcon.vue";

const route = useRoute();
const router = useRouter();
const emit = defineEmits(["toggle-mobile"]);
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

function goHome() {
  if (route.path === "/home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector(".content")?.scrollTo({ top: 0, behavior: "smooth" });
  } else router.push("/home");
}
function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/home");
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
      <button class="mobile-nav-trigger" type="button" aria-label="Open navigation menu" title="Open navigation menu" @click="emit('toggle-mobile')"><AppIcon name="menu" :size="21" /></button>
      <button class="topbar-back-trigger" type="button" aria-label="Go back" title="Go back" @click="goBack"><AppIcon name="chevron" :size="18" /></button>
      <button class="topbar-home-trigger" type="button" aria-label="Go to Home" title="Go to Home" @click="goHome"><AppIcon name="home" :size="18" /></button>
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

<style scoped>
.topbar-title { display:flex; align-items:center; gap:7px; min-width:0; }
.topbar-title > div { min-width:0; }
.mobile-nav-trigger,.topbar-back-trigger,.topbar-home-trigger { display:inline-grid; place-items:center; flex:0 0 34px; width:34px; height:34px; border:1px solid var(--mf-border, #e2e8f0); border-radius:10px; background:var(--mf-surface, #fff); color:var(--mf-text, #0f172a); cursor:pointer; }
.topbar-back-trigger svg { transform:rotate(180deg); }
.mobile-nav-trigger { display:none; }
@media(max-width:900px) {
 .mobile-nav-trigger { display:inline-grid; }
 .topbar-back-trigger { display:none; }
 .topbar-home-trigger { display:inline-grid; }
 .topbar-title { gap:5px; }
 .topbar-context { display:none; }
 .topbar-title h2 { font-size:15px; margin:0; }
}
@media(max-width:560px) {
 .topbar-home-trigger { display:none; }
 .topbar-title { flex:0 0 auto; }
 .topbar-title h2 { max-width:95px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
}
</style>
