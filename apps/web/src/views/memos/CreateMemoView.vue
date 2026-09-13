<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api, normalizeList } from "../../services/api";

const router = useRouter();
const services = ref([]);
const sbus = ref([]);
const workflows = ref([]);
const loading = ref(false);
const loadingData = ref(true);
const error = ref("");

const form = ref({ title:"", body:"", category:"General", priority:"Normal", businessService:"", requestingSbu:"", beneficiarySBU:"", workflow:"" });

onMounted(loadData);
async function loadData() {
  loadingData.value = true; error.value = "";
  try {
    const [servicesResult, sbusResult, workflowsResult] = await Promise.all([api.listBusinessServices(), api.listSBUs(), api.listWorkflows()]);
    services.value = normalizeList(servicesResult, ["services"]);
    sbus.value = normalizeList(sbusResult, ["sbus"]);
    workflows.value = normalizeList(workflowsResult, ["workflows"]);
  } catch (err) { error.value = err.message || "Unable to load memo options."; }
  finally { loadingData.value = false; }
}

async function submit() {
  error.value = "";
  if (!form.value.title.trim()) return (error.value = "Title is required.");
  if (!form.value.body.trim()) return (error.value = "Memo body is required.");
  if (!form.value.businessService) return (error.value = "Select a business service.");
  if (!form.value.requestingSbu) return (error.value = "Select the requesting SBU.");

  loading.value = true;
  try {
    const result = await api.createMemo({
      title: form.value.title.trim(), body: form.value.body.trim(), category: form.value.category.trim() || "General", priority: form.value.priority,
      businessService: form.value.businessService, requestingSbu: form.value.requestingSbu,
      ...(form.value.beneficiarySBU ? { beneficiarySBU: form.value.beneficiarySBU } : {}),
      ...(form.value.workflow ? { workflow: form.value.workflow } : {}),
    });
    const memo = result?.data || result?.memo || result;
    if (!memo?._id) throw new Error("Memo was created but the API returned no memo ID.");
    router.replace(`/memos/${memo._id}`);
  } catch (err) { error.value = err.message || "Failed to create memo."; }
  finally { loading.value = false; }
}
</script>

<template>
  <div class="page">
    <div class="page-header"><div><span class="page-kicker">MEMO MANAGEMENT</span><h1>Create memo</h1><p>Start a business request and send it into the configured workflow.</p></div></div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <form class="memo-form-new" @submit.prevent="submit">
      <section class="card form-main-new">
        <div class="form-section-title"><span>01</span><div><h2>Memo details</h2><p>Describe what needs to happen.</p></div></div>
        <label>Title<input v-model="form.title" class="input" placeholder="e.g. Office network equipment request" required /></label>
        <label>Memo body<textarea v-model="form.body" class="input textarea" rows="10" placeholder="Explain the request, reason and any relevant details…" required /></label>
        <div class="form-row"><label>Category<input v-model="form.category" class="input" placeholder="General" /></label><label>Priority<select v-model="form.priority" class="input"><option>Low</option><option>Normal</option><option>High</option><option>Critical</option></select></label></div>
      </section>

      <aside class="card form-side-new">
        <div class="form-section-title"><span>02</span><div><h2>Routing</h2><p>Tell MemoFlo where this request belongs.</p></div></div>
        <label>Business service<select v-model="form.businessService" class="input" :disabled="loadingData" required><option value="">{{ loadingData ? "Loading…" : "Select a service" }}</option><option v-for="service in services" :key="service._id" :value="service._id">{{ service.name }}</option></select></label>
        <label>Requesting SBU<select v-model="form.requestingSbu" class="input" :disabled="loadingData" required><option value="">Select SBU</option><option v-for="sbu in sbus" :key="sbu._id" :value="sbu._id">{{ sbu.name }} ({{ sbu.code }})</option></select></label>
        <label>Beneficiary SBU <span class="optional">Optional</span><select v-model="form.beneficiarySBU" class="input" :disabled="loadingData"><option value="">Same as requesting SBU</option><option v-for="sbu in sbus" :key="sbu._id" :value="sbu._id">{{ sbu.name }} ({{ sbu.code }})</option></select></label>
        <label>Workflow <span class="optional">Optional</span><select v-model="form.workflow" class="input"><option value="">Use service/default workflow</option><option v-for="workflow in workflows" :key="workflow._id" :value="workflow._id">{{ workflow.name }}</option></select></label>
        <div class="form-actions sticky-actions"><button type="button" class="btn btn-secondary" @click="router.push('/memos')">Cancel</button><button type="submit" class="btn btn-primary" :disabled="loading || loadingData">{{ loading ? "Creating…" : "Create Memo" }}</button></div>
      </aside>
    </form>
  </div>
</template>
