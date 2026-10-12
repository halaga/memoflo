<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api, assetUrl, getSavedEmployee, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const route = useRoute();
const employee = ref(null);
const documents = ref([]);
const requiredDocuments = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const uploadingType = ref("");
const current = computed(() => getSavedEmployee());
const permissions = computed(() => current.value?.role?.permissions || []);
const canManage = computed(() => permissions.value.includes("*") || permissions.value.includes("employees.update"));
const basicForm = ref({ firstName: "", lastName: "", email: "", phone: "", employmentStatus: "Active" });
const form = ref({});
const fields = [
  ["middleName", "Middle name"], ["dateOfBirth", "Date of birth", "date"],
  ["gender", "Gender"], ["maritalStatus", "Marital status"],
  ["nationality", "Nationality"], ["stateOfOrigin", "State of origin"],
  ["lga", "Local government area"], ["residentialAddress", "Residential address", "textarea"],
  ["emergencyContactName", "Emergency contact name"],
  ["emergencyContactPhone", "Emergency contact phone"],
  ["emergencyContactRelationship", "Emergency contact relationship"],
  ["employmentType", "Employment type"], ["hireDate", "Hire date", "date"],
  ["notes", "HR notes", "textarea"],
];
const documentTypes = [
  "Government ID", "Employment Contract", "CV / Resume",
  "Qualification / Certificate", "Passport Photograph",
];

function dateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

function hydrate() {
  const bio = employee.value?.biodata || {};
  basicForm.value = {
    firstName: employee.value?.firstName || "",
    lastName: employee.value?.lastName || "",
    email: employee.value?.email || "",
    phone: employee.value?.phone || "",
    employmentStatus: employee.value?.employmentStatus || "Active",
  };
  form.value = Object.fromEntries(fields.map(([key]) => [key, bio[key] ?? ""]));
  form.value.dateOfBirth = dateInput(bio.dateOfBirth);
  form.value.hireDate = dateInput(bio.hireDate);
  form.value.nationality ||= "Nigerian";
  form.value.employmentType ||= "Full-time";
}

async function loadDocuments() {
  if (!canManage.value) return;
  const result = await api.listEmployeeDocuments(route.params.id);
  const payload = result?.data || result;
  documents.value = normalizeList(payload, ["documents"]);
  requiredDocuments.value = payload?.required || [];
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.getEmployee(route.params.id);
    employee.value = result?.data || result;
    hydrate();
    await loadDocuments();
  } catch (err) {
    error.value = err.message || "Unable to load employee profile.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    await api.updateEmployee(route.params.id, {
      ...basicForm.value,
      biodata: { ...form.value },
    });
    success.value = "Employee biodata saved.";
    await load();
  } catch (err) {
    error.value = err.message || "Unable to save employee biodata.";
  } finally {
    saving.value = false;
  }
}

async function uploadAvatar(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  error.value = "";
  try {
    const result = await api.uploadEmployeeAvatar(route.params.id, file);
    employee.value = result?.data || result;
    success.value = "Profile photo updated.";
  } catch (err) {
    error.value = err.message || "Unable to upload profile photo.";
  }
}

async function uploadDocument(documentType, event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  uploadingType.value = documentType;
  error.value = "";
  try {
    await api.uploadEmployeeDocument(route.params.id, documentType, file);
    success.value = `${documentType} uploaded.`;
    await loadDocuments();
  } catch (err) {
    error.value = err.message || "Unable to upload document.";
  } finally {
    uploadingType.value = "";
  }
}

async function downloadDocument(document) {
  try {
    const response = await api.downloadEmployeeDocument(document._id);
    if (!response.ok) throw new Error("Unable to download document.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.name || "employee-document";
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = err.message || "Unable to download document.";
  }
}

async function removeDocument(document) {
  if (!window.confirm(`Remove ${document.name}?`)) return;
  try {
    await api.removeEmployeeDocument(document._id);
    await loadDocuments();
    success.value = "Document removed.";
  } catch (err) {
    error.value = err.message || "Unable to remove document.";
  }
}

function name() {
  return [basicForm.value.firstName, form.value.middleName, basicForm.value.lastName].filter(Boolean).join(" ");
}

onMounted(load);
</script>

<template>
  <div class="experience-page employee-profile-page">
    <div class="service-breadcrumb">
      <RouterLink to="/people">People</RouterLink>
      <AppIcon name="chevron" :size="15" />
      <strong>Employee biodata</strong>
    </div>

    <div v-if="loading" class="workspace-panel panel-empty">Loading employee profile…</div>
    <div v-else-if="error && !employee" class="alert alert-error">{{ error }}</div>
    <template v-else-if="employee">
      <section class="profile-hero workspace-panel">
        <div class="profile-avatar">
          <img v-if="employee.avatar" :src="assetUrl(employee.avatar)" :alt="name()" />
          <span v-else>{{ employee.firstName?.[0] }}{{ employee.lastName?.[0] }}</span>
          <label v-if="canManage" class="avatar-upload">
            <AppIcon name="upload" :size="14" /> Change photo
            <input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadAvatar" />
          </label>
        </div>
        <div class="profile-title">
          <span class="eyebrow">EMPLOYEE RECORD</span>
          <h1>{{ name() }}</h1>
          <p>{{ employee.position?.title || "Position not assigned" }} · {{ employee.position?.department?.name || "Department not assigned" }}</p>
          <div class="profile-tags">
            <span>{{ employee.employeeNo || "No employee number" }}</span>
            <span>{{ employee.employmentStatus || "Active" }}</span>
            <span>{{ employee.email }}</span>
          </div>
        </div>
      </section>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <section class="workspace-panel profile-section">
        <header class="section-title-row">
          <div><span class="eyebrow">EMPLOYEE DETAILS</span><h2>Contact and employment record</h2></div>
        </header>
        <div class="profile-form-grid">
          <label class="profile-field"><span>First name</span><input v-model="basicForm.firstName" :disabled="!canManage" required /></label>
          <label class="profile-field"><span>Last name</span><input v-model="basicForm.lastName" :disabled="!canManage" required /></label>
          <label class="profile-field"><span>Email address</span><input v-model="basicForm.email" type="email" :disabled="!canManage" required /></label>
          <label class="profile-field"><span>Phone number</span><input v-model="basicForm.phone" :disabled="!canManage" /></label>
          <label class="profile-field"><span>Employment status</span><select v-model="basicForm.employmentStatus" :disabled="!canManage"><option>Active</option><option>Inactive</option><option>Suspended</option></select></label>
          <label class="profile-field"><span>Position</span><input :value="employee.position?.title || 'Not assigned'" disabled /></label>
        </div>
      </section>

      <section class="workspace-panel profile-section">
        <header class="section-title-row">
          <div><span class="eyebrow">BIODATA</span><h2>Personal and employment information</h2></div>
          <button v-if="canManage" class="action-primary" type="button" :disabled="saving" @click="save">
            <AppIcon name="check" :size="17" /> {{ saving ? "Saving…" : "Save changes" }}
          </button>
        </header>
        <div class="profile-form-grid">
          <label v-for="([key, label, type]) in fields" :key="key" class="profile-field">
            <span>{{ label }}</span>
            <textarea v-if="type === 'textarea'" v-model="form[key]" :disabled="!canManage" rows="3"></textarea>
            <input v-else v-model="form[key]" :type="type || 'text'" :disabled="!canManage" />
          </label>
        </div>
        <p v-if="!canManage" class="muted-note">Only authorised HR or employee administrators can edit biodata.</p>
      </section>

      <section v-if="canManage" class="workspace-panel profile-section">
        <header class="section-title-row">
          <div><span class="eyebrow">DOCUMENTS</span><h2>Required employee documents</h2><p>Stored privately and accessible only through authenticated document routes.</p></div>
        </header>
        <div class="required-document-grid">
          <article v-for="type in documentTypes" :key="type" class="required-document-card">
            <div class="document-card-icon"><AppIcon name="file" :size="21" /></div>
            <div class="document-card-copy"><strong>{{ type }}</strong><small>{{ documents.some((doc) => doc.documentType === type) ? "Uploaded" : "Missing" }}</small></div>
            <label class="icon-button upload-document-button" :aria-label="`Upload ${type}`">
              <AppIcon name="upload" :size="18" />
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" @change="uploadDocument(type, $event)" />
            </label>
          </article>
        </div>
        <div v-if="uploadingType" class="muted-note">Uploading {{ uploadingType }}…</div>
        <div v-if="documents.length" class="document-list">
          <article v-for="doc in documents" :key="doc._id" class="document-row">
            <AppIcon name="file" :size="20" />
            <span><strong>{{ doc.name }}</strong><small>{{ doc.documentType }} · {{ Math.max(1, Math.round((doc.size || 0) / 1024)) }} KB</small></span>
            <button class="icon-button" type="button" aria-label="Download document" @click="downloadDocument(doc)"><AppIcon name="download" :size="18" /></button>
            <button class="icon-button danger" type="button" aria-label="Remove document" @click="removeDocument(doc)"><AppIcon name="trash" :size="18" /></button>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
