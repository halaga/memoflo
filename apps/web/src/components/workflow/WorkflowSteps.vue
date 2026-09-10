<script setup>
import { computed } from "vue";

const props = defineProps({
  steps: {
    type: Array,
    default: () => [],
  },

  currentStep: {
    type: Object,
    default: null,
  },
});

const orderedSteps = computed(() =>
  [...props.steps].sort(
    (a, b) => Number(a.order || 0) - Number(b.order || 0)
  )
);

function stepPosition(step) {
  return (
    step.position?.title ||
    step.position?.designation?.name ||
    step.position?.code ||
    "Unassigned"
  );
}

function stepOccupant(step) {
  return (
    step.position?.occupant?.firstName
      ? `${step.position.occupant.firstName} ${step.position.occupant.lastName || ""}`
      : "No occupant"
  );
}

function isCurrent(step) {
  return (
    props.currentStep &&
    String(props.currentStep._id) === String(step._id)
  );
}
</script>

<template>
  <div class="workflow-steps">
    <div
      v-for="(step, index) in orderedSteps"
      :key="step._id || index"
      class="workflow-step"
      :class="{ 'workflow-step-current': isCurrent(step) }"
    >
      <div class="workflow-step-number">
        {{ index + 1 }}
      </div>

      <div class="workflow-step-content">
        <div class="workflow-step-header">
          <strong>{{ step.name }}</strong>

          <span
            v-if="isCurrent(step)"
            class="workflow-current-badge"
          >
            Current
          </span>
        </div>

        <div class="workflow-step-meta">
          <span>{{ step.action }}</span>
          <span>•</span>
          <span>{{ stepPosition(step) }}</span>
          <span>•</span>
          <span>{{ stepOccupant(step) }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="!orderedSteps.length"
      class="empty-state"
    >
      No workflow steps configured.
    </div>
  </div>
</template>
