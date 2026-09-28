<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../../services/api";

const route = useRoute();
const router = useRouter();
const employee = computed(() => getSavedEmployee());
const request = ref(null);
const activity = ref([]);
const loading = ref(true);
const error = ref("");
const actionError = ref("");
const busy = ref(false);
const activeSection = ref("summary");

const action = ref({ comment: "", vendor: "", quotedAmount: "", quoteReference: "", recommendation: "", amountApproved: "", amount: "", reference: "", note: "", reason: "" });

const stages = [
  ["PENDING_SBU_HEAD", "SBU Head", "Minute"],
  ["PENDING_ADMIN", "Administration", "Dispatch"],
  ["PENDING_ICC", "ICC", "Evaluate"],
  ["PENDING_SBU_FINANCE", "SBU Finance", "Approve"],
  ["PENDING_CEO", "CEO", "Approve"],
  ["PENDING_PAYMENT", "SBU Finance", "Payment"],
  ["COMPLETED", "Completed", "Done"],
];

const stageIndex = computed(() => stages.findIndex(([key]) => key === request.value?.stage));
const currentHandlerIsMe = computed(() => String(request.value?.currentHandler?._id || request.value?.currentHandler || "") === String(employee.value?._id || employee.value?.id || ""));
const isRejected = computed(() => request.value?.stage === "REJECTED");

function money(value, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
}

function dateTime(value) {
  return value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.getProcurementRequest(route.params.id);
    request.value = result?.data || result;
    const logs = await api.listAuditLogs({ resourceType: "procurement", resourceId: route.params.id, limit: 100 });
    activity.value = normalizeList(logs?.data || logs, ["items", "data"]);
  } catch (requestError) {
    error.value = requestError.message || "Unable to load procurement request.";
  } finally {
    loading.value = false;
  }
}

function goSection(id) {
  activeSection.value = id;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetAction() {
  action.value = { comment: "", vendor: "", quotedAmount: "", quoteReference: "", recommendation: "", amountApproved: "", amount: "", reference: "", note: "", reason: "" };
}

async function perform(actionName) {
  busy.value = true;
  actionError.value = "";
  try {
    await api.actProcurementRequest(route.params.id, { action: actionName, ...action.value });
    resetAction();
    await load();
    goSection("activity");
  } catch (requestError) {
    actionError.value = requestError.message || "Unable to complete this action.";
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page procurement-detail-page">
    <div v-if="loading" class="procurement-empty">Loading procurement request…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else>
      <header class="procurement-detail-hero">
        <div class="detail-back-row"><button class="text-button" type="button" @click="router.push('/procurement')">← Procurement</button><button class="text-button" type="button" @click="router.push('/modules')">Module Hub</button></div>
        <div class="detail-title-row">
          <div><div class="page-kicker">{{ request.requestNo }}</div><h1>{{ request.title }}</h1><p>{{ request.requestingSbu?.name }} · {{ request.requestingDepartment?.name }} · {{ request.requester?.firstName }} {{ request.requester?.lastName }}</p></div>
          <span class="status-pill large" :class="request.status?.toLowerCase()">{{ request.status }}</span>
        </div>
      </header>

      <nav class="procurement-section-nav">
        <button :class="{ active: activeSection === 'summary' }" @click="goSection('summary')">Summary</button>
        <button :class="{ active: activeSection === 'route' }" @click="goSection('route')">Approval route</button>
        <button :class="{ active: activeSection === 'action' }" @click="goSection('action')">Action</button>
        <button :class="{ active: activeSection === 'activity' }" @click="goSection('activity')">Activity</button>
      </nav>

      <section id="summary" class="procurement-detail-grid">
        <article class="procurement-card wide">
          <div class="card-title"><div><div class="page-kicker">REQUEST</div><h2>Requirement</h2></div><span class="priority-badge">{{ request.urgency }}</span></div>
          <p class="detail-description">{{ request.description || "No description supplied." }}</p>
          <div class="detail-meta-grid">
            <div><span>Category</span><strong>{{ request.category }}</strong></div>
            <div><span>Needed by</span><strong>{{ request.neededBy ? new Date(request.neededBy).toLocaleDateString('en-NG') : 'Not specified' }}</strong></div>
            <div><span>Estimated value</span><strong>{{ money(request.estimatedAmount, request.currency) }}</strong></div>
            <div><span>Current stage</span><strong>{{ stages[stageIndex]?.[1] || request.stage }}</strong></div>
          </div>
        </article>

        <article class="procurement-card">
          <div class="card-title"><div><div class="page-kicker">ITEMS</div><h2>Requested</h2></div></div>
          <div class="detail-items"><div v-for="item in request.items" :key="item._id" class="detail-item"><div><strong>{{ item.description }}</strong><span>{{ item.quantity }} {{ item.unit }}</span></div><strong>{{ money(item.estimatedTotal, request.currency) }}</strong></div></div>
        </article>

        <article class="procurement-card">
          <div class="card-title"><div><div class="page-kicker">OUTCOME</div><h2>Financial trail</h2></div></div>
          <div class="financial-trail">
            <div><span>ICC quote</span><strong>{{ request.iccEvaluation?.quotedAmount ? money(request.iccEvaluation.quotedAmount, request.currency) : '—' }}</strong></div>
            <div><span>Finance approval</span><strong>{{ request.financeApproval?.amountApproved ? money(request.financeApproval.amountApproved, request.currency) : '—' }}</strong></div>
            <div><span>Payment</span><strong>{{ request.payment?.amount ? money(request.payment.amount, request.currency) : '—' }}</strong></div>
          </div>
        </article>
      </section>

      <section id="route" class="procurement-card procurement-route-card">
        <div class="card-title"><div><div class="page-kicker">WORKFLOW</div><h2>Approval route</h2><p>Every request gets its own handler chain from the employee's organisation data.</p></div></div>
        <div class="approval-route">
          <div v-for="(stage, index) in stages" :key="stage[0]" class="route-step" :class="{ done: index < stageIndex || request.stage === 'COMPLETED', current: index === stageIndex, rejected: isRejected }">
            <div class="route-dot">{{ index + 1 }}</div><div><strong>{{ stage[1] }}</strong><span>{{ stage[2] }}</span></div>
          </div>
        </div>
        <div class="participant-grid">
          <div><span>SBU Head</span><strong>{{ request.participants?.requestingSbuHead?.employee?.firstName }} {{ request.participants?.requestingSbuHead?.employee?.lastName }}</strong></div>
          <div><span>Administration</span><strong>{{ request.participants?.adminDispatcher?.employee?.firstName }} {{ request.participants?.adminDispatcher?.employee?.lastName }}</strong></div>
          <div><span>ICC</span><strong>{{ request.participants?.iccEvaluator?.employee?.firstName }} {{ request.participants?.iccEvaluator?.employee?.lastName }}</strong></div>
          <div><span>SBU Finance</span><strong>{{ request.participants?.sbuFinanceApprover?.employee?.firstName }} {{ request.participants?.sbuFinanceApprover?.employee?.lastName }}</strong></div>
          <div><span>CEO</span><strong>{{ request.participants?.ceoApprover?.employee?.firstName }} {{ request.participants?.ceoApprover?.employee?.lastName }}</strong></div>
        </div>
      </section>

      <section id="action" class="procurement-card action-centre">
        <div class="card-title"><div><div class="page-kicker">ACTION CENTRE</div><h2>{{ currentHandlerIsMe ? 'Your action is required' : 'Workflow action' }}</h2><p v-if="request.currentHandler">Currently assigned to {{ request.currentHandler.firstName }} {{ request.currentHandler.lastName }}.</p><p v-else>This request has no pending handler.</p></div></div>
        <div v-if="actionError" class="alert alert-error">{{ actionError }}</div>
        <div v-if="currentHandlerIsMe && request.stage === 'PENDING_SBU_HEAD'" class="action-form"><label>Minute / consent comment<textarea v-model="action.comment" rows="4" placeholder="Record the SBU Head minute before forwarding to Administration."></textarea></label><button class="button button-primary" :disabled="busy" @click="perform('minute')">{{ busy ? 'Saving…' : 'Minute & forward' }}</button></div>
        <div v-else-if="currentHandlerIsMe && request.stage === 'PENDING_ADMIN'" class="action-form"><p>Confirm that Administration has reviewed the request and is dispatching it to ICC.</p><button class="button button-primary" :disabled="busy" @click="perform('dispatch')">Dispatch to ICC</button></div>
        <div v-else-if="currentHandlerIsMe && request.stage === 'PENDING_ICC'" class="action-form action-grid"><label>Vendor<input v-model="action.vendor" /></label><label>Quoted amount<input v-model="action.quotedAmount" type="number" min="0" step="0.01" /></label><label>Quote reference<input v-model="action.quoteReference" /></label><label class="full">Recommendation<textarea v-model="action.recommendation" rows="4"></textarea></label><button class="button button-primary full" :disabled="busy" @click="perform('evaluate')">Complete ICC evaluation</button></div>
        <div v-else-if="currentHandlerIsMe && request.stage === 'PENDING_SBU_FINANCE'" class="action-form action-grid"><label>Approved amount<input v-model="action.amountApproved" type="number" min="0" step="0.01" /></label><label>Comment<input v-model="action.comment" /></label><button class="button button-primary full" :disabled="busy" @click="perform('finance_approve')">Approve & send to CEO</button></div>
        <div v-else-if="currentHandlerIsMe && request.stage === 'PENDING_CEO'" class="action-form"><label>CEO comment<textarea v-model="action.comment" rows="4"></textarea></label><button class="button button-primary" :disabled="busy" @click="perform('ceo_approve')">Approve & return to Finance</button></div>
        <div v-else-if="currentHandlerIsMe && request.stage === 'PENDING_PAYMENT'" class="action-form action-grid"><label>Paid amount<input v-model="action.amount" type="number" min="0" step="0.01" /></label><label>Payment reference<input v-model="action.reference" required /></label><label class="full">Payment note<textarea v-model="action.note" rows="3"></textarea></label><button class="button button-primary full" :disabled="busy" @click="perform('mark_paid')">Record payment & complete</button></div>
        <div v-else class="not-your-turn"><strong>No action required from you right now.</strong><span>The request remains visible for reference while its assigned handler works on the next stage.</span></div>

        <div v-if="currentHandlerIsMe && !['COMPLETED','REJECTED','CANCELLED'].includes(request.stage)" class="reject-area"><label>Reject with reason<textarea v-model="action.reason" rows="2" placeholder="Explain why this request cannot proceed."></textarea></label><button class="button button-danger" :disabled="busy" @click="perform('reject')">Reject request</button></div>
      </section>

      <section id="activity" class="procurement-card">
        <div class="card-title"><div><div class="page-kicker">PERMANENT HISTORY</div><h2>Activity</h2><p>A company reference trail for this procurement request.</p></div></div>
        <div v-if="!activity.length" class="procurement-empty small">No activity recorded yet.</div>
        <div v-else class="activity-list">
          <div v-for="item in activity" :key="item._id" class="activity-row"><div class="activity-dot"></div><div><strong>{{ item.action }}</strong><p>{{ item.metadata?.description || item.path || 'Procurement activity recorded.' }}</p><small>{{ dateTime(item.occurredAt) }} · {{ item.actor?.firstName || 'System' }} {{ item.actor?.lastName || '' }}</small></div></div>
        </div>
      </section>
    </template>
  </div>
</template>
