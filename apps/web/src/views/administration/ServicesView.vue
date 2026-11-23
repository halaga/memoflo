<script setup>
import { computed, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";
import AppIcon from "../../components/ui/AppIcon.vue";

const services = ref([]);
const departments = ref([]);
const workflows = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const editingId = ref("");
const search = ref("");
const requisitionText = ref("");
const attachmentText = ref("");
const audienceText = ref("");
const form = ref(blankForm());
const iconOptions = ["services", "memo", "approval", "receipt", "droplet", "zap", "building", "package", "sparkles", "chart", "wallet", "laptop", "monitor", "code", "wifi", "wrench", "settings", "calendar", "users", "file-check"];

function blankForm() {
  return {
    name: "", slug: "", category: "", description: "", ownerDepartment: "",
    responsibleDepartment: "", workflow: "", icon: "services", color: "#2563EB",
    allowedRequisitionTypes: [], requisitionWorkflowMap: {}, audienceGroups: [], formSchema: [], requiredAttachments: [],
    defaultPriority: "Normal", financialRequired: false, paymentRequired: false,
    inventoryFulfilment: false, slaHours: "", active: true,
  };
}
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return services.value.filter((item) => !term || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(term));
});
function splitList(value) { return [...new Set(String(value || "").split(/[\n,]/).map((part) => part.trim()).filter(Boolean))]; }
function syncTextFromForm() {
  requisitionText.value = (form.value.allowedRequisitionTypes || []).join(", ");
  attachmentText.value = (form.value.requiredAttachments || []).join(", ");
  audienceText.value = (form.value.audienceGroups || []).join(", ");
}
function reset() { editingId.value = ""; form.value = blankForm(); syncTextFromForm(); }
function edit(item) {
  editingId.value = item._id;
  form.value = {
    ...blankForm(), ...item,
    ownerDepartment: item.ownerDepartment?._id || item.ownerDepartment || "",
    workflow: item.workflow?._id || item.workflow || "",
    slaHours: item.slaHours ?? "",
    formSchema: (item.formSchema || []).map((field) => ({ ...field, optionsText: (field.options || []).join(", ") })),
    requisitionWorkflowMap: { ...(item.requisitionWorkflowMap || {}) },
  };
  syncTextFromForm();
  document.getElementById("service-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
function addField() { form.value.formSchema.push({ key: "", label: "", type: "text", required: false, placeholder: "", options: [], optionsText: "" }); }
function removeField(index) { form.value.formSchema.splice(index, 1); }
async function load() {
  loading.value = true; error.value = "";
  try {
    const [serviceResult, departmentResult, workflowResult] = await Promise.all([api.listBusinessServicesAdmin(), api.listDepartments(), api.listWorkflows()]);
    services.value = normalizeList(serviceResult, ["services", "businessServices"]);
    departments.value = normalizeList(departmentResult, ["departments"]);
    workflows.value = normalizeList(workflowResult, ["workflows"]);
  } catch (err) { error.value = err.message || "Unable to load service catalogue."; }
  finally { loading.value = false; }
}
async function save() {
  saving.value = true; error.value = "";
  try {
    const payload = {
      ...form.value,
      allowedRequisitionTypes: splitList(requisitionText.value),
      requisitionWorkflowMap: { ...form.value.requisitionWorkflowMap },
      requiredAttachments: splitList(attachmentText.value),
      audienceGroups: splitList(audienceText.value),
      slaHours: form.value.slaHours === "" ? null : Number(form.value.slaHours),
      workflow: form.value.workflow || null,
      formSchema: form.value.formSchema.map(({ optionsText, ...field }) => ({ ...field, options: ["select", "multiselect"].includes(field.type) ? splitList(optionsText) : [] })),
    };
    delete payload._id; delete payload.__v; delete payload.company; delete payload.createdAt; delete payload.updatedAt;
    if (editingId.value) await api.updateBusinessService(editingId.value, payload);
    else await api.createBusinessService(payload);
    await load(); reset();
  } catch (err) { error.value = err.message || "Unable to save service."; }
  finally { saving.value = false; }
}
async function deactivate(item) {
  if (!window.confirm(`Deactivate ${item.name}? Existing memos will retain their service reference.`)) return;
  try { await api.deleteBusinessService(item._id); await load(); if (editingId.value === item._id) reset(); }
  catch (err) { error.value = err.message || "Unable to deactivate service."; }
}
onMounted(async () => { await load(); syncTextFromForm(); });
</script>

<template>
  <div class="experience-page admin-services-page">
    <section class="page-intro-row">
      <div><span class="eyebrow">ADMINISTRATION · CONFIGURATION</span><h1>Business services.</h1><p>Manage tenant services, requisition routes, dynamic forms and fulfilment requirements. Each service starts the unified Approval Memo process.</p></div>
      <button class="action-primary" type="button" @click="reset(); document.getElementById('service-editor')?.scrollIntoView({behavior:'smooth'})"><AppIcon name="plus" :size="17" /> Add service</button>
    </section>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <section class="workspace-panel service-admin-toolbar"><div class="command-strip"><AppIcon name="search" :size="18" /><input v-model="search" placeholder="Search service catalogue…" /></div><span>{{ filtered.length }} services</span></section>
    <section class="workspace-panel service-admin-list">
      <div v-if="loading" class="panel-empty">Loading service catalogue…</div>
      <div v-else-if="!filtered.length" class="panel-empty">No services match this search.</div>
      <div v-for="item in filtered" :key="item._id" class="service-admin-row">
        <div class="service-icon" :style="{ color: item.color || '#2563EB', background: `${item.color || '#2563EB'}18` }"><AppIcon :name="item.icon || 'services'" :size="22" /></div>
        <div class="service-admin-copy"><span>{{ item.category }} · {{ (item.allowedRequisitionTypes || []).length }} requisition type(s)</span><strong>{{ item.name }}</strong><p>{{ item.description || "No description yet." }}</p><small>{{ (item.formSchema || []).length }} dynamic fields · {{ item.ownerDepartment?.name || "No owner" }} · {{ item.active ? "Active" : "Inactive" }}</small></div>
        <div class="service-admin-actions"><button class="text-button" type="button" @click="edit(item)"><AppIcon name="edit" :size="15" /> Configure</button><button class="text-button danger-text" type="button" @click="deactivate(item)"><AppIcon name="trash" :size="15" /> Deactivate</button></div>
      </div>
    </section>

    <section id="service-editor" class="workspace-panel service-editor-panel">
      <div class="panel-heading"><div><span class="eyebrow">{{ editingId ? "EDIT CONFIGURATION" : "NEW CATALOGUE ENTRY" }}</span><h2>{{ editingId ? "Configure service" : "Create business service" }}</h2></div><button v-if="editingId" class="text-button" type="button" @click="reset">Cancel</button></div>
      <form class="service-editor-form" @submit.prevent="save">
        <label>Service name<input v-model="form.name" required placeholder="Office Supplies" /></label>
        <label>Slug<input v-model="form.slug" required placeholder="office-supplies" /></label>
        <label>Category<input v-model="form.category" required placeholder="Administration" /></label>
        <label>Owner department<select v-model="form.ownerDepartment" required><option value="">Select department</option><option v-for="department in departments" :key="department._id" :value="department._id">{{ department.name }}</option></select></label>
        <label>Responsible department / team<input v-model="form.responsibleDepartment" placeholder="Administration" /></label>
        <label>Default workflow<select v-model="form.workflow"><option value="">Resolve from requisition configuration later</option><option v-for="workflow in workflows" :key="workflow._id" :value="workflow._id">{{ workflow.name }}</option></select></label>
        <label>Default priority<select v-model="form.defaultPriority"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option><option>Critical</option></select></label>
        <label>Service icon<select v-model="form.icon"><option v-for="icon in iconOptions" :key="icon" :value="icon">{{ icon }}</option></select></label>
        <div class="service-icon-preview"><span :style="{ color: form.color || '#2563EB', background: `${form.color || '#2563EB'}18` }"><AppIcon :name="form.icon || 'services'" :size="26" /></span><small>Live icon preview</small></div>
        <label>Colour<input v-model="form.color" type="text" placeholder="#315f9f" /></label>
        <label>SLA (hours)<input v-model="form.slaHours" type="number" min="0" step="1" placeholder="No SLA" /></label>
        <label class="full">Description<textarea v-model="form.description" rows="3" placeholder="Explain when employees should use this service."></textarea></label>

        <div class="full service-config-section"><h3>Requisition type configuration</h3><p>Enter the permitted requisition types for this service. Use commas or new lines. These are separate from the Business Service name.</p><label>Allowed requisition types<textarea v-model="requisitionText" rows="2" placeholder="Purchase Requisition, Expense Requisition"></textarea></label></div>
        <div class="full service-config-section"><h3>Workflow mapping by requisition type</h3><p>Assign the tenant workflow that should run for each permitted requisition type. Ordinary requesters never choose a workflow.</p><div v-for="typeName in splitList(requisitionText)" :key="typeName" class="service-workflow-map"><strong>{{ typeName }}</strong><select v-model="form.requisitionWorkflowMap[typeName]"><option value="">Use service default workflow</option><option v-for="workflow in workflows" :key="workflow._id" :value="workflow._id">{{ workflow.name }}</option></select></div></div>
        <div class="full service-config-section"><h3>Availability and fulfilment</h3><div class="service-config-checks"><label><input v-model="form.financialRequired" type="checkbox" /> Financial details required</label><label><input v-model="form.paymentRequired" type="checkbox" /> Payment is expected</label><label><input v-model="form.inventoryFulfilment" type="checkbox" /> Inventory fulfilment applies</label><label><input v-model="form.active" type="checkbox" /> Service is active</label></div><label>Audience groups / roles<textarea v-model="audienceText" rows="2" placeholder="All Employees, IT_SPECIALIST (comma separated)"></textarea></label><label>Required supporting documents<textarea v-model="attachmentText" rows="2" placeholder="Vendor quotation, Invoice (comma separated)"></textarea></label></div>
        <div class="full service-config-section"><div class="panel-heading"><div><h3>Dynamic service form</h3><p>Fields appear in the unified Approval Memo when this service is selected.</p></div><button class="text-button" type="button" @click="addField"><AppIcon name="plus" :size="15" /> Add field</button></div>
          <div v-if="!form.formSchema.length" class="panel-empty">No extra fields configured. Core Approval Memo fields remain available.</div>
          <div v-for="(field, index) in form.formSchema" :key="index" class="service-field-builder">
            <label>Field label<input v-model="field.label" required placeholder="Requested item" /></label>
            <label>Field key<input v-model="field.key" required placeholder="requestedItem" /></label>
            <label>Field type<select v-model="field.type"><option value="text">Text</option><option value="textarea">Long text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Dropdown</option><option value="multiselect">Multi-select</option><option value="checkbox">Checkbox</option><option value="currency">Currency</option><option value="file">File reference</option><option value="user">User</option><option value="department">Department</option></select></label>
            <label class="field-required"><input v-model="field.required" type="checkbox" /> Required</label>
            <label v-if="field.type === 'select' || field.type === 'multiselect'" class="field-options">Dropdown options<input v-model="field.optionsText" placeholder="Option A, Option B" /></label>
            <label class="field-placeholder">Help / placeholder<input v-model="field.placeholder" placeholder="Additional guidance" /></label>
            <button class="text-button danger-text" type="button" @click="removeField(index)"><AppIcon name="trash" :size="15" /> Remove field</button>
          </div>
        </div>
        <div class="service-editor-actions full"><button class="action-primary" type="submit" :disabled="saving"><AppIcon :name="saving ? 'refresh' : 'check'" :size="17" /> {{ saving ? "Saving…" : editingId ? "Save configuration" : "Create service" }}</button></div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.service-config-section{grid-column:1/-1;border-top:1px solid var(--border-color, #e5e7eb);padding-top:1.25rem;margin-top:.5rem}.service-config-section h3{margin:0 0 .35rem}.service-config-section p{margin:.25rem 0 1rem;color:var(--text-muted, #64748b);font-size:.9rem}.service-config-checks{display:flex;flex-wrap:wrap;gap:1rem;margin:1rem 0}.service-config-checks label,.field-required{display:flex;align-items:center;gap:.45rem}.service-workflow-map{display:grid;grid-template-columns:minmax(150px,1fr) minmax(220px,2fr);gap:1rem;align-items:center;margin:.5rem 0}.service-field-builder{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;padding:1rem 0;border-bottom:1px solid var(--border-color, #e5e7eb)}.service-field-builder .field-options,.service-field-builder .field-placeholder{grid-column:span 1}.service-field-builder button{align-self:end;justify-self:start}@media(max-width:760px){.service-workflow-map{grid-template-columns:1fr}.service-field-builder{grid-template-columns:1fr}.service-field-builder>*{grid-column:1!important}}
.service-admin-row{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1rem;border-bottom:1px solid var(--border-color,#e5e7eb)}.service-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:14px}.service-admin-actions{display:flex;align-items:center;gap:.5rem}.service-admin-actions button,.service-editor-actions button,.service-config-section button{display:inline-flex;align-items:center;justify-content:center;gap:.45rem}.service-icon-preview{display:flex;align-items:center;gap:.65rem;padding-top:1.4rem}.service-icon-preview span{display:grid;place-items:center;width:48px;height:48px;border-radius:15px}.service-icon-preview small{color:var(--text-muted,#64748b)}.action-primary{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:12px;padding:.75rem 1rem;font-weight:700;box-shadow:0 5px 14px rgba(37,99,235,.16);transition:transform .15s ease,box-shadow .15s ease}.action-primary:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(37,99,235,.2)}@media(max-width:760px){.service-admin-row{grid-template-columns:42px minmax(0,1fr)}.service-admin-actions{grid-column:1/-1;justify-content:flex-end}.service-icon-preview{padding-top:0}}
</style>
