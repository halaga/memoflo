<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../../services/api";

const router = useRouter();

const services = ref([]);
const loading = ref(false);
const loadingServices = ref(true);
const error = ref("");

const form = ref({
  title: "",
  body: "",
  category: "General",
  priority: "Normal",
  businessService: "",
  requestingSBU: "",
  beneficiarySBU: "",
});

onMounted(loadServices);

async function loadServices() {
  try {
    const result =
      await api.listBusinessServices();

    services.value = Array.isArray(result)
      ? result
      : result?.services ||
        result?.data ||
        [];
  } catch (err) {
    error.value =
      err.message ||
      "Failed to load business services.";
  } finally {
    loadingServices.value = false;
  }
}

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
    error.value =
      "Please select a business service.";
    return;
  }

  if (!form.value.requestingSBU.trim()) {
    error.value =
      "Requesting SBU is required.";
    return;
  }

  loading.value = true;

  try {
    const result = await api.createMemo({
      title: form.value.title.trim(),
      body: form.value.body.trim(),
      category: form.value.category,
      priority: form.value.priority,
      businessService:
        form.value.businessService,
      requestingSBU:
        form.value.requestingSBU.trim(),
      ...(form.value.beneficiarySBU.trim()
        ? {
            beneficiarySBU:
              form.value.beneficiarySBU.trim(),
          }
        : {}),
    });

    const memo =
      result?.memo ||
      result?.data ||
      result;

    if (!memo?._id) {
      throw new Error(
        "Memo was created but no memo ID was returned."
      );
    }

    router.push(`/memos/${memo._id}`);
  } catch (err) {
    error.value =
      err.message ||
      "Failed to create memo.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Create Memo</h1>
        <p>
          Submit a request into your organization's
          workflow.
        </p>
      </div>
    </div>

    <section class="card form-card">
      <div
        v-if="error"
        class="alert alert-error"
      >
        {{ error }}
      </div>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="title">Title</label>

          <input
            id="title"
            v-model="form.title"
            class="input"
            required
            placeholder="What is this memo about?"
          />
        </div>

        <div class="form-group">
          <label for="service">
            Business Service
          </label>

          <select
            id="service"
            v-model="form.businessService"
            class="input"
            required
            :disabled="loadingServices"
          >
            <option value="">
              {{
                loadingServices
                  ? "Loading services..."
                  : "Select a service"
              }}
            </option>

            <option
              v-for="service in services"
              :key="service._id"
              :value="service._id"
            >
              {{ service.name }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">
              Category
            </label>

            <input
              id="category"
              v-model="form.category"
              class="input"
              placeholder="e.g. Procurement"
            />
          </div>

          <div class="form-group">
            <label for="priority">
              Priority
            </label>

            <select
              id="priority"
              v-model="form.priority"
              class="input"
            >
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="requesting-sbu">
            Requesting SBU ID
          </label>

          <input
            id="requesting-sbu"
            v-model="form.requestingSBU"
            class="input"
            required
            placeholder="SBU ObjectId"
          />

          <small>
            Temporary ID field until the SBU API is
            exposed by the organization module.
          </small>
        </div>

        <div class="form-group">
          <label for="beneficiary-sbu">
            Beneficiary SBU ID
          </label>

          <input
            id="beneficiary-sbu"
            v-model="form.beneficiarySBU"
            class="input"
            placeholder="Optional SBU ObjectId"
          />
        </div>

        <div class="form-group">
          <label for="body">
            Memo Body
          </label>

          <textarea
            id="body"
            v-model="form.body"
            class="input textarea"
            rows="10"
            required
            placeholder="Describe the request..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn"
            @click="router.push('/memos')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
          >
            {{
              loading
                ? "Submitting..."
                : "Submit Memo"
            }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
