<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../../services/api";

const memos = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const result = await api.listMemos();

    const all = Array.isArray(result)
      ? result
      : result?.memos || result?.data || [];

    memos.value = all.filter((memo) => memo.status === "Completed");
  } catch (err) {
    error.value = err.message || "Failed to load completed memos.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Completed</h1>
        <p>Memos that have completed their workflow.</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-if="loading" class="empty-state">
      Loading completed memos...
    </div>

    <div v-else-if="memos.length === 0" class="empty-state">
      No completed memos.
    </div>

    <div v-else class="memo-grid">
      <RouterLink
        v-for="memo in memos"
        :key="memo._id"
        :to="`/memos/${memo._id}`"
        class="card memo-card"
      >
        <span class="status-badge">Completed</span>

        <h2>{{ memo.title }}</h2>

        <p>{{ memo.referenceNo || "No reference" }}</p>
      </RouterLink>
    </div>
  </div>
</template>
