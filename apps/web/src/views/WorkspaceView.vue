<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "../components/layout/Sidebar.vue";
import Topbar from "../components/layout/Topbar.vue";
import { api, getSavedEmployee, saveSession } from "../services/api";

const router = useRouter();
const branding = ref({});
const employee = ref(getSavedEmployee());
const sidebarCollapsed = ref(localStorage.getItem("memoflo_sidebar_collapsed") === "true");
const mobileOpen = ref(false);
const isMobile = ref(window.matchMedia("(max-width: 900px)").matches);

const styleVars = computed(() => ({
  "--company-primary": branding.value.primaryColor || "#2563EB",
  "--company-secondary": branding.value.secondaryColor || "#0f172a",
  "--company-wallpaper": branding.value.wallpaper ? `url(${branding.value.wallpaper})` : "none",
}));

function toggleCollapse() {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value;
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem("memoflo_sidebar_collapsed", String(sidebarCollapsed.value));
  }
}

function toggleMobile(value) {
  mobileOpen.value = typeof value === "boolean" ? value : !mobileOpen.value;
}

function handleResize() {
  isMobile.value = window.matchMedia("(max-width: 900px)").matches;
  if (!isMobile.value) mobileOpen.value = false;
}

async function loadWorkspace() {
  try {
    const [workspaceResult, meResult] = await Promise.all([
      api.getCompanyWorkspace(),
      api.me(),
    ]);
    const workspace = workspaceResult?.data || workspaceResult;
    branding.value = workspace?.company?.branding || {};
    if (meResult?.employee) {
      saveSession({ employee: meResult.employee });
      employee.value = meResult.employee;
    }
  } catch (error) {
    if (error?.message === "Authentication required") router.replace("/login");
  }
}

onMounted(() => {
  loadWorkspace();
  window.addEventListener("resize", handleResize);
});
onBeforeUnmount(() => window.removeEventListener("resize", handleResize));
</script>

<template>
  <div class="app-shell branded-shell experience-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'sidebar-mobile-open': mobileOpen, 'is-mobile': isMobile }" :style="styleVars">
    <Sidebar :collapsed="sidebarCollapsed" :mobile-open="mobileOpen" @toggle-collapse="toggleCollapse" @toggle-mobile="toggleMobile" />
    <button v-if="mobileOpen" class="sidebar-backdrop" type="button" aria-label="Close navigation" @click="toggleMobile(false)"></button>
    <main class="main">
      <Topbar @toggle-mobile="toggleMobile()" />
      <section class="content"><router-view /></section>
    </main>
  </div>
</template>
