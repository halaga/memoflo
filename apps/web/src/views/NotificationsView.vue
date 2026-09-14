<script setup>
import { onMounted, ref } from "vue";
import { api } from "../services/api";

const items = ref([]);
const loading = ref(true);
const error = ref("");

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

async function markRead(notification) {
  if (notification.readAt) {
    return;
  }

  try {
    await api.markNotificationRead(notification._id);
    notification.readAt = new Date().toISOString();
  } catch (err) {
    error.value = err.message || "Unable to update notification.";
  }
}

async function markAllRead() {
  try {
    await api.markAllNotificationsRead();

    items.value.forEach((notification) => {
      notification.readAt = new Date().toISOString();
    });
  } catch (err) {
    error.value = err.message || "Unable to update notifications.";
  }
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <span class="page-kicker">MEMOFLO PLATFORM</span>
        <h1>Notifications</h1>
        <p>
          Stay on top of approvals, workflow activity and company updates.
        </p>
      </div>

      <button
        class="btn btn-secondary"
        type="button"
        @click="markAllRead"
      >
        Mark all read
      </button>
    </div>

    <div
      v-if="error"
      class="alert alert-error"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="card empty-state"
    >
      Loading notifications…
    </div>

    <section
      v-else
      class="notification-list"
    >
      <article
        v-for="notification in items"
        :key="notification._id"
        class="card notification-item"
        :class="{ unread: !notification.readAt }"
        @click="markRead(notification)"
      >
        <div class="notification-dot"></div>

        <div>
          <strong>{{ notification.title }}</strong>
          <p>{{ notification.message }}</p>
          <small>
            {{ new Date(notification.createdAt).toLocaleString() }}
          </small>
        </div>
      </article>

      <div
        v-if="!items.length"
        class="card empty-state"
      >
        You're all caught up.
      </div>
    </section>
  </div>
</template>
