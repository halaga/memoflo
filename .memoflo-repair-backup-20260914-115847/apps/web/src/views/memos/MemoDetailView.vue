<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  api,
  getSavedEmployee,
  normalizeList,
} from "../../services/api";

import MemoStatusBadge from "../../components/memos/MemoStatusBadge.vue";
import WorkflowInstancePanel from "../../components/workflow/WorkflowInstancePanel.vue";

const route = useRoute();
const router = useRouter();

const memo = ref(null);
const workflow = ref(null);
const instance = ref(null);
const workflows = ref([]);

const loading = ref(true);
const workflowLoading = ref(false);
const error = ref("");
const actionError = ref("");

const employee = getSavedEmployee();

const memoId = computed(() => route.params.id);

const currentApproverId = computed(() =>
  memo.value?.currentApprover?._id ||
  memo.value?.currentApprover
);

const employeePositionIds = computed(() =>
  employee?.positions?.map((position) =>
    String(position?._id || position)
  ) || []
);

const canAct = computed(() => {
  if (!memo.value || !instance.value) return false;

  if (
    !["pending", "running"].includes(
      String(instance.value.status || "").toLowerCase()
    )
  ) {
    return false;
  }

  const occupantId =
    instance.value.currentEmployee?._id ||
    instance.value.currentEmployee;

  if (
    occupantId &&
    employee?._id &&
    String(occupantId) === String(employee._id)
  ) {
    return true;
  }

  if (
    currentApproverId.value &&
    employeePositionIds.value.includes(
      String(currentApproverId.value)
    )
  ) {
    return true;
  }

  return false;
});

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const result = await api.getMemo(memoId.value);

    memo.value =
      result?.memo ||
      result?.data ||
      result;

    const workflowResult = await api.listWorkflows();

    workflows.value = normalizeList(
      workflowResult,
      ["workflows"]
    );

    const selectedWorkflowId =
      memo.value?.workflow?._id ||
      memo.value?.workflow;

    if (selectedWorkflowId) {
      await loadWorkflow(selectedWorkflowId);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loadWorkflow(workflowId) {
  if (!workflowId) return;

  try {
    const result = await api.getWorkflow(workflowId);

    workflow.value =
      result?.workflow ||
      result?.data ||
      result;

    if (memo.value?.workflowInstance) {
      await loadInstance(memo.value.workflowInstance);
    }
  } catch (err) {
    actionError.value = err.message;
  }
}

async function loadInstance(instanceId) {
  if (!instanceId) return;

  try {
    const result = await api.getWorkflowInstance(instanceId);

    instance.value =
      result?.instance ||
      result?.data ||
      result;
  } catch (err) {
    actionError.value = err.message;
  }
}

async function startWorkflow() {
  actionError.value = "";

  if (!memo.value) return;

  const workflowId =
    memo.value.workflow?._id ||
    memo.value.workflow ||
    workflows.value.find(
      (item) =>
        item.name === "Procurement Approval"
    )?._id;

  if (!workflowId) {
    actionError.value =
      "No workflow is configured for this memo.";
    return;
  }

  workflowLoading.value = true;

  try {
    const result = await api.startWorkflow(
      workflowId,
      "Memo",
      memo.value._id
    );

    instance.value =
      result?.instance ||
      result?.workflowInstance ||
      result?.data ||
      result;

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
    await api.advanceWorkflow(instance.value._id);
    await load();
  } catch (err) {
    actionError.value = err.message;
  } finally {
    workflowLoading.value = false;
  }
}

async function reject() {
  if (!instance.value?._id) return;

  if (!window.confirm("Reject this memo?")) return;

  workflowLoading.value = true;
  actionError.value = "";

  try {
    await api.rejectWorkflow(instance.value._id);
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
    await api.cancelWorkflow(instance.value._id);
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
    await api.resubmitWorkflow(instance.value._id);
    await load();
  } catch (err) {
    actionError.value = err.message;
  } finally {
    workflowLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <button
          class="btn btn-secondary"
          @click="router.back()"
        >
          ← Back
        </button>

        <h1>Memo Details</h1>
      </div>

      <div
        v-if="memo"
        class="page-header-actions"
      >
        <MemoStatusBadge :status="memo.status" />
      </div>
    </div>

    <div
      v-if="loading"
      class="card"
    >
      Loading memo...
    </div>

    <div
      v-else-if="error"
      class="alert alert-error"
    >
      {{ error }}
    </div>

    <template v-else-if="memo">
      <div class="detail-grid">
        <section class="card">
          <div class="card-header">
            <h3>{{ memo.title }}</h3>
            <span>{{ memo.referenceNo || "No reference" }}</span>
          </div>

          <div class="detail-list">
            <div>
              <span>Category</span>
              <strong>{{ memo.category || "—" }}</strong>
            </div>

            <div>
              <span>Priority</span>
              <strong>{{ memo.priority || "—" }}</strong>
            </div>

            <div>
              <span>Business service</span>
              <strong>
                {{ memo.businessService?.name || "—" }}
              </strong>
            </div>

            <div>
              <span>Created by</span>
              <strong>
                {{
                  memo.createdBy?.firstName
                    ? `${memo.createdBy.firstName} ${memo.createdBy.lastName || ""}`
                    : "—"
                }}
              </strong>
            </div>
          </div>

          <div class="memo-body">
            <h4>Memo</h4>
            <p>{{ memo.body }}</p>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <h3>Workflow Control</h3>
          </div>

          <div
            v-if="actionError"
            class="alert alert-error"
          >
            {{ actionError }}
          </div>

          <div
            v-if="!instance && !memo.workflowInstance"
            class="workflow-start"
          >
            <p>
              This memo has not started its approval workflow.
            </p>

            <button
              class="btn btn-primary"
              :disabled="workflowLoading"
              @click="startWorkflow"
            >
              {{
                workflowLoading
                  ? "Starting..."
                  : "Start Approval Workflow"
              }}
            </button>
          </div>

          <WorkflowInstancePanel
            v-else
            :workflow="workflow"
            :instance="instance"
            :loading="workflowLoading"
            :can-act="canAct"
            @approve="approve"
            @reject="reject"
            @cancel="cancel"
            @resubmit="resubmit"
          />
        </section>
      </div>
    </template>
  </div>
</template>
