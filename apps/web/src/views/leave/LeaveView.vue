<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../../services/api";

const route = useRoute();
const router = useRouter();
const employee = computed(() => getSavedEmployee());
const types = ref([]);
const balances = ref([]);
const requests = ref([]);
const approvals = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

const tab = computed(() => {
  const value = route.query.tab;
  return ["overview", "request", "approvals"].includes(value) ? value : "overview";
});

const form = ref({
  leaveType: "",
  startDate: "",
  endDate: "",
  durationMode: "dates",
  customDays: "",
  reason: "",
});

const selectedType = computed(() => types.value.find((item) => String(item._id) === String(form.value.leaveType)));
const selectedBalance = computed(() => balances.value.find((item) => String(item._id) === String(form.value.leaveType)));
const availableBalance = computed(() => {
  const balance = selectedBalance.value?.balance;
  return Math.max(0, Number(balance?.allocated || 0) - Number(balance?.used || 0) - Number(balance?.pending || 0));
});
const pendingMine = computed(() => requests.value.filter((item) => item.status === "Pending").length);
const approvedMine = computed(() => requests.value.filter((item) => ["Approved", "HR Filed"].includes(item.status)).length);

function initials() {
  return `${employee.value?.firstName?.[0] || ""}${employee.value?.lastName?.[0] || ""}`.toUpperCase() || "MF";
}

function go(nextTab) {
  router.push({ path: "/leave", query: nextTab === "overview" ? {} : { tab: nextTab } });
}

function openRequest(id) {
  router.push(`/leave/requests/${id}`);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function statusLabel(item) {
  if (item.status === "HR Filed") return "Filed by HR";
  if (item.status === "Approved" && item.approvalStage === "HR") return "Approved · HR";
  if (item.approvalStage === "SBU_HEAD") return "SBU Head approval";
  if (item.approvalStage === "SUPERVISOR") return "Line manager approval";
  return item.status;
}

function statusClass(status) {
  return String(status || "").toLowerCase().replaceAll(" ", "-");
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [typeResult, balanceResult, requestResult, approvalResult] = await Promise.all([
      api.listLeaveTypes(),
      api.listLeaveBalances(),
      api.listLeaveRequests("mine"),
      api.listLeaveRequests("pending"),
    ]);
    types.value = normalizeList(typeResult);
    balances.value = normalizeList(balanceResult);
    requests.value = normalizeList(requestResult, ["requests"]);
    approvals.value = normalizeList(approvalResult, ["requests"]);
    if (!form.value.leaveType && types.value.length) form.value.leaveType = types.value[0]._id;
  } catch (err) {
    error.value = err.message || "Unable to load Leave Management.";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  error.value = "";
  success.value = "";
  if (!form.value.leaveType || !form.value.startDate || !form.value.endDate) {
    error.value = "Choose a leave type and leave period.";
    return;
  }
  if (form.value.endDate < form.value.startDate) {
    error.value = "End date cannot be before start date.";
    return;
  }
  if (form.value.durationMode === "custom" && (!form.value.customDays || Number(form.value.customDays) <= 0)) {
    error.value = "Enter the number of working days you need.";
    return;
  }
  saving.value = true;
  try {
    const result = await api.createLeaveRequest(form.value);
    const created = result?.data?.request || result?.data || result;
    if (created?._id) return router.push(`/leave/requests/${created._id}`);
    success.value = "Leave request submitted.";
    await load();
    go("overview");
  } catch (err) {
    error.value = err.message || "Unable to submit leave request.";
  } finally {
    saving.value = false;
  }
}

function resetForm() {
  form.value = { leaveType: types.value[0]?._id || "", startDate: "", endDate: "", durationMode: "dates", customDays: "", reason: "" };
}

watch(() => route.query.tab, (value) => {
  if (value === "request") resetForm();
});

onMounted(load);
</script>

<template>
  <div class="leave-workspace">
    <header class="leave-header">
      <div class="leave-header-main">
        <button class="mf-back-button" type="button" @click="router.push('/modules')">← Module Hub</button>
        <div class="leave-heading-row">
          <div class="leave-logo">L</div>
          <div>
            <span class="mf-eyebrow">PEOPLE OPERATIONS</span>
            <h1>Leave Management</h1>
            <p>Request time away, follow approvals and hand approved leave to HR without losing the paper trail.</p>
          </div>
        </div>
      </div>
      <div class="leave-user-card">
        <div class="leave-user-avatar">{{ initials() }}</div>
        <div><strong>{{ employee?.firstName }} {{ employee?.lastName }}</strong><span>{{ employee?.employeeNo || "Employee" }}</span></div>
      </div>
    </header>

    <div v-if="error" class="mf-alert mf-alert-error">{{ error }}</div>
    <div v-if="success" class="mf-alert mf-alert-success">{{ success }}</div>

    <div class="leave-nav-card">
      <div class="leave-nav-tabs">
        <button type="button" :class="{ active: tab === 'overview' }" @click="go('overview')">Overview</button>
        <button type="button" :class="{ active: tab === 'request' }" @click="go('request')">Request leave <span>+</span></button>
        <button type="button" :class="{ active: tab === 'approvals' }" @click="go('approvals')">Approvals <b v-if="approvals.length">{{ approvals.length }}</b></button>
      </div>
      <button class="mf-secondary-button" type="button" @click="router.push('/modules')">All modules →</button>
    </div>

    <div v-if="loading" class="leave-loading"><div></div><div></div><div></div></div>

    <template v-else>
      <section v-if="tab === 'overview'" class="leave-content-grid">
        <div class="leave-main-column">
          <div class="leave-metrics">
            <article class="leave-metric"><span>My pending</span><strong>{{ pendingMine }}</strong><small>moving through approval</small></article>
            <article class="leave-metric"><span>Approved / filed</span><strong>{{ approvedMine }}</strong><small>completed requests</small></article>
            <article class="leave-metric leave-metric-accent"><span>{{ selectedType?.name || "Selected leave" }}</span><strong>{{ availableBalance }}</strong><small>days currently available</small></article>
          </div>

          <article class="leave-card">
            <div class="leave-card-heading"><div><span class="mf-eyebrow">YOUR BALANCES</span><h2>Time off available</h2></div><button class="mf-link-button" type="button" @click="go('request')">Request leave →</button></div>
            <div class="balance-grid">
              <article v-for="item in balances" :key="item._id" class="balance-card">
                <div class="balance-top"><span class="balance-icon">{{ item.name?.[0] || "L" }}</span><span :class="['leave-tag', item.paid ? 'paid' : 'unpaid']">{{ item.paid ? 'Paid' : 'Unpaid' }}</span></div>
                <strong>{{ item.name }}</strong>
                <div class="balance-number">{{ Math.max(0, Number(item.balance?.allocated || 0) - Number(item.balance?.used || 0) - Number(item.balance?.pending || 0)) }} <small>days</small></div>
                <div class="balance-line"><i :style="{ width: `${Math.min(100, ((Number(item.balance?.used || 0) + Number(item.balance?.pending || 0)) / Math.max(1, Number(item.balance?.allocated || 1))) * 100)}%` }"></i></div>
                <small>{{ item.balance?.used || 0 }} used · {{ item.balance?.pending || 0 }} pending · {{ item.balance?.allocated || 0 }} allocated</small>
              </article>
            </div>
          </article>

          <article class="leave-card">
            <div class="leave-card-heading"><div><span class="mf-eyebrow">REQUEST HISTORY</span><h2>Recent requests</h2></div><button class="mf-secondary-button" type="button" @click="go('request')">New request</button></div>
            <div v-if="!requests.length" class="leave-empty"><strong>No leave requests yet</strong><span>Your approved and pending requests will appear here.</span><button class="mf-primary-button" type="button" @click="go('request')">Create first request</button></div>
            <div v-else class="leave-table-wrap">
              <table class="leave-table"><thead><tr><th>Leave</th><th>Period</th><th>Days</th><th>Stage</th></tr></thead><tbody>
                <tr v-for="item in requests.slice(0, 10)" :key="item._id" tabindex="0" @click="openRequest(item._id)" @keydown.enter="openRequest(item._id)">
                  <td><strong>{{ item.leaveType?.name }}</strong><small>{{ item.reason || 'No reason supplied' }}</small></td>
                  <td>{{ formatDate(item.startDate) }} — {{ formatDate(item.endDate) }}</td><td>{{ item.days }}</td><td><span :class="['leave-status', statusClass(item.status)]">{{ statusLabel(item) }}</span></td>
                </tr>
              </tbody></table>
            </div>
          </article>
        </div>

        <aside class="leave-side-column">
          <article class="leave-card route-card">
            <span class="mf-eyebrow">YOUR APPROVAL ROUTE</span><h2>One request. Three checkpoints.</h2>
            <div class="route-step"><b>01</b><div><strong>Line manager</strong><span>Your Reports To employee receives the request first.</span></div></div>
            <div class="route-line"></div>
            <div class="route-step"><b>02</b><div><strong>SBU Head</strong><span>Resolved from your position's SBU.</span></div></div>
            <div class="route-line"></div>
            <div class="route-step"><b>03</b><div><strong>HR filing</strong><span>After SBU approval, HR is notified to file the approved request.</span></div></div>
          </article>
          <article class="leave-card help-card"><span class="help-icon">?</span><div><strong>Need a different number of days?</strong><p>Choose custom duration when dates don't represent the exact working-day count you need.</p><button class="mf-link-button" type="button" @click="go('request')">Start request →</button></div></article>
        </aside>
      </section>

      <section v-else-if="tab === 'request'" class="leave-form-layout">
        <article class="leave-card leave-form-card">
          <div class="leave-card-heading"><div><span class="mf-eyebrow">NEW REQUEST</span><h2>Request time away</h2><p>Your request will automatically route to your configured line manager and SBU Head.</p></div><button class="mf-secondary-button" type="button" @click="go('overview')">Cancel</button></div>
          <form class="leave-form" @submit.prevent="submit">
            <div class="form-section-title"><span>01</span><div><strong>Leave details</strong><small>Choose the type and duration.</small></div></div>
            <label>Leave type<select v-model="form.leaveType" required><option disabled value="">Select leave type</option><option v-for="type in types" :key="type._id" :value="type._id">{{ type.name }} · {{ type.daysPerYear }} days</option></select></label>
            <div class="duration-switch"><button type="button" :class="{ active: form.durationMode === 'dates' }" @click="form.durationMode = 'dates'">Calculate from dates</button><button type="button" :class="{ active: form.durationMode === 'custom' }" @click="form.durationMode = 'custom'">Custom number of days</button></div>
            <div class="form-two-col"><label>Start date<input v-model="form.startDate" type="date" required></label><label>End date<input v-model="form.endDate" type="date" required></label></div>
            <label v-if="form.durationMode === 'custom'">Custom working days<input v-model="form.customDays" type="number" min="0.5" max="365" step="0.5" placeholder="e.g. 2.5"><small>Use half-day increments. Dates still define the requested period.</small></label>
            <div class="available-callout"><span>Available for {{ selectedType?.name || 'this leave type' }}</span><strong>{{ availableBalance }} days</strong></div>
            <div class="form-section-title"><span>02</span><div><strong>Reason</strong><small>Give approvers enough context to make a decision.</small></div></div>
            <label>Reason<textarea v-model="form.reason" rows="6" maxlength="4000" placeholder="Tell your approvers why you need the leave…"></textarea></label>
            <div class="submit-row"><button class="mf-secondary-button" type="button" @click="go('overview')">Back</button><button class="mf-primary-button" type="submit" :disabled="saving">{{ saving ? 'Submitting…' : 'Submit leave request →' }}</button></div>
          </form>
        </article>
        <aside class="leave-card request-preview"><span class="mf-eyebrow">ROUTING PREVIEW</span><h2>What happens next</h2><div class="preview-person"><span>01</span><div><strong>Line manager</strong><small>Consent / reject</small></div></div><div class="preview-person"><span>02</span><div><strong>SBU Head</strong><small>Approve / reject</small></div></div><div class="preview-person"><span>03</span><div><strong>HR</strong><small>File approved request</small></div></div><div class="preview-note">You can follow every decision, comment and timestamp from the request detail page.</div></aside>
      </section>

      <section v-else class="leave-card approvals-card">
        <div class="leave-card-heading"><div><span class="mf-eyebrow">ACTION QUEUE</span><h2>Leave approvals</h2><p>Requests assigned to you are shown here. Open one to review the full request and take action.</p></div><button class="mf-secondary-button" type="button" @click="go('overview')">Back to overview</button></div>
        <div v-if="!approvals.length" class="leave-empty"><strong>Nothing waiting for you</strong><span>When a leave request reaches your approval stage, it will appear here.</span></div>
        <div v-else class="approval-list"><article v-for="item in approvals" :key="item._id" class="approval-item" @click="openRequest(item._id)"><div class="approval-avatar">{{ item.employee?.firstName?.[0] }}{{ item.employee?.lastName?.[0] }}</div><div class="approval-copy"><strong>{{ item.employee?.firstName }} {{ item.employee?.lastName }}</strong><span>{{ item.leaveType?.name }} · {{ item.days }} day(s)</span><small>{{ formatDate(item.startDate) }} — {{ formatDate(item.endDate) }}</small></div><span class="leave-status pending">{{ statusLabel(item) }} →</span></article></div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.leave-workspace{display:flex;flex-direction:column;gap:20px;max-width:1440px;margin:0 auto;padding:4px 0 48px}.leave-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;padding:4px 4px 2px}.leave-header-main{display:flex;flex-direction:column;gap:18px}.mf-back-button,.mf-link-button{border:0;background:none;color:#315dff;font-weight:700;cursor:pointer;padding:0}.mf-back-button{color:#64748b;font-size:13px;text-align:left}.leave-heading-row{display:flex;gap:16px;align-items:flex-start}.leave-logo{width:54px;height:54px;border-radius:17px;display:grid;place-items:center;background:linear-gradient(135deg,#111827,#315dff);color:#fff;font-size:20px;font-weight:800;box-shadow:0 12px 30px #315dff26}.mf-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#7690ad}.leave-heading-row h1{margin:4px 0 6px;font-size:clamp(30px,4vw,44px);letter-spacing:-.045em;color:#14213d}.leave-heading-row p{margin:0;color:#718096;max-width:760px;line-height:1.65}.leave-user-card{display:flex;align-items:center;gap:11px;padding:10px 13px;background:#fff;border:1px solid #e5ebf3;border-radius:16px;box-shadow:0 10px 30px #16233b08}.leave-user-avatar{width:40px;height:40px;border-radius:12px;background:#edf2ff;color:#315dff;display:grid;place-items:center;font-size:12px;font-weight:800}.leave-user-card strong,.leave-user-card span{display:block}.leave-user-card strong{font-size:13px;color:#1b2942}.leave-user-card span{font-size:11px;color:#8794a8;margin-top:2px}.leave-nav-card{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #e3e9f2;border-radius:18px;padding:6px;box-shadow:0 10px 28px #18263d08;position:sticky;top:12px;z-index:5}.leave-nav-tabs{display:flex;gap:4px}.leave-nav-tabs button{border:0;background:transparent;border-radius:12px;padding:11px 15px;color:#66758b;font-weight:700;cursor:pointer}.leave-nav-tabs button.active{background:#14213d;color:#fff;box-shadow:0 7px 18px #14213d18}.leave-nav-tabs b{margin-left:5px;display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:#fff;color:#315dff;font-size:10px}.leave-nav-tabs button:not(.active) b{background:#edf2ff}.mf-secondary-button,.mf-primary-button{border:1px solid #dbe3ee;border-radius:12px;padding:11px 14px;font-weight:750;cursor:pointer;transition:.2s}.mf-secondary-button{background:#fff;color:#334155}.mf-secondary-button:hover{border-color:#b9c6d8;transform:translateY(-1px)}.mf-primary-button{background:#315dff;color:#fff;border-color:#315dff;box-shadow:0 10px 22px #315dff24}.mf-primary-button:hover{transform:translateY(-1px);box-shadow:0 14px 28px #315dff30}.mf-primary-button:disabled{opacity:.6;cursor:not-allowed;transform:none}.mf-alert{padding:13px 15px;border-radius:13px;font-size:13px}.mf-alert-error{background:#fff1f2;border:1px solid #fecdd3;color:#be123c}.mf-alert-success{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}.leave-loading{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.leave-loading div{height:130px;border-radius:18px;background:linear-gradient(90deg,#f4f7fb,#e9eef6,#f4f7fb);background-size:200% 100%;animation:mfshimmer 1.2s infinite}@keyframes mfshimmer{to{background-position:-200% 0}}.leave-content-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(290px,.7fr);gap:20px}.leave-main-column,.leave-side-column{display:flex;flex-direction:column;gap:20px}.leave-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.leave-metric{background:#fff;border:1px solid #e4eaf2;border-radius:18px;padding:18px;box-shadow:0 12px 30px #16233b07}.leave-metric span,.leave-metric small{display:block;color:#7c8aa0}.leave-metric span{font-size:12px;font-weight:700}.leave-metric strong{display:block;font-size:30px;letter-spacing:-.04em;color:#15233d;margin:7px 0 2px}.leave-metric small{font-size:11px}.leave-metric-accent{background:linear-gradient(145deg,#14213d,#223d70);border-color:#14213d}.leave-metric-accent span,.leave-metric-accent small,.leave-metric-accent strong{color:#fff}.leave-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:21px;box-shadow:0 14px 35px #18263d08}.leave-card-heading{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.leave-card-heading h2,.route-card h2,.request-preview h2{margin:5px 0 4px;color:#17243d;letter-spacing:-.025em}.leave-card-heading p{margin:0;color:#8190a4;font-size:12px;line-height:1.55}.balance-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.balance-card{padding:16px;border:1px solid #e8edf4;border-radius:16px;background:#fbfcfe}.balance-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px}.balance-icon{width:30px;height:30px;border-radius:10px;background:#edf2ff;color:#315dff;display:grid;place-items:center;font-weight:800;font-size:11px}.leave-tag{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:5px 7px;border-radius:99px}.leave-tag.paid{background:#ecfdf5;color:#047857}.leave-tag.unpaid{background:#fff7ed;color:#c2410c}.balance-card>strong{font-size:13px;color:#293750}.balance-number{font-size:28px;font-weight:800;color:#17243d;margin-top:8px}.balance-number small{font-size:11px;color:#7d8ba0}.balance-line{height:5px;background:#e9eef5;border-radius:99px;overflow:hidden;margin:12px 0 7px}.balance-line i{display:block;height:100%;background:#315dff;border-radius:99px}.balance-card>small{font-size:10px;color:#8794a8}.leave-table-wrap{overflow:auto}.leave-table{width:100%;border-collapse:collapse}.leave-table th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#8b98aa;padding:0 12px 10px}.leave-table td{padding:13px 12px;border-top:1px solid #edf1f6;color:#506078;font-size:12px}.leave-table tbody tr{cursor:pointer;transition:.16s}.leave-table tbody tr:hover,.leave-table tbody tr:focus{background:#f7f9fc;outline:none}.leave-table td strong,.leave-table td small{display:block}.leave-table td strong{color:#273650;font-size:12px}.leave-table td small{color:#9aa6b6;margin-top:3px}.leave-status{display:inline-flex;align-items:center;padding:6px 8px;border-radius:99px;background:#eef2f7;color:#536277;font-size:10px;font-weight:800;white-space:nowrap}.leave-status.pending{background:#fff7e8;color:#a16207}.leave-status.approved{background:#ecfdf5;color:#047857}.leave-status.hr-filed{background:#eff6ff;color:#1d4ed8}.leave-status.rejected{background:#fff1f2;color:#be123c}.leave-status.cancelled{background:#f1f5f9;color:#64748b}.leave-empty{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:35px 12px;color:#7b899d}.leave-empty strong{color:#263650}.leave-empty .mf-primary-button{margin-top:10px}.route-card{background:linear-gradient(160deg,#fff,#f7f9ff)}.route-card h2{font-size:22px;margin-bottom:22px}.route-step{display:flex;gap:12px;align-items:flex-start}.route-step>b,.preview-person>span{width:28px;height:28px;border-radius:9px;background:#edf2ff;color:#315dff;display:grid;place-items:center;font-size:10px;flex:none}.route-step strong,.route-step span{display:block}.route-step strong{font-size:13px;color:#273650}.route-step span{font-size:11px;line-height:1.55;color:#8390a2;margin-top:3px}.route-line{width:1px;height:25px;background:#dce4ee;margin:5px 0 5px 13px}.help-card{display:flex;gap:12px;background:#f8fafc}.help-icon{width:32px;height:32px;border-radius:10px;background:#14213d;color:#fff;display:grid;place-items:center;font-weight:800}.help-card strong{font-size:13px;color:#263650}.help-card p{font-size:11px;color:#7f8da0;line-height:1.55;margin:5px 0 10px}.leave-form-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.55fr);gap:20px}.leave-form-card{max-width:900px}.leave-form{display:flex;flex-direction:column;gap:17px}.leave-form label{display:flex;flex-direction:column;gap:7px;color:#41516a;font-size:12px;font-weight:700}.leave-form input,.leave-form select,.leave-form textarea{width:100%;border:1px solid #dce4ef;border-radius:12px;background:#fbfcfe;padding:12px 13px;color:#263650;outline:none;font:inherit;font-weight:500}.leave-form input:focus,.leave-form select:focus,.leave-form textarea:focus{border-color:#8aa4ff;box-shadow:0 0 0 4px #315dff0d;background:#fff}.leave-form textarea{resize:vertical;min-height:130px}.leave-form label small{font-weight:500;color:#8996a9}.form-section-title{display:flex;gap:10px;align-items:center;padding:4px 0 1px;border-top:1px solid #edf1f6;padding-top:18px}.form-section-title span{width:28px;height:28px;border-radius:9px;background:#14213d;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:800}.form-section-title strong,.form-section-title small{display:block}.form-section-title strong{color:#273650;font-size:13px}.form-section-title small{color:#8794a7;font-size:11px;margin-top:2px}.form-two-col{display:grid;grid-template-columns:1fr 1fr;gap:13px}.duration-switch{display:flex;gap:5px;padding:4px;background:#f2f5f9;border-radius:12px}.duration-switch button{flex:1;border:0;background:transparent;border-radius:9px;padding:10px;color:#718096;font-weight:700;cursor:pointer}.duration-switch button.active{background:#fff;color:#263650;box-shadow:0 4px 12px #16233b10}.available-callout{display:flex;justify-content:space-between;align-items:center;padding:13px 15px;border-radius:13px;background:#f2f6ff;border:1px solid #dce6ff;color:#5b6d87;font-size:11px}.available-callout strong{font-size:16px;color:#315dff}.submit-row{display:flex;justify-content:flex-end;gap:8px;margin-top:6px}.request-preview{align-self:start;position:sticky;top:90px}.request-preview h2{font-size:21px;margin-bottom:22px}.preview-person{display:flex;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #edf1f6}.preview-person strong,.preview-person small{display:block}.preview-person strong{font-size:12px;color:#273650}.preview-person small{font-size:10px;color:#8a97a8;margin-top:2px}.preview-note{margin-top:18px;padding:13px;border-radius:12px;background:#f7f9fc;color:#77869a;font-size:11px;line-height:1.6}.approvals-card{min-height:400px}.approval-list{display:flex;flex-direction:column;gap:8px}.approval-item{display:flex;align-items:center;gap:13px;padding:14px;border:1px solid #e7edf4;border-radius:15px;cursor:pointer;transition:.16s}.approval-item:hover{border-color:#cbd6e5;transform:translateY(-1px);box-shadow:0 8px 20px #17233b08}.approval-avatar{width:40px;height:40px;border-radius:12px;background:#eef2ff;color:#315dff;display:grid;place-items:center;font-weight:800;font-size:11px}.approval-copy{flex:1}.approval-copy strong,.approval-copy span,.approval-copy small{display:block}.approval-copy strong{font-size:13px;color:#263650}.approval-copy span{font-size:11px;color:#607087;margin-top:2px}.approval-copy small{font-size:10px;color:#99a4b3;margin-top:3px}@media(max-width:1050px){.leave-content-grid,.leave-form-layout{grid-template-columns:1fr}.request-preview{position:static}.leave-side-column{display:grid;grid-template-columns:1fr 1fr}.leave-header{align-items:flex-start}.leave-user-card{display:none}}@media(max-width:720px){.leave-workspace{padding-bottom:24px}.leave-header{display:block}.leave-heading-row h1{font-size:30px}.leave-nav-card{position:static;overflow:auto}.leave-nav-tabs{min-width:max-content}.leave-nav-card>.mf-secondary-button{display:none}.leave-metrics{grid-template-columns:1fr}.balance-grid,.form-two-col,.leave-side-column{grid-template-columns:1fr}.leave-card{padding:16px;border-radius:17px}.leave-table th:nth-child(2),.leave-table td:nth-child(2){display:none}.leave-table td{padding:12px 7px}.submit-row{justify-content:stretch}.submit-row button{flex:1}.approval-item{align-items:flex-start}.approval-item .leave-status{display:none}}
</style>
