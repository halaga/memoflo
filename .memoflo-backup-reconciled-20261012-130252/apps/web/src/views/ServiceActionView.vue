<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  api,
  getSavedEmployee,
  normalizeList,
} from "../services/api";

const route = useRoute();
const router = useRouter();

const service = ref(null);
const services = ref([]);
const employees = ref([]);
const sbus = ref([]);
const workflows = ref([]);
const workspace = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

const form = ref({
  title: "",
  details: "",
  recipient: "",
  requestingSbu: "",
  workflow: "",
  priority: "Normal",
  department: "",
  role: "",
  headcount: 1,
  item: "",
  reason: "",
});

const builtIns = {
  "general-memo": {
    slug: "general-memo",
    name: "General Memo",
    category: "Communication",
    actionType: "memo-simple",
    moduleId: "communication",
  },
  "approval-memo": {
    slug: "approval-memo",
    name: "Approval Memo",
    category: "Communication",
    actionType: "memo-approval",
    moduleId: "communication",
  },
  "email-signature": {
    slug: "email-signature",
    name: "Email Signature",
    category: "Communication",
    actionType: "signature",
    moduleId: "signature",
  },
  "leave-request": {
    slug: "leave-request",
    name: "Leave Request",
    category: "People & HR",
    actionType: "leave",
    moduleId: "hr",
  },
  "request-leave": {
    slug: "request-leave",
    name: "Leave Request",
    category: "People & HR",
    actionType: "leave",
    moduleId: "hr",
  },
  "business-purchase-request": {
    slug: "business-purchase-request",
    name: "Business Purchase",
    category: "Business Purchase",
    actionType: "procurement",
    moduleId: "procurement",
  },
  "people-directory": {
    slug: "people-directory",
    name: "People Directory",
    category: "People & HR",
    actionType: "people",
    moduleId: "hr",
  },
  "laptop-request": {
    slug: "laptop-request",
    name: "Laptop Request",
    category: "Business Purchase",
    actionType: "procurement",
    moduleId: "procurement",
  },
  "it-support": {
    slug: "it-support",
    name: "IT Support",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
  },
  "it-maintenance": {
    slug: "it-maintenance",
    name: "IT Maintenance",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
  },
  "software-installation": {
    slug: "software-installation",
    name: "Software Installation",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
  },
  "internet-subscription": {
    slug: "internet-subscription",
    name: "Internet Subscription",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
  },
};

const action = computed(
  () => service.value?.actionType || "service-request",
);

const enabled = computed(() => {
  const moduleId = service.value?.moduleId;
  if (!moduleId) return true;

  const module = workspace.value?.modules?.find(
    (item) => item.id === moduleId,
  );

  return module ? Boolean(module.enabled) : true;
});

const employee = computed(() => getSavedEmployee());

function back() {
  router.push(`/services/${route.params.slug}`);
}

async function load() {
  loading.value = true;
  error.value = "";

  const [serviceResult, workspaceResult] = await Promise.allSettled([
    api.listBusinessServices(),
    api.getCompanyWorkspace(),
  ]);

  services.value =
    serviceResult.status === "fulfilled"
      ? normalizeList(serviceResult.value, [
          "services",
          "businessServices",
        ])
      : [];

  workspace.value =
    workspaceResult.status === "fulfilled"
      ? workspaceResult.value?.data || workspaceResult.value
      : null;

  const slug = String(route.params.slug || "").toLowerCase();

  service.value =
    services.value.find(
      (item) => String(item.slug || "").toLowerCase() === slug,
    ) ||
    builtIns[slug] ||
    null;

  if (!service.value) {
    error.value = "Service not found.";
    loading.value = false;
    return;
  }

  try {
    if (action.value === "memo-simple") {
      const result = await api.listEmployeeDirectory();
      employees.value = normalizeList(result, ["employees"]);
    }

    if (action.value === "memo-approval") {
      const [sbuResult, workflowResult] = await Promise.allSettled([
        api.listSBUs(),
        api.listWorkflows(),
      ]);

      sbus.value =
        sbuResult.status === "fulfilled"
          ? normalizeList(sbuResult.value, ["sbus", "SBUs"])
          : [];

      workflows.value =
        workflowResult.status === "fulfilled"
          ? normalizeList(workflowResult.value, ["workflows"])
          : [];
    }
  } catch (err) {
    error.value = err.message || "Unable to load service options.";
  } finally {
    loading.value = false;
  }
}

async function submitMemo(type) {
  if (!form.value.title.trim() || !form.value.details.trim()) {
    throw new Error("Title and message are required.");
  }

  if (type === "simple" && !form.value.recipient) {
    throw new Error("Choose a recipient.");
  }

  if (type === "approval" && !form.value.requestingSbu) {
    throw new Error("Choose the requesting SBU.");
  }

  const serviceRecord = services.value.find(
    (item) =>
      item.slug ===
      (type === "simple" ? "general-memo" : "approval-memo"),
  );

  if (!serviceRecord?._id) {
    throw new Error(
      "The memo service has not been seeded yet. Ask an administrator to refresh the service catalogue.",
    );
  }

  const result = await api.createMemo({
    title: form.value.title.trim(),
    body: form.value.details.trim(),
    memoType: type,
    recipient: type === "simple" ? form.value.recipient : null,
    businessService: serviceRecord._id,
    requestingSbu:
      type === "approval" ? form.value.requestingSbu : null,
    workflow:
      type === "approval" ? form.value.workflow || null : null,
    priority: form.value.priority,
  });

  const memo = result?.data || result?.memo || result;

  router.push(`/memos/${memo._id}`);
}

async function submitGeneric() {
  if (!form.value.title.trim() || !form.value.details.trim()) {
    throw new Error("Title and details are required.");
  }

  const result = await api.createServiceRequest({
    serviceId: service.value?._id,
    title: form.value.title.trim(),
    details: form.value.details.trim(),
    priority: form.value.priority,
    metadata: {
      actionType: action.value,
      department: form.value.department,
      role: form.value.role,
      headcount: form.value.headcount,
      item: form.value.item,
      reason: form.value.reason,
    },
  });

  success.value = `Request submitted successfully. Reference: ${
    result?.data?._id || "created"
  }.`;

  form.value.title = "";
  form.value.details = "";
}

async function submit() {
  error.value = "";
  success.value = "";
  saving.value = true;

  try {
    if (action.value === "signature") {
      router.push("/email-signature");
      return;
    }

    if (action.value === "leave") {
      router.push("/leave");
      return;
    }

    if (action.value === "procurement") {
      router.push("/procurement/requests/new");
      return;
    }

    if (action.value === "people") {
      router.push("/people");
      return;
    }

    if (action.value === "memo-simple") {
      await submitMemo("simple");
      return;
    }

    if (action.value === "memo-approval") {
      await submitMemo("approval");
      return;
    }

    await submitGeneric();
  } catch (err) {
    error.value = err.message || "Unable to submit request.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="experience-page service-action-page">
    <button class="text-button" type="button" @click="back">
      ← Services
    </button>

    <section v-if="loading" class="service-detail-state">
      Loading action…
    </section>

    <section
      v-else-if="error && !service"
      class="service-detail-state error-state"
    >
      <strong>{{ error }}</strong>
      <RouterLink to="/services" class="action-secondary">
        Back to Services
      </RouterLink>
    </section>

    <template v-else-if="service">
      <header class="page-intro-row service-action-header">
        <div>
          <span class="eyebrow">{{ service.category }}</span>
          <h1>{{ service.name }}</h1>
          <p>
            Complete the request below. MemoFlo will send it through the
            appropriate route for this service.
          </p>
        </div>
      </header>

      <div v-if="!enabled" class="service-disabled-panel">
        <strong>Service unavailable</strong>
        <p>
          This service is disabled for your company. Contact your MemoFlo
          administrator.
        </p>
      </div>

      <form
        v-else
        class="workspace-panel service-action-form"
        @submit.prevent="submit"
      >
        <div
          v-if="action === 'memo-simple' || action === 'memo-approval'"
          class="form-section-title"
        >
          <span>M</span>
          <div>
            <strong>
              {{
                action === "memo-simple"
                  ? "Direct memo"
                  : "Approval memo"
              }}
            </strong>
            <small>
              {{
                action === "memo-simple"
                  ? "Sender → recipient → delivered"
                  : "Sender → configured workflow → approver(s)"
              }}
            </small>
          </div>
        </div>

        <label>
          Title
          <input
            v-model="form.title"
            class="input"
            :placeholder="
              action === 'memo-simple'
                ? 'Memo subject'
                : 'Request subject'
            "
          />
        </label>

        <label v-if="action === 'memo-simple'">
          Recipient
          <select v-model="form.recipient" class="input">
            <option value="">Select recipient</option>
            <option
              v-for="person in employees"
              :key="person._id"
              :value="person._id"
            >
              {{ person.firstName }} {{ person.lastName }} ·
              {{ person.email }}
            </option>
          </select>
        </label>

        <div v-if="action === 'memo-approval'" class="form-two-col">
          <label>
            Requesting SBU
            <select v-model="form.requestingSbu" class="input">
              <option value="">Select SBU</option>
              <option
                v-for="sbu in sbus"
                :key="sbu._id"
                :value="sbu._id"
              >
                {{ sbu.name }}
              </option>
            </select>
          </label>

          <label>
            Workflow
            <select v-model="form.workflow" class="input">
              <option value="">Use service workflow</option>
              <option
                v-for="workflow in workflows"
                :key="workflow._id"
                :value="workflow._id"
              >
                {{ workflow.name }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="action === 'recruitment'" class="form-two-col">
          <label>
            Department
            <input
              v-model="form.department"
              class="input"
              placeholder="e.g. Engineering"
            />
          </label>

          <label>
            Role / position
            <input
              v-model="form.role"
              class="input"
              placeholder="e.g. Frontend Developer"
            />
          </label>

          <label>
            Headcount
            <input
              v-model="form.headcount"
              class="input"
              type="number"
              min="1"
            />
          </label>
        </div>

        <label v-if="action === 'it-request'">
          Requested item
          <input
            v-model="form.item"
            class="input"
            placeholder="Laptop, software, internet, support…"
          />
        </label>

        <label>
          Details
          <textarea
            v-model="form.details"
            class="textarea"
            rows="8"
            placeholder="Describe exactly what you need and why."
          ></textarea>
        </label>

        <label>
          Priority
          <select v-model="form.priority" class="input">
            <option>Low</option>
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </label>

        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success">
          {{ success }}
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="back"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="saving"
          >
            {{ saving ? "Submitting…" : "Submit request" }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
