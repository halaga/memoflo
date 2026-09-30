<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { api, normalizeList } from "../services/api";

const route = useRoute();
const router = useRouter();
const service = ref(null);
const loading = ref(true);
const error = ref("");

const builtInRoutes = {
  "create-memo": "/memos/create",
  "email-signature": "/email-signature",
  "my-approvals": "/approvals",
  "request-leave": "/leave",
  "business-purchase-request": "/procurement",
  "people-directory": "/people",
};

const actionRoute = computed(() => {
  if (!service.value) return "/services";
  return service.value.route || builtInRoutes[service.value.slug] || `/memos/create?service=${encodeURIComponent(service.value._id || "")}`;
});

const isDynamic = computed(() => Boolean(service.value?._id));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.listBusinessServices();
    const items = normalizeList(result, ["services", "businessServices"]);
    const slug = String(route.params.slug || "").toLowerCase();
    const found = items.find((item) => String(item.slug || "").toLowerCase() === slug);
    if (found) {
      service.value = {
        ...found,
        description: found.description || "A company service available through MemoFlo.",
        category: found.category || "Company service",
        ownerName: found.ownerDepartment?.name || "Service owner",
      };
      return;
    }

    const builtIns = [
      { slug: "create-memo", name: "Create a memo", category: "Communication", description: "Send an internal request, announcement or approval through the company's configured workflow.", ownerName: "Company communications", icon: "M", route: "/memos/create" },
      { slug: "email-signature", name: "Email signature", category: "Identity", description: "Generate the company-approved signature using the company's brand and approved layout.", ownerName: "Administration", icon: "@", route: "/email-signature" },
      { slug: "my-approvals", name: "My approvals", category: "Approvals", description: "Review work waiting for your decision and keep requests moving.", ownerName: "Workflow", icon: "✓", route: "/approvals" },
      { slug: "request-leave", name: "Request leave", category: "People & HR", description: "Submit leave and follow the configured manager, SBU and HR route.", ownerName: "Human Resources", icon: "L", route: "/leave" },
      { slug: "business-purchase-request", name: "Business purchase request", category: "Business services", description: "Request equipment, supplies or other business purchases and follow the approval trail through completion.", ownerName: "Administration / Finance", icon: "R", route: "/procurement/requests/new" },
      { slug: "people-directory", name: "People directory", category: "People", description: "Find colleagues, departments, positions and the company structure.", ownerName: "People & HR", icon: "P", route: "/people" },
    ];
    service.value = builtIns.find((item) => item.slug === slug) || null;
    if (!service.value) error.value = "Service not found.";
  } catch (err) {
    error.value = err.message || "Unable to load this service.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="experience-page service-detail-page">
    <div class="service-breadcrumb"><RouterLink to="/services">Services</RouterLink><span>›</span><strong>{{ service?.name || "Service" }}</strong></div>

    <section v-if="loading" class="service-detail-state">Loading service…</section>
    <section v-else-if="error" class="service-detail-state error-state"><strong>{{ error }}</strong><RouterLink to="/services" class="action-secondary">Back to services</RouterLink></section>
    <template v-else-if="service">
      <section class="service-detail-hero">
        <div class="service-detail-icon">{{ service.icon || service.name?.[0] || "S" }}</div>
        <div class="service-detail-copy">
          <span class="eyebrow">{{ service.category }}</span>
          <h1>{{ service.name }}</h1>
          <p>{{ service.description }}</p>
          <div class="service-detail-meta"><span>Owner</span><strong>{{ service.ownerName }}</strong><span v-if="service.workflow">Workflow configured</span></div>
        </div>
        <div class="service-detail-actions">
          <RouterLink :to="actionRoute" class="action-primary">Start service →</RouterLink>
          <RouterLink to="/services" class="action-secondary">Back to services</RouterLink>
        </div>
      </section>

      <section class="service-detail-grid">
        <article class="workspace-panel service-info-panel">
          <span class="eyebrow">HOW IT WORKS</span>
          <h2>One request. The right route.</h2>
          <p>MemoFlo uses your company's people, permissions and workflow definitions to determine who handles the work next. Employees don't need to know the internal approval structure before starting.</p>
          <div class="service-flow"><span>1. You request</span><i>→</i><span>2. MemoFlo routes</span><i>→</i><span>3. People act</span><i>→</i><span>4. You track</span></div>
        </article>
        <article class="workspace-panel service-info-panel">
          <span class="eyebrow">VISIBILITY</span>
          <h2>Always know where it is.</h2>
          <p>Requests can appear in My Work, notifications and the permanent activity history so the company has a record of what happened.</p>
          <RouterLink to="/work" class="panel-link">Open My Work →</RouterLink>
        </article>
      </section>
    </template>
  </div>
</template>
