<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  api,
  clearSession,
  getSavedEmployee,
} from "../../services/api";

const route = useRoute();
const router = useRouter();
const employee = computed(() => getSavedEmployee());
const unread = ref(0);
const previousUnread = ref(0);
let notificationTimer = null;

const titles = {
  modules: ["Workspace", "Module Hub"],
  notifications: ["Workspace", "Notifications"],
  memos: ["Memo Management", "My Memos"],
  leave: ["Leave Management", "Leave Overview"],
  "leave-request": ["Leave Management", "Leave Request"],
  "create-memo": ["Memo Management", "Create Memo"],
  "memo-detail": ["Memo Management", "Memo Details"],
  approvals: ["Memo Management", "Approvals"],
  completed: ["Memo Management", "Completed"],
  administration: ["Administration", "Overview"],
  "workflow-settings": ["Administration", "Workflow Definitions"],
  roles: ["Administration", "Roles & Permissions"],
  "module-access": ["Administration", "Module Access"],
  "company-branding": ["Administration", "Company Branding"],
  dashboard: ["Workspace", "Dashboard"],
};

const title = computed(
  () => titles[route.name] || ["MemoFlo", "Workspace"]
);

const initials = computed(() => {
  const first = employee.value?.firstName?.[0] || "";
  const last = employee.value?.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "MF";
});

async function loadNotifications({ playSound = false } = {}) {
  try {
    const result = await api.listNotifications();
    const nextUnread = result?.unreadCount || 0;

    if (playSound && nextUnread > previousUnread.value) {
      try {
        const context = new window.AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 880;
        gain.gain.value = 0.045;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.12);
      } catch {
        // Browsers can block audio until the user interacts with the page.
      }
    }

    previousUnread.value = nextUnread;
    unread.value = nextUnread;
  } catch {
    unread.value = 0;
  }
}

function logout() {
  clearSession();
  router.replace("/login");
}

onMounted(async () => {
  await loadNotifications();
  notificationTimer = window.setInterval(() => loadNotifications({ playSound: true }), 15000);
});
onBeforeUnmount(() => {
  if (notificationTimer) window.clearInterval(notificationTimer);
});
</script>

<template>
  <header class="topbar premium-topbar">
    <div>
      <p class="topbar-eyebrow">{{ title[0] }}</p>
      <h2>{{ title[1] }}</h2>
    </div>

    <div class="topbar-actions">
      <button
        class="notification-button"
        type="button"
        aria-label="Notifications"
        @click="router.push('/notifications')"
      >
        ◔
        <b v-if="unread">{{ unread > 9 ? "9+" : unread }}</b>
      </button>

      <div class="topbar-user">
        <div class="top-avatar">{{ initials }}</div>
        <div>
          <strong>{{ employee?.firstName || "User" }}</strong>
          <span>{{ employee?.role?.name || "Employee" }}</span>
        </div>
      </div>

      <button
        class="topbar-signout"
        type="button"
        @click="logout"
      >
        Sign out
      </button>
    </div>
  </header>
</template>
