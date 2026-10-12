<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const items = ref([]);
const loading = ref(true);
const error = ref("");
const filter = ref("all");

const filtered = computed(() => {
  if (filter.value === "action") return items.value.filter((item) => item.actionable);
  if (filter.value !== "all") return items.value.filter((item) => item.typeKey === filter.value);
  return items.value;
});

function mapMemo(memo) {
  const status = memo.status || "Draft";
  return {
    id: `memo-${memo._id}`,
    title: memo.title || "Untitled memo",
    detail: [memo.referenceNo || "Memo", memo.businessService?.name || (memo.memoType === "simple" ? "Simple memo" : "Request")].join(" · "),
    type: "Memo",
    typeKey: "memo",
    status,
    date: memo.updatedAt || memo.createdAt,
    route: `/memos/${memo._id}`,
    actionable: ["Pending", "In Review", "Draft"].includes(status),
    icon: "memo",
  };
}

function mapNotification(item) {
  return {
    id: `notification-${item._id}`,
    title: item.title || "Notification",
    detail: item.message || item.description || "You have a new notification.",
    type: "Notification",
    typeKey: "notification",
    status: item.readAt || item.read ? "Read" : "Unread",
    date: item.createdAt,
    route: typeof (item.link || item.actionUrl) === "string" && (item.link || item.actionUrl).startsWith("/") ? item.link || item.actionUrl : "/notifications",
    actionable: !(item.readAt || item.read),
    icon: "bell",
  };
}

function mapRequest(request, typeKey, type, routePrefix, icon) {
  const status = request.status || "Submitted";
  const actionable = !["Completed", "Approved", "Rejected", "Cancelled", "Archived"].includes(status);
  return {
    id: `${typeKey}-${request._id}`,
    title: request.title || request.subject || request.requestNumber || type,
    detail: [request.requestNumber || request.referenceNo, request.service?.name || request.category || type].filter(Boolean).join(" · "),
    type,
    typeKey,
    status,
    date: request.updatedAt || request.createdAt || request.startDate,
    route: `${routePrefix}/${request._id}`,
    actionable,
    icon,
  };
}

async function load() {
  loading.value = true;
  error.value = "";
  const sources = await Promise.allSettled([
    api.listMemos(),
    api.listNotifications(),
    api.listServiceRequests(),
    api.listProcurementRequests("mine"),
    api.listLeaveRequests("mine"),
  ]);
  const result = [];
  if (sources[0].status === "fulfilled") result.push(...normalizeList(sources[0].value, ["memos"]).map(mapMemo));
  if (sources[1].status === "fulfilled") result.push(...normalizeList(sources[1].value, ["notifications"]).map(mapNotification));
  if (sources[2].status === "fulfilled") result.push(...normalizeList(sources[2].value, ["requests", "serviceRequests"]).map((item) => mapRequest(item, "request", "Service request", "/work/requests", "file")));
  if (sources[3].status === "fulfilled") result.push(...normalizeList(sources[3].value, ["requests", "procurementRequests"]).map((item) => mapRequest(item, "procurement", "Purchase", "/procurement/requests", "purchase")));
  if (sources[4].status === "fulfilled") result.push(...normalizeList(sources[4].value, ["requests", "leaveRequests"]).map((item) => mapRequest(item, "leave", "Leave request", "/leave/requests", "calendar")));
  items.value = result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  if (sources.every((source) => source.status === "rejected")) error.value = "Unable to load your work. Check the API connection and your permissions.";
  loading.value = false;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

onMounted(load);
</script>

<template>
  <div class="experience-page my-work-page">
    <section class="page-intro-row">
      <div><span class="eyebrow">MY WORK</span><h1>Everything that needs you.</h1><p>Memos, requests, approvals and notifications open their corresponding detail or action page.</p></div>
      <RouterLink to="/services" class="action-primary"><AppIcon name="plus" :size="18" /> Start something</RouterLink>
    </section>

    <div class="work-filter-tabs" role="tablist" aria-label="Filter work">
      <button v-for="option in [{key:'all',label:'All work'},{key:'action',label:'Needs action'},{key:'memo',label:'Memos'},{key:'request',label:'Service requests'},{key:'procurement',label:'Purchases'},{key:'leave',label:'Leave'},{key:'notification',label:'Notifications'}]" :key="option.key" type="button" :class="{ active: filter === option.key }" @click="filter = option.key">{{ option.label }}</button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <section class="workspace-panel work-queue">
      <div v-if="loading" class="panel-empty">Loading your work queue…</div>
      <div v-else-if="!filtered.length" class="panel-empty"><AppIcon name="work" :size="28" /><strong>No items in this view</strong><p>When you create a request or receive an action, it will appear here.</p></div>
      <RouterLink v-for="item in filtered" v-else :key="item.id" :to="item.route" class="queue-row">
        <span class="queue-type"><AppIcon :name="item.icon" :size="20" /></span>
        <span class="queue-main"><strong>{{ item.title }}</strong><small>{{ item.detail }}</small></span>
        <span class="queue-status" :class="{ attention: item.actionable }">{{ item.status }}</span>
        <time>{{ formatDate(item.date) }}</time>
        <AppIcon name="chevron" :size="18" />
      </RouterLink>
    </section>
  </div>
</template>
