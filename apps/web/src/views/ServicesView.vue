<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const services = ref([]);
const workspace = ref(null);
const loading = ref(true);
const error = ref("");

const builtIns = [
  { name: "Simple Memo", slug: "general-memo", description: "Send a direct memo to one or more colleagues without an approval workflow.", category: "Communication", actionType: "memo-simple", moduleId: "communication", keywords: ["memo", "message", "communication", "letter"], icon: "memo" },
  { name: "Approval Memo", slug: "approval-memo", description: "Create a memo that follows the configured approval workflow.", category: "Communication", actionType: "memo-approval", moduleId: "communication", keywords: ["memo", "approval", "approve"], icon: "approval" },
  { name: "Email Signature", slug: "email-signature", description: "Create and preview the approved company email signature.", category: "Communication", actionType: "signature", moduleId: "signature", keywords: ["signature", "email", "mail"], icon: "mail" },
  { name: "My Approvals", slug: "my-approvals", description: "Review items waiting for your decision.", category: "Approvals", actionType: "approvals", moduleId: "memos", keywords: ["approval", "decision"], icon: "check" },
  { name: "Leave Request", slug: "leave-request", description: "Submit leave and follow the HR review process.", category: "People & HR", actionType: "leave", moduleId: "leave", keywords: ["hr", "leave", "vacation", "absence"], icon: "calendar" },
  { name: "Business Purchase", slug: "business-purchase-request", description: "Request laptops, equipment, supplies and other business purchases.", category: "Business Purchase", actionType: "procurement", moduleId: "procurement", keywords: ["purchase", "procurement", "laptop", "equipment", "buy"], icon: "purchase" },
  { name: "People Directory", slug: "people-directory", description: "Find colleagues, roles and departments.", category: "People & HR", actionType: "people", moduleId: "hr", keywords: ["people", "employee", "staff", "directory"], icon: "people" },
  { name: "IT Support & Maintenance", slug: "it-support", description: "Log an IT support ticket for troubleshooting, equipment repair, software installation, connectivity or data/internet issues, then track its progress.", category: "IT", actionType: "it-request", moduleId: "it", keywords: ["computer", "help", "technical", "maintenance", "repair", "printer", "network", "software", "installation", "internet", "wifi", "data", "ticket"], icon: "laptop" },
];

const categoryOrder = ["Communication", "Business Purchase", "IT", "People & HR", "Workplace", "Approvals", "Other"];

function categoryFor(service) {
  if (["laptop-request", "business-purchase-request"].includes(service.slug) || service.actionType === "procurement") return "Business Purchase";
  const category = String(service.category || "").trim();
  if (category.toLowerCase() === "business") return "Business Purchase";
  if (category) return category;
  return "Other";
}

const catalog = computed(() => {
  const dynamic = services.value.map((service) => {
    const originalSlug = String(service.slug || service._id || "").toLowerCase();
    const slug = ({ "laptop-request": "business-purchase-request", "it-maintenance": "it-support", "software-installation": "it-support", "internet-subscription": "it-support" })[originalSlug] || originalSlug;
    return {
      ...service,
      slug,
      name: slug === "business-purchase-request" ? "Business Purchase" : slug === "it-support" ? "IT Support & Maintenance" : service.name,
      description: slug === "business-purchase-request"
        ? "Request laptops, IT equipment, subscriptions, software, office supplies and other business purchases in one itemised workflow."
        : slug === "it-support"
          ? "Log and track IT support tickets for troubleshooting, repairs, software, connectivity and data issues."
          : service.description || "Company service.",
      category: slug === "business-purchase-request" ? "Business Purchase" : slug === "it-support" ? "IT" : categoryFor(service),
      actionType: slug === "business-purchase-request" ? "procurement" : slug === "it-support" ? "it-request" : service.actionType || "service-request",
      moduleId: slug === "business-purchase-request" ? "procurement" : slug === "it-support" ? "it" : service.moduleId || "",
      icon: slug === "business-purchase-request" ? "purchase" : slug === "it-support" ? "laptop" : service.icon || "services",
      keywords: Array.isArray(service.keywords) ? service.keywords : [],
    };
  });
  const bySlug = new Map();
  for (const service of [...builtIns, ...dynamic]) {
    bySlug.set(service.slug, { ...bySlug.get(service.slug), ...service, category: categoryFor(service) });
  }
  return [...bySlug.values()];
});

const groups = computed(() => {
  const categories = [...new Set([...categoryOrder, ...catalog.value.map((service) => service.category)])];
  return categories
    .map((category) => ({ category, services: catalog.value.filter((service) => service.category === category) }))
    .filter((group) => group.services.length);
});

function moduleEnabled(service) {
  if (!service.moduleId) return true;
  const modules = workspace.value?.modules || [];
  const match = modules.find((item) => item.id === service.moduleId);
  return match ? Boolean(match.enabled) : true;
}

async function load() {
  loading.value = true;
  error.value = "";
  const [serviceResult, workspaceResult] = await Promise.allSettled([
    api.listBusinessServices(),
    api.getCompanyWorkspace(),
  ]);
  if (serviceResult.status === "fulfilled") {
    services.value = normalizeList(serviceResult.value, ["services", "businessServices"]);
  } else {
    error.value = "The company service catalogue could not load. Showing built-in services.";
  }
  if (workspaceResult.status === "fulfilled") {
    workspace.value = workspaceResult.value?.data || workspaceResult.value;
  }
  loading.value = false;
}

onMounted(load);
</script>

<template>
  <div class="experience-page services-page">
    <section class="service-hero">
      <div>
        <span class="eyebrow">SERVICE CATALOGUE</span>
        <h1>What do you need to get done?</h1>
        <p>Choose a service by outcome. MemoFlo takes you to the right form, detail page or workflow.</p>
      </div>
      <div class="service-hero-note">
        <span class="service-hero-note-icon"><AppIcon name="grid" :size="24" /></span>
        <strong>{{ workspace?.company?.name || "Your workspace" }}</strong>
        <small>{{ catalog.length }} services available to explore</small>
      </div>
    </section>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>
    <div v-if="loading" class="workspace-panel panel-empty">Loading services…</div>
    <div v-else-if="!catalog.length" class="workspace-panel panel-empty">No services are configured yet.</div>

    <section v-for="group in groups" :key="group.category" class="service-group">
      <header class="service-group-heading">
        <div><span class="eyebrow">CATEGORY</span><h2>{{ group.category }}</h2></div>
        <span>{{ group.services.length }} {{ group.services.length === 1 ? "service" : "services" }}</span>
      </header>
      <div class="service-card-grid">
        <RouterLink
          v-for="service in group.services"
          :key="service.slug"
          :to="`/services/${service.slug}`"
          class="service-card"
          :class="{ 'service-disabled': !moduleEnabled(service) }"
        >
          <span class="service-icon"><AppIcon :name="service.icon" :size="23" /></span>
          <span class="service-card-copy">
            <strong>{{ service.name }}</strong>
            <small>{{ service.description }}</small>
          </span>
          <span v-if="!moduleEnabled(service)" class="service-availability">Disabled</span>
          <AppIcon v-else name="arrow" :size="19" class="service-card-arrow" />
        </RouterLink>
      </div>
    </section>
  </div>
</template>
