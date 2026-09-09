<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api } from "../../services/api";
import MemoStatusBadge from "../../components/memos/MemoStatusBadge.vue";

const route = useRoute();

const memo = ref(null);
const workflowInstance = ref(null);

const loading = ref(true);
const error = ref("");

onMounted(load);

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const result =
      await api.getMemo(route.params.id);

    memo.value =
      result?.memo ||
      result?.data ||
      result;

    const instanceId =
      memo.value?.workflowInstance?._id ||
      memo.value?.workflowInstance;

    if (instanceId) {
      try {
        const result =
          await api.getWorkflowInstance(
            instanceId
          );

        workflowInstance.value =
          result?.instance ||
          result?.data ||
          result;
      } catch {
        workflowInstance.value = null;
      }
    }
  } catch (err) {
    error.value =
      err.message ||
      "Failed to load memo.";
  } finally {
    loading.value = false;
  }
}

function serviceName() {
  return (
    memo.value?.businessService?.name ||
    "General Memo"
  );
}

function creatorName() {
  const creator = memo.value?.createdBy;

  if (!creator) return "-";

  return (
    creator.name ||
    `${creator.firstName || ""} ${
      creator.lastName || ""
    }`.trim() ||
    creator.email ||
    "-"
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
</script>

<template>
  <div class="page">
    <div
      v-if="loading"
      class="empty-state"
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
      <div class="page-header">
        <div>
          <RouterLink
            to="/memos"
            class="text-link"
          >
            ← Back to Memos
          </RouterLink>

          <h1>{{ memo.title }}</h1>

          <p>
            {{ memo.referenceNo || "No reference" }}
          </p>
        </div>

        <MemoStatusBadge
          :status="memo.status"
        />
      </div>

      <div class="detail-grid">
        <section class="card">
          <h2>Request Details</h2>

          <dl class="detail-list">
            <div>
              <dt>Reference</dt>
              <dd>
                {{ memo.referenceNo || "-" }}
              </dd>
            </div>

            <div>
              <dt>Business Service</dt>
              <dd>{{ serviceName() }}</dd>
            </div>

            <div>
              <dt>Category</dt>
              <dd>
                {{ memo.category || "-" }}
              </dd>
            </div>

            <div>
              <dt>Priority</dt>
              <dd>
                {{ memo.priority || "-" }}
              </dd>
            </div>

            <div>
              <dt>Created By</dt>
              <dd>{{ creatorName() }}</dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>
                {{ formatDate(memo.createdAt) }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="card">
          <h2>Workflow</h2>

          <template v-if="workflowInstance">
            <p>
              Workflow:
              <strong>
                {{
                  workflowInstance.workflow?.name ||
                  "Active workflow"
                }}
              </strong>
            </p>

            <p>
              Instance status:
              <strong>
                {{ workflowInstance.status }}
              </strong>
            </p>

            <p
              v-if="
                workflowInstance.currentPosition
              "
            >
              Current position:
              <strong>
                {{
                  workflowInstance
                    .currentPosition?.title ||
                  "-"
                }}
              </strong>
            </p>
          </template>

          <p v-else>
            No active workflow instance is attached
            to this memo.
          </p>
        </section>
      </div>

      <section class="card">
        <h2>Memo Content</h2>

        <div class="memo-body">
          {{ memo.body }}
        </div>
      </section>
    </template>
  </div>
</template>
