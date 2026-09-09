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
    const result = await api.listBusinessServices();

    services.value = Array.isArray(result)
      ? result
      : result?.services || result?.data || [];
  } catch (err) {
    error.value = err.message || "Failed to load business services.";
  } finally {
    loadingServices.value = false;
  }
}

async function submit() {
  error.value = "";

  if (!form.value.title.trim()) {
    error.value = "Memo title is required.";
    return;
  }

  if (!form.value.body.trim()) {
    error.value = "Memo body is required.";
    return;
  }

  if (!form.value.businessService) {
    error.value = "Business service is required.";
    return;
  }

  if (!form.value.requestingSBU) {
    error.value = "Requesting SBU is required.";
    return;
  }

  loading.value = true;

  try {
    const result = await api.createMemo({
      title: form.value.title,
      body: form.value.body,
      category: form.value.category,
      priority: form.value.priority,
      businessService: form.value.businessService,
      requestingSBU: form.value.requestingSBU,
      beneficiarySBU: form.value.beneficiarySBU || undefined,
    });

    const memo = result?.memo || result?.data || result;

    router.push(`/memos/${memo._id}`);
  } catch (err) {
    error.value = err.message || "Failed to create memo.";
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
        <p>Submit a new request into the MemoFlo workflow.</p>
      </div>
    </div>

    <div class="card form-card">
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Title</label>
          <input v-model="form.title" class="input" required />
        </div>

        <div class="form-group">
          <label>Business Service</label>

          <select
            v-model="form.businessService"
            class="input"
            required
            :disabled="loadingServices"
          >
            <option value="">
              {{ loadingServices ? "Loading..." : "Select service" }}
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
            <label>Category</label>

            <input
              v-model="form.category"
              class="input"
              placeholder="e.g. Procurement"
            />
          </div>

          <div class="form-group">
            <label>Priority</label>

            <select v-model="form.priority" class="input">
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Requesting SBU ID</label>

          <input
            v-model="form.requestingSBU"
            class="input"
            placeholder="SBU ObjectId"
            required
          />

          <small>
            SBU selection will become a proper selector once the SBU API is
            exposed.
          </small>
        </div>

        <div class="form-group">
          <label>Beneficiary SBU ID</label>

          <input
            v-model="form.beneficiarySBU"
            class="input"
            placeholder="Optional SBU ObjectId"
          />
        </div>

        <div class="form-group">
          <label>Memo Body</label>

          <textarea
            v-model="form.body"
            class="input textarea"
            rows="8"
            required
          ></textarea>
        </div>

        <button class="btn btn-primary" :disabled="loading">
          {{ loading ? "Submitting..." : "Submit Memo" }}
        </button>
      </form>
    </div>
  </div>
</template>
