<script setup>
import { onMounted, ref } from "vue";
import { api } from "../../services/api.js";

const logs = ref([]);
const loading = ref(true);
const error = ref("");
const page = ref(1);
const pages = ref(1);
const search = ref("");
const outcome = ref("");

function actorName(actor) {
  if (!actor) return "System";
  return `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || actor.email;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const result = await api.listAuditLogs({
      page: page.value,
      search: search.value || undefined,
      outcome: outcome.value || undefined,
    });

    logs.value = result?.data?.items || [];
    pages.value = result?.data?.pagination?.pages || 1;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  load();
}

onMounted(load);
</script>

<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Audit Log</h1>
        <p>Review company activity, changes and administrative events.</p>
      </div>
    </div>

    <div class="panel audit-panel">
      <div class="audit-toolbar">
        <input
          v-model="search"
          class="form-input"
          placeholder="Search action, resource or ID"
          @keyup.enter="applyFilters"
        />

        <select v-model="outcome" class="form-input" @change="applyFilters">
          <option value="">All outcomes</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>

        <button class="btn btn-primary" type="button" @click="applyFilters">
          Filter
        </button>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
      <p v-if="loading" class="empty-state">Loading audit events...</p>
      <p v-else-if="!logs.length" class="empty-state">No audit events found.</p>

      <div v-else class="audit-table-wrap">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Outcome</th>
              <th>Request</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id">
              <td>{{ formatDate(log.occurredAt) }}</td>
              <td>{{ actorName(log.actor) }}</td>
              <td><strong>{{ log.action }}</strong></td>
              <td>
                {{ log.resourceType }}
                <span v-if="log.resourceId" class="muted">#{{ log.resourceId }}</span>
              </td>
              <td>
                <span :class="['audit-badge', log.outcome]">
                  {{ log.outcome }}
                </span>
              </td>
              <td>{{ log.method }} {{ log.statusCode }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pages > 1" class="pagination-row">
        <button
          class="btn btn-secondary"
          :disabled="page <= 1"
          @click="page--; load()"
        >
          Previous
        </button>
        <span>Page {{ page }} of {{ pages }}</span>
        <button
          class="btn btn-secondary"
          :disabled="page >= pages"
          @click="page++; load()"
        >
          Next
        </button>
      </div>
    </div>
  </section>
</template>
