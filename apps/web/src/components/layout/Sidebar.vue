<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { assetUrl, getSavedEmployee } from "../../services/api";
import AppIcon from "../ui/AppIcon.vue";

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  mobileOpen: { type: Boolean, default: false },
});
const emit = defineEmits(["toggle-collapse", "toggle-mobile"]);
const router = useRouter();
const route = useRoute();
const employee = computed(() => getSavedEmployee());
const company = computed(() => employee.value?.company || {});
const permissions = computed(() => employee.value?.role?.permissions || []);
const can = (permission) => permissions.value.includes("*") || permissions.value.includes(permission);
const isAdmin = computed(() => can("administration.view") || /admin/i.test(employee.value?.role?.code || "") || /admin/i.test(employee.value?.role?.name || ""));
const initials = computed(() => `${employee.value?.firstName?.[0] || ""}${employee.value?.lastName?.[0] || ""}`.toUpperCase() || "MF");

const navigation = [
  { label: "Home", route: "/home", icon: "home" },
  { label: "My Work", route: "/work", icon: "work" },
  { label: "Services", route: "/services", icon: "services" },
  { label: "People", route: "/people", icon: "people" },
  { label: "Company", route: "/company", icon: "company" },
];
const shortcuts = [
  { label: "Memos", route: "/memos", icon: "memo", permission: "memos.view" },
  { label: "Approvals", route: "/approvals", icon: "approval", permission: "memos.approve" },
  { label: "Notifications", route: "/notifications", icon: "bell", permission: "notifications.view" },
  { label: "Inventory", route: "/administration/inventory", icon: "box", permission: "inventory.view" },
];

function active(path) {
  return route.path === path || route.path.startsWith(`${path}/`);
}
function go(path) {
  router.push(path);
  emit("toggle-mobile", false);
}
</script>

<template>
  <aside class="sidebar experience-sidebar" :class="{ 'sidebar-is-collapsed': collapsed, 'sidebar-mobile-open': mobileOpen, 'sidebar-mobile-closed': !mobileOpen }">
    <div class="sidebar-top-row">
      <button class="mf-brand" type="button" @click="go('/home')" :title="collapsed ? 'MemoFlo home' : undefined">
        <span class="mf-logo">
          <img v-if="company?.branding?.logo || company?.logo" :src="assetUrl(company?.branding?.logo || company?.logo)" alt="" />
          <b v-else>M</b>
        </span>
        <span class="mf-brand-copy"><strong>MemoFlo</strong><small>{{ company?.name || "Workspace" }}</small></span>
      </button>
      <button
        class="sidebar-toggle-inside"
        type="button"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="emit('toggle-collapse')"
      >
        <AppIcon name="panel" :size="19" />
      </button>
    </div>

    <nav class="experience-nav" aria-label="Main navigation">
      <span class="sidebar-caption nav-caption">WORKSPACE</span>
      <button
        v-for="item in navigation"
        :key="item.route"
        type="button"
        class="experience-nav-item"
        :class="{ active: active(item.route) }"
        :title="collapsed ? item.label : undefined"
        @click="go(item.route)"
      >
        <AppIcon :name="item.icon" :size="20" />
        <span class="sidebar-nav-label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-divider"></div>
    <nav class="sidebar-shortcuts" aria-label="Shortcuts">
      <span class="sidebar-caption nav-caption">SHORTCUTS</span>
      <button
        v-for="item in shortcuts.filter((item) => can(item.permission))"
        :key="item.route"
        type="button"
        class="experience-nav-item shortcut-nav-item"
        :class="{ active: active(item.route) }"
        :title="collapsed ? item.label : undefined"
        @click="go(item.route)"
      >
        <AppIcon :name="item.icon" :size="19" />
        <span class="sidebar-nav-label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-spacer"></div>

    <a class="portfolio-link" href="https://xplicitcrafted.netlify.app/" target="_blank" rel="noopener noreferrer" :title="collapsed ? 'Xplicit_Crafted portfolio' : undefined">
      <span class="portfolio-mark">X</span>
      <span class="portfolio-copy"><strong>Xplicit_Crafted</strong><small>Interactive. Intentional. Xplicitly Crafted.</small></span>
      <AppIcon name="arrow" :size="15" />
    </a>

    <button v-if="isAdmin" type="button" class="admin-entry" @click="go('/administration')" :title="collapsed ? 'Administration' : undefined">
      <AppIcon name="settings" :size="20" />
      <span class="sidebar-nav-label"><b>Administration</b><small>Manage workspace</small></span>
      <AppIcon name="chevron" :size="16" class="admin-chevron" />
    </button>

    <button type="button" class="sidebar-profile" @click="go('/people')" :title="collapsed ? (employee?.firstName || 'Profile') : undefined">
      <span class="top-avatar">{{ initials }}</span>
      <span class="sidebar-profile-copy"><b>{{ employee?.firstName || "Employee" }}</b><small>{{ employee?.role?.name || "Employee" }}</small></span>
    </button>
  </aside>
</template>
