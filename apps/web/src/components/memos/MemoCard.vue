<script setup>
import { RouterLink } from "vue-router";
import MemoStatusBadge from "./MemoStatusBadge.vue";

defineProps({
  memo: {
    type: Object,
    required: true,
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
  <RouterLink
    :to="`/memos/${memo._id}`"
    class="card memo-card"
  >
    <div class="memo-card-top">
      <span>{{ memo.referenceNo || "No reference" }}</span>

      <MemoStatusBadge :status="memo.status" />
    </div>

    <h2>{{ memo.title }}</h2>

    <p>{{ serviceName(memo) }}</p>

    <div class="memo-card-footer">
      <span>{{ memo.priority || "Normal" }}</span>
      <span>{{ formatDate(memo.createdAt) }}</span>
    </div>
  </RouterLink>
</template>
