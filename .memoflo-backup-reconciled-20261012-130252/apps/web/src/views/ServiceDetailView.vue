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
  "general-memo": {
    slug: "general-memo",
    name: "General Memo",
    category: "Communication",
    description: "Send a direct memo to one or more colleagues.",
    actionType: "memo-simple",
    moduleId: "communication",
    route: "/services/general-memo/start",
    icon: "M",
  },
  "approval-memo": {
    slug: "approval-memo",
    name: "Approval Memo",
    category: "Communication",
    description: "Create a memo that enters the configured approval workflow.",
    actionType: "memo-approval",
    moduleId: "communication",
    route: "/services/approval-memo/start",
    icon: "A",
  },
  "email-signature": {
    slug: "email-signature",
    name: "Email Signature",
    category: "Communication",
    description: "Generate the company-approved email signature.",
    actionType: "signature",
    moduleId: "signature",
    route: "/email-signature",
    icon: "@",
  },
  "leave-request": {
    slug: "leave-request",
    name: "Leave Request",
    category: "People & HR",
    description: "Request leave and follow the configured HR route.",
    actionType: "leave",
    moduleId: "hr",
    route: "/leave",
    icon: "L",
  },
  "request-leave": {
    slug: "request-leave",
    name: "Leave Request",
    category: "People & HR",
    description: "Request leave and follow the configured HR route.",
    actionType: "leave",
    moduleId: "hr",
    route: "/leave",
    icon: "L",
  },
  "business-purchase-request": {
    slug: "business-purchase-request",
    name: "Business Purchase",
    category: "Business Purchase",
    description: "Request equipment, supplies or other purchases that require approval.",
    actionType: "procurement",
    moduleId: "procurement",
    route: "/procurement/requests/new",
    icon: "P",
  },
  "people-directory": {
    slug: "people-directory",
    name: "People Directory",
    category: "People & HR",
    description: "Find colleagues and company structure.",
    actionType: "people",
    moduleId: "hr",
    route: "/people",
    icon: "P",
  },
  "laptop-request": {
    slug: "laptop-request",
    name: "Laptop Request",
    category: "Business Purchase",
    description: "Request a laptop or business computing equipment through approval.",
    actionType: "procurement",
    moduleId: "procurement",
    route: "/procurement/requests/new",
    icon: "L",
  },
  "it-support": {
    slug: "it-support",
    name: "IT Support",
    category: "IT",
    description: "Report a technical issue or request IT assistance.",
    actionType: "it-request",
    moduleId: "it",
    route: "/services/it-support/start",
    icon: "I",
  },
  "it-maintenance": {
    slug: "it-maintenance",
    name: "IT Maintenance",
    category: "IT",
    description: "Request device, system or other IT maintenance.",
    actionType: "it-request",
    moduleId: "it",
    route: "/services/it-maintenance/start",
    icon: "W",
  },
  "software-installation": {
    slug: "software-installation",
    name: "Software Installation",
    category: "IT",
    description: "Request approved software or application installation.",
    actionType: "it-request",
    moduleId: "it",
    route: "/services/software-installation/start",
    icon: "S",
  },
  "internet-subscription": {
    slug: "internet-subscription",
    name: "Internet Subscription",
    category: "IT",
    description: "Request an internet, data or connectivity service.",
    actionType: "it-request",
    moduleId: "it",
    route: "/services/internet-subscription/start",
    icon: "N",
  },
};

const available = computed(() => {
  const moduleId = service.value?.moduleId;
  if (!moduleId) return true;

  const module = workspace.value?.modules?.find(
    (item) => item.id === moduleId,
  );

  return module ? Boolean(module.enabled) : true;
});

const actionRoute = computed(
  () => service.value?.route || `/services/${route.params.slug}/start`,
);

async function load() {
  loading.value = true;
  error.value = "";

  const [serviceResult, workspaceResult] = await Promise.allSettled([
    api.listBusinessServices(),
    api.getCompanyWorkspace(),
  ]);

  const items =
    serviceResult.status === "fulfilled"
      ? normalizeList(serviceResult.value, ["services", "businessServices"])
      : [];

  workspace.value =
    workspaceResult.status === "fulfilled"
      ? workspaceResult.value?.data || workspaceResult.value
      : null;

  const slug = String(route.params.slug || "").toLowerCase();

  service.value =
    items.find(
      (item) => String(item.slug || "").toLowerCase() === slug,
    ) ||
    builtIns[slug] ||
    null;

  if (!service.value) {
    error.value = "Service not found.";
  }

  loading.value = false;
}

onMounted(load);
</script>

<template>
  <div class="experience-page service-detail-page">
    <div class="service-breadcrumb">
      <RouterLink to="/services">Services</RouterLink>
      <span>›</span>
      <strong>{{ service?.name || "Service" }}</strong>
    </div>

    <section v-if="loading" class="service-detail-state">
      Loading service…
    </section>

    <section v-else-if="error" class="service-detail-state error-state">
      <strong>{{ error }}</strong>
      <p>The service may have been renamed or is not available in this catalogue.</p>
      <RouterLink to="/services" class="action-secondary">
        Back to Services
      </RouterLink>
    </section>

    <template v-else-if="service">
      <section class="service-detail-hero">
        <div class="service-detail-icon">
          {{ service.icon || service.name?.[0] || "S" }}
        </div>

        <div class="service-detail-copy">
          <span class="eyebrow">{{ service.category }}</span>
          <h1>{{ service.name }}</h1>
          <p>{{ service.description }}</p>

          <div class="service-detail-meta">
            <span>Service group</span>
            <strong>{{ service.category }}</strong>
            <span v-if="service.workflow">Workflow configured</span>
          </div>
        </div>

        <div class="service-detail-actions">
          <RouterLink
            v-if="available"
            :to="actionRoute"
            class="action-primary"
          >
            Start service →
          </RouterLink>

          <span v-else class="service-disabled-message">
            This service is currently disabled for your company.
          </span>

          <RouterLink to="/services" class="action-secondary">
            Back to Services
          </RouterLink>
        </div>
      </section>

      <section class="service-detail-grid">
        <article class="workspace-panel service-info-panel">
          <span class="eyebrow">HOW IT WORKS</span>
          <h2>You choose the outcome.</h2>
          <p>
            MemoFlo resolves the people, permissions and workflow behind the
            service. Employees do not need to understand the internal setup
            before starting.
          </p>
        </article>

        <article class="workspace-panel service-info-panel">
          <span class="eyebrow">AVAILABILITY</span>
          <h2>{{ available ? "Available" : "Currently disabled" }}</h2>
          <p>
            {{
              available
                ? "You can start this service now."
                : "The service remains visible so employees know it exists, but the company module or subscription is currently disabled."
            }}
          </p>
        </article>
      </section>
    </template>
  </div>
</template>
