<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const route = useRoute();
const employee = ref(null);
const loading = ref(true);
const error = ref("");

function relation(value) { return value?.name || value?.title || value || "Not provided"; }
function fullName() { return `${employee.value?.firstName || ""} ${employee.value?.lastName || ""}`.trim() || "Employee"; }
function initials() { return fullName().split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }

async function load() {
  loading.value = true; error.value = "";
  try {
    const result = await api.getEmployee(route.params.id);
    employee.value = result?.data || result?.employee || result;
  } catch (err) { error.value = err?.message || "Unable to load employee profile."; }
  finally { loading.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="experience-page">
    <div class="profile-back"><RouterLink to="/people" class="panel-link"><AppIcon name="arrow" /> Back to People</RouterLink></div>
    <section v-if="loading" class="workspace-panel panel-empty">Loading employee profile…</section>
    <section v-else-if="error" class="workspace-panel profile-error"><AppIcon name="user" size="24" /><strong>Unable to load employee profile</strong><span>{{ error }}</span><button class="action-secondary icon-action" type="button" @click="load"><AppIcon name="refresh" /> Try again</button></section>
    <template v-else-if="employee">
      <section class="profile-hero workspace-panel">
        <div class="profile-avatar">{{ initials() }}</div>
        <div class="profile-heading"><span class="eyebrow">EMPLOYEE PROFILE</span><h1>{{ fullName() }}</h1><p>{{ relation(employee.position) }} · {{ employee.employeeNo || "No employee number" }}</p></div>
      </section>
      <section class="profile-grid">
        <article class="workspace-panel profile-card"><div class="panel-heading"><div><span class="eyebrow">CONTACT</span><h2>Contact details</h2></div></div><dl><div><dt>Email</dt><dd>{{ employee.email || "Not provided" }}</dd></div><div><dt>Phone</dt><dd>{{ employee.phone || "Not provided" }}</dd></div></dl></article>
        <article class="workspace-panel profile-card"><div class="panel-heading"><div><span class="eyebrow">EMPLOYMENT</span><h2>Work details</h2></div></div><dl><div><dt>Position</dt><dd>{{ relation(employee.position) }}</dd></div><div><dt>Status</dt><dd>{{ employee.employmentStatus || (employee.active ? "Active" : "Inactive") }}</dd></div><div><dt>Reports to</dt><dd>{{ relation(employee.reportsTo) }}</dd></div></dl></article>
      </section>
    </template>
  </div>
</template>
