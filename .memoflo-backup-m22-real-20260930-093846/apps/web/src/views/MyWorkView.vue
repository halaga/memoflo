<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../services/api";

const memos = ref([]);
const notifications = ref([]);
const loading = ref(true);
const filter = ref("all");

const items = computed(() => {
  const memoItems = memos.value.map((memo) => ({
    id: `memo-${memo._id}`,
    title: memo.title || "Untitled memo",
    detail: `${memo.referenceNo || "Memo"} · ${memo.businessService?.name || "General request"}`,
    type: "Memo",
    status: memo.status || "Draft",
    date: memo.createdAt,
    route: `/memos/${memo._id}`,
    actionable: ["Pending", "In Review", "Draft"].includes(memo.status),
  }));

  const notificationItems = notifications.value.map((item) => ({
    id: `notification-${item._id}`,
    title: item.title || "Notification",
    detail: item.message || item.description || "You have a new notification.",
    type: "Notification",
    status: item.readAt || item.read ? "Read" : "Unread",
    date: item.createdAt,
    route: item.actionUrl || item.link || "/notifications",
    actionable: !(item.readAt || item.read),
  }));

  return [...notificationItems, ...memoItems].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
});

const filtered = computed(() => {
  if (filter.value === "action") return items.value.filter((item) => item.actionable);
  if (filter.value === "memo") return items.value.filter((item) => item.type === "Memo");
  if (filter.value === "notification") return items.value.filter((item) => item.type === "Notification");
  return items.value;
});

async function load() {
  loading.value = true;
  const [memoResult, notificationResult] = await Promise.allSettled([api.listMemos(), api.listNotifications()]);
  if (memoResult.status === "fulfilled") memos.value = Array.isArray(memoResult.value) ? memoResult.value : memoResult.value?.memos || memoResult.value?.data || [];
  if (notificationResult.status === "fulfilled") {
    const value = notificationResult.value;
    notifications.value = Array.isArray(value) ? value : value?.notifications || value?.data || [];
  }
  loading.value = false;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

onMounted(load);
</script>

<template>
  <div class="experience-page">
    <section class="page-intro-row">
      <div>
        <span class="eyebrow">MY WORK</span>
        <h1>Everything that needs you.</h1>
        <p>Approvals, requests, notifications and active work in one actionable queue.</p>
      </div>
      <RouterLink to="/memos/create" class="action-primary">Start something</RouterLink>
    </section>

    <div class="segmented-tabs">
      <button v-for="item in [{key:'all',label:'All work'},{key:'action',label:'Needs action'},{key:'memo',label:'Memos'},{key:'notification',label:'Notifications'}]" :key="item.key" :class="{active: filter === item.key}" @click="filter = item.key">{{ item.label }}</button>
    </div>

    <section class="workspace-panel work-queue">
      <div v-if="loading" class="panel-empty">Loading work queue…</div>
      <div v-else-if="filtered.length === 0" class="panel-empty">No work in this view.</div>
      <RouterLink v-for="item in filtered" v-else :key="item.id" :to="item.route" class="queue-row">
        <div class="queue-type">{{ item.type === "Memo" ? "M" : "N" }}</div>
        <div class="queue-main">
          <strong>{{ item.title }}</strong>
          <span>{{ item.detail }}</span>
        </div>
        <span class="queue-status" :class="{ attention: item.actionable }">{{ item.status }}</span>
        <time>{{ formatDate(item.date) }}</time>
        <span class="queue-arrow">→</span>
      </RouterLink>
    </section>
  </div>
</template>
