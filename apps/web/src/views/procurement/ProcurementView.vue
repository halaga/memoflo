<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { api, normalizeList } from "../../services/api";

const router = useRouter();
const requests = ref([]);
const loading = ref(true);
const error = ref("");
const mode = ref("mine");
const search = ref("");

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return requests.value;
  return requests.value.filter((item) =>
    `${item.title || ""} ${item.reference || ""} ${item.status || ""}`.toLowerCase().includes(term)
  );
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    requests.value = normalizeList(await api.listProcurementRequests(mode.value), ["requests", "data"]);
  } catch (err) {
    error.value = err.message || "Unable to load business purchase requests.";
  } finally {
    loading.value = false;
  }
}

function openRequest(item) {
  if (item?._id || item?.id) router.push(`/procurement/requests/${item._id || item.id}`);
}

onMounted(load);
</script>

<template>
  <div class="experience-page procurement-workspace">
    <header class="request-header procurement-header">
      <div class="request-header-copy">
        <span class="eyebrow">BUSINESS PURCHASE REQUEST</span>
        <h1>Keep business purchases moving.</h1>
        <p>Request equipment, supplies or other business purchases and follow the approval route without losing the context.</p>
      </div>
      <div class="request-header-actions">
        <RouterLink to="/services" class="btn btn-secondary">← Services</RouterLink>
        <RouterLink to="/procurement" class="btn btn-primary">Start request</RouterLink>
      </div>
    </header>

    <section class="request-layout">
      <div class="request-panel">
        <div class="request-panel-head">
          <div class="card-header">
            <div>
              <h2>Your purchase requests</h2>
              <p>Open a request to see its route, comments, decisions and activity.</p>
            </div>
            <select v-model="mode" class="input" style="width:auto;min-width:120px" @change="load">
              <option value="mine">My requests</option>
              <option value="pending">Needs action</option>
              <option value="all">All I can view</option>
            </select>
          </div>
        </div>
        <div class="request-panel-body">
          <div class="command-strip"><span>⌕</span><input v-model="search" placeholder="Search requests…" /></div>
          <div v-if="error" class="alert alert-error" style="margin-top:14px">{{ error }}</div>
          <div v-if="loading" class="empty-state">Loading requests…</div>
          <div v-else-if="!filtered.length" class="empty-state">
            <strong>No purchase requests here yet.</strong>
            <p class="muted">Start one when the business needs something.</p>
          </div>
          <div v-else class="service-list">
            <button v-for="item in filtered" :key="item._id || item.id" class="service-row" type="button" @click="openRequest(item)">
              <div class="service-icon">R</div>
              <div class="service-copy">
                <span>{{ item.reference || "Business purchase" }}</span>
                <strong>{{ item.title || item.description || "Purchase request" }}</strong>
                <p>{{ item.status || "Pending" }} · Open for details</p>
              </div>
              <span class="service-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <aside class="request-sidebar">
        <div class="request-side-card">
          <h3>How this service works</h3>
          <div class="request-step"><div class="request-step-number">1</div><div><strong>Request</strong><span>Describe what the business needs.</span></div></div>
          <div class="request-step"><div class="request-step-number">2</div><div><strong>Review</strong><span>The configured approval route handles the right people.</span></div></div>
          <div class="request-step"><div class="request-step-number">3</div><div><strong>Complete</strong><span>Track decisions, payment and final activity.</span></div></div>
        </div>
        <div class="request-side-card">
          <h3>Approval route</h3>
          <div class="procurement-route" style="display:block;padding:0;overflow:visible">
            <div class="request-meta-row"><span>1</span><strong>SBU Head</strong></div>
            <div class="request-meta-row"><span>2</span><strong>Administration</strong></div>
            <div class="request-meta-row"><span>3</span><strong>ICC</strong></div>
            <div class="request-meta-row"><span>4</span><strong>SBU Finance</strong></div>
            <div class="request-meta-row"><span>5</span><strong>CEO</strong></div>
            <div class="request-meta-row"><span>6</span><strong>Payment</strong></div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>
