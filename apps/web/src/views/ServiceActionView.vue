<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

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
  recipients: [],
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
  "general-memo": { slug: "general-memo", name: "Simple Memo", category: "Communication", actionType: "memo-simple", moduleId: "communication" },
  "approval-memo": { slug: "approval-memo", name: "Approval Memo", category: "Communication", actionType: "memo-approval", moduleId: "communication" },
  "it-support": { slug: "it-support", name: "IT Support", category: "IT", actionType: "it-request", moduleId: "it" },
  "it-maintenance": { slug: "it-maintenance", name: "IT Maintenance", category: "IT", actionType: "it-request", moduleId: "it" },
  "software-installation": { slug: "software-installation", name: "Software Installation", category: "IT", actionType: "it-request", moduleId: "it" },
  "internet-subscription": { slug: "internet-subscription", name: "Internet Subscription", category: "IT", actionType: "it-request", moduleId: "it" },
  "employee-information": { slug: "employee-information", name: "Employee Information Request", category: "People & HR", actionType: "service-request", moduleId: "hr" },
  "recruitment": { slug: "recruitment", name: "Recruitment Request", category: "People & HR", actionType: "recruitment", moduleId: "hr" },
  "fuel-request": { slug: "fuel-request", name: "Fuel Request", category: "Workplace", actionType: "service-request", moduleId: "workplace" },
  "vehicle-repair": { slug: "vehicle-repair", name: "Vehicle Repair", category: "Workplace", actionType: "service-request", moduleId: "workplace" },
  "office-furniture": { slug: "office-furniture", name: "Office Furniture", category: "Workplace", actionType: "service-request", moduleId: "workplace" },
};

const action = computed(() => service.value?.actionType || "service-request");
const enabled = computed(() => {
  const id = service.value?.moduleId;
  if (!id) return true;
  const module = workspace.value?.modules?.find((item) => item.id === id);
  return module ? Boolean(module.enabled) : true;
});
const employee = computed(() => getSavedEmployee());

function back() {
  router.push(`/services/${route.params.slug}`);
}

async function load() {
  loading.value = true;
  error.value = "";
  const slug = String(route.params.slug || "").toLowerCase();
  const [serviceResult, workspaceResult] = await Promise.allSettled([
    api.listBusinessServices(),
    api.getCompanyWorkspace(),
  ]);
  services.value = serviceResult.status === "fulfilled"
    ? normalizeList(serviceResult.value, ["services", "businessServices"])
    : [];
  if (workspaceResult.status === "fulfilled") workspace.value = workspaceResult.value?.data || workspaceResult.value;
  service.value = services.value.find((item) => String(item.slug || "").toLowerCase() === slug) || builtIns[slug] || null;

  if (!service.value) {
    error.value = "This service is not configured yet.";
    loading.value = false;
    return;
  }

  try {
    if (action.value === "memo-simple") {
      employees.value = normalizeList(await api.listEmployeeDirectory(), ["employees"]);
    } else if (action.value === "memo-approval") {
      const [sbuResult, workflowResult] = await Promise.all([
        api.listSBUs(),
        api.listWorkflows(),
      ]);
      sbus.value = normalizeList(sbuResult, ["sbus", "SBUs"]);
      workflows.value = normalizeList(workflowResult, ["workflows"]);
    }
  } catch (err) {
    error.value = err.message || "Some setup data could not be loaded.";
  } finally {
    loading.value = false;
  }
}

async function submitMemo(type) {
  if (!form.value.title.trim() || !form.value.details.trim()) {
    throw new Error("Title and message are required.");
  }
  if (type === "simple" && !form.value.recipients.length) {
    throw new Error("Choose at least one recipient.");
  }
  if (type === "approval" && !form.value.requestingSbu) {
    throw new Error("Choose the requesting SBU.");
  }

  const serviceRecord = services.value.find((item) => item.slug === service.value.slug)
    || services.value.find((item) => item.slug === (type === "simple" ? "general-memo" : "approval-memo"));
  if (type === "approval" && !serviceRecord?._id) {
    throw new Error("The approval memo service has not been configured. Ask an administrator to seed the service catalogue.");
  }

  const payload = {
    title: form.value.title.trim(),
    body: form.value.details.trim(),
    memoType: type,
    priority: form.value.priority,
    ...(type === "simple"
      ? { recipients: form.value.recipients }
      : {
          businessService: serviceRecord._id,
          requestingSbu: form.value.requestingSbu,
          workflow: form.value.workflow || undefined,
        }),
  };
  const result = await api.createMemo(payload);
  const memo = result?.data || result?.memo || result;
  if (!memo?._id) throw new Error("Memo was created but no memo ID was returned.");
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
      headcount: Number(form.value.headcount) || 1,
      item: form.value.item,
      reason: form.value.reason,
    },
  });
  const request = result?.data || result;
  success.value = `Request submitted${request?._id ? ` (${request._id})` : ""}. You can follow it from My Work.`;
  form.value.title = "";
  form.value.details = "";
}

async function submit() {
  error.value = "";
  success.value = "";
  saving.value = true;
  try {
    if (action.value === "memo-simple") return await submitMemo("simple");
    if (action.value === "memo-approval") return await submitMemo("approval");
    if (action.value === "signature") return router.push("/email-signature");
    if (action.value === "leave") return router.push("/leave");
    if (action.value === "procurement") return router.push("/procurement/requests/new");
    if (action.value === "people") return router.push("/people");
    if (action.value === "approvals") return router.push("/approvals");
    await submitGeneric();
  } catch (err) {
    error.value = err.message || "Unable to submit this request.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="experience-page service-action-page">
    <button class="text-button back-link" type="button" @click="back">
      <AppIcon name="chevron" :size="16" /> Services
    </button>

    <section v-if="loading" class="workspace-panel panel-empty">Preparing service…</section>
    <section v-else-if="error && !service" class="workspace-panel service-detail-state">
      <AppIcon name="file" :size="28" /><strong>{{ error }}</strong>
      <button class="action-secondary" type="button" @click="back">Back to service</button>
    </section>
    <template v-else-if="service">
      <header class="page-intro-row service-action-header">
        <div><span class="eyebrow">{{ service.category }}</span><h1>{{ service.name }}</h1><p>Complete the details below. MemoFlo will send it to the relevant recipient or request queue.</p></div>
      </header>
      <div v-if="!enabled" class="service-disabled-panel"><strong>Service unavailable</strong><p>This service is disabled for your company. Contact your administrator.</p></div>
      <form v-else class="workspace-panel service-action-form" @submit.prevent="submit">
        <div v-if="action === 'memo-simple' || action === 'memo-approval'" class="form-section-title">
          <span class="form-section-icon"><AppIcon :name="action === 'memo-simple' ? 'memo' : 'approval'" :size="22" /></span>
          <span><strong>{{ action === "memo-simple" ? "Direct memo" : "Approval memo" }}</strong><small>{{ action === "memo-simple" ? "Delivered directly to every selected recipient." : "Sent through the selected approval route." }}</small></span>
        </div>

        <label class="form-field">Title<input v-model="form.title" class="input" :placeholder="action === 'memo-simple' ? 'Memo subject' : 'Request title'" required /></label>

        <label v-if="action === 'memo-simple'" class="form-field">
          Recipients <small class="field-help">Select one or more colleagues. Use Ctrl (Windows) or Cmd (Mac) to select multiple names.</small>
          <select v-model="form.recipients" class="input multi-select" multiple required>
            <option v-for="person in employees" :key="person._id" :value="person._id">{{ person.firstName }} {{ person.lastName }} · {{ person.email }}</option>
          </select>
        </label>

        <div v-if="action === 'memo-approval'" class="form-two-col">
          <label class="form-field">Requesting SBU<select v-model="form.requestingSbu" class="input" required><option value="">Select SBU</option><option v-for="sbu in sbus" :key="sbu._id" :value="sbu._id">{{ sbu.name }}</option></select></label>
          <label class="form-field">Workflow<select v-model="form.workflow" class="input"><option value="">Use service workflow</option><option v-for="workflow in workflows" :key="workflow._id" :value="workflow._id">{{ workflow.name }}</option></select></label>
        </div>

        <div v-if="action === 'recruitment'" class="form-two-col">
          <label class="form-field">Department<input v-model="form.department" class="input" placeholder="Department" /></label>
          <label class="form-field">Role / position<input v-model="form.role" class="input" placeholder="Role or position" /></label>
          <label class="form-field">Headcount<input v-model.number="form.headcount" class="input" type="number" min="1" /></label>
        </div>

        <label v-if="action === 'it-request'" class="form-field">Requested item or system<input v-model="form.item" class="input" :placeholder="service.name" /></label>
        <label v-if="action === 'service-request'" class="form-field">Reason / purpose<input v-model="form.reason" class="input" placeholder="Why is this needed?" /></label>
        <label class="form-field">Details<textarea v-model="form.details" class="textarea" rows="7" placeholder="Describe what you need, why it is needed, and any relevant details…" required></textarea></label>
        <label class="form-field">Priority<select v-model="form.priority" class="input"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option><option>Critical</option></select></label>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>
        <div class="form-actions">
          <button type="button" class="action-secondary" @click="back">Cancel</button>
          <button type="submit" class="action-primary" :disabled="saving">{{ saving ? "Submitting…" : "Submit request" }} <AppIcon name="arrow" :size="17" /></button>
        </div>
      </form>
    </template>
  </div>
</template>

<style scoped>
.service-action-form { width:100%; box-sizing:border-box; gap:17px; }
.service-action-form .form-two-col { align-items:start; }
.service-form-note { margin:-5px 0 0; padding:12px 14px; border:1px solid var(--mf-border); border-radius:10px; color:var(--mf-muted); background:var(--mf-surface-soft); font-size:12px; line-height:1.55; }
@media(max-width:680px) { .service-action-form { padding:18px; } .service-action-form .form-two-col { grid-template-columns:minmax(0,1fr); } }
</style>
