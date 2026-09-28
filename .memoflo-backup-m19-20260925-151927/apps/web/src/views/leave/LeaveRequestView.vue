<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee } from "../../services/api";

const route = useRoute();
const router = useRouter();
const employee = getSavedEmployee();
const data = ref(null);
const loading = ref(true);
const error = ref("");
const actionError = ref("");
const working = ref(false);
const comment = ref("");

const request = computed(() => data.value?.request || null);
const events = computed(() => data.value?.events || []);
const permissions = computed(() => employee?.role?.permissions || []);
const canManage = computed(() => permissions.value.includes("*") || permissions.value.includes("leave.manage"));
const isAssigned = computed(() => request.value?.approver && String(request.value.approver._id || request.value.approver) === String(employee?._id));
const canAct = computed(() => request.value?.status === "Pending" && (isAssigned.value || permissions.value.includes("leave.approve") || canManage.value));
const canFile = computed(() => request.value?.status === "Approved" && request.value?.approvalStage === "HR" && canManage.value);

function name(person) {
  if (!person) return "—";
  return `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || "User";
}
function date(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function dateTime(value) {
  return value ? new Date(value).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}
function stageClass(stage) {
  return stage === "SUPERVISOR" ? "active" : stage === "SBU_HEAD" ? "active" : stage === "HR" ? "active" : "done";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.getLeaveRequest(route.params.id);
    data.value = result?.data || result;
  } catch (err) {
    error.value = err.message || "Unable to load this leave request.";
  } finally {
    loading.value = false;
  }
}

async function decide(decision) {
  actionError.value = "";
  if (decision === "reject" && !comment.value.trim()) {
    actionError.value = "Add a reason before rejecting the request.";
    return;
  }
  working.value = true;
  try {
    await api.decideLeaveRequest(route.params.id, decision, comment.value.trim());
    comment.value = "";
    await load();
  } catch (err) {
    actionError.value = err.message || "Unable to update the leave request.";
  } finally {
    working.value = false;
  }
}

async function fileRequest() {
  actionError.value = "";
  working.value = true;
  try {
    await api.fileLeaveRequest(route.params.id, comment.value.trim());
    comment.value = "";
    await load();
  } catch (err) {
    actionError.value = err.message || "Unable to mark this request as filed.";
  } finally {
    working.value = false;
  }
}

async function cancelRequest() {
  if (!window.confirm("Cancel this leave request?")) return;
  working.value = true;
  actionError.value = "";
  try {
    await api.cancelLeaveRequest(route.params.id);
    await load();
  } catch (err) {
    actionError.value = err.message || "Unable to cancel this request.";
  } finally {
    working.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="leave-request-page">
    <header class="request-page-header">
      <div>
        <button class="mf-back-button" type="button" @click="router.push('/leave')">← Leave Management</button>
        <div class="request-title-row"><div class="request-ref">L</div><div><span class="mf-eyebrow">LEAVE REQUEST</span><h1>{{ request?.leaveType?.name || 'Leave request' }}</h1><p>{{ request?.employee ? name(request.employee) : 'Loading request…' }} · {{ request?.days || '—' }} day(s)</p></div></div>
      </div>
      <div class="request-header-actions"><button class="mf-secondary-button" type="button" @click="router.push('/modules')">Module Hub</button><span v-if="request" :class="['request-status', request.status.toLowerCase().replaceAll(' ', '-')]">{{ request.status }}</span></div>
    </header>

    <div v-if="error" class="mf-alert mf-alert-error">{{ error }}</div>
    <div v-if="loading" class="request-loading"><div></div><div></div></div>

    <template v-else-if="request">
      <div class="request-grid">
        <main class="request-main">
          <section class="request-card">
            <div class="request-card-heading"><div><span class="mf-eyebrow">REQUEST SUMMARY</span><h2>{{ request.leaveType?.name }}</h2></div><span :class="['request-status', request.status.toLowerCase().replaceAll(' ', '-')]">{{ request.status }}</span></div>
            <div class="request-facts"><div><span>Employee</span><strong>{{ name(request.employee) }}</strong></div><div><span>Period</span><strong>{{ date(request.startDate) }} — {{ date(request.endDate) }}</strong></div><div><span>Duration</span><strong>{{ request.days }} day(s)</strong></div><div><span>Duration method</span><strong>{{ request.durationMode === 'custom' ? 'Custom days' : 'Calendar period' }}</strong></div></div>
            <div class="request-reason"><span>Reason</span><p>{{ request.reason || 'No reason was supplied.' }}</p></div>
          </section>

          <section class="request-card">
            <div class="request-card-heading"><div><span class="mf-eyebrow">APPROVAL ROUTE</span><h2>Who handles this request</h2></div></div>
            <div class="request-route">
              <div :class="['request-route-step', request.approvalStage === 'SUPERVISOR' ? 'current' : 'done']"><div class="route-number">01</div><div><strong>Line manager</strong><span>{{ name(request.supervisor) }}</span><small>{{ request.supervisorDecisionAt ? `Approved ${dateTime(request.supervisorDecisionAt)}` : request.approvalStage === 'SUPERVISOR' ? 'Waiting for consent' : 'Next after employee submission' }}</small></div></div>
              <div class="route-connector"></div>
              <div :class="['request-route-step', request.approvalStage === 'SBU_HEAD' ? 'current' : request.sbuHeadDecisionAt ? 'done' : '']"><div class="route-number">02</div><div><strong>SBU Head</strong><span>{{ name(request.sbuHead) }}</span><small>{{ request.sbuHeadDecisionAt ? `Approved ${dateTime(request.sbuHeadDecisionAt)}` : request.approvalStage === 'SBU_HEAD' ? 'Waiting for approval' : 'Waiting for line manager' }}</small></div></div>
              <div class="route-connector"></div>
              <div :class="['request-route-step', request.approvalStage === 'HR' ? 'current' : request.status === 'HR Filed' ? 'done' : '']"><div class="route-number">03</div><div><strong>HR filing</strong><span>HR department head</span><small>{{ request.status === 'HR Filed' ? 'Filed and recorded' : request.status === 'Approved' ? 'Ready for HR filing' : 'Starts after SBU approval' }}</small></div></div>
            </div>
          </section>

          <section class="request-card">
            <div class="request-card-heading"><div><span class="mf-eyebrow">PERMANENT HISTORY</span><h2>Request activity</h2></div><button class="mf-secondary-button" type="button" @click="load">Refresh</button></div>
            <div v-if="!events.length" class="request-empty">No activity has been recorded yet.</div>
            <div v-else class="request-timeline"><article v-for="event in events" :key="event._id" class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-top"><strong>{{ event.title }}</strong><time>{{ dateTime(event.createdAt) }}</time></div><p>{{ event.description }}</p><small>{{ name(event.actor) }}</small><blockquote v-if="event.comment">{{ event.comment }}</blockquote></div></article></div>
          </section>
        </main>

        <aside class="request-side">
          <section class="request-card action-panel">
            <span class="mf-eyebrow">ACTION CENTRE</span><h2>Next step</h2>
            <p v-if="canAct">This request is assigned to you. Review the dates and reason, then record your decision.</p>
            <p v-else-if="canFile">The SBU Head has approved this request. HR can now mark the paper process as filed.</p>
            <p v-else-if="request.status === 'Pending'">This request is waiting for {{ request.approvalStage === 'SBU_HEAD' ? 'the SBU Head' : 'the line manager' }}.</p>
            <p v-else-if="request.status === 'Approved'">Approved. The request is ready for HR filing.</p>
            <p v-else-if="request.status === 'HR Filed'">This request has been filed by HR. The approval trail is complete.</p>
            <p v-else>This request is {{ request.status.toLowerCase() }}.</p>

            <div v-if="canAct || canFile" class="action-form">
              <label>Comment<textarea v-model="comment" rows="5" placeholder="Add a note for the permanent activity history…"></textarea></label>
              <div class="action-buttons"><button v-if="canAct" class="mf-danger-button" type="button" :disabled="working" @click="decide('reject')">Reject</button><button v-if="canAct" class="mf-primary-button" type="button" :disabled="working" @click="decide('approve')">Approve & forward →</button><button v-if="canFile" class="mf-primary-button" type="button" :disabled="working" @click="fileRequest">Mark filed by HR ✓</button></div>
              <div v-if="actionError" class="mf-alert mf-alert-error">{{ actionError }}</div>
            </div>

            <button v-if="request.employee?._id === employee?._id && ['Pending','Approved'].includes(request.status)" class="cancel-link" type="button" @click="cancelRequest">Cancel this request</button>
          </section>

          <section class="request-card quick-card"><span class="mf-eyebrow">QUICK NAVIGATION</span><button type="button" @click="router.push('/leave')">← Leave overview</button><button type="button" @click="router.push('/leave?tab=request')">+ New leave request</button><button type="button" @click="router.push('/modules')">⌘ Module Hub</button></section>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.leave-request-page{max-width:1400px;margin:0 auto;padding:4px 0 48px}.request-page-header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:20px}.mf-back-button{border:0;background:none;color:#65748a;font-weight:700;padding:0;cursor:pointer;margin-bottom:14px}.request-title-row{display:flex;gap:14px}.request-ref{width:52px;height:52px;border-radius:16px;background:#14213d;color:#fff;display:grid;place-items:center;font-weight:800}.request-title-row h1{margin:4px 0;color:#17243d;letter-spacing:-.04em;font-size:34px}.request-title-row p{margin:0;color:#7e8b9f;font-size:12px}.request-header-actions{display:flex;align-items:center;gap:10px}.mf-secondary-button,.mf-primary-button,.mf-danger-button{border:1px solid #dbe3ee;border-radius:12px;padding:11px 14px;font-weight:750;cursor:pointer}.mf-secondary-button{background:#fff;color:#34445c}.mf-primary-button{background:#315dff;border-color:#315dff;color:#fff}.mf-danger-button{background:#fff1f2;border-color:#fecdd3;color:#be123c}.request-status{display:inline-flex;padding:7px 10px;border-radius:99px;background:#eef2f7;color:#526178;font-size:10px;font-weight:800}.request-status.pending{background:#fff7e8;color:#a16207}.request-status.approved{background:#ecfdf5;color:#047857}.request-status.hr-filed{background:#eff6ff;color:#1d4ed8}.request-status.rejected{background:#fff1f2;color:#be123c}.request-status.cancelled{background:#f1f5f9;color:#64748b}.mf-alert{padding:13px;border-radius:12px;font-size:12px}.mf-alert-error{background:#fff1f2;border:1px solid #fecdd3;color:#be123c}.request-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(290px,.55fr);gap:20px}.request-main{display:flex;flex-direction:column;gap:20px}.request-side{display:flex;flex-direction:column;gap:20px}.request-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:21px;box-shadow:0 14px 35px #18263d08}.request-card-heading{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:18px}.request-card-heading h2,.action-panel h2{margin:4px 0;color:#17243d;letter-spacing:-.025em}.request-facts{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.request-facts>div{padding:13px;border:1px solid #edf1f5;border-radius:13px;background:#fbfcfe}.request-facts span,.request-facts strong,.request-reason span{display:block}.request-facts span,.request-reason span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#8b98aa;font-weight:800}.request-facts strong{font-size:12px;color:#2b3952;margin-top:5px}.request-reason{margin-top:15px;padding:15px;border-radius:14px;background:#f7f9fc}.request-reason p{margin:8px 0 0;color:#526178;font-size:12px;line-height:1.7;white-space:pre-wrap}.request-route{display:flex;align-items:stretch;gap:0}.request-route-step{display:flex;gap:10px;flex:1;padding:12px;border:1px solid #e7edf4;border-radius:15px;background:#fbfcfe}.request-route-step.current{border-color:#9fb2ff;background:#f4f6ff}.request-route-step.done{border-color:#b9ead4;background:#f4fcf8}.route-number{width:29px;height:29px;border-radius:9px;background:#edf2ff;color:#315dff;display:grid;place-items:center;font-size:9px;font-weight:800;flex:none}.request-route-step strong,.request-route-step span,.request-route-step small{display:block}.request-route-step strong{font-size:12px;color:#273650}.request-route-step span{font-size:10px;color:#68778c;margin-top:3px}.request-route-step small{font-size:9px;color:#96a1b1;margin-top:5px;line-height:1.4}.route-connector{height:1px;background:#dfe6ef;width:18px;align-self:center}.request-timeline{display:flex;flex-direction:column;gap:0}.timeline-item{display:grid;grid-template-columns:12px 1fr;gap:13px;padding:0 0 20px}.timeline-item:last-child{padding-bottom:0}.timeline-dot{width:10px;height:10px;border-radius:50%;background:#315dff;margin-top:5px;box-shadow:0 0 0 4px #edf2ff}.timeline-top{display:flex;justify-content:space-between;gap:12px}.timeline-top strong{font-size:12px;color:#273650}.timeline-top time{font-size:9px;color:#9aa5b3;white-space:nowrap}.timeline-item p{margin:5px 0;font-size:11px;line-height:1.6;color:#6c7a8f}.timeline-item small{font-size:9px;color:#8e9aaa}.timeline-item blockquote{margin:8px 0 0;padding:9px 11px;border-left:3px solid #315dff;background:#f7f9fc;color:#617087;font-size:10px}.action-panel{position:sticky;top:90px}.action-panel>p{font-size:11px;line-height:1.65;color:#7c899c}.action-form{display:flex;flex-direction:column;gap:10px;margin-top:15px}.action-form label{font-size:11px;color:#53627a;font-weight:700}.action-form textarea{width:100%;margin-top:7px;border:1px solid #dce4ef;border-radius:12px;padding:11px;background:#fbfcfe;resize:vertical;font:inherit;color:#2d3b54;outline:none}.action-buttons{display:flex;gap:7px;flex-wrap:wrap}.cancel-link{border:0;background:none;color:#be123c;font-size:10px;font-weight:700;cursor:pointer;margin-top:12px;text-align:left}.quick-card{display:flex;flex-direction:column;gap:7px}.quick-card button{border:1px solid #e6ebf2;background:#fbfcfe;color:#53627a;border-radius:11px;padding:11px;text-align:left;font-weight:700;cursor:pointer}.quick-card button:hover{background:#f3f6fa}.request-empty{padding:30px;color:#8794a7;font-size:12px}.request-loading{display:grid;grid-template-columns:1.4fr .6fr;gap:20px}.request-loading div{height:400px;border-radius:20px;background:linear-gradient(90deg,#f4f7fb,#e9eef6,#f4f7fb);background-size:200% 100%;animation:load 1.2s infinite}@keyframes load{to{background-position:-200% 0}}@media(max-width:950px){.request-grid{grid-template-columns:1fr}.action-panel{position:static}.request-route{flex-direction:column}.route-connector{height:16px;width:1px;margin-left:26px}.request-page-header{align-items:flex-start}.request-header-actions{flex-direction:column;align-items:flex-end}}@media(max-width:650px){.request-page-header{display:block}.request-header-actions{margin-top:12px;flex-direction:row;justify-content:space-between}.request-title-row h1{font-size:28px}.request-card{padding:16px;border-radius:17px}.request-facts{grid-template-columns:1fr}.timeline-top{display:block}.timeline-top time{display:block;margin-top:3px}.action-buttons button{flex:1}}
</style>
