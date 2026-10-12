<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { api, getSavedEmployee } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const router = useRouter();
const employee = computed(() => getSavedEmployee());
const workspace = ref(null);
const memos = ref([]);
const notifications = ref([]);
const loading = ref(true);
const search = ref("");

const company = computed(() => workspace.value?.company || employee.value?.company || {});
const firstName = computed(() => employee.value?.firstName || "there");
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
});

const openWork = computed(() =>
  memos.value.filter((memo) => ["Pending", "In Review", "Draft"].includes(memo.status)).slice(0, 4)
);
const recent = computed(() => memos.value.slice(0, 5));
const unreadNotifications = computed(() => notifications.value.filter((item) => !item.readAt && !item.read).length);
const filteredRecent = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return recent.value;
  return recent.value.filter((memo) =>
    [memo.title, memo.referenceNo, memo.status, memo.businessService?.name]
      .filter(Boolean).join(" ").toLowerCase().includes(term)
  );
});

async function load() {
  loading.value = true;
  const results = await Promise.allSettled([
    api.getCompanyWorkspace(),
    api.listMemos(),
    api.listNotifications(),
  ]);
  if (results[0].status === "fulfilled") workspace.value = results[0].value?.data || results[0].value;
  if (results[1].status === "fulfilled") memos.value = Array.isArray(results[1].value) ? results[1].value : results[1].value?.memos || results[1].value?.data || [];
  if (results[2].status === "fulfilled") {
    const value = results[2].value;
    notifications.value = Array.isArray(value) ? value : value?.notifications || value?.data || [];
  }
  loading.value = false;
}

function submitSearch() {
  const query = search.value.trim();
  if (query) router.push({ name: "global-search", query: { q: query } });
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
      <div>
        <span class="eyebrow">{{ company?.name || "MEMOFLO" }}</span>
        <h1>{{ greeting }}, {{ firstName }}.</h1>
        <p>One place for the work, requests, people and information that keep your company moving.</p>
      </div>
      <div class="welcome-actions">
        <RouterLink to="/memos/create" class="action-primary"><AppIcon name="plus" />Create a memo</RouterLink>
        <RouterLink to="/services" class="action-secondary"><AppIcon name="grid" />Browse services</RouterLink>
      </div>
    </section>

    <form class="command-strip" @submit.prevent="submitSearch">
      <AppIcon name="search" />
      <input v-model="search" placeholder="Search anything — people, memos, services, inventory…" aria-label="Search anything" />
      <kbd>Enter</kbd>
    </form>

    <section class="experience-grid home-grid">
      <article class="workspace-panel work-panel">
        <div class="panel-heading">
          <div><span class="eyebrow">MY WORK</span><h2>Things that need you</h2></div>
          <RouterLink to="/work" class="panel-link">Open My Work <AppIcon name="arrow-right" /></RouterLink>
        </div>
        <div v-if="loading" class="panel-empty">Loading your workspace…</div>
        <div v-else-if="openWork.length === 0" class="panel-empty">Nothing is waiting for you right now.</div>
        <div v-else class="work-list">
          <RouterLink v-for="memo in openWork" :key="memo._id" :to="`/memos/${memo._id}`" class="work-row">
            <div class="work-icon"><AppIcon :name="memo.status === 'In Review' ? 'clock' : 'arrow-up-right'" /></div>
            <div class="work-copy"><strong>{{ memo.title }}</strong><span>{{ memo.referenceNo || "Memo" }} · {{ memo.businessService?.name || "General request" }}</span></div>
            <small>{{ memo.status || "Open" }}</small>
          </RouterLink>
        </div>
      </article>

      <article class="workspace-panel signal-panel">
        <div class="panel-heading"><div><span class="eyebrow">ATTENTION</span><h2>Stay in the loop</h2></div><span class="signal-count">{{ unreadNotifications }}</span></div>
        <p class="signal-copy">Notifications take you directly to the action that needs attention, instead of making you hunt through the system.</p>
        <RouterLink to="/notifications" class="inline-action">View notifications <AppIcon name="arrow-right" /></RouterLink>
      </article>
    </section>

    <section class="workspace-panel recent-panel">
      <div class="panel-heading"><div><span class="eyebrow">RECENT</span><h2>Recent work</h2></div><RouterLink to="/work" class="panel-link">View all <AppIcon name="arrow-right" /></RouterLink></div>
      <div v-if="loading" class="panel-empty">Loading activity…</div>
      <div v-else-if="filteredRecent.length === 0" class="panel-empty">No matching work found.</div>
      <div v-else class="recent-table">
        <RouterLink v-for="memo in filteredRecent" :key="memo._id" :to="`/memos/${memo._id}`" class="recent-row">
          <div><strong>{{ memo.title }}</strong><span>{{ memo.referenceNo || "No reference" }}</span></div>
          <span>{{ memo.businessService?.name || "General" }}</span><span class="status-text">{{ memo.status || "Draft" }}</span><time>{{ formatDate(memo.createdAt) }}</time>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
