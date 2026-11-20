<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, normalizeList } from "../../services/api";

const route = useRoute();
const router = useRouter();
const services = ref([]);
const sbus = ref([]);
const employees = ref([]);
const recipientQuery = ref("");
const ccQuery = ref("");
const loading = ref(false);
const loadingData = ref(true);
const error = ref("");
const serviceFieldValues = ref({});
const selectedService = computed(() =>
    services.value.find((service) => String(service._id) === String(form.value.businessService)) || null
);
const requisitionTypes = computed(() => {
    const service = selectedService.value;
    return service ? (service.allowedRequisitionTypes || service.requisitionTypes || []) : [];
});
const form = ref({
    memoType: "simple",
    title: "",
    priority: "Normal",
    body: "",
    recipients: [],
    ccRecipients: [],
    businessService: "",
    requisitionType: "",
    requestingSbu: "",
    beneficiarySBU: "",
    businessJustification: "",
    requiredCompletionDate: "",
    financialDetails: {
        required: false,
        estimatedAmount: "",
        currency: "NGN",
        budgetOrCostCentre: "",
        vendor: "",
        invoiceNumber: "",
        quotationDetails: "",
        paymentRequired: false,
    },
    submissionDetails: { serviceFields: {} },
    acknowledgementRequired: false,
});

const visibleRecipients = computed(() => filterPeople(recipientQuery.value, form.value.recipients));
const visibleCcRecipients = computed(() => filterPeople(ccQuery.value, form.value.ccRecipients));

function filterPeople(query, selected) {
    const term = query.trim().toLowerCase();
    return employees.value
        .filter((person) => !selected.some((id) => String(id) === String(person._id)))
        .filter((person) => {
            if (!term) return false;
            return [
                person.firstName, person.lastName, person.email,
                person.department?.name, person.designation?.title,
                person.position?.title, person.employeeNo,
            ].filter(Boolean).join(" ").toLowerCase().includes(term);
        })
        .slice(0, 10);
}

function fullName(person) {
    return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

function selectedPerson(id) {
    return employees.value.find((person) => String(person._id) === String(id));
}

function addPerson(target, person) {
    if (!form.value[target].some((id) => String(id) === String(person._id))) {
        form.value[target].push(person._id);
    }
    if (target === "recipients") recipientQuery.value = "";
    if (target === "ccRecipients") ccQuery.value = "";
}

function removePerson(target, id) {
    form.value[target] = form.value[target].filter((value) => String(value) !== String(id));
}

async function searchPeople(target) {
    const query = target === "recipients" ? recipientQuery.value : ccQuery.value;
    if (query.trim().length < 2) return;
    try {
        const result = await api.listEmployeeDirectory(query.trim());
        const matches = normalizeList(result, ["employees", "people"]);
        const byId = new Map(employees.value.map((person) => [String(person._id), person]));
        matches.forEach((person) => byId.set(String(person._id), person));
        employees.value = [...byId.values()];
    } catch (err) {
        error.value = err.message || "Unable to search employees.";
    }
}

async function loadFormData() {
    loadingData.value = true;
    error.value = "";
    try {
        const [serviceResult, sbuResult, employeeResult] = await Promise.all([
            api.listBusinessServices(),
            api.listSBUs(),
            api.listEmployeeDirectory(),
        ]);
        services.value = normalizeList(serviceResult, ["services", "businessServices"]);
        sbus.value = normalizeList(sbuResult, ["sbus", "SBUs"]);
        employees.value = normalizeList(employeeResult, ["employees", "people"]);

        const requestedService = String(route.query.service || "");
        if (requestedService) {
            const match = services.value.find((item) =>
                String(item._id) === requestedService || String(item.slug) === requestedService
            );
            if (match) {
                form.value.memoType = "approval";
                form.value.businessService = match._id;
                form.value.priority = match.defaultPriority || "Normal";
                form.value.financialDetails.required = Boolean(match.financialRequired);
                form.value.financialDetails.paymentRequired = Boolean(match.paymentRequired);
                if (!form.value.title) form.value.title = `${match.name} request`;
            }
        }

        if (route.query.memoType === "approval") form.value.memoType = "approval";
        if (route.query.recipient) {
            const person = employees.value.find((item) => String(item._id) === String(route.query.recipient));
            if (person) form.value.recipients = [person._id];
        }
    } catch (err) {
        error.value = err.message || "Unable to load memo setup data.";
    } finally {
        loadingData.value = false;
    }
}

function applyServiceDefaults(service) {
    if (!service) return;
    form.value.priority = service.defaultPriority || "Normal";
    form.value.financialDetails.required = Boolean(service.financialRequired);
    form.value.financialDetails.paymentRequired = Boolean(service.paymentRequired);
    serviceFieldValues.value = {};
    const choices = service.allowedRequisitionTypes || service.requisitionTypes || [];
    form.value.requisitionType = choices.length === 1 ? choices[0] : "";
}

watch(() => form.value.businessService, (id) => {
    const service = services.value.find((item) => String(item._id) === String(id));
    applyServiceDefaults(service);
});

watch(() => form.value.memoType, (type) => {
    if (type === "simple") {
        form.value.businessService = "";
        form.value.requisitionType = "";
        form.value.businessJustification = "";
        form.value.financialDetails.required = false;
        form.value.financialDetails.paymentRequired = false;
        serviceFieldValues.value = {};
    }
});

function validateForm() {
    if (!form.value.title.trim()) return "Title / subject is required.";
    if (!form.value.body.trim()) return "Memo content is required.";
    if (form.value.memoType === "simple" && !form.value.recipients.length) {
        return "Select at least one recipient.";
    }
    if (form.value.memoType === "approval") {
        if (!form.value.businessService) return "Select a Business Service.";
        if (!form.value.requisitionType) return "Select a Requisition Type.";
        if (!form.value.businessJustification.trim()) return "Business justification is required.";
        for (const field of selectedService.value?.formSchema || []) {
            const value = serviceFieldValues.value[field.key];
            if (field.required && (value === undefined || value === null || String(value).trim() === "")) {
                return `${field.label} is required.`;
            }
        }
        if (selectedService.value?.financialRequired && !form.value.financialDetails.estimatedAmount) {
            return "Enter the estimated amount required by this service.";
        }
    }
    return "";
}

function payload(saveAsDraft) {
    const isApproval = form.value.memoType === "approval";
    return {
        memoType: form.value.memoType,
        title: form.value.title.trim(),
        priority: form.value.priority,
        body: form.value.body.trim(),
        recipients: isApproval ? [] : form.value.recipients,
        ccRecipients: isApproval ? [] : form.value.ccRecipients,
        acknowledgementRequired: !isApproval && form.value.acknowledgementRequired,
        ...(isApproval ? {
            businessService: form.value.businessService,
            requisitionType: form.value.requisitionType,
            requestingSbu: form.value.requestingSbu || undefined,
            beneficiarySBU: form.value.beneficiarySBU || undefined,
            businessJustification: form.value.businessJustification.trim(),
            requiredCompletionDate: form.value.requiredCompletionDate || null,
            submissionDetails: { serviceFields: { ...serviceFieldValues.value } },
            financialDetails: { ...form.value.financialDetails },
        } : {}),
        saveAsDraft,
    };
}

async function saveDraft() {
    error.value = "";
    if (!form.value.title.trim() || !form.value.body.trim()) {
        error.value = "Title and memo content are required before saving a draft.";
        return;
    }
    loading.value = true;
    try {
        const result = await api.createMemo(payload(true));
        const memo = result?.data || result?.memo || result;
        if (!memo?._id) throw new Error("Draft was saved but no memo ID was returned.");
        router.push(`/memos/${memo._id}`);
    } catch (err) {
        error.value = err.message || "Unable to save draft.";
    } finally {
        loading.value = false;
    }
}

async function submit() {
    error.value = "";
    const validation = validateForm();
    if (validation) {
        error.value = validation;
        return;
    }
    loading.value = true;
    try {
        const created = await api.createMemo(payload(true));
        const draft = created?.data || created?.memo || created;
        if (!draft?._id) throw new Error("Memo draft was created but no memo ID was returned.");
        const result = await api.submitMemo(draft._id);
        const memo = result?.data || result?.memo || result;
        router.push(`/memos/${memo?._id || draft._id}`);
    } catch (err) {
        error.value = `${err.message || "Submission failed."} Your draft is preserved; you can reopen it and retry.`;
    } finally {
        loading.value = false;
    }
}

onMounted(loadFormData);
</script>

<template>
<div class="page module-page memo-composer-page">
  <div class="page-header">
    <div>
      <span class="page-kicker">MEMO</span>
      <h1>Create Memo</h1>
      <p>Use one composer for direct communication and formal business requests.</p>
    </div>
    <button class="btn btn-secondary" type="button" @click="router.push('/memos')">Back to memos</button>
  </div>

  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <div v-if="loadingData" class="card empty-state">Loading memo setup…</div>

  <section v-else class="card form-card premium-form-card">
    <form @submit.prevent="submit">
      <div class="form-row">
        <label>
          Memo type
          <select v-model="form.memoType" class="input">
            <option value="simple">Basic Memo</option>
            <option value="approval">Approval Memo</option>
          </select>
        </label>
        <label>
          Title / Subject
          <input v-model="form.title" class="input" placeholder="Enter a clear subject" required />
        </label>
        <label>
          Priority
          <select v-model="form.priority" class="input">
            <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option><option>Critical</option>
          </select>
        </label>
      </div>

      <template v-if="form.memoType === 'simple'">
        <section class="composer-section">
          <h2>Recipients</h2>
          <div class="recipient-chips">
            <span v-for="id in form.recipients" :key="id" class="recipient-chip">
              {{ fullName(selectedPerson(id)) || "Selected employee" }}
              <button type="button" aria-label="Remove recipient" @click="removePerson('recipients', id)">×</button>
            </span>
          </div>
          <label>
            Search recipients by name, email, department or designation
            <input v-model="recipientQuery" class="input" placeholder="Start typing a colleague's name or email…" @input="searchPeople('recipients')" />
          </label>
          <div v-if="recipientQuery.trim().length >= 2" class="recipient-results">
            <button v-for="person in visibleRecipients" :key="person._id" type="button" @click="addPerson('recipients', person)">
              <strong>{{ fullName(person) }}</strong><span>{{ person.email || person.department?.name || person.position?.title }}</span>
            </button>
            <p v-if="!visibleRecipients.length">No matching employees found.</p>
          </div>
        </section>

        <section class="composer-section">
          <h2>CC</h2>
          <div class="recipient-chips">
            <span v-for="id in form.ccRecipients" :key="id" class="recipient-chip">
              {{ fullName(selectedPerson(id)) || "Selected employee" }}
              <button type="button" aria-label="Remove CC recipient" @click="removePerson('ccRecipients', id)">×</button>
            </span>
          </div>
          <label>
            Search people to copy
            <input v-model="ccQuery" class="input" placeholder="Search by name or email…" @input="searchPeople('ccRecipients')" />
          </label>
          <div v-if="ccQuery.trim().length >= 2" class="recipient-results">
            <button v-for="person in visibleCcRecipients" :key="person._id" type="button" @click="addPerson('ccRecipients', person)">
              <strong>{{ fullName(person) }}</strong><span>{{ person.email || person.department?.name || person.position?.title }}</span>
            </button>
            <p v-if="!visibleCcRecipients.length">No matching employees found.</p>
          </div>
        </section>
        <label class="inline-check"><input v-model="form.acknowledgementRequired" type="checkbox" /> Request acknowledgement from recipients</label>
      </template>

      <template v-else>
        <section class="composer-section">
          <h2>Request details</h2>
          <div class="form-row">
            <label>
              Business Service
              <select v-model="form.businessService" class="input" required>
                <option value="">Select a service</option>
                <option v-for="service in services" :key="service._id" :value="service._id">{{ service.name }}</option>
              </select>
            </label>
            <label>
              Requisition Type
              <select v-model="form.requisitionType" class="input" required :disabled="!requisitionTypes.length">
                <option value="">Select a requisition type</option>
                <option v-for="type in requisitionTypes" :key="type" :value="type">{{ type }}</option>
              </select>
              <small v-if="!requisitionTypes.length">No requisition types are configured for this service yet. Save as draft and ask an administrator to configure it.</small>
            </label>
            <label>
              Required date
              <input v-model="form.requiredCompletionDate" class="input" type="date" />
            </label>
          </div>
          <div class="form-row">
            <label>
              Requesting SBU
              <select v-model="form.requestingSbu" class="input">
                <option value="">Select requesting SBU</option>
                <option v-for="sbu in sbus" :key="sbu._id" :value="sbu._id">{{ sbu.name }}</option>
              </select>
            </label>
            <label>
              Beneficiary SBU
              <select v-model="form.beneficiarySBU" class="input">
                <option value="">Same as requesting / not specified</option>
                <option v-for="sbu in sbus" :key="sbu._id" :value="sbu._id">{{ sbu.name }}</option>
              </select>
            </label>
          </div>
          <label>
            Business justification
            <textarea v-model="form.businessJustification" class="textarea" rows="3" placeholder="Explain the business need and expected outcome…" required></textarea>
          </label>
        </section>

        <section v-if="selectedService?.formSchema?.length" class="composer-section">
          <h2>{{ selectedService.name }} information</h2>
          <div class="form-row">
            <label v-for="field in selectedService.formSchema" :key="field.key">
              {{ field.label }}<span v-if="field.required"> *</span>
              <textarea v-if="field.type === 'textarea'" v-model="serviceFieldValues[field.key]" class="textarea" :placeholder="field.placeholder" :required="field.required" rows="3"></textarea>
              <select v-else-if="field.type === 'select'" v-model="serviceFieldValues[field.key]" class="input" :required="field.required">
                <option value="">Select {{ field.label.toLowerCase() }}</option>
                <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
              </select>
              <input v-else-if="field.type === 'checkbox'" v-model="serviceFieldValues[field.key]" type="checkbox" />
              <input v-else v-model="serviceFieldValues[field.key]" class="input" :type="field.type || 'text'" :placeholder="field.placeholder" :required="field.required" />
            </label>
          </div>
        </section>

        <section v-if="selectedService?.requiredAttachments?.length" class="composer-section">
          <h2>Required supporting documents</h2>
          <p v-for="item in selectedService.requiredAttachments" :key="item">{{ item }}</p>
          <small>Upload controls are managed from the memo record after the draft is created; required-file enforcement remains a follow-up integration.</small>
        </section>

        <section v-if="selectedService?.financialRequired || form.financialDetails.required" class="composer-section">
          <h2>Financial information</h2>
          <label class="inline-check">
            <input v-model="form.financialDetails.required" type="checkbox" :disabled="selectedService?.financialRequired" />
            Financial information required
          </label>
          <div v-if="form.financialDetails.required" class="form-row">
            <label>Estimated amount<input v-model="form.financialDetails.estimatedAmount" class="input" type="number" min="0" step="0.01" /></label>
            <label>Currency<input v-model.trim="form.financialDetails.currency" class="input" maxlength="3" /></label>
            <label>Budget / cost centre<input v-model.trim="form.financialDetails.budgetOrCostCentre" class="input" /></label>
            <label>Vendor / beneficiary<input v-model.trim="form.financialDetails.vendor" class="input" /></label>
            <label>Invoice number<input v-model.trim="form.financialDetails.invoiceNumber" class="input" /></label>
            <label class="inline-check"><input v-model="form.financialDetails.paymentRequired" type="checkbox" /> Payment required after approval</label>
            <label class="full-row">Quotation details<textarea v-model="form.financialDetails.quotationDetails" class="textarea" rows="2"></textarea></label>
          </div>
        </section>
      </template>

      <label>
        {{ form.memoType === "simple" ? "Memo content" : "Request summary / details" }}
        <textarea v-model="form.body" class="textarea" rows="9" placeholder="Write the message or describe the request…" required></textarea>
      </label>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="router.push('/memos')">Cancel</button>
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="saveDraft">Save draft</button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? "Submitting…" : "Submit" }}
        </button>
      </div>
    </form>
  </section>
</div>
</template>

<style scoped>
.memo-composer-page .composer-section {
    display: grid;
    gap: 0.85rem;
    margin: 1.25rem 0;
    padding: 1rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 12px;
}
.memo-composer-page .composer-section h2 {
    margin: 0;
    font-size: 1rem;
}
.memo-composer-page .recipient-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.memo-composer-page .recipient-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.6rem;
    border: 1px solid var(--border, #d1d5db);
    border-radius: 999px;
    background: var(--surface-muted, #f8fafc);
    font-size: 0.875rem;
}
.memo-composer-page .recipient-chip button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
}
.memo-composer-page .recipient-results {
    display: grid;
    max-height: 16rem;
    overflow-y: auto;
    border: 1px solid var(--border, #d1d5db);
    border-radius: 10px;
}
.memo-composer-page .recipient-results button {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.65rem 0.8rem;
    border: 0;
    border-bottom: 1px solid var(--border, #e5e7eb);
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
}
.memo-composer-page .recipient-results button:hover {
    background: var(--surface-muted, #f8fafc);
}
.memo-composer-page .recipient-results span,
.memo-composer-page small {
    color: var(--text-muted, #64748b);
}
.memo-composer-page .recipient-results p {
    margin: 0;
    padding: 0.75rem;
}
</style>
