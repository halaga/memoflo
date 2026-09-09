<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../../services/api";

const data = ref({
  employees: [],
  positions: [],
  departments: [],
  designations: [],
  services: [],
  workflows: [],
});

const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const [
      employees,
      positions,
      departments,
      designations,
      services,
      workflows,
    ] = await Promise.all([
      api.listEmployees(),
      api.listPositions(),
      api.listDepartments(),
      api.listDesignations(),
      api.listBusinessServices(),
      api.listWorkflows(),
    ]);

    data.value = {
      employees: employees?.employees || employees?.data || employees || [],
      positions: positions?.positions || positions?.data || positions || [],
      departments:
        departments?.departments || departments?.data || departments || [],
      designations:
        designations?.designations ||
        designations?.data ||
        designations ||
        [],
      services: services?.services || services?.data || services || [],
      workflows: workflows?.workflows || workflows?.data || workflows || [],
    };
  } catch (err) {
    error.value = err.message || "Failed to load administration data.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Administration</h1>
        <p>Manage your organization's platform configuration.</p>
      </div>

      <RouterLink to="/administration/workflows" class="btn btn-primary">
        Workflow Settings
      </RouterLink>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-if="loading" class="empty-state">
      Loading administration...
    </div>

    <div v-else class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Employees</span>
        <strong class="stat-value">{{ data.employees.length }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Positions</span>
        <strong class="stat-value">{{ data.positions.length }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Departments</span>
        <strong class="stat-value">{{ data.departments.length }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Workflows</span>
        <strong class="stat-value">{{ data.workflows.length }}</strong>
      </div>
    </div>
  </div>
</template>
