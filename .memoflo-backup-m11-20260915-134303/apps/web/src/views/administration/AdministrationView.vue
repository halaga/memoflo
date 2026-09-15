<script setup>
import { onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";

const data = ref({
  employees: [],
  positions: [],
  departments: [],
  workflows: [],
});

const loading = ref(true);
const error = ref("");

const cards = [
  {
    title: "Module Access",
    text: "Enable or disable the MemoFlo modules available to this company.",
    to: "/administration/modules",
    icon: "◈",
  },
  {
    title: "Workflow Definitions",
    text: "Create reusable workflows and add, edit or remove their steps.",
    to: "/administration/workflows",
    icon: "◇",
  },
  {
    title: "Roles & Permissions",
    text: "Define employee authority and control what people can do.",
    to: "/administration/roles",
    icon: "♙",
  },
  {
    title: "Employees",
    text: "Set up employees, assign roles and positions, and create their login accounts.",
    to: "/administration/employees",
    icon: "♙",
  },
  {
    title: "Company Branding",
    text: "Customize your logo, wallpaper and company colours.",
    to: "/administration/branding",
    icon: "✦",
  },
  {
    title: "Notifications",
    text: "Review workflow activity and platform notifications.",
    to: "/notifications",
    icon: "◔",
  },
];

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const [employees, positions, departments, workflows] =
      await Promise.all([
        api.listEmployees(),
        api.listPositions(),
        api.listDepartments(),
        api.listWorkflows(),
      ]);

    data.value = {
      employees: normalizeList(employees),
      positions: normalizeList(positions),
      departments: normalizeList(departments),
      workflows: normalizeList(workflows),
    };
  } catch (err) {
    error.value = err.message || "Unable to load administration.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page administration-page">
    <div class="page-header">
      <div>
        <span class="page-kicker">ADMINISTRATION</span>
        <h1>Company control centre</h1>
        <p>
          Configure how this company uses MemoFlo without changing the
          platform's core experience.
        </p>
      </div>

      <RouterLink
        to="/modules"
        class="btn btn-secondary"
      >
        ← Module Hub
      </RouterLink>
    </div>

    <div
      v-if="error"
      class="alert alert-error"
    >
      {{ error }}
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <span class="stat-label">Employees</span>
        <strong class="stat-value">{{ data.employees.length }}</strong>
      </div>

      <div class="stat-card card">
        <span class="stat-label">Positions</span>
        <strong class="stat-value">{{ data.positions.length }}</strong>
      </div>

      <div class="stat-card card">
        <span class="stat-label">Departments</span>
        <strong class="stat-value">{{ data.departments.length }}</strong>
      </div>

      <div class="stat-card card">
        <span class="stat-label">Workflows</span>
        <strong class="stat-value">{{ data.workflows.length }}</strong>
      </div>
    </div>

    <section class="admin-control-grid">
      <RouterLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="card admin-control-card"
      >
        <div class="module-tile-icon">
          {{ card.icon }}
        </div>

        <div>
          <h2>{{ card.title }}</h2>
          <p>{{ card.text }}</p>
          <span>Open →</span>
        </div>
      </RouterLink>
    </section>

    <section class="card admin-note">
      <strong>MemoFlo tenant principle</strong>
      <p>
        Company configuration controls what the tenant has. Roles and
        permissions control what each employee can do inside those modules.
      </p>
    </section>
  </div>
</template>
