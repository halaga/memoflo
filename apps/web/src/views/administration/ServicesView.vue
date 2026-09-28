<script setup>
import { computed, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";

const services = ref([]);
const departments = ref([]);
const workflows = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const editingId = ref("");
const search = ref("");

const form = ref({ name: "", slug: "", category: "", description: "", ownerDepartment: "", workflow: "", icon: "", color: "#315f9f" });

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return services.value;
  return services.value.filter((item) => `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(term));
});

function reset() {
  editingId.value = "";
  form.value = { name: "", slug: "", category: "", description: "", ownerDepartment: "", workflow: "", icon: "", color: "#315f9f" };
}

function edit(item) {
  editingId.value = item._id;
  form.value = {
    name: item.name || "",
    slug: item.slug || "",
    category: item.category || "",
    description: item.description || "",
    ownerDepartment: item.ownerDepartment?._id || item.ownerDepartment || "",
    workflow: item.workflow?._id || item.workflow || "",
    icon: item.icon || "",
    color: item.color || "#315f9f",
  };
  document.getElementById("service-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [serviceResult, departmentResult, workflowResult] = await Promise.all([api.listBusinessServices(), api.listDepartments(), api.listWorkflows()]);
    services.value = normalizeList(serviceResult, ["services", "businessServices"]);
    departments.value = normalizeList(departmentResult, ["departments"]);
    workflows.value = normalizeList(workflowResult, ["workflows"]);
  } catch (err) { error.value = err.message || "Unable to load services."; }
  finally { loading.value = false; }
}

async function save() {
  saving.value = true; error.value = "";
  try {
    const payload = { ...form.value, workflow: form.value.workflow || null };
    if (editingId.value) await api.updateBusinessService(editingId.value, payload);
    else await api.createBusinessService(payload);
    await load(); reset();
  } catch (err) { error.value = err.message || "Unable to save service."; }
  finally { saving.value = false; }
}

async function remove(item) {
  if (!window.confirm(`Deactivate ${item.name}?`)) return;
  try { await api.deleteBusinessService(item._id); await load(); if (editingId.value === item._id) reset(); }
  catch (err) { error.value = err.message || "Unable to deactivate service."; }
}

onMounted(load);
</script>

<template>
  <div class="experience-page admin-services-page">
    <section class="page-intro-row">
      <div><span class="eyebrow">ADMINISTRATION · SERVICES</span><h1>Service catalogue.</h1><p>Define what employees can ask MemoFlo for, who owns each service and which workflow handles it.</p></div>
      <button class="action-primary" type="button" @click="reset(); document.getElementById('service-editor')?.scrollIntoView({behavior:'smooth',block:'start'})">+ Add service</button>
    </section>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <section class="workspace-panel service-admin-toolbar"><div class="command-strip"><span>⌕</span><input v-model="search" placeholder="Search service catalogue…" /></div><span>{{ filtered.length }} services</span></section>

    <section class="workspace-panel service-admin-list">
      <div v-if="loading" class="panel-empty">Loading service catalogue…</div>
      <div v-else-if="!filtered.length" class="panel-empty">No services match this search.</div>
      <div v-else v-for="item in filtered" :key="item._id" class="service-admin-row">
        <div class="service-icon">{{ item.icon || item.name?.[0] || "S" }}</div>
        <div class="service-admin-copy"><span>{{ item.category }}</span><strong>{{ item.name }}</strong><p>{{ item.description || "No description yet." }}</p></div>
        <div class="service-admin-owner"><span>OWNER</span><strong>{{ item.ownerDepartment?.name || "—" }}</strong></div>
        <div class="service-admin-actions"><button class="text-button" type="button" @click="edit(item)">Edit</button><button class="text-button danger-text" type="button" @click="remove(item)">Deactivate</button></div>
      </div>
    </section>

    <section id="service-editor" class="workspace-panel service-editor-panel">
      <div class="panel-heading"><div><span class="eyebrow">{{ editingId ? "EDIT SERVICE" : "NEW SERVICE" }}</span><h2>{{ editingId ? "Update service" : "Add a service" }}</h2></div><button v-if="editingId" class="text-button" type="button" @click="reset">Cancel</button></div>
      <form class="service-editor-form" @submit.prevent="save">
        <label>Service name<input v-model="form.name" required placeholder="Laptop Request" /></label>
        <label>Slug<input v-model="form.slug" required placeholder="laptop-request" /></label>
        <label>Category<input v-model="form.category" required placeholder="IT Services" /></label>
        <label>Owner department<select v-model="form.ownerDepartment" required><option value="">Select department</option><option v-for="department in departments" :key="department._id" :value="department._id">{{ department.name }}</option></select></label>
        <label>Workflow<select v-model="form.workflow"><option value="">No workflow assigned</option><option v-for="workflow in workflows" :key="workflow._id" :value="workflow._id">{{ workflow.name }}</option></select></label>
        <label>Icon<input v-model="form.icon" placeholder="laptop" /></label>
        <label>Colour<input v-model="form.color" type="text" placeholder="#315f9f" /></label>
        <label class="full">Description<textarea v-model="form.description" rows="4" placeholder="What can employees use this service for?"></textarea></label>
        <div class="service-editor-actions full"><button class="action-primary" type="submit" :disabled="saving">{{ saving ? "Saving…" : editingId ? "Save service" : "Create service" }}</button></div>
      </form>
    </section>
  </div>
</template>
