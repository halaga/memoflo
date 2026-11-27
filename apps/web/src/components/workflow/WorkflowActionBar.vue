<script setup>
import { computed, ref } from "vue";
const props = defineProps({
    instance: {
        type: Object,
        default: null,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    canAct: {
        type: Boolean,
        default: false,
    },
    employees: {
        type: Array,
        default: () => [],
    },
    assignmentLoading: {
        type: Boolean,
        default: false,
    },
});
const selectedEmployeeId = ref("");
const assignmentReason = ref("");
const emit = defineEmits([
    "approve",
    "reject",
    "cancel",
    "resubmit",
    "delegate",
    "reassign",
]);
const status = computed(() => String(props.instance?.status || "").toLowerCase());
const isRunning = computed(() => ["pending", "running"].includes(status.value));
const isRejected = computed(() => status.value === "rejected");
</script>

<template>
<div
    v-if="instance"
    class="workflow-actions"
  >
  <div class="workflow-actions-info">
    <strong>
      Workflow status
    </strong>
    <span class="workflow-status">
      {{ instance.status }}
    </span>
  </div>
  <div class="workflow-action-buttons">
    <button
      v-if="isRunning && canAct"
      class="btn btn-primary"
      :disabled="loading"
      @click="emit('approve')"
    >
      {{ loading ? "Processing..." : "Approve & Continue" }}
    </button>
    <button
      v-if="isRunning && canAct"
      class="btn btn-danger"
      :disabled="loading"
      @click="emit('reject')"
    >
      Reject
    </button>
    <button
      v-if="isRunning && canAct"
      class="btn btn-secondary"
      :disabled="loading"
      @click="emit('cancel')"
    >
      Cancel
    </button>
    <button
      v-if="isRejected"
      class="btn btn-primary"
      :disabled="loading"
      @click="emit('resubmit')"
    >
      Resubmit
    </button>
  </div>
  <div v-if="isRunning && canAct" class="workflow-assignment-tools">
    <label>
      Assign current stage to
      <select v-model="selectedEmployeeId" class="input">
        <option value="">Select an active employee</option>
        <option v-for="person in employees" :key="person._id" :value="person._id">
          {{ [person.firstName, person.lastName].filter(Boolean).join(" ") }}{{ person.email ? ` · ${person.email}` : "" }}
        </option>
      </select>
    </label>
    <label>
      Reason (optional)
      <input v-model="assignmentReason" class="input" maxlength="1000" placeholder="Add a short reason" />
    </label>
    <div class="workflow-action-buttons">
      <button v-if="instance.currentStep?.allowDelegate" class="btn btn-secondary" type="button" :disabled="!selectedEmployeeId || loading || assignmentLoading" @click="emit('delegate', { employeeId: selectedEmployeeId, reason: assignmentReason })">
        {{ assignmentLoading ? "Saving…" : "Delegate" }}
      </button>
      <button class="btn btn-secondary" type="button" :disabled="!selectedEmployeeId || loading || assignmentLoading" @click="emit('reassign', { employeeId: selectedEmployeeId, reason: assignmentReason })">
        {{ assignmentLoading ? "Saving…" : "Reassign" }}
      </button>
    </div>
    <small>Delegation is available only when enabled on this workflow stage. Reassignment changes the current stage's responsible employee.</small>
  </div>
</div>
</template>

<style scoped>
.workflow-assignment-tools{display:grid;gap:.7rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color,#e5e7eb)}.workflow-assignment-tools label{display:grid;gap:.35rem;font-size:.82rem;font-weight:600}.workflow-assignment-tools small{color:var(--text-muted,#64748b);line-height:1.45}
</style>

