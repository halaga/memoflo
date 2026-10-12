<script setup>
import { computed } from "vue";
const props = defineProps({ name: { type: String, default: "dot" }, size: { type: [Number, String], default: 16 } });
const paths = {
  search: "M11 19a8 8 0 1 1 5.657-2.343L21 21M16.657 16.657 21 21",
  plus: "M12 5v14M5 12h14",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-up-right": "M7 17 17 7M8 7h9v9",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  download: "M12 3v12m0 0 5-5m-5 5-5-5M5 21h14",
  upload: "M12 15V3m0 0 5 5m-5-5L7 8M5 21h14",
  user: "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  file: "M6 2h8l4 4v16H6zM14 2v5h5",
  refresh: "M20 11a8 8 0 1 0 1 5M20 5v6h-6",
};
const path = computed(() => paths[props.name] || paths.file);
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="path" /></svg></template>
