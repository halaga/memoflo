<script setup>
import { computed } from "vue";

const props = defineProps({
  name: { type: String, default: "file" },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 1.8 },
});

const paths = {
  search: ["M11 19a8 8 0 1 1 5.657-2.343L21 21", "M16.657 16.657 21 21"],
  home: ["M3 10.5 12 3l9 7.5", "M5.5 9.5V21h13V9.5", "M9.5 21v-7h5v7"],
  work: ["M3 7h18v14H3z", "M8 7V4h8v3", "m7 13 3 3 7-7"],
  services: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5"],
  "file-text": ["M6 2h8l4 4v16H6z", "M14 2v5h5", "M9 12h6", "M9 16h6"],
  "file-check": ["M6 2h8l4 4v16H6z", "M14 2v5h5", "m8 14 2 2 5-5"],
  headset: ["M3 13v-1a9 9 0 0 1 18 0v1", "M3 13h4v7H5a2 2 0 0 1-2-2z", "M21 13h-4v7h2a2 2 0 0 0 2-2z"],
  fuel: ["M4 21V4h11v17", "M2 21h15", "M15 8h3l3 3v6h-3", "M7 8h5", "M7 12h5"],
  car: ["M5 17h14l1-6-2-5H6l-2 5z", "M4 11h16", "M7 17v3", "M17 17v3", "M7 14h.01", "M17 14h.01"],
  chair: ["M7 4h10v8H7z", "M5 12h14v4H5z", "M7 16v5", "M17 16v5"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M20 8v6", "M17 11h6"],
  grid: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"],
  people: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M20 8v6", "M17 11h6"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
  company: ["M3 21h18", "M5 21V5l7-2v18", "M12 8h7v13", "M8 7h1", "M8 11h1", "M8 15h1", "M15 12h1", "M15 16h1"],
  memo: ["M6 2h8l4 4v16H6z", "M14 2v5h5", "M9 12h6", "M9 16h6"],
  approval: ["M4 4h16v16H4z", "m8 12 3 3 5-6"],
  calendar: ["M4 5h16v16H4z", "M8 3v4", "M16 3v4", "M4 9h16"],
  purchase: ["M3 4h2l2 12h11l3-9H6", "M9 21h.01", "M17 21h.01"],
  laptop: ["M4 5h16v11H4z", "M2 20h20", "M9 16l-1 4", "M15 16l1 4"],
  wifi: ["M5 9a11 11 0 0 1 14 0", "M8 12a6.5 6.5 0 0 1 8 0", "M11 15a2 2 0 0 1 2 0", "M12 19h.01"],
  settings: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8", "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.8.1l-.2.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.5-1l-.2 0-3-1.7.1-.2a1.7 1.7 0 0 0-.1-1.8l-.1-.2v-3.4l.2-.1a1.7 1.7 0 0 0 1-1.5l0-.2 1.7-3 .2.1a1.7 1.7 0 0 0 1.8-.1l.2-.1h3.4l.1.2a1.7 1.7 0 0 0 1.5 1l.2 0 3 1.7-.1.2a1.7 1.7 0 0 0 .1 1.8l.1.2v3.4z"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  arrow: ["M5 12h14", "m13 6 6 6-6 6"],
  chevron: ["m9 18 6-6-6-6"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  panel: ["M4 4h16v16H4z", "M9 4v16", "m14 9 3 3-3 3"],
  download: ["M12 3v12", "m7 10 5 5 5-5", "M4 21h16"],
  upload: ["M12 15V3", "m7 8 5-5 5 5", "M4 21h16"],
  refresh: ["M20 11a8 8 0 1 0 1 5", "M20 4v7h-7"],
  filter: ["M4 5h16l-6 7v6l-4 2v-8z"],
  plus: ["M12 5v14", "M5 12h14"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M6 6l1 15h10l1-15", "M10 10v7", "M14 10v7"],
  file: ["M6 2h8l4 4v16H6z", "M14 2v5h5"],
  check: ["m5 12 4 4L19 6"],
  clock: ["M12 7v5l3 2", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"],
  mail: ["M3 5h18v14H3z", "m3 6 9 7 9-7"],
  shield: ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z", "m9 12 2 2 4-4"],
  box: ["M21 8 12 13 3 8", "M12 22V13", "m3 8 9-5 9 5v10l-9 4-9-4z"],
  moon: ["M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13z"],
  sun: ["M12 3v2", "M12 19v2", "M3 12h2", "M19 12h2", "m5.6 5.6 1.4 1.4", "m17 17 1.4 1.4", "m18.4 5.6-1.4 1.4", "m7 17-1.4 1.4", "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0"],
};

const segments = computed(() => paths[props.name] || paths.file);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(segment, index) in segments" :key="index" :d="segment" />
  </svg>
</template>
