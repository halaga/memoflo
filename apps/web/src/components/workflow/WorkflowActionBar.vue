<script setup>
import { computed } from "vue";

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
});

const emit = defineEmits([
  "approve",
  "reject",
  "cancel",
  "resubmit",
]);

const status = computed(() =>
  String(props.instance?.status || "").toLowerCase()
);

const isRunning = computed(() =>
  ["pending", "running"].includes(status.value)
);

const isRejected = computed(() =>
  status.value === "rejected"
);
</script>

<template>
  <div
    v-if="instance"
    class="workflow-actions"
  >
    <div class="workflow-actions-info">
      <strong>Workflow status</strong>
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
        v-if="isRunning"
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
  </div>
</template>
