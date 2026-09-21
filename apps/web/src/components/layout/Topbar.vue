<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, clearSession, getSavedEmployee } from "../../services/api";

const route = useRoute();
const router = useRouter();
const employee = computed(() => getSavedEmployee());
const unread = ref(0);
const notifications = ref([]);
const showNotifications = ref(false);
let pollTimer = null;
let previousUnread = 0;
let audioContext = null;

const titles = {
  modules: ["Workspace", "Module Hub"], notifications: ["Workspace", "Notifications"], memos: ["Memo Management", "My Memos"],
  "create-memo": ["Memo Management", "Create Memo"], "memo-detail": ["Memo Management", "Memo Details"], approvals: ["Memo Management", "Approvals"],
  completed: ["Memo Management", "Completed"], administration: ["Administration", "Overview"], "workflow-settings": ["Administration", "Workflow Definitions"],
  roles: ["Administration", "Roles & Permissions"], "module-access": ["Administration", "Module Access"], "company-branding": ["Administration", "Company Branding"],
  dashboard: ["Workspace", "Dashboard"], employees: ["Administration", "Employees"], "organization-structure": ["Administration", "Organization Structure"], "audit-log": ["Administration", "Audit Log"],
};
const title = computed(() => titles[route.name] || ["MemoFlo", "Workspace"]);
const initials = computed(() => `${employee.value?.firstName?.[0] || ""}${employee.value?.lastName?.[0] || ""}`.toUpperCase() || "MF");

function playNotificationSound() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // Browser autoplay policies may block sound until the user interacts with the page.
  }
}

async function loadNotifications({ sound = true } = {}) {
  try {
    const result = await api.listNotifications();
    notifications.value = result?.data || [];
    unread.value = result?.unreadCount || 0;
    if (sound && unread.value > previousUnread) playNotificationSound();
    previousUnread = unread.value;
  } catch {
    unread.value = 0;
  }
}

async function openNotification(notification) {
  showNotifications.value = false;
  try { await api.markNotificationRead(notification._id); } catch {}
  notification.readAt ||= new Date().toISOString();
  if (notification.link) {
    await router.push(notification.link);
    return;
  }
  await router.push("/notifications");
}

function logout() { clearSession(); router.replace("/login"); }
function toggleNotifications() {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) loadNotifications({ sound: false });
}
function handleUserGesture() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
  } catch {}
}

onMounted(() => {
  loadNotifications({ sound: false });
  pollTimer = window.setInterval(() => loadNotifications(), 15000);
  window.addEventListener("pointerdown", handleUserGesture, { once: true });
});
onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer);
  window.removeEventListener("pointerdown", handleUserGesture);
});
</script>

<template>
  <header class="topbar premium-topbar">
    <div>
      <p class="topbar-eyebrow">{{ title[0] }}</p>
      <h2>{{ title[1] }}</h2>
    </div>

    <div class="topbar-actions">
      <div class="notification-menu">
        <button class="notification-button" type="button" aria-label="Notifications" @click="toggleNotifications">
          ◔
          <b v-if="unread">{{ unread > 9 ? "9+" : unread }}</b>
        </button>
        <div v-if="showNotifications" class="notification-popover">
          <div class="notification-popover-header">
            <strong>Notifications</strong>
            <button type="button" class="btn btn-ghost btn-small" @click="router.push('/notifications'); showNotifications=false">View all</button>
          </div>
          <button v-for="notification in notifications.slice(0, 6)" :key="notification._id" class="notification-popover-item" :class="{ unread: !notification.readAt }" type="button" @click="openNotification(notification)">
            <span class="notification-popover-dot"></span>
            <span><strong>{{ notification.title }}</strong><small>{{ notification.message }}</small></span>
          </button>
          <div v-if="!notifications.length" class="notification-popover-empty">You're all caught up.</div>
        </div>
      </div>

      <div class="topbar-user">
        <div class="top-avatar">{{ initials }}</div>
        <div><strong>{{ employee?.firstName || "User" }}</strong><span>{{ employee?.role?.name || "Employee" }}</span></div>
      </div>
      <button class="topbar-signout" type="button" @click="logout">Sign out</button>
    </div>
  </header>
</template>
