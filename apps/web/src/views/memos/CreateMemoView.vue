<script setup>
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { api, normalizeList } from "../../services/api";

const router = useRouter();

const services = ref([]);
const sbus = ref([]);
const workflows = ref([]);

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
});

async function loadFormData() {
  loadingData.value = true;
  error.value = "";

  try {
    const [serviceResult, sbuResult, workflowResult] =
      await Promise.all([
        api.listBusinessServices(),
        api.listSBUs(),
        api.listWorkflows(),
      ]);

    services.value = normalizeList(serviceResult, [
      "services",
      "businessServices",
    ]);

    sbus.value = normalizeList(sbuResult, ["sbus", "SBUs"]);

    workflows.value = normalizeList(workflowResult, ["workflows"]);
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

  if (!form.value.businessService) {
    error.value = "Please select a business service.";
    return;
  }

  if (!form.value.requestingSbu) {
    error.value = "Please select the requesting SBU.";
    return;
  }

  loading.value = true;

  try {
    const result = await api.createMemo({
      title: form.value.title.trim(),
      body: form.value.body.trim(),
      category: form.value.category,
      priority: form.value.priority,
      businessService: form.value.businessService,
      requestingSbu: form.value.requestingSbu,
      ...(form.value.beneficiarySBU
        ? { beneficiarySBU: form.value.beneficiarySBU }
        : {}),
      ...(form.value.workflow
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
        <span class="page-kicker">MEMO MANAGEMENT</span>
        <h1>Create memo</h1>
        <p>
          Start a business request and route it through your company's
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

        <div class="form-row">
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

          <label>
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

        <div class="form-row">
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
