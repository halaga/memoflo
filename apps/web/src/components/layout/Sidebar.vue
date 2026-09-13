<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { clearSession, getSavedEmployee } from "../../services/api";

const router = useRouter();
const route = useRoute();
const employee = computed(() => getSavedEmployee());

const workspaceItems = [
  { label: "Module Hub", route: "/modules", icon: "⌘" },
  { label: "My Memos", route: "/memos", icon: "▤" },
  { label: "Create Memo", route: "/memos/create", icon: "+" },
  { label: "Approvals", route: "/approvals", icon: "✓" },
  { label: "Completed", route: "/completed", icon: "◷" },
];

const adminItems = [
  { label: "Administration", route: "/administration", icon: "⚙" },
  { label: "Workflow Settings", route: "/administration/workflows", icon: "◇" },
  { label: "Roles & Permissions", route: "/administration/roles", icon: "♙" },
];

const employeeName = computed(() => [employee.value?.firstName, employee.value?.lastName].filter(Boolean).join(" ") || "User");
const roleName = computed(() => employee.value?.role?.name || employee.value?.position?.title || "Employee");
const companyName = computed(() => employee.value?.company?.name || "Company workspace");
const initials = computed(() => employeeName.value.split(/\s+/).map((x) => x[0]).join("").slice(0,2).toUpperCase());

function isActive(path) { return route.path === path || route.path.startsWith(`${path}/`); }
function go(path) { router.push(path); }
function logout() { clearSession(); router.replace("/login"); }
</script>

<template>
  <aside class="sidebar">
    <div class="brand"><div class="brand-mark">M</div><div><div class="brand-name">MemoFlo</div><div class="brand-tag">Workflow simplified</div></div></div>

    <div class="tenant-mini"><span>WORKSPACE</span><strong>{{ companyName }}</strong></div>

    <div class="sidebar-section">
      <div class="sidebar-label">WORKSPACE</div>
      <nav class="nav">
        <button v-for="item in workspaceItems" :key="item.route" class="nav-item" :class="{ active: isActive(item.route) }" type="button" @click="go(item.route)">
          <span class="nav-icon">{{ item.icon }}</span><span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">ADMINISTRATION</div>
      <nav class="nav">
        <button v-for="item in adminItems" :key="item.route" class="nav-item" :class="{ active: isActive(item.route) }" type="button" @click="go(item.route)">
          <span class="nav-icon">{{ item.icon }}</span><span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <div class="sidebar-bottom">
      <div class="user-card">
        <div class="avatar">{{ initials }}</div>
        <div class="user-info"><strong>{{ employeeName }}</strong><span>{{ roleName }}</span></div>
      </div>
      <button class="logout-button" type="button" @click="logout">Sign out</button>
    </div>
  </aside>
</template>
