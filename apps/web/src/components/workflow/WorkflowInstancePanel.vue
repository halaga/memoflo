<script setup>
import { computed } from "vue";
import WorkflowSteps from "./WorkflowSteps.vue";
import WorkflowActionBar from "./WorkflowActionBar.vue";

const props = defineProps({
  workflow: {
    type: Object,
    default: null,
  },

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
});

const emit = defineEmits([
  "approve",
  "reject",
  "cancel",
  "resubmit",
]);

const steps = computed(() =>
  props.workflow?.steps || []
);

const currentStep = computed(() =>
  props.instance?.currentStep || null
);

const currentPosition = computed(() =>
  props.instance?.currentPosition ||
  currentStep.value?.position ||
  null
);

const occupant = computed(() =>
  props.instance?.currentEmployee ||
  currentPosition.value?.occupant ||
  null
);

const occupantName = computed(() => {
  if (!occupant.value) return "Unassigned";

  return [
    occupant.value.firstName,
    occupant.value.lastName,
  ]
    .filter(Boolean)
    .join(" ");
});
</script>

<template>
  <section class="card workflow-panel">
    <div class="card-header">
      <div>
        <h3>Workflow</h3>
        <p>
          {{ workflow?.name || "No workflow selected" }}
        </p>
      </div>

      <span
        v-if="instance"
        class="workflow-status"
      >
        {{ instance.status }}
      </span>
    </div>

    <div
      v-if="!instance"
      class="empty-state"
    >
      This memo has not entered a workflow yet.
    </div>

    <template v-else>
      <div class="workflow-current">
        <div>
          <span class="stat-label">Current step</span>
          <strong>
            {{ currentStep?.name || "Completed" }}
          </strong>
        </div>

        <div>
          <span class="stat-label">Approver</span>
          <strong>
            {{ currentPosition?.title || "—" }}
          </strong>
        </div>

        <div>
          <span class="stat-label">Employee</span>
          <strong>{{ occupantName }}</strong>
        </div>
      </div>

      <WorkflowSteps
        :steps="steps"
        :current-step="currentStep"
      />

      <WorkflowActionBar
        :instance="instance"
        :loading="loading"
        :can-act="canAct"
        @approve="emit('approve')"
        @reject="emit('reject')"
        @cancel="emit('cancel')"
        @resubmit="emit('resubmit')"
      />
    </template>
  </section>
</template>
