<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../services/api";

const router = useRouter();
const items = ref([]);
const loading = ref(true);
const error = ref("");

function relativeDate(value) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function notificationIcon(notification) {
  if (notification.type === "leave") return "L";
  if (notification.type === "memo") return "M";
  return "•";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.listNotifications();
    items.value = result?.data || [];
  } catch (err) {
    error.value = err.message || "Unable to load notifications.";
  } finally {
    loading.value = false;
  }
}

async function openNotification(notification) {
  try {
    if (!notification.readAt) {
      await api.markNotificationRead(notification._id);
      notification.readAt = new Date().toISOString();
    }
  } catch (err) {
    error.value = err.message || "Unable to update notification.";
  }

  if (notification.link) {
    router.push(notification.link);
  }
}

async function markAllRead() {
  try {
    await api.markAllNotificationsRead();
    items.value.forEach((notification) => { notification.readAt = new Date().toISOString(); });
  } catch (err) {
    error.value = err.message || "Unable to update notifications.";
  }
}

onMounted(load);
</script>

<template>
  <div class="page notifications-page">
    <section class="page-header notification-hero">
      <div>
        <span class="page-kicker">MEMOFLO PLATFORM</span>
        <h1>Notifications</h1>
        <p>Open a notification to jump directly to the work it is asking you to handle.</p>
      </div>
      <button class="btn btn-secondary" type="button" @click="markAllRead">Mark all read</button>
    </section>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="card empty-state">Loading notifications…</div>

    <section v-else class="notification-center">
      <article
        v-for="notification in items"
        :key="notification._id"
        class="card notification-item notification-action-card"
        :class="{ unread: !notification.readAt }"
        tabindex="0"
        role="button"
        @click="openNotification(notification)"
        @keydown.enter="openNotification(notification)"
      >
        <div class="notification-type-icon">{{ notificationIcon(notification) }}</div>
        <div class="notification-content">
          <div class="notification-title-row"><strong>{{ notification.title }}</strong><span>{{ relativeDate(notification.createdAt) }}</span></div>
          <p>{{ notification.message }}</p>
          <small>{{ notification.link ? "Open related action →" : "System notification" }}</small>
        </div>
        <span v-if="!notification.readAt" class="notification-unread-dot"></span>
      </article>

      <div v-if="!items.length" class="card empty-state">You're all caught up.</div>
    </section>
  </div>
</template>
