<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api } from "../../services/api";

const route = useRoute();

const memo = ref(null);
const workflowInstance = ref(null);
const loading = ref(true);
const error = ref("");

onMounted(loadMemo);

async function loadMemo() {
  loading.value = true;
  error.value = "";

  try {
    const result = await api.getMemo(route.params.id);

    memo.value = result?.memo || result?.data || result;

    if (memo.value?.workflowInstance) {
      try {
        workflowInstance.value = await api.getWorkflowInstance(
          memo.value.workflowInstance
        );
      } catch {
        workflowInstance.value = null;
      }
    }
  } catch (err) {
    error.value = err.message || "Failed to load memo.";
  } finally {
    loading.value = false;
  }
}

function serviceName() {
  return memo.value?.businessService?.name || "General Memo";
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div class="page">
    <div v-if="loading" class="empty-state">
      Loading memo...
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <template v-else-if="memo">
      <div class="page-header">
        <div>
          <RouterLink to="/memos" class="text-link">
            ← Back to memos
          </RouterLink>

          <h1>{{ memo.title }}</h1>

          <p>
            {{ memo.referenceNo || "No reference" }}
          </p>
        </div>

        <span class="status-badge">
          {{ memo.status }}
        </span>
      </div>

      <div class="detail-grid">
        <section class="card">
          <h2>Request Details</h2>

          <dl class="detail-list">
            <div>
              <dt>Business Service</dt>
              <dd>{{ serviceName() }}</dd>
            </div>

            <div>
              <dt>Category</dt>
              <dd>{{ memo.category || "-" }}</dd>
            </div>

            <div>
              <dt>Priority</dt>
              <dd>{{ memo.priority || "-" }}</dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>{{ formatDate(memo.createdAt) }}</dd>
            </div>
          </dl>
        </section>

        <section class="card">
          <h2>Workflow</h2>

          <p v-if="workflowInstance">
            Status:
            <strong>{{ workflowInstance.status }}</strong>
          </p>

          <p v-else>
            Workflow information is not currently available.
          </p>
        </section>
      </div>

      <section class="card">
        <h2>Memo</h2>

        <div class="memo-body">
          {{ memo.body }}
        </div>
      </section>
    </template>
  </div>
</template>
