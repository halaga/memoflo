<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, normalizeList } from "../../services/api";

const router = useRouter();
const route = useRoute();

const services = ref([]);
const sbus = ref([]);
const workflows = ref([]);
const employees = ref([]);

const loading = ref(false);
const loadingData = ref(true);
const error = ref("");

const form = ref({
  title: "",
  body: "",
  category: "General",
  priority: "Normal",
  businessService: "",
  requestingSbu: "",
  beneficiarySBU: "",
  workflow: "",
  memoType: "simple",
  recipients: [],
});

async function loadFormData() {
  loadingData.value = true;
  error.value = "";

  try {
    const [serviceResult, sbuResult, workflowResult, employeeResult] = await Promise.all([api.listBusinessServices(), api.listSBUs(), api.listWorkflows(), api.listEmployeeDirectory()]);

    services.value = normalizeList(serviceResult, [
      "services",
      "businessServices",
    ]);

    const requestedService = String(route.query.service || "");
    if (requestedService) {
      const match = services.value.find((item) => String(item._id) === requestedService || String(item.slug) === requestedService);
      if (match) {
        form.value.businessService = match._id;
        if (!form.value.title) form.value.title = `${match.name} request`;
      }
    }

    sbus.value = normalizeList(sbuResult, ["sbus", "SBUs"]);

    workflows.value = normalizeList(workflowResult, ["workflows"]);
    employees.value = normalizeList(employeeResult);
  } catch (err) {
    error.value =
      err.message || "Unable to load memo setup data.";
  } finally {
    loadingData.value = false;
  }
}

function applyServiceDefaults() {
  const service = services.value.find(
    (item) => String(item._id) === String(form.value.businessService)
  );

  if (!service) return;

  form.value.category = service.category || "General";

  const workflowId =
    service.workflow?._id ||
    service.workflow ||
    "";

  if (workflowId) {
    form.value.workflow = String(workflowId);
  }
}

watch(
  () => form.value.businessService,
  applyServiceDefaults
);

async function submit() {
  error.value = "";

  if (!form.value.title.trim()) {
    error.value = "Title is required.";
    return;
  }

  if (!form.value.body.trim()) {
    error.value = "Memo body is required.";
    return;
  }

  if (form.value.memoType !== "simple" && !form.value.businessService) { error.value = "Please select a business service."; return; }
  if (form.value.memoType === "simple" && !form.value.recipients.length) { error.value = "Select at least one recipient."; return; }

  loading.value = true;

  try {
    const result = await api.createMemo({
      title: form.value.title.trim(),
      body: form.value.body.trim(),
      category: form.value.category,
      priority: form.value.priority,
      businessService: form.value.businessService,
      memoType: form.value.memoType,
      recipients: form.value.recipients,
      ...(form.value.requestingSbu ? { requestingSbu: form.value.requestingSbu } : {}),
      ...(form.value.beneficiarySBU
        ? { beneficiarySBU: form.value.beneficiarySBU }
        : {}),
      ...(form.value.memoType !== "simple" && form.value.workflow
        ? { workflow: form.value.workflow }
        : {}),
    });

    const memo = result?.memo || result?.data || result;

    if (!memo?._id) {
      throw new Error(
        "Memo was created but no memo ID was returned."
      );
    }

    router.push(`/memos/${memo._id}`);
  } catch (err) {
    error.value = err.message || "Failed to create memo.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadFormData);
</script>

<template>
  <div class="page module-page">
    <div class="page-header">
      <div>
        <span class="page-kicker">SERVICE REQUEST</span>
        <h1>{{ route.query.service ? "Request a service" : "Create memo" }}</h1>
        <p>
          Send a direct memo or create a request that follows your company's
          configured workflow.
        </p>
      </div>

      <button
        class="btn btn-secondary"
        type="button"
        @click="router.push('/memos')"
      >
        Back to memos
      </button>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-if="loadingData" class="card empty-state">
      Loading business services, SBUs and workflows…
    </div>

    <section v-else class="card form-card premium-form-card">
      <form @submit.prevent="submit">
        <div class="form-row">
          <label>Memo type<select v-model="form.memoType" class="input"><option value="simple">Simple memo — deliver directly</option><option value="approval">Approval memo — use workflow</option><option value="request">Request memo — start a business request</option></select></label>
          <label>
            Title
            <input
              v-model="form.title"
              class="input"
              placeholder="Laptop replacement request"
              required
            />
          </label>

          <label>
            Priority
            <select v-model="form.priority" class="input">
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
              <option>Critical</option>
            </select>
          </label>
        </div>

        <div v-if="form.memoType === 'simple'" class="form-row">
          <label>Recipients (one or many)<select v-model="form.recipients" class="input" multiple size="5"><option v-for="person in employees" :key="person._id" :value="person._id">{{person.firstName}} {{person.lastName}} · {{person.email}}</option></select></label>
          <div class="people-setup-hint"><span>Delivery</span><strong>Every selected recipient receives the same memo at the same time.</strong></div>
        </div>

        <div v-if="form.memoType !== 'simple'" class="form-row">
          <label>
            Business service
            <select
              v-model="form.businessService"
              class="input"
              required
            >
              <option value="">Select a service</option>
              <option
                v-for="service in services"
                :key="service._id"
                :value="service._id"
              >
                {{ service.name }}
              </option>
            </select>
          </label>

          <label v-if="form.memoType !== 'simple'">
            Workflow
            <select v-model="form.workflow" class="input">
              <option value="">
                No workflow selected
              </option>
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

        <div v-if="form.memoType !== 'simple'" class="form-row">
          <label>
            Requesting SBU
            <select
              v-model="form.requestingSbu"
              class="input"
              required
            >
              <option value="">Select requesting SBU</option>
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
            Beneficiary SBU
            <select v-model="form.beneficiarySBU" class="input">
              <option value="">Same as requesting / not specified</option>
              <option
                v-for="sbu in sbus"
                :key="sbu._id"
                :value="sbu._id"
              >
                {{ sbu.name }}
              </option>
            </select>
          </label>
        </div>

        <label>
          Category
          <input
            v-model="form.category"
            class="input"
            placeholder="IT Services"
          />
        </label>

        <label>
          Memo details
          <textarea
            v-model="form.body"
            class="textarea"
            rows="10"
            placeholder="Describe what you need, why it is needed and any relevant details…"
            required
          ></textarea>
        </label>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="router.push('/memos')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
          >
            {{ loading ? "Creating…" : "Create memo" }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
