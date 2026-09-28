<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee } from "../../services/api";

const route = useRoute();
const router = useRouter();
const request = ref(null);
const events = ref([]);
const loading = ref(true);
const actionLoading = ref(false);
const error = ref("");
const comment = ref("");

const employee = computed(() => getSavedEmployee());
const isOwner = computed(() => String(request.value?.employee?._id) === String(employee.value?._id));
const canReview = computed(() => {
  if (!request.value || request.value.status !== "Pending") return false;
  const permissions = employee.value?.role?.permissions || [];
  return String(request.value.approver?._id) === String(employee.value?._id) || permissions.includes("leave.approve") || permissions.includes("leave.manage") || permissions.includes("*");
});
const stageTitle = computed(() => {
  if (request.value?.status === "Approved") return "Approved · ready for HR filing";
  if (request.value?.status === "Rejected") return "Rejected";
  if (request.value?.status === "Cancelled") return "Cancelled";
  return request.value?.approvalStage === "SBU_HEAD" ? "Awaiting SBU Head" : "Awaiting line manager";
});

function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" }) : "—"; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString() : "—"; }
function statusClass(status) { return `status-${String(status || "").toLowerCase().replaceAll(" ", "-")}`; }

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.getLeaveRequest(route.params.id);
    const data = result?.data || result;
    request.value = data.request || data;
    events.value = data.events || [];
  } catch (err) {
    error.value = err.message || "Unable to load this leave request.";
  } finally {
    loading.value = false;
  }
}

async function decide(decision) {
  if (decision === "reject" && !comment.value.trim()) {
    error.value = "Add a reason before rejecting this request.";
    return;
  }

  actionLoading.value = true;
  error.value = "";
  try {
    await api.decideLeaveRequest(route.params.id, decision, comment.value);
    comment.value = "";
    await load();
  } catch (err) {
    error.value = err.message || "Unable to process leave request.";
  } finally {
    actionLoading.value = false;
  }
}

async function cancel() {
  if (!window.confirm("Cancel this leave request?")) return;
  actionLoading.value = true;
  error.value = "";
  try {
    await api.cancelLeaveRequest(route.params.id);
    await load();
  } catch (err) {
    error.value = err.message || "Unable to cancel leave request.";
  } finally {
    actionLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page leave-request-page">
    <button class="back-link" type="button" @click="router.push('/leave')">← Back to Leave Management</button>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="card empty-state">Loading leave request…</div>

    <template v-else-if="request">
      <section class="leave-detail-hero card">
        <div>
          <span class="page-kicker">LEAVE REQUEST · {{ request.leaveType?.code || "TIME OFF" }}</span>
          <h1>{{ request.leaveType?.name }}</h1>
          <p>{{ request.employee?.firstName }} {{ request.employee?.lastName }} · {{ request.days }} working days · {{ formatDate(request.startDate) }} — {{ formatDate(request.endDate) }}</p>
        </div>
        <span :class="['status-pill large', statusClass(request.status)]">{{ stageTitle }}</span>
      </section>

      <section class="leave-approval-track card">
        <div :class="['track-step', request.supervisorDecisionAt ? 'complete' : request.approvalStage === 'SUPERVISOR' ? 'current' : '']"><span>01</span><div><strong>Line manager</strong><small>{{ request.supervisor?.firstName }} {{ request.supervisor?.lastName }}</small></div><b>{{ request.supervisorDecisionAt ? "Approved" : request.approvalStage === 'SUPERVISOR' ? "Waiting" : "Next" }}</b></div>
        <i></i>
        <div :class="['track-step', request.sbuHeadDecisionAt ? 'complete' : request.approvalStage === 'SBU_HEAD' ? 'current' : '']"><span>02</span><div><strong>SBU Head</strong><small>{{ request.sbuHead?.firstName }} {{ request.sbuHead?.lastName }}</small></div><b>{{ request.sbuHeadDecisionAt ? "Approved" : request.approvalStage === 'SBU_HEAD' ? "Waiting" : "Next" }}</b></div>
        <i></i>
        <div :class="['track-step', request.status === 'Approved' ? 'complete' : '']"><span>03</span><div><strong>HR filing</strong><small>Paper form / HR record</small></div><b>{{ request.status === 'Approved' ? "Ready" : "Pending" }}</b></div>
      </section>

      <div class="leave-detail-grid">
        <section class="card detail-card">
          <div class="section-heading compact"><div><span class="page-kicker">REQUEST DETAILS</span><h2>Leave information</h2></div></div>
          <div class="detail-grid"><div><span>Employee</span><strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong></div><div><span>Employee number</span><strong>{{ request.employee?.employeeNo || "—" }}</strong></div><div><span>Period</span><strong>{{ formatDate(request.startDate) }} — {{ formatDate(request.endDate) }}</strong></div><div><span>Working days</span><strong>{{ request.days }}</strong></div><div><span>Line manager</span><strong>{{ request.supervisor ? `${request.supervisor.firstName} ${request.supervisor.lastName}` : "Not configured" }}</strong></div><div><span>SBU Head</span><strong>{{ request.sbuHead ? `${request.sbuHead.firstName} ${request.sbuHead.lastName}` : "Not configured" }}</strong></div></div>
          <div class="detail-row detail-row-stack"><span>Reason / handover note</span><p>{{ request.reason || "No reason provided." }}</p></div>
          <div v-if="request.decisionComment" class="decision-note"><strong>Latest decision note</strong><p>{{ request.decisionComment }}</p></div>

          <div v-if="canReview" class="action-centre leave-action-centre">
            <span class="page-kicker">ACTION CENTRE · {{ request.approvalStage === 'SBU_HEAD' ? 'SBU HEAD' : 'LINE MANAGER' }}</span>
            <h2>Review this request</h2>
            <label class="field"><span>Comment</span><textarea v-model="comment" rows="4" placeholder="Add an approval note or rejection reason…"></textarea></label>
            <div class="form-actions"><button class="btn btn-primary btn-lg" :disabled="actionLoading" @click="decide('approve')">Approve & forward</button><button class="btn btn-danger" :disabled="actionLoading" @click="decide('reject')">Reject</button></div>
          </div>

          <div v-if="request.status === 'Approved'" class="hr-handoff"><span>✓</span><div><strong>Ready for HR filing</strong><p>Both approval stages are complete. The employee can now submit the required paper form to HR.</p></div></div>
          <button v-if="request.status === 'Pending' && isOwner" class="btn btn-secondary cancel-leave" :disabled="actionLoading" @click="cancel">Cancel request</button>
        </section>

        <section class="card event-card">
          <div class="section-heading compact"><div><span class="page-kicker">AUDIT TRAIL</span><h2>Approval history</h2></div></div>
          <div class="event-timeline">
            <article v-for="event in events" :key="event._id" class="event-item"><div class="event-marker"></div><div><strong>{{ event.title }}</strong><p>{{ event.description }}</p><small>{{ event.actor?.firstName }} {{ event.actor?.lastName }} · {{ formatDateTime(event.createdAt) }}</small><blockquote v-if="event.comment">“{{ event.comment }}”</blockquote></div></article>
            <div v-if="!events.length" class="empty-state small">No events recorded.</div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
