<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../../services/api";

const memos = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(load);

async function load() {
  try {
    const result = await api.listMemos();

    const all = Array.isArray(result)
      ? result
      : result?.memos || result?.data || [];

    memos.value = all.filter(
      (memo) => !["Completed", "Rejected"].includes(memo.status)
    );
  } catch (err) {
    error.value = err.message || "Failed to load approvals.";
  } finally {
    loading.value = false;
  }
}

const count = computed(() => memos.value.length);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Approvals</h1>
        <p>Memos currently moving through workflow.</p>
      </div>

      <strong>{{ count }} pending</strong>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-if="loading" class="empty-state">
      Loading approvals...
    </div>

    <div v-else-if="memos.length === 0" class="empty-state">
      No pending approvals.
    </div>

    <div v-else class="memo-grid">
      <RouterLink
        v-for="memo in memos"
        :key="memo._id"
        :to="`/memos/${memo._id}`"
        class="card memo-card"
      >
        <span class="status-badge">{{ memo.status }}</span>

        <h2>{{ memo.title }}</h2>

        <p>{{ memo.referenceNo || "No reference" }}</p>
      </RouterLink>
    </div>
  </div>
</template>
