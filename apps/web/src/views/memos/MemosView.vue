<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../../services/api";
import MemoTable from "../../components/memos/MemoTable.vue";

const memos = ref([]);
const loading = ref(true);
const error = ref("");

const search = ref("");
const status = ref("");

onMounted(loadMemos);

async function loadMemos() {
  loading.value = true;
  error.value = "";

  try {
    const result = await api.listMemos();

    memos.value = Array.isArray(result)
      ? result
      : result?.memos ||
        result?.data ||
        [];
  } catch (err) {
    error.value =
      err.message || "Failed to load memos.";
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
      !status.value ||
      memo.status === status.value;

    return matchesSearch && matchesStatus;
  });
});
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>My Memos</h1>
        <p>
          Create, track and manage your business requests.
        </p>
      </div>

      <RouterLink
        to="/memos/create"
        class="btn btn-primary"
      >
        + Create Memo
      </RouterLink>
    </div>

    <div class="filters">
      <input
        v-model="search"
        class="input"
        type="search"
        placeholder="Search by title or reference..."
      />

      <select
        v-model="status"
        class="input"
      >
        <option value="">All statuses</option>
        <option>Draft</option>
        <option>Pending</option>
        <option>In Review</option>
        <option>Approved</option>
        <option>Rejected</option>
        <option>Completed</option>
      </select>
    </div>

    <div
      v-if="error"
      class="alert alert-error"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="empty-state"
    >
      Loading memos...
    </div>

    <div
      v-else-if="filteredMemos.length === 0"
      class="empty-state"
    >
      No memos found.
    </div>

    <MemoTable
      v-else
      :memos="filteredMemos"
    />
  </div>
</template>
