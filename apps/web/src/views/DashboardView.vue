<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../services/api";

const memos = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const result = await api.listMemos();

    memos.value = Array.isArray(result)
      ? result
      : result?.memos || result?.data || [];
  } catch (err) {
    error.value = err.message || "Failed to load dashboard.";
  } finally {
    loading.value = false;
  }
});

const totalMemos = computed(() => memos.value.length);

const pendingMemos = computed(() =>
  memos.value.filter((memo) =>
    ["Pending", "In Review"].includes(memo.status)
  ).length
);

const completedMemos = computed(() =>
  memos.value.filter((memo) => memo.status === "Completed").length
);

const rejectedMemos = computed(() =>
  memos.value.filter((memo) => memo.status === "Rejected").length
);

const recentMemos = computed(() => memos.value.slice(0, 5));

function serviceName(memo) {
  return memo.businessService?.name || "General Memo";
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Overview of your MemoFlo workspace.</p>
      </div>

      <RouterLink to="/memos/create" class="btn btn-primary">
        + Create Memo
      </RouterLink>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total Memos</span>
        <strong class="stat-value">{{ totalMemos }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Pending</span>
        <strong class="stat-value">{{ pendingMemos }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Completed</span>
        <strong class="stat-value">{{ completedMemos }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Rejected</span>
        <strong class="stat-value">{{ rejectedMemos }}</strong>
      </div>
    </div>

    <section class="card">
      <div class="card-header">
        <div>
          <h2>Recent Memos</h2>
          <p>Your latest memo activity.</p>
        </div>

        <RouterLink to="/memos" class="text-link">
          View all
        </RouterLink>
      </div>

      <div v-if="loading" class="empty-state">
        Loading memos...
      </div>

      <div v-else-if="recentMemos.length === 0" class="empty-state">
        No memos found.
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Service</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="memo in recentMemos" :key="memo._id">
              <td>
                <RouterLink
                  :to="`/memos/${memo._id}`"
                  class="text-link"
                >
                  {{ memo.referenceNo || "—" }}
                </RouterLink>
              </td>

              <td>{{ memo.title }}</td>

              <td>{{ serviceName(memo) }}</td>

              <td>
                <span class="status-badge">
                  {{ memo.status || "Draft" }}
                </span>
              </td>

              <td>{{ formatDate(memo.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
