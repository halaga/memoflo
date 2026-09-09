<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    default: "Draft",
  },
});

const statusClass = computed(() =>
  `status-${props.status.toLowerCase().replaceAll(" ", "-")}`
);
</script>

<template>
  <span
    class="status-badge"
    :class="statusClass"
  >
    {{ status }}
  </span>
</template>
