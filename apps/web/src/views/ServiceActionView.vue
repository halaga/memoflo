<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, normalizeList, getSavedEmployee } from "../services/api";

const route = useRoute(); const router = useRouter();
const service = ref(null); const services = ref([]); const employees = ref([]); const sbus = ref([]); const workflows = ref([]); const workspace = ref(null);
const loading = ref(true); const saving = ref(false); const error = ref(""); const success = ref("");
const form = ref({ title: "", details: "", recipient: "", requestingSbu: "", workflow: "", priority: "Normal", department: "", role: "", headcount: 1, item: "", reason: "" });

const builtIns = {
  "general-memo": { slug: "general-memo", name: "Simple Memo", category: "Communication", actionType: "memo-simple", moduleId: "communication", requiresSbu: false },
  "approval-memo": { slug: "approval-memo", name: "Approval Memo", category: "Communication", actionType: "memo-approval", moduleId: "communication", requiresSbu: true },
  "email-signature": { slug: "email-signature", name: "Email Signature", category: "Communication", actionType: "signature", moduleId: "signature" },
  "request-leave": { slug: "request-leave", name: "Leave Request", category: "People & HR", actionType: "leave", moduleId: "hr" },
  "business-purchase-request": { slug: "business-purchase-request", name: "Business Purchase Request", category: "Business", actionType: "procurement", moduleId: "procurement" },
  "people-directory": { slug: "people-directory", name: "People Directory", category: "People & HR", actionType: "people", moduleId: "hr" },
};

const action = computed(() => service.value?.actionType || "service-request");
const enabled = computed(() => { const id = service.value?.moduleId; if (!id) return true; const item = workspace.value?.modules?.find((m) => m.id === id); return item ? Boolean(item.enabled) : true; });
const employee = computed(() => getSavedEmployee());

function back() { router.push(`/services/${route.params.slug}`); }
async function load() {
  loading.value = true; error.value = "";
  try {
    const [svc, ws] = await Promise.all([api.listBusinessServices(), api.getCompanyWorkspace()]);
    services.value = normalizeList(svc, ["services", "businessServices"]); workspace.value = ws?.data || ws;
    const slug = String(route.params.slug || "").toLowerCase(); service.value = services.value.find((x) => String(x.slug).toLowerCase() === slug) || builtIns[slug] || null;
    if (service.value?.actionType === "memo-simple") { const emp = await api.listEmployeeDirectory(); employees.value = normalizeList(emp, ["employees"]); }
    if (service.value?.actionType === "memo-approval") { const [sbu, wf] = await Promise.all([api.listSBUs(), api.listWorkflows()]); sbus.value = normalizeList(sbu, ["sbus", "SBUs"]); workflows.value = normalizeList(wf, ["workflows"]); }
    if (!service.value) throw new Error("Service not found.");
    if (!enabled.value) return;
    const current = employee.value;
    if (service.value.actionType === "memo-simple") form.value.title = "";
    if (service.value.actionType === "memo-approval") form.value.title = "";
  } catch (e) { error.value = e.message || "Unable to load service action."; }
  finally { loading.value = false; }
}

async function submitMemo(type) {
  const s = services.value.find((x) => x.slug === "general-memo" || x.slug === "approval-memo");
  if (!form.value.title.trim() || !form.value.details.trim()) throw new Error("Title and message are required.");
  if (type === "simple" && !form.value.recipient) throw new Error("Choose a recipient.");
  if (type === "approval" && !form.value.requestingSbu) throw new Error("Choose the requesting SBU.");
  if (!s?._id) throw new Error("The memo service has not been seeded yet.");
  const result = await api.createMemo({ title: form.value.title.trim(), body: form.value.details.trim(), memoType: type, recipient: type === "simple" ? form.value.recipient : null, businessService: s._id, requestingSbu: type === "approval" ? form.value.requestingSbu : null, workflow: type === "approval" ? (form.value.workflow || null) : null, priority: form.value.priority });
  const memo = result?.data || result?.memo || result; router.push(`/memos/${memo._id}`);
}

async function submitGeneric() {
  if (!form.value.title.trim() || !form.value.details.trim()) throw new Error("Title and details are required.");
  const result = await api.createServiceRequest({ serviceId: service.value?._id, title: form.value.title.trim(), details: form.value.details.trim(), priority: form.value.priority, metadata: { actionType: action.value, department: form.value.department, role: form.value.role, headcount: form.value.headcount, item: form.value.item, reason: form.value.reason } });
  success.value = `Request submitted successfully. Reference: ${result?.data?._id || "created"}`; form.value.title = ""; form.value.details = "";
}

async function submit() {
  error.value = ""; success.value = ""; saving.value = true;
  try {
    if (action.value === "signature") return router.push("/email-signature");
    if (action.value === "leave") return router.push("/leave");
    if (action.value === "procurement") return router.push("/procurement/requests/new");
    if (action.value === "people") return router.push("/people");
    if (action.value === "memo-simple") return await submitMemo("simple");
    if (action.value === "memo-approval") return await submitMemo("approval");
    await submitGeneric();
  } catch (e) { error.value = e.message || "Unable to submit request."; }
  finally { saving.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="experience-page service-action-page">
    <button class="text-button" type="button" @click="back">← Services</button>
    <section v-if="loading" class="service-detail-state">Loading action…</section>
    <section v-else-if="error && !service" class="service-detail-state error-state"><strong>{{ error }}</strong></section>
    <template v-else-if="service">
      <header class="page-intro-row service-action-header"><div><span class="eyebrow">{{ service.category }}</span><h1>{{ service.name }}</h1><p>This service has its own action. MemoFlo does not force every service through the memo composer.</p></div></header>
      <div v-if="!enabled" class="service-disabled-panel"><strong>Service unavailable</strong><p>This service is disabled for your company. Contact your MemoFlo administrator.</p></div>
      <form v-else class="workspace-panel service-action-form" @submit.prevent="submit">
        <div v-if="action === 'memo-simple' || action === 'memo-approval'" class="form-section-title"><span>M</span><div><strong>{{ action === 'memo-simple' ? 'Direct memo' : 'Approval memo' }}</strong><small>{{ action === 'memo-simple' ? 'Sender → recipient → delivered' : 'Sender → configured workflow → approver(s)' }}</small></div></div>
        <label>Title<input v-model="form.title" class="input" :placeholder="action === 'memo-simple' ? 'Memo subject' : 'Approval memo subject'" /></label>
        <label v-if="action === 'memo-simple'">Recipient<select v-model="form.recipient" class="input"><option value="">Select recipient</option><option v-for="person in employees" :key="person._id" :value="person._id">{{ person.firstName }} {{ person.lastName }} · {{ person.email }}</option></select></label>
        <div v-if="action === 'memo-approval'" class="form-two-col"><label>Requesting SBU<select v-model="form.requestingSbu" class="input"><option value="">Select SBU</option><option v-for="s in sbus" :key="s._id" :value="s._id">{{ s.name }}</option></select></label><label>Workflow<select v-model="form.workflow" class="input"><option value="">Use service workflow</option><option v-for="w in workflows" :key="w._id" :value="w._id">{{ w.name }}</option></select></label></div>
        <div v-if="action === 'recruitment'" class="form-two-col"><label>Department<input v-model="form.department" class="input" placeholder="e.g. Engineering" /></label><label>Role / position<input v-model="form.role" class="input" placeholder="e.g. Frontend Developer" /></label><label>Headcount<input v-model="form.headcount" class="input" type="number" min="1" /></label></div>
        <label v-if="action === 'it-request'">Requested item<input v-model="form.item" class="input" placeholder="Laptop, software, internet, support…" /></label>
        <label>Details<textarea v-model="form.details" class="textarea" rows="8" placeholder="Describe exactly what you need and why."></textarea></label>
        <label>Priority<select v-model="form.priority" class="input"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></label>
        <div v-if="error" class="alert alert-error">{{ error }}</div><div v-if="success" class="alert alert-success">{{ success }}</div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" @click="back">Cancel</button><button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Submitting…' : (action === 'memo-simple' ? 'Send memo' : action === 'memo-approval' ? 'Create approval memo' : 'Submit request') }}</button></div>
      </form>
    </template>
  </div>
</template>
