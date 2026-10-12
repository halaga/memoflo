<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const employee = computed(() => getSavedEmployee());
const workspace = ref(null);
const memos = ref([]);
const notifications = ref([]);
const loading = ref(true);
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
});
const company = computed(() => workspace.value?.company || employee.value?.company || {});
const firstName = computed(() => employee.value?.firstName || "there");
const openWork = computed(() => memos.value
  .filter((memo) => ["Pending", "In Review", "Draft"].includes(memo.status))
  .slice(0, 5));
const recent = computed(() => memos.value.slice(0, 5));
const unreadNotifications = computed(() => notifications.value.filter((item) => !item.readAt && !item.read).length);

async function load() {
  loading.value = true;
  const results = await Promise.allSettled([
    api.getCompanyWorkspace(),
    api.listMemos(),
    api.listNotifications(),
  ]);
  if (results[0].status === "fulfilled") {
    workspace.value = results[0].value?.data || results[0].value;
  }
  if (results[1].status === "fulfilled") {
    memos.value = normalizeList(results[1].value, ["memos"])
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
  if (results[2].status === "fulfilled") {
    notifications.value = normalizeList(results[2].value, ["notifications"]);
  }
  loading.value = false;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
}

onMounted(load);
</script>

<template>
  <div class="experience-page home-page">
    <section class="welcome-bar">
      <div class="welcome-copy">
        <span class="eyebrow">{{ company?.name || "MEMOFLO" }}</span>
        <h1>{{ greeting }}, {{ firstName }}.</h1>
        <p>Workflow, simplified. Find people, services, memos, assets and everything your team needs from the search at the top.</p>
      </div>
      <div class="welcome-actions">
        <RouterLink to="/memos/create" class="action-primary">
          <AppIcon name="plus" :size="18" /> Create a memo
        </RouterLink>
        <RouterLink to="/services" class="action-secondary">
          <AppIcon name="grid" :size="18" /> Browse services
        </RouterLink>
      </div>
    </section>

    <section class="home-stat-grid">
      <RouterLink to="/work" class="home-stat-card">
        <span class="home-stat-icon"><AppIcon name="work" :size="21" /></span>
        <span><small>MY WORK</small><strong>{{ openWork.length }}</strong><em>Items needing attention</em></span>
        <AppIcon name="arrow" :size="18" />
      </RouterLink>
      <RouterLink to="/notifications" class="home-stat-card">
        <span class="home-stat-icon"><AppIcon name="bell" :size="21" /></span>
        <span><small>NOTIFICATIONS</small><strong>{{ unreadNotifications }}</strong><em>Unread updates</em></span>
        <AppIcon name="arrow" :size="18" />
      </RouterLink>
      <RouterLink to="/people" class="home-stat-card">
        <span class="home-stat-icon"><AppIcon name="people" :size="21" /></span>
        <span><small>PEOPLE</small><strong>Directory</strong><em>Find colleagues and roles</em></span>
        <AppIcon name="arrow" :size="18" />
      </RouterLink>
      <RouterLink to="/services" class="home-stat-card">
        <span class="home-stat-icon"><AppIcon name="services" :size="21" /></span>
        <span><small>SERVICES</small><strong>Explore</strong><em>Start a business request</em></span>
        <AppIcon name="arrow" :size="18" />
      </RouterLink>
    </section>

    <section class="experience-grid home-grid">
      <article class="workspace-panel work-panel">
        <div class="panel-heading">
          <div><span class="eyebrow">MY WORK</span><h2>Things that need you</h2></div>
          <RouterLink to="/work" class="panel-link">Open My Work <AppIcon name="arrow" :size="15" /></RouterLink>
        </div>
        <div v-if="loading" class="panel-empty">Loading your workspace…</div>
        <div v-else-if="!openWork.length" class="panel-empty">Nothing is waiting for you right now.</div>
        <div v-else class="work-list">
          <RouterLink v-for="memo in openWork" :key="memo._id" :to="`/memos/${memo._id}`" class="work-row">
            <span class="work-icon"><AppIcon :name="memo.status === 'In Review' ? 'clock' : 'memo'" :size="19" /></span>
            <span class="work-copy"><strong>{{ memo.title }}</strong><small>{{ memo.referenceNo || "Memo" }} · {{ memo.businessService?.name || "General request" }}</small></span>
            <span class="queue-status attention">{{ memo.status || "Open" }}</span>
            <AppIcon name="chevron" :size="18" />
          </RouterLink>
        </div>
      </article>

      <article class="workspace-panel signal-panel">
        <div class="panel-heading">
          <div><span class="eyebrow">ATTENTION</span><h2>Stay in the loop</h2></div>
          <span class="signal-count">{{ unreadNotifications }}</span>
        </div>
        <p class="signal-copy">Updates and reminders stay together, with links to the related request whenever an action is needed.</p>
        <RouterLink to="/notifications" class="inline-action">View notifications <AppIcon name="arrow" :size="16" /></RouterLink>
      </article>
    </section>

    <section class="workspace-panel recent-panel">
      <div class="panel-heading">
        <div><span class="eyebrow">RECENT ACTIVITY</span><h2>Recent memos</h2></div>
        <RouterLink to="/work" class="panel-link">View all <AppIcon name="arrow" :size="15" /></RouterLink>
      </div>
      <div v-if="loading" class="panel-empty">Loading activity…</div>
      <div v-else-if="!recent.length" class="panel-empty">No recent memos yet.</div>
      <div v-else class="recent-table">
        <RouterLink v-for="memo in recent" :key="memo._id" :to="`/memos/${memo._id}`" class="recent-row">
          <span class="recent-title"><strong>{{ memo.title }}</strong><small>{{ memo.referenceNo || "No reference" }}</small></span>
          <span>{{ memo.businessService?.name || "General" }}</span>
          <span class="status-text">{{ memo.status || "Draft" }}</span>
          <time>{{ formatDate(memo.createdAt) }}</time>
          <AppIcon name="chevron" :size="18" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>
