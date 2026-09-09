<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../../services/api";

const workflows = ref([]);
const selected = ref(null);
const loading = ref(true);
const error = ref("");

onMounted(load);

async function load() {
  try {
    const result = await api.listWorkflows();

    workflows.value = Array.isArray(result)
      ? result
      : result?.workflows || result?.data || [];

    selected.value = workflows.value[0] || null;
  } catch (err) {
    error.value = err.message || "Failed to load workflows.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <RouterLink to="/administration" class="text-link">
          ← Administration
        </RouterLink>

        <h1>Workflow Settings</h1>
        <p>Configure workflow definitions and approval steps.</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-if="loading" class="empty-state">
      Loading workflows...
    </div>

    <template v-else>
      <div class="detail-grid">
        <section class="card">
          <h2>Workflows</h2>

          <button
            v-for="workflow in workflows"
            :key="workflow._id"
            class="workflow-list-item"
            @click="selected = workflow"
          >
            {{ workflow.name }}
          </button>

          <div v-if="workflows.length === 0" class="empty-state">
            No workflows found.
          </div>
        </section>

        <section class="card">
          <h2>{{ selected?.name || "Select a workflow" }}</h2>

          <p v-if="selected">
            {{ selected.description || "No description provided." }}
          </p>

          <p v-else>
            Select a workflow to view its configuration.
          </p>
        </section>
      </div>
    </template>
  </div>
</template>
