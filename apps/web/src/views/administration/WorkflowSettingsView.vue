<script setup>
import { computed, onMounted, ref } from "vue";

import {
  api,
  normalizeList,
} from "../../services/api";

const workflows = ref([]);
const positions = ref([]);

const selectedId = ref("");
const selectedWorkflow = ref(null);

const loading = ref(true);
const saving = ref(false);
const error = ref("");

const showStepForm = ref(false);
const editingStep = ref(null);

const workflowName = ref("");
const workflowDescription = ref("");

const stepForm = ref({
  name: "",
  action: "approve",
  position: "",
  required: true,
  allowDelegate: false,
});

const actions = [
  "submit",
  "minute",
  "approve",
  "reject",
  "forward",
  "review",
  "complete",
  "archive",
  "cancel",
  "reopen",
  "resubmit",
  "pay",
  "receive",
  "acknowledge",
];

const sortedSteps = computed(() =>
  [...(selectedWorkflow.value?.steps || [])].sort(
    (a, b) =>
      Number(a.order || 0) - Number(b.order || 0)
  )
);

async function loadWorkflows() {
  loading.value = true;
  error.value = "";

  try {
    const [workflowResult, positionResult] =
      await Promise.all([
        api.listWorkflows(),
        api.listPositions(),
      ]);

    workflows.value = normalizeList(
      workflowResult,
      ["workflows"]
    );

    positions.value = normalizeList(
      positionResult,
      ["positions"]
    );

    if (workflows.value.length) {
      await selectWorkflow(
        selectedId.value || workflows.value[0]._id
      );
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function selectWorkflow(id) {
  selectedId.value = id;

  const result = await api.getWorkflow(id);

  selectedWorkflow.value =
    result?.workflow ||
    result?.data ||
    result;

  workflowName.value =
    selectedWorkflow.value?.name || "";

  workflowDescription.value =
    selectedWorkflow.value?.description || "";

  resetStepForm();
}

function resetStepForm() {
  editingStep.value = null;

  stepForm.value = {
    name: "",
    action: "approve",
    position: "",
    required: true,
    allowDelegate: false,
  };

  showStepForm.value = false;
}

function editStep(step) {
  editingStep.value = step;

  stepForm.value = {
    name: step.name || "",
    action: step.action || "approve",
    position:
      step.position?._id ||
      step.position ||
      "",
    required: step.required !== false,
    allowDelegate: step.allowDelegate === true,
  };

  showStepForm.value = true;
}

async function saveWorkflow() {
  if (!selectedWorkflow.value?._id) return;

  saving.value = true;
  error.value = "";

  try {
    const result = await api.updateWorkflow(
      selectedWorkflow.value._id,
      {
        name: workflowName.value,
        description: workflowDescription.value,
      }
    );

    selectedWorkflow.value =
      result?.workflow ||
      result?.data ||
      result;

    await loadWorkflows();
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function saveStep() {
  if (!selectedWorkflow.value?._id) return;

  if (!stepForm.value.name.trim()) {
    error.value = "Step name is required.";
    return;
  }

  if (!stepForm.value.position) {
    error.value = "Select a workflow position.";
    return;
  }

  saving.value = true;
  error.value = "";

  try {
    if (editingStep.value) {
      await api.updateWorkflowStep(
        selectedWorkflow.value._id,
        editingStep.value._id,
        {
          name: stepForm.value.name,
          action: stepForm.value.action,
          position: stepForm.value.position,
          required: stepForm.value.required,
          allowDelegate: stepForm.value.allowDelegate,
        }
      );
    } else {
      await api.addWorkflowStep(
        selectedWorkflow.value._id,
        {
          name: stepForm.value.name,
          action: stepForm.value.action,
          position: stepForm.value.position,
          required: stepForm.value.required,
          allowDelegate: stepForm.value.allowDelegate,
          order: sortedSteps.value.length + 1,
        }
      );
    }

    await selectWorkflow(selectedWorkflow.value._id);
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function deleteStep(step) {
  if (!selectedWorkflow.value?._id) return;

  if (!window.confirm(`Delete "${step.name}"?`)) return;

  saving.value = true;
  error.value = "";

  try {
    await api.deleteWorkflowStep(
      selectedWorkflow.value._id,
      step._id
    );

    await selectWorkflow(selectedWorkflow.value._id);
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function deleteWorkflow() {
  if (!selectedWorkflow.value?._id) return;

  if (
    !window.confirm(
      `Delete workflow "${selectedWorkflow.value.name}"?`
    )
  ) {
    return;
  }

  saving.value = true;

  try {
    await api.deleteWorkflow(
      selectedWorkflow.value._id
    );

    selectedWorkflow.value = null;
    selectedId.value = "";

    await loadWorkflows();
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

function positionLabel(position) {
  if (!position) return "Unassigned";

  return [
    position.title,
    position.code
      ? `(${position.code})`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

onMounted(loadWorkflows);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Workflow Settings</h1>
        <p>
          Configure approval workflows, steps and responsible
          positions.
        </p>
      </div>
    </div>

    <div
      v-if="error"
      class="alert alert-error"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="card"
    >
      Loading workflows...
    </div>

    <div
      v-else
      class="workflow-builder"
    >
      <aside class="card workflow-list">
        <div class="card-header">
          <h3>Workflows</h3>
        </div>

        <button
          v-for="item in workflows"
          :key="item._id"
          class="workflow-list-item"
          :class="{
            active: item._id === selectedId,
          }"
          @click="selectWorkflow(item._id)"
        >
          <strong>{{ item.name }}</strong>
          <small>
            {{ item.steps?.length || 0 }} steps
          </small>
        </button>

        <div
          v-if="!workflows.length"
          class="empty-state"
        >
          No workflows found.
        </div>
      </aside>

      <main
        v-if="selectedWorkflow"
        class="workflow-editor"
      >
        <section class="card">
          <div class="card-header">
            <div>
              <h3>Workflow Definition</h3>
              <p>
                {{ selectedWorkflow._id }}
              </p>
            </div>

            <button
              class="btn btn-danger"
              :disabled="saving"
              @click="deleteWorkflow"
            >
              Delete
            </button>
          </div>

          <div class="form-group">
            <label>Name</label>
            <input
              v-model="workflowName"
              class="input"
            />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea
              v-model="workflowDescription"
              class="textarea"
              rows="3"
            />
          </div>

          <div class="form-actions">
            <button
              class="btn btn-primary"
              :disabled="saving"
              @click="saveWorkflow"
            >
              Save Workflow
            </button>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <h3>Workflow Steps</h3>
              <p>
                Steps execute from top to bottom.
              </p>
            </div>

            <button
              class="btn btn-primary"
              @click="showStepForm = true"
            >
              + Add Step
            </button>
          </div>

          <div class="workflow-builder-steps">
            <div
              v-for="(step, index) in sortedSteps"
              :key="step._id"
              class="builder-step"
            >
              <div class="workflow-step-number">
                {{ index + 1 }}
              </div>

              <div class="builder-step-main">
                <div class="workflow-step-header">
                  <strong>{{ step.name }}</strong>

                  <span class="workflow-action">
                    {{ step.action }}
                  </span>
                </div>

                <div class="workflow-step-meta">
                  <span>
                    {{
                      positionLabel(step.position)
                    }}
                  </span>

                  <span>
                    {{
                      step.required
                        ? "Required"
                        : "Optional"
                    }}
                  </span>

                  <span v-if="step.allowDelegate">
                    Delegation allowed
                  </span>
                </div>
              </div>

              <div class="builder-step-actions">
                <button
                  class="btn btn-secondary"
                  @click="editStep(step)"
                >
                  Edit
                </button>

                <button
                  class="btn btn-danger"
                  @click="deleteStep(step)"
                >
                  Delete
                </button>
              </div>
            </div>

            <div
              v-if="!sortedSteps.length"
              class="empty-state"
            >
              No steps configured.
            </div>
          </div>
        </section>

        <section
          v-if="showStepForm"
          class="card"
        >
          <div class="card-header">
            <h3>
              {{
                editingStep
                  ? "Edit Workflow Step"
                  : "Add Workflow Step"
              }}
            </h3>

            <button
              class="btn btn-secondary"
              @click="resetStepForm"
            >
              Close
            </button>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Step name</label>
              <input
                v-model="stepForm.name"
                class="input"
                placeholder="e.g. Finance Approval"
              />
            </div>

            <div class="form-group">
              <label>Action</label>
              <select
                v-model="stepForm.action"
                class="input"
              >
                <option
                  v-for="action in actions"
                  :key="action"
                  :value="action"
                >
                  {{ action }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Responsible position</label>

            <select
              v-model="stepForm.position"
              class="input"
            >
              <option value="">
                Select position
              </option>

              <option
                v-for="position in positions"
                :key="position._id"
                :value="position._id"
              >
                {{ positionLabel(position) }}
              </option>
            </select>
          </div>

          <div class="checkbox-row">
            <label>
              <input
                v-model="stepForm.required"
                type="checkbox"
              />
              Required step
            </label>

            <label>
              <input
                v-model="stepForm.allowDelegate"
                type="checkbox"
              />
              Allow delegation
            </label>
          </div>

          <div class="form-actions">
            <button
              class="btn btn-primary"
              :disabled="saving"
              @click="saveStep"
            >
              {{
                saving
                  ? "Saving..."
                  : "Save Step"
              }}
            </button>
          </div>
        </section>
      </main>

      <div
        v-else
        class="card empty-state"
      >
        Select a workflow to configure it.
      </div>
    </div>
  </div>
</template>
