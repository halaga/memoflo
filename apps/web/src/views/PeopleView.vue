<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, assetUrl, getSavedEmployee, normalizeList } from "../services/api";
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
const canManageEmployees = computed(() =>
  permissions.value.includes("*") ||
  permissions.value.includes("employees.create") ||
  permissions.value.includes("employees.update")
);
const canImportEmployees = computed(() =>
  permissions.value.includes("*") || permissions.value.includes("employees.create")
);

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return employees.value;
  return employees.value.filter((person) => [
    person.firstName, person.lastName, person.middleName, person.email,
    person.employeeNo, person.phone, person.position?.title,
    person.position?.department?.name, person.department?.name,
    person.sbu?.name, person.employmentStatus,
  ].filter(Boolean).join(" ").toLowerCase().includes(term));
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    employees.value = normalizeList(await api.listEmployeeDirectory(), ["employees"]);
  } catch (err) {
    error.value = err?.message || "Unable to load employee list.";
    employees.value = [];
  } finally {
    loading.value = false;
  }
}

function employeeName(person) {
  return [person.firstName, person.biodata?.middleName, person.lastName].filter(Boolean).join(" ") || person.email || "Employee";
}

function initials(person) {
  return employeeName(person).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function relation(value) {
  return value?.name || value?.title || value || "Not assigned";
}

function exportPeople() {
  downloadCsv("memoflo-people.csv", filtered.value.map((person) => ({
    employeeNo: person.employeeNo || "",
    firstName: person.firstName || "",
    lastName: person.lastName || "",
    email: person.email || "",
    phone: person.phone || "",
    position: relation(person.position),
    department: relation(person.position?.department || person.department),
    status: person.employmentStatus || "Active",
    middleName: person.biodata?.middleName || "",
    dateOfBirth: person.biodata?.dateOfBirth ? String(person.biodata.dateOfBirth).slice(0, 10) : "",
    nationality: person.biodata?.nationality || "",
    stateOfOrigin: person.biodata?.stateOfOrigin || "",
  })));
}

async function importPeople(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  importBusy.value = true;
  importMessage.value = "";
  let created = 0;
  const failures = [];

  try {
    const rows = await parseCsv(file);
    for (let index = 0; index < rows.length; index += 1) {
      const row = Object.fromEntries(Object.entries(rows[index]).map(([key, value]) => [key.trim(), String(value || "").trim()]));
      if (!row.firstName || !row.lastName || !row.email) {
        failures.push(`Row ${index + 2}: firstName, lastName and email are required.`);
        continue;
      }
      try {
        await api.createEmployee({
          employeeNo: row.employeeNo || undefined,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone || "",
          createLogin: String(row.createLogin || "false").toLowerCase() === "true",
          ...(row.middleName || row.dateOfBirth || row.nationality || row.stateOfOrigin ? {
            biodata: {
              middleName: row.middleName || "",
              dateOfBirth: row.dateOfBirth || null,
              nationality: row.nationality || "Nigerian",
              stateOfOrigin: row.stateOfOrigin || "",
            },
          } : {}),
        });
        created += 1;
      } catch (err) {
        failures.push(`Row ${index + 2} (${row.email}): ${err.message}`);
      }
    }
    importMessage.value = `${created} employee record(s) imported.${failures.length ? ` ${failures.length} row(s) skipped: ${failures.slice(0, 3).join(" ")}` : ""}`;
    await load();
  } catch (err) {
    importMessage.value = err.message || "Unable to read this CSV file.";
  } finally {
    importBusy.value = false;
  }
}

function downloadTemplate() {
  downloadCsv("memoflo-people-import-template.csv", [{
    employeeNo: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    createLogin: "false",
    middleName: "",
    dateOfBirth: "",
    nationality: "Nigerian",
    stateOfOrigin: "",
  }]);
}

onMounted(load);
</script>

<template>
  <div class="experience-page people-page">
    <section class="page-intro-row">
      <div>
        <span class="eyebrow">PEOPLE & HR</span>
        <h1>People directory</h1>
        <p>Employee biodata, roles and reporting relationships, with import and export for authorised staff.</p>
      </div>
      <div class="people-actions">
        <button type="button" class="action-secondary" @click="exportPeople">
          <AppIcon name="download" :size="17" /> Export CSV
        </button>
        <label v-if="canImportEmployees" class="action-secondary file-action">
          <AppIcon name="upload" :size="17" /> {{ importBusy ? "Importing…" : "Import CSV" }}
          <input type="file" accept=".csv,text/csv" :disabled="importBusy" @change="importPeople" />
        </label>
        <button v-if="canImportEmployees" type="button" class="action-secondary" @click="downloadTemplate">
          <AppIcon name="file" :size="17" /> Template
        </button>
        <RouterLink v-if="permissions.includes('*') || permissions.includes('employees.view')" to="/administration/organization" class="action-primary">
          <AppIcon name="settings" :size="17" /> Manage structure
        </RouterLink>
      </div>
    </section>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="importMessage" class="alert" :class="importMessage.includes('Unable') ? 'alert-error' : 'alert-success'">{{ importMessage }}</div>

    <section class="people-toolbar">
      <label class="people-search">
        <AppIcon name="search" :size="19" />
        <input v-model="search" type="search" placeholder="Search name, employee number, department or email…" />
      </label>
      <span class="people-count">{{ filtered.length }} {{ filtered.length === 1 ? "person" : "people" }}</span>
    </section>

    <section class="workspace-panel directory-panel">
      <div v-if="loading" class="panel-empty">Loading people…</div>
      <div v-else-if="!filtered.length" class="panel-empty">
        <AppIcon name="people" :size="30" />
        <strong>No people found</strong>
        <p>Try a different search term or add employees through Administration.</p>
      </div>
      <div v-else class="people-list">
        <component
          :is="canManageEmployees || permissions.includes('*') || permissions.includes('employees.view') ? RouterLink : 'div'"
          v-for="person in filtered"
          :key="person._id"
          :to="`/people/${person._id}`"
          class="person-row"
        >
          <span class="person-avatar">
            <img v-if="person.avatar" :src="assetUrl(person.avatar)" :alt="employeeName(person)" />
            <span v-else>{{ initials(person) }}</span>
          </span>
          <span class="person-main">
            <strong>{{ employeeName(person) }}</strong>
            <small>{{ person.employeeNo || "No employee number" }} · {{ relation(person.position) }}</small>
          </span>
          <span class="person-meta">
            <strong>{{ relation(person.position?.department || person.department) }}</strong>
            <small>{{ person.email || "No email" }}</small>
          </span>
          <span class="person-status" :class="{ inactive: person.employmentStatus !== 'Active' }">{{ person.employmentStatus || "Active" }}</span>
          <AppIcon name="chevron" :size="18" />
        </component>
      </div>
    </section>
    <p class="people-footnote">CSV import creates employee records. Login accounts are not enabled unless <code>createLogin</code> is set to <code>true</code>.</p>
  </div>
</template>
