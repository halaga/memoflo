<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, getSavedEmployee } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";
import { downloadCsv, parseCsv } from "../utils/dataTransfer";

const employees = ref([]);
const search = ref("");
const loading = ref(true);
const error = ref("");
const importBusy = ref(false);
const importMessage = ref("");
const current = computed(() => getSavedEmployee());
const permissions = computed(() => current.value?.role?.permissions || []);
const canManageEmployees = computed(() => permissions.value.includes("*") || permissions.value.includes("employees.create"));

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return employees.value;
  return employees.value.filter((person) =>
    [person.firstName, person.lastName, person.email, person.employeeNo, person.phone, person.position?.title, person.department?.name, person.department, person.sbu?.name]
      .filter(Boolean).join(" ").toLowerCase().includes(term)
  );
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.listEmployeeDirectory();
    employees.value = Array.isArray(result) ? result : result?.data || result?.employees || [];
  } catch (err) {
    error.value = err?.message || "Unable to load employee list.";
    employees.value = [];
  } finally { loading.value = false; }
}

function name(person) { return `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || "Employee"; }
function initials(person) { return name(person).split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function relation(value) { return value?.name || value?.title || value || "—"; }
function exportPeople() {
  downloadCsv("memoflo-people.csv", filtered.value.map((person) => ({
    employeeNo: person.employeeNo || "", firstName: person.firstName || "", lastName: person.lastName || "", email: person.email || "", phone: person.phone || "", position: relation(person.position), status: person.employmentStatus || "Active"
  })));
}

async function importPeople(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  importBusy.value = true; importMessage.value = "";
  try {
    const rows = await parseCsv(file);
    let created = 0; let failed = 0;
    for (const row of rows) {
      if (!row.firstName || !row.lastName || !row.email) { failed++; continue; }
      try { await api.createEmployee({ firstName: row.firstName, lastName: row.lastName, email: row.email, phone: row.phone || "", employeeNo: row.employeeNo || undefined, createLogin: row.createLogin !== "false" }); created++; } catch { failed++; }
    }
    importMessage.value = `${created} employee${created === 1 ? "" : "s"} imported${failed ? `, ${failed} skipped` : ""}.`;
    await load();
  } catch (err) { importMessage.value = err?.message || "Unable to import the file."; }
  finally { importBusy.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="experience-page">
    <section class="page-intro-row people-intro">
      <div><span class="eyebrow">PEOPLE</span><h1>Know who keeps the company moving.</h1><p>A living employee directory for people, roles and the information behind every workflow.</p></div>
      <div class="page-actions">
        <button class="action-secondary icon-action" type="button" @click="exportPeople"><AppIcon name="download" /> Export CSV</button>
        <label v-if="canManageEmployees" class="action-primary icon-action"><AppIcon name="upload" /> {{ importBusy ? "Importing…" : "Import CSV" }}<input hidden type="file" accept=".csv,text/csv" :disabled="importBusy" @change="importPeople" /></label>
        <RouterLink v-if="permissions.includes('*')" to="/administration/organization" class="action-secondary icon-action"><AppIcon name="grid" /> Structure</RouterLink>
      </div>
    </section>

    <div v-if="importMessage" class="transfer-notice">{{ importMessage }}</div>
    <section class="people-toolbar"><div class="command-strip"><AppIcon name="search" /><input v-model="search" placeholder="Search people, department, position or employee number…" /></div><span>{{ filtered.length }} people</span></section>

    <section class="workspace-panel directory-panel">
      <div v-if="loading" class="panel-empty">Loading people…</div>
      <div v-else-if="error" class="panel-empty error-state"><strong>Unable to load employee list</strong><span>{{ error }}</span><button class="action-secondary icon-action" type="button" @click="load"><AppIcon name="refresh" /> Try again</button></div>
      <div v-else-if="filtered.length === 0" class="panel-empty">No people match your search.</div>
      <div v-else class="people-list">
        <RouterLink v-for="person in filtered" :key="person._id" :to="{ name: 'employee-profile', params: { id: person._id } }" class="person-row person-link">
          <div class="person-avatar">{{ initials(person) }}</div>
          <div class="person-main"><strong>{{ name(person) }}</strong><span>{{ relation(person.position) }} · {{ person.employeeNo || "No employee number" }}</span></div>
          <div class="person-meta"><span>{{ relation(person.department) }}</span><small>{{ person.email || "No email" }}</small></div><AppIcon name="arrow-right" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>
