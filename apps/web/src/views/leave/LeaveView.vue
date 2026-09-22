<script setup>
import { computed, onMounted, ref } from "vue";
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

const form = ref({ leaveType: "", startDate: "", endDate: "", reason: "" });

const selectedType = computed(() => types.value.find((type) => String(type._id) === String(form.value.leaveType)));
const availableBalance = computed(() => {
  const item = balances.value.find((balance) => String(balance._id) === String(form.value.leaveType));
  return item?.balance ? Number(item.balance.allocated) - Number(item.balance.used) - Number(item.balance.pending) : 0;
});
const canReview = computed(() => pending.value.length > 0);

function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function statusClass(status) { return `status-${String(status || "").toLowerCase()}`; }

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [typeResult, balanceResult, requestResult, pendingResult] = await Promise.all([
      api.listLeaveTypes(), api.listLeaveBalances(), api.listLeaveRequests("mine"), api.listLeaveRequests("pending"),
    ]);
    types.value = normalizeList(typeResult, ["types"]);
    balances.value = normalizeList(balanceResult, ["balances"]);
    requests.value = normalizeList(requestResult, ["requests"]);
    pending.value = normalizeList(pendingResult, ["requests"]);
    if (!form.value.leaveType && types.value.length) form.value.leaveType = types.value[0]._id;
  } catch (err) { error.value = err.message || "Unable to load leave workspace."; }
  finally { loading.value = false; }
}

async function submit() {
  error.value = ""; success.value = "";
  if (!form.value.leaveType || !form.value.startDate || !form.value.endDate) { error.value = "Select a leave type and both dates."; return; }
  saving.value = true;
  try {
    const result = await api.createLeaveRequest(form.value);
    const created = result?.data?.request || result?.data || result;
    success.value = "Leave request submitted successfully.";
    form.value = { leaveType: types.value[0]?._id || "", startDate: "", endDate: "", reason: "" };
    await load();
    if (created?._id) router.push(`/leave/requests/${created._id}`);
  } catch (err) { error.value = err.message || "Unable to submit leave request."; }
  finally { saving.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="page leave-page">
    <section class="page-header leave-hero">
      <div>
        <span class="page-kicker">PEOPLE OPERATIONS</span>
        <h1>Leave Management</h1>
        <p>Plan time away, track your balance and handle approvals from one workspace.</p>
      </div>
      <div class="hero-person-card">
        <span>EMPLOYEE</span>
        <strong>{{ employee?.firstName }} {{ employee?.lastName }}</strong>
        <small>{{ employee?.employeeNo || "Employee" }}</small>
      </div>
    </section>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="loading" class="card empty-state">Loading leave workspace…</div>

    <template v-else>
      <section class="leave-balance-grid">
        <article v-for="item in balances" :key="item._id" class="card leave-balance-card">
          <div class="leave-balance-top"><span>{{ item.name }}</span><b>{{ item.paid ? "Paid" : "Unpaid" }}</b></div>
          <strong>{{ Math.max(0, Number(item.balance.allocated) - Number(item.balance.used) - Number(item.balance.pending)) }}</strong>
          <small>days available of {{ item.balance.allocated }}</small>
          <div class="leave-balance-meta"><span>Used {{ item.balance.used }}</span><span>Pending {{ item.balance.pending }}</span></div>
        </article>
        <article v-if="!balances.length" class="card empty-state">No leave types have been configured yet.</article>
      </section>

      <div class="leave-layout">
        <section class="card leave-form-card">
          <div class="section-heading compact"><div><span class="page-kicker">REQUEST TIME OFF</span><h2>New leave request</h2></div></div>
          <form class="form-grid" @submit.prevent="submit">
            <label class="field"><span>Leave type</span><select v-model="form.leaveType" required><option value="" disabled>Select type</option><option v-for="type in types" :key="type._id" :value="type._id">{{ type.name }} · {{ type.balance?.allocated ?? type.daysPerYear }} days</option></select></label>
            <div class="leave-available"><span>Available</span><strong>{{ availableBalance }}</strong><small>working days</small></div>
            <label class="field"><span>Start date</span><input v-model="form.startDate" type="date" required /></label>
            <label class="field"><span>End date</span><input v-model="form.endDate" type="date" :min="form.startDate" required /></label>
            <label class="field field-full"><span>Reason</span><textarea v-model="form.reason" rows="4" maxlength="4000" placeholder="Add context for your approver…"></textarea></label>
            <div class="form-actions field-full"><button class="btn btn-primary" :disabled="saving" type="submit">{{ saving ? "Submitting…" : "Submit request" }}</button></div>
          </form>
        </section>

        <section class="card leave-requests-card">
          <div class="section-heading compact"><div><span class="page-kicker">MY REQUESTS</span><h2>Leave history</h2></div><span class="count-chip">{{ requests.length }}</span></div>
          <div v-if="!requests.length" class="empty-state small">No leave requests yet.</div>
          <div v-else class="leave-request-list">
            <button v-for="request in requests" :key="request._id" class="leave-request-row" type="button" @click="router.push(`/leave/requests/${request._id}`)">
              <div><strong>{{ request.leaveType?.name }}</strong><span>{{ formatDate(request.startDate) }} — {{ formatDate(request.endDate) }}</span></div>
              <div class="leave-request-right"><b>{{ request.days }}d</b><span :class="['status-pill', statusClass(request.status)]">{{ request.status }}</span></div>
            </button>
          </div>
        </section>
      </div>

      <section v-if="canReview" class="card leave-approval-card">
        <div class="section-heading compact"><div><span class="page-kicker">ACTION REQUIRED</span><h2>Requests waiting for you</h2></div><span class="count-chip">{{ pending.length }}</span></div>
        <div class="leave-request-list">
          <button v-for="request in pending" :key="request._id" class="leave-request-row" type="button" @click="router.push(`/leave/requests/${request._id}`)">
            <div><strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong><span>{{ request.leaveType?.name }} · {{ request.days }} working days</span></div>
            <span class="status-pill status-pending">Review →</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
