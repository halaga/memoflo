<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../../services/api";

const memos = ref([]);
const loading = ref(true);
const error = ref("");

const search = ref("");
const statusFilter = ref("");

onMounted(loadMemos);

async function loadMemos() {
  loading.value = true;
  error.value = "";

  try {
    const result = await api.listMemos();

    memos.value = Array.isArray(result)
      ? result
      : result?.memos || result?.data || [];
  } catch (err) {
    error.value = err.message || "Failed to load memos.";
  } finally {
    loading.value = false;
  }
}

const filteredMemos = computed(() => {
  const query = search.value.trim().toLowerCase();

  return memos.value.filter((memo) => {
    const matchesSearch =
      !query ||
      memo.title?.toLowerCase().includes(query) ||
      memo.referenceNo?.toLowerCase().includes(query);

    const matchesStatus =
      !statusFilter.value || memo.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

function serviceName(memo) {
  return memo.businessService?.name || "General Memo";
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>My Memos</h1>
        <p>View and manage your submitted memos.</p>
      </div>

      <RouterLink to="/memos/create" class="btn btn-primary">
        + Create Memo
      </RouterLink>
    </div>

    <div class="filters">
      <input
        v-model="search"
        class="input"
        type="search"
        placeholder="Search memos..."
      />

      <select v-model="statusFilter" class="input">
        <option value="">All statuses</option>
        <option>Draft</option>
        <option>Pending</option>
        <option>In Review</option>
        <option>Approved</option>
        <option>Rejected</option>
        <option>Completed</option>
      </select>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-if="loading" class="empty-state">
      Loading memos...
    </div>

    <div v-else-if="filteredMemos.length === 0" class="empty-state">
      No memos found.
    </div>

    <div v-else class="memo-grid">
      <RouterLink
        v-for="memo in filteredMemos"
        :key="memo._id"
        :to="`/memos/${memo._id}`"
        class="card memo-card"
      >
        <div class="memo-card-top">
          <span>{{ memo.referenceNo || "No reference" }}</span>
          <span class="status-badge">{{ memo.status }}</span>
        </div>

        <h2>{{ memo.title }}</h2>

        <p>{{ serviceName(memo) }}</p>

        <small>
          {{ memo.priority || "Normal" }}
        </small>
      </RouterLink>
    </div>
  </div>
</template>
