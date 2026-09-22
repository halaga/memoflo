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
const canReview = computed(() => request.value?.status === "Pending" && (String(request.value?.approver?._id) === String(employee.value?._id) || employee.value?.role?.permissions?.includes("leave.manage") || employee.value?.role?.permissions?.includes("*")));

function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" }) : "—"; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString() : "—"; }
function statusClass(status) { return `status-${String(status || "").toLowerCase()}`; }

async function load() {
  loading.value = true; error.value = "";
  try { const result = await api.getLeaveRequest(route.params.id); const data = result?.data || result; request.value = data.request || data; events.value = data.events || []; }
  catch (err) { error.value = err.message || "Unable to load leave request."; }
  finally { loading.value = false; }
}

async function decide(decision) {
  if (decision === "reject" && !comment.value.trim()) { error.value = "Add a reason before rejecting this request."; return; }
  actionLoading.value = true; error.value = "";
  try { const result = await api.decideLeaveRequest(route.params.id, decision, comment.value); const data = result?.data || result; request.value = data.request || request.value; events.value = data.events || events.value; comment.value = ""; await load(); }
  catch (err) { error.value = err.message || "Unable to process leave request."; }
  finally { actionLoading.value = false; }
}

async function cancel() {
  if (!window.confirm("Cancel this leave request?")) return;
  actionLoading.value = true; error.value = "";
  try { await api.cancelLeaveRequest(route.params.id); await load(); } catch (err) { error.value = err.message || "Unable to cancel leave request."; } finally { actionLoading.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="page leave-request-page">
    <button class="back-link" type="button" @click="router.push('/leave')">← Back to Leave Management</button>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="card empty-state">Loading leave request…</div>

    <template v-else-if="request">
      <section class="page-header leave-detail-header">
        <div><span class="page-kicker">LEAVE REQUEST</span><h1>{{ request.leaveType?.name }}</h1><p>{{ request.employee?.firstName }} {{ request.employee?.lastName }} · {{ request.days }} working days</p></div>
        <span :class="['status-pill large', statusClass(request.status)]">{{ request.status }}</span>
      </section>

      <div class="leave-detail-grid">
        <section class="card detail-card">
          <div class="detail-row"><span>Employee</span><strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong></div>
          <div class="detail-row"><span>Period</span><strong>{{ formatDate(request.startDate) }} — {{ formatDate(request.endDate) }}</strong></div>
          <div class="detail-row"><span>Working days</span><strong>{{ request.days }}</strong></div>
          <div class="detail-row"><span>Approver</span><strong>{{ request.approver ? `${request.approver.firstName} ${request.approver.lastName}` : "Company administrator" }}</strong></div>
          <div class="detail-row detail-row-stack"><span>Reason</span><p>{{ request.reason || "No reason provided." }}</p></div>
          <div v-if="request.decisionComment" class="decision-note"><strong>Decision note</strong><p>{{ request.decisionComment }}</p></div>

          <div v-if="canReview" class="action-centre">
            <span class="page-kicker">ACTION CENTRE</span>
            <h2>Review this request</h2>
            <label class="field"><span>Comment</span><textarea v-model="comment" rows="4" placeholder="Add an approval note or rejection reason…"></textarea></label>
            <div class="form-actions"><button class="btn btn-primary" :disabled="actionLoading" @click="decide('approve')">Approve</button><button class="btn btn-danger" :disabled="actionLoading" @click="decide('reject')">Reject</button></div>
          </div>

          <button v-if="request.status === 'Pending' && String(request.employee?._id) === String(employee?._id)" class="btn btn-secondary cancel-leave" :disabled="actionLoading" @click="cancel">Cancel request</button>
        </section>

        <section class="card event-card">
          <div class="section-heading compact"><div><span class="page-kicker">EVENT HISTORY</span><h2>Request timeline</h2></div></div>
          <div class="event-timeline">
            <article v-for="event in events" :key="event._id" class="event-item">
              <div class="event-marker"></div>
              <div><strong>{{ event.title }}</strong><p>{{ event.description }}</p><small>{{ event.actor?.firstName }} {{ event.actor?.lastName }} · {{ formatDateTime(event.createdAt) }}</small><blockquote v-if="event.comment">“{{ event.comment }}”</blockquote></div>
            </article>
            <div v-if="!events.length" class="empty-state small">No events recorded.</div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
