<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../../services/api";
import MemoStatusBadge from "../../components/memos/MemoStatusBadge.vue";
import WorkflowInstancePanel from "../../components/workflow/WorkflowInstancePanel.vue";

const route = useRoute();
const router = useRouter();
const employee = getSavedEmployee();

const memo = ref(null);
const workflow = ref(null);
const instance = ref(null);
const workflows = ref([]);
const events = ref([]);
const attachments = ref([]);
const selectedFile = ref(null);
const comment = ref("");
const loading = ref(true);
const workflowLoading = ref(false);
const attachmentLoading = ref(false);
const error = ref("");
const actionError = ref("");

const memoId = computed(() => route.params.id);
const currentApproverId = computed(() => memo.value?.currentApprover?._id || memo.value?.currentApprover);
const employeePositionIds = computed(() => {
  const position = employee?.position;
  return position ? [String(position?._id || position)] : [];
});
const canAct = computed(() => {
  if (!memo.value || !instance.value) return false;
  if (!["pending", "running"].includes(String(instance.value.status || "").toLowerCase())) return false;
  const occupantId = instance.value.currentEmployee?._id || instance.value.currentEmployee;
  return (
    (occupantId && employee?._id && String(occupantId) === String(employee._id)) ||
    (currentApproverId.value && employeePositionIds.value.includes(String(currentApproverId.value)))
  );
});

async function loadEvents() {
  const result = await api.listMemoEvents(memoId.value);
  events.value = normalizeList(result);
}

async function loadAttachments() {
  const result = await api.listMemoAttachments(memoId.value);
  attachments.value = normalizeList(result);
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.getMemo(memoId.value);
    memo.value = result?.memo || result?.data || result;
    const workflowResult = await api.listWorkflows();
    workflows.value = normalizeList(workflowResult, ["workflows"]);
    const workflowId = memo.value?.workflow?._id || memo.value?.workflow;
    if (workflowId) await loadWorkflow(workflowId);
    await Promise.all([loadEvents(), loadAttachments()]);
  } catch (err) {
    error.value = err.message || "Unable to load memo.";
  } finally {
    loading.value = false;
  }
}

async function loadWorkflow(workflowId) {
  try {
    const result = await api.getWorkflow(workflowId);
    workflow.value = result?.workflow || result?.data || result;
    if (memo.value?.workflowInstance) await loadInstance(memo.value.workflowInstance);
  } catch (err) {
    actionError.value = err.message;
  }
}

async function loadInstance(instanceId) {
  try {
    const result = await api.getWorkflowInstance(instanceId);
    instance.value = result?.instance || result?.data || result;
  } catch (err) {
    actionError.value = err.message;
  }
}

async function refreshHistory() {
  await Promise.all([loadEvents(), loadAttachments()]);
}

async function startWorkflow() {
  actionError.value = "";
  const workflowId = memo.value?.workflow?._id || memo.value?.workflow || workflows.value.find((item) => item.name === "Procurement Approval")?._id;
  if (!workflowId) {
    actionError.value = "No workflow is configured for this memo.";
    return;
  }
  workflowLoading.value = true;
  try {
    await api.startWorkflow(workflowId, "memo", memo.value._id);
    await load();
  } catch (err) {
    actionError.value = err.message;
  } finally {
    workflowLoading.value = false;
  }
}

async function approve() {
  if (!instance.value?._id) return;
  workflowLoading.value = true;
  actionError.value = "";
  try {
    await api.advanceWorkflow(instance.value._id, comment.value.trim());
    comment.value = "";
    await load();
  } catch (err) {
    actionError.value = err.message;
  } finally {
    workflowLoading.value = false;
  }
}

async function reject() {
  if (!instance.value?._id) return;
  if (!comment.value.trim()) {
    actionError.value = "Add a comment explaining why the memo is being rejected.";
    return;
  }
  workflowLoading.value = true;
  actionError.value = "";
  try {
    await api.rejectWorkflow(instance.value._id, comment.value.trim());
    comment.value = "";
    await load();
  } catch (err) {
    actionError.value = err.message;
  } finally {
    workflowLoading.value = false;
  }
}

async function cancel() {
  if (!instance.value?._id) return;
  if (!window.confirm("Cancel this workflow?")) return;
  workflowLoading.value = true;
  actionError.value = "";
  try {
    await api.cancelWorkflow(instance.value._id, comment.value.trim());
    comment.value = "";
    await load();
  } catch (err) {
    actionError.value = err.message;
  } finally {
    workflowLoading.value = false;
  }
}

async function resubmit() {
  if (!instance.value?._id) return;
  workflowLoading.value = true;
  actionError.value = "";
  try {
    await api.resubmitWorkflow(instance.value._id, comment.value.trim());
    comment.value = "";
    await load();
  } catch (err) {
    actionError.value = err.message;
  } finally {
    workflowLoading.value = false;
  }
}

function chooseFile(event) {
  selectedFile.value = event.target.files?.[0] || null;
}

async function uploadAttachment() {
  if (!selectedFile.value) return;
  attachmentLoading.value = true;
  actionError.value = "";
  try {
    await api.uploadMemoAttachment(memoId.value, selectedFile.value);
    selectedFile.value = null;
    await refreshHistory();
    const input = document.getElementById("memo-attachment-input");
    if (input) input.value = "";
  } catch (err) {
    actionError.value = err.message;
  } finally {
    attachmentLoading.value = false;
  }
}

async function downloadAttachment(attachment) {
  const response = await api.downloadMemoAttachment(memoId.value, attachment._id);
  if (!response.ok) throw new Error("Unable to download attachment.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = attachment.originalName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function removeAttachment(attachment) {
  if (!window.confirm(`Remove ${attachment.originalName}?`)) return;
  try {
    await api.removeMemoAttachment(memoId.value, attachment._id);
    await refreshHistory();
  } catch (err) {
    actionError.value = err.message;
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function actorName(actor) {
  if (!actor) return "System";
  return `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || actor.email || "User";
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div class="page-heading-group">
        <button class="btn btn-secondary" type="button" @click="router.back()">← Back</button>
        <div>
          <span class="page-kicker">MEMO MANAGEMENT</span>
          <h1>Memo Details</h1>
          <p>Review the memo, workflow state, supporting files and complete event history.</p>
        </div>
      </div>
      <MemoStatusBadge v-if="memo" :status="memo.status" />
    </div>

    <div v-if="loading" class="card empty-state">Loading memo…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <template v-else-if="memo">
      <div class="detail-grid-new">
        <div class="detail-main-column">
          <section class="card detail-card-new">
            <div class="card-header">
              <div>
                <span class="page-kicker">{{ memo.referenceNo || "MEMO" }}</span>
                <h2>{{ memo.title }}</h2>
              </div>
              <MemoStatusBadge :status="memo.status" />
            </div>

            <div class="detail-meta-new">
              <div><span>Category</span><strong>{{ memo.category || "—" }}</strong></div>
              <div><span>Priority</span><strong>{{ memo.priority || "—" }}</strong></div>
              <div><span>Business service</span><strong>{{ memo.businessService?.name || "—" }}</strong></div>
              <div><span>Created by</span><strong>{{ actorName(memo.createdBy) }}</strong></div>
            </div>

            <div class="memo-body-new">
              <span class="page-kicker">MEMO CONTENT</span>
              <p>{{ memo.body }}</p>
            </div>
          </section>

          <section class="card detail-card-new attachments-panel">
            <div class="card-header">
              <div>
                <span class="page-kicker">SUPPORTING FILES</span>
                <h2>Attachments</h2>
              </div>
              <span class="soft-pill">10 MB / file</span>
            </div>

            <div class="attachment-upload">
              <input id="memo-attachment-input" type="file" @change="chooseFile" />
              <button class="btn btn-primary" type="button" :disabled="!selectedFile || attachmentLoading" @click="uploadAttachment">
                {{ attachmentLoading ? "Uploading…" : "Add attachment" }}
              </button>
            </div>

            <div v-if="attachments.length" class="attachment-list">
              <article v-for="attachment in attachments" :key="attachment._id" class="attachment-item">
                <div class="attachment-icon">↗</div>
                <div class="attachment-copy">
                  <strong>{{ attachment.originalName }}</strong>
                  <span>{{ Math.ceil(attachment.size / 1024) }} KB · {{ attachment.mimeType }}</span>
                </div>
                <div class="inline-actions">
                  <button class="btn btn-small btn-secondary" type="button" @click="downloadAttachment(attachment)">Download</button>
                  <button class="btn btn-small btn-danger" type="button" @click="removeAttachment(attachment)">Remove</button>
                </div>
              </article>
            </div>
            <div v-else class="subtle-empty">No attachments have been added to this memo.</div>
          </section>

          <section class="card detail-card-new event-panel">
            <div class="card-header">
              <div>
                <span class="page-kicker">AUDIT TRAIL</span>
                <h2>Memo Event History</h2>
              </div>
              <button class="btn btn-small btn-secondary" type="button" @click="refreshHistory">Refresh</button>
            </div>

            <div v-if="events.length" class="event-timeline">
              <article v-for="event in events" :key="event._id" class="event-row">
                <div class="event-marker"></div>
                <div class="event-content">
                  <div class="event-topline">
                    <strong>{{ event.title }}</strong>
                    <time>{{ formatDate(event.createdAt) }}</time>
                  </div>
                  <p>{{ event.description }}</p>
                  <span class="event-actor">{{ actorName(event.actor) }} · {{ event.type }}</span>
                  <div v-if="event.comment" class="event-comment">“{{ event.comment }}”</div>
                </div>
              </article>
            </div>
            <div v-else class="subtle-empty">No events recorded yet.</div>
          </section>
        </div>

        <aside class="action-card-new card">
          <div class="card-header">
            <div>
              <span class="page-kicker">ACTION CENTRE</span>
              <h2>Workflow</h2>
            </div>
          </div>

          <div v-if="actionError" class="alert alert-error">{{ actionError }}</div>

          <div v-if="!instance && !memo.workflowInstance" class="workflow-start-new">
            <p>This memo has not started its approval workflow.</p>
            <button class="btn btn-primary btn-block" :disabled="workflowLoading" type="button" @click="startWorkflow">
              {{ workflowLoading ? "Starting…" : "Start Approval Workflow" }}
            </button>
          </div>

          <template v-else>
            <div v-if="canAct" class="workflow-comment-box">
              <label for="workflow-comment">Action comment</label>
              <textarea id="workflow-comment" v-model="comment" class="input" rows="4" placeholder="Add context for this workflow action…"></textarea>
              <small>Comments become part of the memo's permanent event history.</small>
            </div>
            <WorkflowInstancePanel
              :workflow="workflow"
              :instance="instance"
              :loading="workflowLoading"
              :can-act="canAct"
              @approve="approve"
              @reject="reject"
              @cancel="cancel"
              @resubmit="resubmit"
            />
          </template>
        </aside>
      </div>
    </template>
  </div>
</template>
