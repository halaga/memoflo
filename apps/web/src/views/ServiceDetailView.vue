<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api, normalizeList } from "../services/api";

const route = useRoute();
const service = ref(null);
const workspace = ref(null);
const loading = ref(true);
const error = ref("");

const builtIns = {
  "general-memo": { slug: "general-memo", name: "Simple Memo", category: "Communication", description: "Send a memo directly to a colleague without forcing it through a long approval workflow.", actionType: "memo-simple", moduleId: "communication", route: "/services/general-memo/start", icon: "M" },
  "approval-memo": { slug: "approval-memo", name: "Approval Memo", category: "Communication", description: "Create a memo that uses a configured approval workflow.", actionType: "memo-approval", moduleId: "communication", route: "/services/approval-memo/start", icon: "A" },
  "email-signature": { slug: "email-signature", name: "Email Signature", category: "Communication", description: "Generate the company-approved email signature.", actionType: "signature", moduleId: "signature", route: "/email-signature", icon: "@" },
  "request-leave": { slug: "request-leave", name: "Leave Request", category: "People & HR", description: "Request leave and follow the configured HR route.", actionType: "leave", moduleId: "hr", route: "/leave", icon: "L" },
  "business-purchase-request": { slug: "business-purchase-request", name: "Business Purchase Request", category: "Business", description: "Request equipment, supplies or other business purchases.", actionType: "procurement", moduleId: "procurement", route: "/procurement/requests/new", icon: "P" },
  "people-directory": { slug: "people-directory", name: "People Directory", category: "People & HR", description: "Find colleagues and company structure.", actionType: "people", moduleId: "hr", route: "/people", icon: "P" },
};

const available = computed(() => {
  const id = service.value?.moduleId;
  if (!id) return true;
  const item = workspace.value?.modules?.find((m) => m.id === id);
  return item ? Boolean(item.enabled) : true;
});

const actionRoute = computed(() => service.value?.route || `/services/${route.params.slug}/start`);

async function load() {
  loading.value = true; error.value = "";
  try {
    const [serviceResult, workspaceResult] = await Promise.all([api.listBusinessServices(), api.getCompanyWorkspace()]);
    const items = normalizeList(serviceResult, ["services", "businessServices"]);
    workspace.value = workspaceResult?.data || workspaceResult;
    const slug = String(route.params.slug || "").toLowerCase();
    service.value = items.find((item) => String(item.slug || "").toLowerCase() === slug) || builtIns[slug] || null;
    if (!service.value) error.value = "Service not found.";
  } catch (err) { error.value = err.message || "Unable to load this service."; }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="experience-page service-detail-page">
    <div class="service-breadcrumb"><RouterLink to="/services">Services</RouterLink><span>›</span><strong>{{ service?.name || "Service" }}</strong></div>
    <section v-if="loading" class="service-detail-state">Loading service…</section>
    <section v-else-if="error" class="service-detail-state error-state"><strong>{{ error }}</strong><RouterLink to="/services" class="action-secondary">Back to services</RouterLink></section>
    <template v-else-if="service">
      <section class="service-detail-hero"><div class="service-detail-icon">{{ service.icon || service.name?.[0] || "S" }}</div><div class="service-detail-copy"><span class="eyebrow">{{ service.category }}</span><h1>{{ service.name }}</h1><p>{{ service.description }}</p><div class="service-detail-meta"><span>Action</span><strong>{{ service.actionType }}</strong><span v-if="service.workflow">Workflow configured</span></div></div><div class="service-detail-actions"><RouterLink v-if="available" :to="actionRoute" class="action-primary">Start service →</RouterLink><span v-else class="service-disabled-message">This service is currently disabled for your company. Contact your MemoFlo administrator to enable it.</span><RouterLink to="/services" class="action-secondary">Back to services</RouterLink></div></section>
      <section class="service-detail-grid"><article class="workspace-panel service-info-panel"><span class="eyebrow">HOW IT WORKS</span><h2>You choose the outcome.</h2><p>MemoFlo resolves the service action, people, permissions and workflow behind it. Employees do not need to understand the internal module structure before starting.</p></article><article class="workspace-panel service-info-panel"><span class="eyebrow">AVAILABILITY</span><h2>{{ available ? "Available" : "Currently disabled" }}</h2><p>{{ available ? "You can start this service now." : "The service remains discoverable so employees know it exists, but the company subscription/module access currently does not make it available." }}</p></article></section>
    </template>
  </div>
</template>
