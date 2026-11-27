<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";
import AppIcon from "../../components/ui/AppIcon.vue";
const workflows = ref([]);
const positions = ref([]);
const services = ref([]);
const selectedId = ref("");
const selectedWorkflow = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const showWorkflow = ref(false);
const showStep = ref(false);
const editingStep = ref(null);
const workflowForm = ref({
    name: "",
    code: "",
    description: "",
    businessService: "",
});
const stepForm = ref({
    name: "",
    action: "approve",
    position: "",
    assignmentRule: "fixed_position",
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
const sortedSteps = computed(() => {
    return [...(selectedWorkflow.value?.steps || [])].sort((a, b) => a.order - b.order);
});
const unassignedSteps = computed(() => sortedSteps.value.filter((step) => step.assignmentRule !== "beneficiary_sbu_head" && !step.position?.occupant));
async function load() {
    loading.value = true;
    error.value = "";
    try {
        const [workflowResult, positionResult, serviceResult] = await Promise.all([
            api.listWorkflows(),
            api.listPositions(),
            api.listBusinessServices(),
        ]);
        workflows.value = normalizeList(workflowResult);
        positions.value = normalizeList(positionResult);
        services.value = normalizeList(serviceResult);
        if (selectedId.value &&
            workflows.value.some((item) => item._id === selectedId.value)) {
            await selectWorkflow(selectedId.value);
        }
        else if (workflows.value[0]) {
            await selectWorkflow(workflows.value[0]._id);
        }
    }
    catch (err) {
        error.value = err.message || "Unable to load workflows.";
    }
    finally {
        loading.value = false;
    }
}
async function selectWorkflow(id) {
    selectedId.value = id;
    const result = await api.getWorkflow(id);
    const object = result?.data || result;
    selectedWorkflow.value = {
        ...(object?.workflow || object),
        steps: object?.steps ||
            object?.workflow?.steps ||
            [],
    };
    workflowForm.value = {
        name: selectedWorkflow.value.name || "",
        code: selectedWorkflow.value.code || "",
        description: selectedWorkflow.value.description || "",
        businessService: selectedWorkflow.value.businessService?._id ||
            selectedWorkflow.value.businessService ||
            "",
    };
    showStep.value = false;
    success.value = "";
}
function openNewWorkflow() {
    workflowForm.value = {
        name: "",
        code: "",
        description: "",
        businessService: "",
    };
    showWorkflow.value = true;
    error.value = "";
    success.value = "";
}
async function createWorkflow() {
    if (!workflowForm.value.name.trim()) {
        error.value = "Workflow name is required.";
        return;
    }
    if (!workflowForm.value.code.trim()) {
        error.value = "Workflow code is required.";
        return;
    }
    saving.value = true;
    error.value = "";
    try {
        const result = await api.createWorkflow(workflowForm.value);
        const created = result?.data || result;
        showWorkflow.value = false;
        await load();
        if (created?._id) {
            await selectWorkflow(created._id);
        }
        success.value = "Workflow definition created.";
    }
    catch (err) {
        error.value = err.message || "Unable to create workflow.";
    }
    finally {
        saving.value = false;
    }
}
async function openNewStep() {
    editingStep.value = null;
    stepForm.value = {
        name: "",
        action: "approve",
        position: "",
        assignmentRule: "fixed_position",
        required: true,
        allowDelegate: false,
    };
    showStep.value = true;
    error.value = "";
    await nextTick();
    document.querySelector(".workflow-step-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}
async function editStep(step) {
    editingStep.value = step;
    stepForm.value = {
        name: step.name || "",
        action: step.action || "approve",
        position: step.position?._id || step.position || "",
        assignmentRule: step.assignmentRule || "fixed_position",
        required: step.required !== false,
        allowDelegate: step.allowDelegate === true,
    };
    showStep.value = true;
    error.value = "";
}
async function saveStep() {
    if (!selectedId.value) {
        error.value = "Select a workflow first.";
        return;
    }
    if (!stepForm.value.name.trim()) {
        error.value = "Step name is required.";
        return;
    }
    if (!stepForm.value.position) {
        error.value = "Select a responsible position.";
        return;
    }
    saving.value = true;
    error.value = "";
    try {
        if (editingStep.value) {
            await api.updateWorkflowStep(selectedId.value, editingStep.value._id, stepForm.value);
        }
        else {
            await api.addWorkflowStep(selectedId.value, {
                ...stepForm.value,
                order: sortedSteps.value.length + 1,
            });
        }
        await selectWorkflow(selectedId.value);
        showStep.value = false;
        success.value = editingStep.value
            ? "Workflow step updated."
            : "Workflow step added.";
    }
    catch (err) {
        error.value = err.message || "Unable to save workflow step.";
    }
    finally {
        saving.value = false;
    }
}
async function moveStep(step, index, direction) {
    const targetOrder = index + 1 + direction;
    if (targetOrder < 1 || targetOrder > sortedSteps.value.length) return;
    saving.value = true;
    error.value = "";
    try {
        await api.reorderWorkflowStep(selectedId.value, step._id, targetOrder);
        await selectWorkflow(selectedId.value);
        success.value = "Workflow stage order updated.";
    }
    catch (err) {
        error.value = err.message || "Unable to reorder workflow stages.";
    }
    finally {
        saving.value = false;
    }
}
async function toggleWorkflowStatus() {
    if (!selectedWorkflow.value) return;
    const nextActive = selectedWorkflow.value.active === false;
    saving.value = true;
    error.value = "";
    try {
        await api.updateWorkflow(selectedId.value, { active: nextActive });
        await load();
        await selectWorkflow(selectedId.value);
        success.value = nextActive ? "Workflow activated." : "Workflow deactivated.";
    }
    catch (err) {
        error.value = err.message || "Unable to change workflow status.";
    }
    finally {
        saving.value = false;
    }
}
async function removeStep(step) {
    if (!confirm(`Delete "${step.name}"?`)) {
        return;
    }
    saving.value = true;
    error.value = "";
    try {
        await api.deleteWorkflowStep(selectedId.value, step._id);
        await selectWorkflow(selectedId.value);
        success.value = "Workflow step deleted.";
    }
    catch (err) {
        error.value = err.message || "Unable to delete workflow step.";
    }
    finally {
        saving.value = false;
    }
}
async function saveDefinition() {
    if (!selectedId.value) {
        return;
    }
    saving.value = true;
    error.value = "";
    try {
        await api.updateWorkflow(selectedId.value, {
            name: workflowForm.value.name,
            code: workflowForm.value.code,
            description: workflowForm.value.description,
            businessService: workflowForm.value.businessService || null,
        });
        await selectWorkflow(selectedId.value);
        success.value = "Workflow definition saved.";
    }
    catch (err) {
        error.value = err.message || "Unable to save workflow definition.";
    }
    finally {
        saving.value = false;
    }
}
async function removeWorkflow() {
    if (!selectedWorkflow.value) {
        return;
    }
    if (!confirm(`Delete workflow "${selectedWorkflow.value.name}"?`)) {
        return;
    }
    saving.value = true;
    error.value = "";
    try {
        await api.deleteWorkflow(selectedId.value);
        selectedId.value = "";
        selectedWorkflow.value = null;
        await load();
        success.value = "Workflow definition deleted.";
    }
    catch (err) {
        error.value = err.message || "Unable to delete workflow.";
    }
    finally {
        saving.value = false;
    }
}
onMounted(load);
</script>

<template>
<div class="page">
  <div class="page-header">
    <div>
      <span class="page-kicker">
        ADMINISTRATION
      </span>
      <h1>
        Workflow Definitions
      </h1>
      <p>
        Build reusable approval flows for your company's business
        processes.
      </p>
    </div>
    <button
        class="btn btn-primary workflow-primary-button"
        type="button"
        @click="openNewWorkflow"
      >
      <AppIcon name="plus" :size="17" /> Add workflow
    </button>
  </div>
  <div
      v-if="error"
      class="alert alert-error"
    >
    {{ error }}
  </div>
  <div
      v-if="success"
      class="alert alert-success"
    >
    {{ success }}
  </div>
  <div
      v-if="loading"
      class="card empty-state"
    >
    Loading workflows…
  </div>
  <div
      v-else
      class="workflow-builder"
    >
    <aside class="card workflow-list">
      <div class="card-header">
        <h3>
          Definitions
        </h3>
        <span class="count-pill">
          {{ workflows.length }}
        </span>
      </div>
      <button
        v-for="item in workflows"
        :key="item._id"
        type="button"
        class="workflow-list-item"
        :class="{ active: item._id === selectedId }"
        @click="selectWorkflow(item._id)"
      >
        <strong>
          {{ item.name }}
        </strong>
        <small>
          {{ item.code }} · v{{ item.version || 1 }}
        </small>
      </button>
      <button
          type="button"
          class="workflow-list-add"
          @click="openNewWorkflow"
        >
        <AppIcon name="plus" :size="16" /> New workflow
      </button>
    </aside>
    <main
        v-if="selectedWorkflow"
        class="workflow-editor"
      >
      <section class="card">
        <div class="card-header">
          <div>
            <span class="page-kicker">
              DEFINITION
            </span>
            <h2>
              {{ selectedWorkflow.name }}
            </h2>
            <p>
              {{ selectedWorkflow.description || "No description" }}
            </p>
          </div>
          <div class="workflow-definition-actions">
            <span class="workflow-status-pill" :class="selectedWorkflow.active === false ? 'is-inactive' : 'is-active'">
              {{ selectedWorkflow.active === false ? "Inactive" : "Active" }}
            </span>
            <button class="btn btn-secondary" type="button" :disabled="saving" @click="toggleWorkflowStatus">
              {{ selectedWorkflow.active === false ? "Activate" : "Deactivate" }}
            </button>
            <button class="btn btn-danger" type="button" :disabled="saving" @click="removeWorkflow">
              <AppIcon name="trash" :size="15" /> Delete
            </button>
          </div>
        </div>
        <div class="form-row">
          <label>
            Name
            <input
                v-model="workflowForm.name"
                class="input"
              />
          </label>
          <label>
            Code
            <input
                v-model="workflowForm.code"
                class="input"
              />
          </label>
        </div>
        <label>
          Description
          <textarea
              v-model="workflowForm.description"
              class="textarea"
              rows="2"
            >
          </textarea>
        </label>
        <div class="form-actions">
          <button
            class="btn btn-primary"
            type="button"
            :disabled="saving"
            @click="saveDefinition"
          >
            <AppIcon name="check" :size="16" /> Save definition
          </button>
        </div>
      </section>
      <section class="card">
        <div v-if="unassignedSteps.length" class="alert alert-warning workflow-assignment-warning">
          <AppIcon name="users" :size="18" />
          <span>{{ unassignedSteps.length }} workflow position(s) need an assigned office holder before requests can be routed: {{ unassignedSteps.map((step) => step.position?.title || step.name).join(", ") }}.</span>
        </div>
        <div class="card-header">
          <div>
            <h2>
              Workflow steps
            </h2>
            <p>
              Execute the workflow from top to bottom.
            </p>
          </div>
          <button
              class="btn btn-primary"
              type="button"
              :disabled="saving"
              @click="openNewStep"
            >
            <AppIcon name="plus" :size="16" /> Add step
          </button>
        </div>
        <div class="workflow-builder-steps">
          <article
            v-for="(step, index) in sortedSteps"
            :key="step._id"
            class="builder-step"
          >
            <div class="workflow-step-number">
              {{ index + 1 }}
            </div>
            <div class="builder-step-main">
              <strong>
                {{ step.name }}
              </strong>
              <div class="workflow-step-meta">
                <span>
                  {{ step.action }}
                </span>
                <span>
                  {{ step.position?.occupant ? `${step.position.occupant.firstName} ${step.position.occupant.lastName}` : `${step.position?.title || "Unassigned"} · assign office holder` }}
                </span>
                <span>
                  {{ step.required ? "Required" : "Optional" }}
                </span>
                <span v-if="step.assignmentRule === 'beneficiary_sbu_head'">Beneficiary SBU routing</span>
              </div>
            </div>
            <div class="builder-step-actions">
              <button class="btn btn-secondary workflow-move-button" type="button" :disabled="saving || index === 0" :aria-label="`Move ${step.name} up`" title="Move up" @click="moveStep(step, index, -1)">↑</button>
              <button class="btn btn-secondary workflow-move-button" type="button" :disabled="saving || index === sortedSteps.length - 1" :aria-label="`Move ${step.name} down`" title="Move down" @click="moveStep(step, index, 1)">↓</button>
              <button
                class="btn btn-secondary"
                type="button"
                :disabled="saving"
                @click="editStep(step)"
              >
                <AppIcon name="edit" :size="14" /> Edit
              </button>
              <button
                class="btn btn-danger"
                type="button"
                :disabled="saving"
                @click="removeStep(step)"
              >
                <AppIcon name="trash" :size="14" /> Delete
              </button>
            </div>
          </article>
          <div
              v-if="!sortedSteps.length"
              class="empty-state"
            >
            No steps yet. Add the first step.
          </div>
        </div>
      </section>
      <section
          v-if="showStep"
          class="card workflow-step-editor"
        >
        <div class="card-header">
          <div>
            <span class="page-kicker">
              {{ editingStep ? "EDIT STEP" : "NEW STEP" }}
            </span>
            <h2>
              {{ editingStep ? "Edit workflow step" : "Add workflow step" }}
            </h2>
          </div>
          <button
            class="btn btn-secondary"
            type="button"
            @click="showStep = false"
          >
            <AppIcon name="close" :size="15" /> Close
          </button>
        </div>
        <div class="form-row">
          <label>
            Step name
            <input
              v-model="stepForm.name"
              class="input"
              placeholder="Finance approval"
             />
          </label>
          <label>
            Action
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
          </label>
        </div>
        <label>
          Responsible position
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
              {{ position.title }}
              {{ position.code ? `— ${position.code}` : "" }}
            </option>
          </select>
        </label>
        <label>
          Assignment rule
          <select v-model="stepForm.assignmentRule" class="input">
            <option value="fixed_position">Fixed position</option>
            <option value="beneficiary_sbu_head">Head of Beneficiary SBU</option>
          </select>
          <small>Use Beneficiary SBU routing when the approver changes with the request's selected SBU.</small>
        </label>
        <label class="check-label">
          <input
              v-model="stepForm.required"
              type="checkbox"
            />
          Required step
        </label>
        <label class="check-label">
          <input
              v-model="stepForm.allowDelegate"
              type="checkbox"
            />
          Allow delegation
        </label>
        <div class="form-actions">
          <button
            class="btn btn-primary"
            type="button"
            :disabled="saving"
            @click="saveStep"
          >
            {{ saving ? "Saving…" : "Save step" }}
          </button>
        </div>
      </section>
    </main>
    <div
        v-else
        class="card empty-state"
      >
      Create your first workflow definition.
    </div>
  </div>
  <div
      v-if="showWorkflow"
      class="modal-backdrop"
    >
    <section class="card modal-card">
      <div class="card-header">
        <div>
          <span class="page-kicker">
            NEW DEFINITION
          </span>
          <h2>
            Add workflow
          </h2>
        </div>
        <button
            class="btn btn-secondary"
            type="button"
            @click="showWorkflow = false"
          >
          <AppIcon name="close" :size="15" /> Close
        </button>
      </div>
      <label>
        Name
        <input
          v-model="workflowForm.name"
          class="input"
          placeholder="IT Equipment Approval"
         />
      </label>
      <label>
        Code
        <input
          v-model="workflowForm.code"
          class="input"
          placeholder="IT_EQUIPMENT_APPROVAL"
         />
      </label>
      <label>
        Description
        <textarea
            v-model="workflowForm.description"
            class="textarea"
            rows="3"
          >
        </textarea>
      </label>
      <label>
        Business service
        <select
            v-model="workflowForm.businessService"
            class="input"
          >
          <option value="">
            General workflow
          </option>
          <option
            v-for="service in services"
            :key="service._id"
            :value="service._id"
          >
            {{ service.name }}
          </option>
        </select>
      </label>
      <div class="form-actions">
        <button
          class="btn btn-primary"
          type="button"
          :disabled="saving"
          @click="createWorkflow"
        >
          <AppIcon name="check" :size="16" /> {{ saving ? "Creating…" : "Create workflow" }}
        </button>
      </div>
    </section>
  </div>
</div>
</template>


<style scoped>
.workflow-primary-button,.workflow-list-add,.builder-step-actions button,.form-actions button,.card-header button{display:inline-flex;align-items:center;justify-content:center;gap:.45rem}.workflow-list-item{display:grid;gap:.3rem;width:100%;padding:.9rem 1rem;border:1px solid transparent;border-radius:12px;text-align:left;background:transparent;transition:background .15s ease,border-color .15s ease}.workflow-list-item:hover{background:var(--surface-muted,#f8fafc)}.workflow-list-item.active{background:var(--surface-muted,#f1f5f9);border-color:var(--border-color,#dbe3ef)}.workflow-list-item small{color:var(--text-muted,#64748b)}.workflow-builder-steps{display:grid;gap:.75rem}.builder-step{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:.9rem;padding:1rem;border:1px solid var(--border-color,#e5e7eb);border-radius:14px;background:var(--surface,#fff)}.workflow-step-number{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:var(--surface-muted,#eff6ff);font-weight:800;color:var(--primary,#2563eb)}.workflow-step-meta{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.4rem}.workflow-step-meta span{padding:.25rem .5rem;border-radius:999px;background:var(--surface-muted,#f1f5f9);font-size:.75rem;color:var(--text-muted,#64748b)}.builder-step-actions{display:flex;gap:.4rem}.workflow-primary-button{border-radius:12px;padding:.7rem 1rem;box-shadow:0 5px 14px rgba(37,99,235,.15)}@media(max-width:640px){.builder-step{grid-template-columns:34px minmax(0,1fr)}.builder-step-actions{grid-column:1/-1;justify-content:flex-end}.workflow-builder{grid-template-columns:1fr!important}}.workflow-assignment-warning{display:flex;align-items:flex-start;gap:.65rem;line-height:1.5}
.workflow-definition-actions{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}.workflow-status-pill{display:inline-flex;align-items:center;padding:.35rem .65rem;border-radius:999px;font-size:.75rem;font-weight:700}.workflow-status-pill.is-active{background:#dcfce7;color:#166534}.workflow-status-pill.is-inactive{background:#f1f5f9;color:#475569}.workflow-move-button{min-width:34px;padding:.35rem .55rem;font-size:1rem;line-height:1}
</style>
