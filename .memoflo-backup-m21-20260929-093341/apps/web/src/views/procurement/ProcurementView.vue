<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../../services/api";

const router = useRouter();
const route = useRoute();
const employee = computed(() => getSavedEmployee());
const activeTab = ref(route.query.mode === "approvals" ? "approvals" : "mine");
const requests = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

const form = ref({
  title: "",
  description: "",
  category: "General",
  urgency: "Normal",
  neededBy: "",
  currency: "NGN",
  items: [{ description: "", quantity: 1, unit: "item", estimatedUnitCost: 0 }],
});

const canCreate = computed(() => {
  const permissions = employee.value?.role?.permissions || [];
  return permissions.includes("*") || permissions.includes("procurement.create");
});

const totalEstimate = computed(() =>
  form.value.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.estimatedUnitCost || 0),
    0
  )
);

const stageLabel = {
  PENDING_SBU_HEAD: "SBU Head review",
  PENDING_ADMIN: "Administration dispatch",
  PENDING_ICC: "ICC evaluation",
  PENDING_SBU_FINANCE: "SBU Finance approval",
  PENDING_CEO: "CEO approval",
  PENDING_PAYMENT: "Payment",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

function addItem() {
  form.value.items.push({ description: "", quantity: 1, unit: "item", estimatedUnitCost: 0 });
}

function removeItem(index) {
  if (form.value.items.length === 1) return;
  form.value.items.splice(index, 1);
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    requests.value = normalizeList(await api.listProcurementRequests(activeTab.value), ["data"]);
  } catch (requestError) {
    error.value = requestError.message || "Unable to load procurement requests.";
  } finally {
    loading.value = false;
  }
}

function switchTab(tab) {
  activeTab.value = tab;
  router.replace({ query: tab === "approvals" ? { mode: "approvals" } : {} });
  load();
}

watch(() => route.query.mode, (mode) => {
  const next = mode === "approvals" ? "approvals" : "mine";
  if (next !== activeTab.value) {
    activeTab.value = next;
    load();
  }
});

async function createRequest() {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const result = await api.createProcurementRequest({
      ...form.value,
      items: form.value.items.map((item) => ({ ...item, quantity: Number(item.quantity), estimatedUnitCost: Number(item.estimatedUnitCost) })),
    });
    const request = result?.data || result;
    success.value = "Procurement request created and routed to the requesting SBU Head.";
    form.value = {
      title: "",
      description: "",
      category: "General",
      urgency: "Normal",
      neededBy: "",
      currency: "NGN",
      items: [{ description: "", quantity: 1, unit: "item", estimatedUnitCost: 0 }],
    };
    await load();
    if (request?._id) router.push(`/procurement/requests/${request._id}`);
  } catch (requestError) {
    error.value = requestError.message || "Unable to create procurement request.";
  } finally {
    saving.value = false;
  }
}

function money(value, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
}

function date(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

onMounted(load);
</script>

<template>
  <div class="experience-page procurement-page">
    <header class="procurement-hero">
      <div>
        <div class="page-kicker">SERVICES · BUSINESS PURCHASE</div>
        <h1>Request something the business needs.</h1>
        <p>Describe the requirement once. MemoFlo routes it through the right people and keeps the full approval and payment trail.</p>
      </div>
      <div class="procurement-hero-actions">
        <button class="button button-secondary" type="button" @click="router.push('/services')">Services</button>
        <button v-if="canCreate" class="button button-primary" type="button" @click="document.getElementById('new-procurement')?.scrollIntoView({ behavior: 'smooth', block: 'start' })">New request</button>
      </div>
    </header>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="procurement-context-line"><span>Business purchase service</span><strong>7-stage approval route</strong><span>Request → SBU Head → Administration → ICC → Finance → CEO → Payment</span></div>

    <section class="procurement-panel">
      <div class="procurement-tabs">
        <button :class="{ active: activeTab === 'mine' }" type="button" @click="switchTab('mine')">My requests</button>
        <button :class="{ active: activeTab === 'approvals' }" type="button" @click="switchTab('approvals')">My approvals</button>
      </div>

      <div v-if="loading" class="procurement-empty">Loading requests…</div>
      <div v-else-if="!requests.length" class="procurement-empty">
        <div class="empty-icon">P</div>
        <h3>{{ activeTab === 'mine' ? 'No procurement requests yet' : 'Nothing is waiting for you' }}</h3>
        <p>{{ activeTab === 'mine' ? 'Start a request and MemoFlo will build the approval route from your organisation structure.' : 'Assigned procurement actions will appear here.' }}</p>
        <button v-if="activeTab === 'mine' && canCreate" class="button button-primary" type="button" @click="document.getElementById('new-procurement')?.scrollIntoView({ behavior: 'smooth', block: 'start' })">Create first request</button>
      </div>
      <div v-else class="procurement-list">
        <button v-for="item in requests" :key="item._id" class="procurement-row" type="button" @click="router.push(`/procurement/requests/${item._id}`)">
          <div class="procurement-row-code">{{ item.requestNo }}</div>
          <div class="procurement-row-main"><strong>{{ item.title }}</strong><span>{{ item.requestingSbu?.name }} · {{ item.requestingDepartment?.name }}</span></div>
          <div class="procurement-row-amount">{{ money(item.estimatedAmount, item.currency) }}</div>
          <div><span class="status-pill" :class="item.status?.toLowerCase()">{{ stageLabel[item.stage] || item.status }}</span><small>{{ date(item.createdAt) }}</small></div>
          <span class="procurement-row-arrow">→</span>
        </button>
      </div>
    </section>

    <section v-if="canCreate" id="new-procurement" class="procurement-panel procurement-form-panel">
      <div class="section-heading compact">
        <div><div class="page-kicker">NEW REQUEST</div><h2>Business requirement</h2><p>Capture the requirement clearly so each approval stage has the information it needs.</p></div>
        <div class="form-total"><span>Estimated total</span><strong>{{ money(totalEstimate, form.currency) }}</strong></div>
      </div>

      <form class="procurement-form" @submit.prevent="createRequest">
        <div class="form-field full"><label>Request title</label><input v-model="form.title" required placeholder="e.g. 5 laptops for new staff" /></div>
        <div class="form-field"><label>Category</label><select v-model="form.category"><option>IT Equipment</option><option>Office Supplies</option><option>Services</option><option>Facilities</option><option>Travel</option><option>General</option></select></div>
        <div class="form-field"><label>Urgency</label><select v-model="form.urgency"><option>Normal</option><option>Urgent</option><option>Critical</option></select></div>
        <div class="form-field"><label>Needed by</label><input v-model="form.neededBy" type="date" /></div>
        <div class="form-field"><label>Currency</label><select v-model="form.currency"><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></div>
        <div class="form-field full"><label>Business reason / description</label><textarea v-model="form.description" rows="4" required placeholder="Explain what is needed, why it is needed and any useful context."></textarea></div>

        <div class="procurement-items full">
          <div class="items-header"><div><h3>Requested items</h3><p>Quantities and estimates are used to calculate the request value.</p></div><button class="button button-secondary small" type="button" @click="addItem">+ Add item</button></div>
          <div v-for="(item, index) in form.items" :key="index" class="procurement-item-editor">
            <input v-model="item.description" placeholder="Item / service description" required />
            <input v-model="item.quantity" type="number" min="0.01" step="0.01" placeholder="Qty" required />
            <input v-model="item.unit" placeholder="Unit" />
            <input v-model="item.estimatedUnitCost" type="number" min="0" step="0.01" placeholder="Estimated unit cost" required />
            <strong>{{ money(Number(item.quantity || 0) * Number(item.estimatedUnitCost || 0), form.currency) }}</strong>
            <button class="icon-button danger" type="button" :disabled="form.items.length === 1" @click="removeItem(index)" title="Remove item">×</button>
          </div>
        </div>

        <div class="form-actions full"><button class="button button-primary" :disabled="saving" type="submit">{{ saving ? 'Submitting…' : 'Submit request' }}</button></div>
      </form>
    </section>
  </div>
</template>
