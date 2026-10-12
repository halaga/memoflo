<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const route = useRoute();
const service = ref(null);
const workspace = ref(null);
const loading = ref(true);
const error = ref("");

const builtIns = {
  "general-memo": { slug: "general-memo", name: "Simple Memo", category: "Communication", description: "Send a direct memo to one or more colleagues. No approval workflow is required.", actionType: "memo-simple", moduleId: "communication", icon: "memo" },
  "approval-memo": { slug: "approval-memo", name: "Approval Memo", category: "Communication", description: "Create a memo that moves through your company's configured approval workflow.", actionType: "memo-approval", moduleId: "communication", icon: "approval" },
  "email-signature": { slug: "email-signature", name: "Email Signature", category: "Communication", description: "Generate a professional email signature using your company details.", actionType: "signature", moduleId: "signature", icon: "mail" },
  "request-leave": { slug: "request-leave", name: "Leave Request", category: "People & HR", description: "Submit leave and follow the HR review process.", actionType: "leave", moduleId: "leave", icon: "calendar" },
  "leave-request": { slug: "leave-request", name: "Leave Request", category: "People & HR", description: "Submit leave and follow the HR review process.", actionType: "leave", moduleId: "leave", icon: "calendar" },
  "business-purchase-request": { slug: "business-purchase-request", name: "Business Purchase", category: "Business Purchase", description: "Request laptops, equipment, supplies or other business purchases.", actionType: "procurement", moduleId: "procurement", icon: "purchase" },
  "laptop-request": { slug: "laptop-request", name: "Laptop Request", category: "Business Purchase", description: "Request a laptop or other approved IT equipment through the procurement process.", actionType: "procurement", moduleId: "procurement", icon: "laptop" },
  "people-directory": { slug: "people-directory", name: "People Directory", category: "People & HR", description: "Find colleagues, roles and departments.", actionType: "people", moduleId: "hr", icon: "people" },
  "it-support": { slug: "it-support", name: "IT Support", category: "IT", description: "Report a technology issue and follow its progress.", actionType: "it-request", moduleId: "it", icon: "laptop" },
  "it-maintenance": { slug: "it-maintenance", name: "IT Maintenance", category: "IT", description: "Request maintenance for IT equipment, printers or network services.", actionType: "it-request", moduleId: "it", icon: "settings" },
  "software-installation": { slug: "software-installation", name: "Software Installation", category: "IT", description: "Request approved software installation or updates.", actionType: "it-request", moduleId: "it", icon: "box" },
  "internet-subscription": { slug: "internet-subscription", name: "Internet Subscription", category: "IT", description: "Request internet, Wi-Fi or data support.", actionType: "it-request", moduleId: "it", icon: "wifi" },
  "my-approvals": { slug: "my-approvals", name: "My Approvals", category: "Approvals", description: "Review work waiting for your decision.", actionType: "approvals", moduleId: "memos", icon: "check" },
};

const available = computed(() => {
  const id = service.value?.moduleId;
  if (!id) return true;
  const module = workspace.value?.modules?.find((item) => item.id === id);
  return module ? Boolean(module.enabled) : true;
});

const actionRoute = computed(() => {
  const item = service.value;
  if (!item) return "/services";
  switch (item.actionType) {
    case "signature": return "/email-signature";
    case "leave": return "/leave";
    case "procurement": return "/procurement/requests/new";
    case "people": return "/people";
    case "approvals": return "/approvals";
    default: return `/services/${item.slug}/start`;
  }
});

async function load() {
  loading.value = true;
  error.value = "";
  const slug = String(route.params.slug || "").toLowerCase();
  const [serviceResult, workspaceResult] = await Promise.allSettled([
    api.listBusinessServices(),
    api.getCompanyWorkspace(),
  ]);
  const dynamicServices = serviceResult.status === "fulfilled"
    ? normalizeList(serviceResult.value, ["services", "businessServices"])
    : [];
  if (workspaceResult.status === "fulfilled") workspace.value = workspaceResult.value?.data || workspaceResult.value;
  service.value = dynamicServices.find((item) => String(item.slug || "").toLowerCase() === slug) || builtIns[slug] || null;
  if (service.value) {
    if (["laptop-request", "business-purchase-request"].includes(service.value.slug)) {
      service.value.category = "Business Purchase";
      service.value.actionType = "procurement";
      service.value.moduleId = "procurement";
    }
  } else {
    error.value = serviceResult.status === "rejected"
      ? "Unable to load the service catalogue. Try again."
      : "Service not found.";
  }
  loading.value = false;
}

watch(() => route.params.slug, load);
onMounted(load);
</script>

<template>
  <div class="experience-page service-detail-page">
    <div class="service-breadcrumb">
      <RouterLink to="/services">Services</RouterLink>
      <AppIcon name="chevron" :size="15" />
      <strong>{{ service?.name || "Service details" }}</strong>
    </div>

    <section v-if="loading" class="workspace-panel panel-empty">Loading service details…</section>
    <section v-else-if="error" class="workspace-panel service-detail-state">
      <AppIcon name="file" :size="28" />
      <strong>{{ error }}</strong>
      <RouterLink to="/services" class="action-secondary">Back to services</RouterLink>
    </section>

    <template v-else-if="service">
      <section class="service-detail-hero workspace-panel">
        <span class="service-detail-icon"><AppIcon :name="service.icon || 'services'" :size="30" /></span>
        <div class="service-detail-copy">
          <span class="eyebrow">{{ service.category || "Company service" }}</span>
          <h1>{{ service.name }}</h1>
          <p>{{ service.description || "Start this service to create a request and track its progress." }}</p>
          <div class="service-detail-meta">
            <span><AppIcon name="shield" :size="15" /> {{ service.actionType || "service-request" }}</span>
            <span v-if="service.workflow"><AppIcon name="check" :size="15" /> Workflow configured</span>
          </div>
        </div>
        <div class="service-detail-actions">
          <RouterLink v-if="available" :to="actionRoute" class="action-primary">Continue <AppIcon name="arrow" :size="17" /></RouterLink>
          <span v-else class="service-disabled-message">This service is disabled for your company. Contact your administrator to enable it.</span>
          <RouterLink to="/services" class="action-secondary">All services</RouterLink>
        </div>
      </section>

      <section class="service-detail-grid">
        <article class="workspace-panel service-info-panel">
          <span class="eyebrow">HOW IT WORKS</span>
          <h2>One service, the right workflow.</h2>
          <p>MemoFlo opens the relevant form or module for this service. Direct memos go to their recipients; requests use their own service or approval process.</p>
        </article>
        <article class="workspace-panel service-info-panel">
          <span class="eyebrow">AVAILABILITY</span>
          <h2>{{ available ? "Available to you" : "Currently disabled" }}</h2>
          <p>{{ available ? "You can continue to the service action." : "The service remains visible so employees know it exists." }}</p>
        </article>
      </section>
    </template>
  </div>
</template>
