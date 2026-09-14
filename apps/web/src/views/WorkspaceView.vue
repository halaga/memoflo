<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "../components/layout/Sidebar.vue";
import Topbar from "../components/layout/Topbar.vue";
import { api, getSavedEmployee, saveSession } from "../services/api";

const router = useRouter();
const branding = ref({});
const employee = ref(getSavedEmployee());

const styleVars = computed(() => ({
  "--company-primary": branding.value.primaryColor || "#2563EB",
  "--company-secondary":
    branding.value.secondaryColor || "#0f172a",
  "--company-wallpaper": branding.value.wallpaper
    ? `url(${branding.value.wallpaper})`
    : "none",
}));

async function loadWorkspace() {
  try {
    const [workspaceResult, meResult] = await Promise.all([
      api.getCompanyWorkspace(),
      api.me(),
    ]);

    const workspace =
      workspaceResult?.data || workspaceResult;

    branding.value =
      workspace?.company?.branding || {};

    if (meResult?.employee) {
      saveSession({
        employee: meResult.employee,
      });

      employee.value = meResult.employee;
    }
  } catch (error) {
    // A stale/expired session is handled by api.js.
    if (error?.message === "Authentication required") {
      router.replace("/login");
    }
  }
}

onMounted(loadWorkspace);
</script>

<template>
  <div
    class="app-shell branded-shell"
    :style="styleVars"
  >
    <Sidebar />
    <main class="main">
      <Topbar />
      <section class="content">
        <router-view />
      </section>
    </main>
  </div>
</template>
