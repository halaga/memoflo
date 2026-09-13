<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { clearSession, getSavedEmployee } from "../../services/api";
import { useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const employee = computed(() => getSavedEmployee());
const titles = { modules: ["Workspace", "Module Hub"], dashboard: ["Workspace", "Dashboard"], memos: ["Memo Management", "My Memos"], "create-memo": ["Memo Management", "Create Memo"], "memo-detail": ["Memo Management", "Memo Details"], approvals: ["Memo Management", "Approvals"], completed: ["Memo Management", "Completed"], administration: ["Administration", "Overview"], "workflow-settings": ["Administration", "Workflow Settings"], roles: ["Administration", "Roles & Permissions"] };
const title = computed(() => titles[route.name] || ["MemoFlo", "Workspace"]);
const initials = computed(() => `${employee.value?.firstName?.[0] || ""}${employee.value?.lastName?.[0] || ""}`.toUpperCase() || "MF");
function logout() { clearSession(); router.replace("/login"); }
</script>

<template>
  <header class="topbar">
    <div><p class="topbar-eyebrow">{{ title[0] }}</p><h2>{{ title[1] }}</h2></div>
    <div class="topbar-actions"><div class="topbar-user"><div class="top-avatar">{{ initials }}</div><div><strong>{{ employee?.firstName || "User" }}</strong><span>{{ employee?.role?.name || "Employee" }}</span></div></div><button class="topbar-signout" type="button" @click="logout">Sign out</button></div>
  </header>
</template>
