<script setup>
import { RouterLink } from "vue-router";
import MemoStatusBadge from "./MemoStatusBadge.vue";

defineProps({
  memos: {
    type: Array,
    default: () => [],
  },
});

function serviceName(memo) {
  return memo.businessService?.name || "General Memo";
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div class="table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Reference</th>
          <th>Title</th>
          <th>Service</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="memo in memos" :key="memo._id">
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

          <td>{{ memo.priority || "Normal" }}</td>

          <td>
            <MemoStatusBadge :status="memo.status" />
          </td>

          <td>{{ formatDate(memo.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
