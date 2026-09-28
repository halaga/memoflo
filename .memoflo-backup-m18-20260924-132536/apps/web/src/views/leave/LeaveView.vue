<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../../services/api";

const router = useRouter();
const employee = computed(() => getSavedEmployee());
const types = ref([]);
const balances = ref([]);
const requests = ref([]);
const pending = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const activeTab = ref("overview");

const form = ref({ leaveType: "", startDate: "", endDate: "", reason: "" });

const selectedType = computed(() => types.value.find((type) => String(type._id) === String(form.value.leaveType)));
const selectedBalance = computed(() => balances.value.find((item) => String(item._id) === String(form.value.leaveType)));
const availableBalance = computed(() => {
  const balance = selectedBalance.value?.balance;
  return balance ? Math.max(0, Number(balance.allocated) - Number(balance.used) - Number(balance.pending)) : 0;
});
const totalPending = computed(() => pending.value.length);
const approvedCount = computed(() => requests.value.filter((request) => request.status === "Approved").length);
const pendingCount = computed(() => requests.value.filter((request) => request.status === "Pending").length);

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function statusClass(status) {
  return `status-${String(status || "").toLowerCase().replaceAll(" ", "-")}`;
}

function stageLabel(request) {
  if (request.status === "Approved") return "Approved · HR filing";
  if (request.status === "Rejected") return "Rejected";
  if (request.status === "Cancelled") return "Cancelled";
  if (request.approvalStage === "SBU_HEAD") return "Waiting for SBU Head";
  return "Waiting for line manager";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [typeResult, balanceResult, requestResult, pendingResult] = await Promise.all([
      api.listLeaveTypes(),
      api.listLeaveBalances(),
      api.listLeaveRequests("mine"),
      api.listLeaveRequests("pending"),
    ]);

    types.value = normalizeList(typeResult, ["types"]);
    balances.value = normalizeList(balanceResult, ["balances"]);
    requests.value = normalizeList(requestResult, ["requests"]);
    pending.value = normalizeList(pendingResult, ["requests"]);

    if (!form.value.leaveType && types.value.length) {
      form.value.leaveType = types.value[0]._id;
    }
  } catch (err) {
    error.value = err.message || "Unable to load the leave workspace.";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  error.value = "";
  success.value = "";

  if (!form.value.leaveType || !form.value.startDate || !form.value.endDate) {
    error.value = "Select a leave type and both dates.";
    return;
  }

  if (form.value.endDate < form.value.startDate) {
    error.value = "End date cannot be before start date.";
    return;
  }

  saving.value = true;
  try {
    const result = await api.createLeaveRequest(form.value);
    const created = result?.data?.request || result?.data || result;
    success.value = "Leave request submitted. Your line manager has been notified.";
    form.value = { leaveType: types.value[0]?._id || "", startDate: "", endDate: "", reason: "" };
    await load();
    if (created?._id) router.push(`/leave/requests/${created._id}`);
  } catch (err) {
    error.value = err.message || "Unable to submit leave request.";
  } finally {
    saving.value = false;
  }
}

watch(() => router.currentRoute.value.query.tab, (tab) => {
  if (["overview", "request", "approvals"].includes(tab)) activeTab.value = tab;
}, { immediate: true });

onMounted(load);
</script>

<template>
  <div class="page leave-page">
    <section class="leave-hero card">
      <div class="leave-hero-copy">
        <span class="page-kicker">PEOPLE OPERATIONS · TIME OFF</span>
        <h1>Leave Management</h1>
        <p>Request time away, follow every approval and know exactly when HR can file the approved request.</p>
      </div>
      <div class="leave-employee-card">
        <div class="leave-avatar">{{ employee?.firstName?.[0] }}{{ employee?.lastName?.[0] }}</div>
        <div>
          <span>Signed in as</span>
          <strong>{{ employee?.firstName }} {{ employee?.lastName }}</strong>
          <small>{{ employee?.employeeNo || "Employee" }}</small>
        </div>
      </div>
    </section>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="loading" class="card empty-state">Loading your leave workspace…</div>

    <template v-else>
      <section class="leave-stat-grid">
        <article class="card leave-stat-card">
          <span>Pending approvals</span>
          <strong>{{ totalPending }}</strong>
          <small>Requests waiting for your action</small>
        </article>
        <article class="card leave-stat-card">
          <span>My pending requests</span>
          <strong>{{ pendingCount }}</strong>
          <small>Still moving through approval</small>
        </article>
        <article class="card leave-stat-card">
          <span>Approved requests</span>
          <strong>{{ approvedCount }}</strong>
          <small>Approved and ready for HR filing</small>
        </article>
        <article class="card leave-stat-card accent-stat">
          <span>{{ selectedType?.name || "Selected leave" }} available</span>
          <strong>{{ availableBalance }}</strong>
          <small>Working days remaining</small>
        </article>
      </section>

      <div class="leave-tabs" role="tablist">
        <button :class="{ active: activeTab === 'overview' }" type="button" @click="activeTab = 'overview'">Overview</button>
        <button :class="{ active: activeTab === 'request' }" type="button" @click="activeTab = 'request'">Request leave</button>
        <button :class="{ active: activeTab === 'approvals' }" type="button" @click="activeTab = 'approvals'">
          Approvals <b v-if="totalPending">{{ totalPending }}</b>
        </button>
      </div>

      <section v-if="activeTab === 'overview'" class="leave-overview-grid">
        <article class="card leave-panel">
          <div class="section-heading compact">
            <div><span class="page-kicker">YOUR ENTITLEMENT</span><h2>Leave balances</h2></div>
          </div>
          <div class="leave-balance-list">
            <div v-for="item in balances" :key="item._id" class="leave-balance-item">
              <div class="leave-balance-icon">{{ item.name?.[0] || "L" }}</div>
              <div class="leave-balance-main">
                <strong>{{ item.name }}</strong>
                <span>{{ item.paid ? "Paid leave" : "Unpaid leave" }}</span>
                <div class="leave-progress"><i :style="{ width: `${Math.min(100, ((Number(item.balance?.used || 0) + Number(item.balance?.pending || 0)) / Math.max(1, Number(item.balance?.allocated || 1))) * 100)}%` }"></i></div>
              </div>
              <div class="leave-balance-number"><strong>{{ Math.max(0, Number(item.balance?.allocated || 0) - Number(item.balance?.used || 0) - Number(item.balance?.pending || 0)) }}</strong><span>available</span></div>
            </div>
            <div v-if="!balances.length" class="empty-state small">No leave types have been configured.</div>
          </div>
        </article>

        <article class="card leave-panel">
          <div class="section-heading compact">
            <div><span class="page-kicker">APPROVAL ROUTE</span><h2>How your request moves</h2></div>
          </div>
          <div class="approval-route">
            <div class="approval-step"><span>01</span><div><strong>Line manager</strong><small>Checks your request and consents.</small></div></div>
            <div class="approval-connector"></div>
            <div class="approval-step"><span>02</span><div><strong>SBU Head</strong><small>Provides the final business approval.</small></div></div>
            <div class="approval-connector"></div>
            <div class="approval-step"><span>03</span><div><strong>HR filing</strong><small>Approved request is ready for your paper form / HR process.</small></div></div>
          </div>
        </article>

        <article class="card leave-panel leave-history-panel">
          <div class="section-heading compact">
            <div><span class="page-kicker">RECENT REQUESTS</span><h2>My leave history</h2></div>
            <button class="btn btn-secondary btn-sm" type="button" @click="activeTab = 'request'">New request</button>
          </div>
          <div v-if="!requests.length" class="empty-state small">You have not submitted a leave request yet.</div>
          <div v-else class="leave-table-wrap">
            <table class="leave-table">
              <thead><tr><th>Leave</th><th>Period</th><th>Days</th><th>Stage</th></tr></thead>
              <tbody>
                <tr v-for="request in requests.slice(0, 8)" :key="request._id" @click="router.push(`/leave/requests/${request._id}`)">
                  <td><strong>{{ request.leaveType?.name }}</strong><small>{{ request.reason || "No reason" }}</small></td>
                  <td>{{ formatDate(request.startDate) }} — {{ formatDate(request.endDate) }}</td>
                  <td>{{ request.days }}</td>
                  <td><span :class="['status-pill', statusClass(request.status)]">{{ stageLabel(request) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section v-if="activeTab === 'request'" class="leave-request-layout">
        <article class="card leave-panel leave-form-card">
          <div class="section-heading compact">
            <div><span class="page-kicker">REQUEST TIME OFF</span><h2>New leave request</h2><p>Submit once. MemoFlo routes it to your line manager, then your SBU Head.</p></div>
          </div>
          <form class="leave-form" @submit.prevent="submit">
            <label class="field"><span>Leave type</span><select v-model="form.leaveType" required><option value="" disabled>Select leave type</option><option v-for="type in types" :key="type._id" :value="type._id">{{ type.name }} · {{ type.daysPerYear }} days</option></select></label>
            <div class="leave-inline-balance"><span>Available balance</span><strong>{{ availableBalance }} days</strong></div>
            <div class="leave-date-grid">
              <label class="field"><span>Start date</span><input v-model="form.startDate" type="date" required /></label>
              <label class="field"><span>End date</span><input v-model="form.endDate" type="date" :min="form.startDate" required /></label>
            </div>
            <label class="field"><span>Reason / handover note</span><textarea v-model="form.reason" rows="6" maxlength="4000" placeholder="Tell your line manager what they need to know…"></textarea></label>
            <div class="leave-submit-summary">
              <div><span>Approval route</span><strong>Line manager → SBU Head → HR</strong></div>
              <div><span>Selected</span><strong>{{ selectedType?.name || "—" }}</strong></div>
            </div>
            <div class="form-actions"><button class="btn btn-primary btn-lg" :disabled="saving" type="submit">{{ saving ? "Submitting…" : "Submit leave request" }}</button></div>
          </form>
        </article>

        <aside class="leave-side-stack">
          <article class="card leave-panel">
            <span class="page-kicker">BEFORE YOU SUBMIT</span>
            <h2>Approval checklist</h2>
            <ul class="leave-checklist"><li>Make sure your Reports To / line manager is correct.</li><li>Your SBU must have a configured SBU Head.</li><li>Your balance must cover the working days requested.</li><li>After SBU Head approval, the request is ready for HR filing.</li></ul>
          </article>
          <article class="leave-help-card"><span>Need a change?</span><strong>Ask your administrator to update your position, Reports To or SBU Head.</strong></article>
        </aside>
      </section>

      <section v-if="activeTab === 'approvals'" class="card leave-panel">
        <div class="section-heading compact"><div><span class="page-kicker">ACTION REQUIRED</span><h2>Requests waiting for you</h2><p>Only requests where you are the current approver appear here.</p></div><span class="count-chip">{{ pending.length }}</span></div>
        <div v-if="!pending.length" class="empty-state">No leave approvals are waiting for you.</div>
        <div v-else class="approval-queue">
          <button v-for="request in pending" :key="request._id" class="approval-queue-row" type="button" @click="router.push(`/leave/requests/${request._id}`)">
            <div class="approval-avatar">{{ request.employee?.firstName?.[0] }}{{ request.employee?.lastName?.[0] }}</div>
            <div class="approval-main"><strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong><span>{{ request.leaveType?.name }} · {{ request.days }} working days · {{ formatDate(request.startDate) }} — {{ formatDate(request.endDate) }}</span></div>
            <span class="status-pill status-pending">{{ request.approvalStage === 'SBU_HEAD' ? 'SBU Head review' : 'Manager review' }} →</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
