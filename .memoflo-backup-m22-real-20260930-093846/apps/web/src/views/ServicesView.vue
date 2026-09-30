<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../services/api";

const services = ref([]);
const workspace = ref(null);
const search = ref("");
const loading = ref(true);

const builtIns = [
  { name: "Create a memo", description: "Send an internal request, announcement or approval through the right workflow.", category: "Communication", route: "/memos/create", live: true, icon: "M" },
  { name: "Email signature", description: "Generate the company-approved email signature for your role and brand.", category: "Identity", route: "/email-signature", live: true, icon: "@" },
  { name: "My approvals", description: "Review work waiting for your decision and keep requests moving.", category: "Approvals", route: "/approvals", live: true, icon: "✓" },
  { name: "Request leave", description: "Submit leave and follow the approval path from your manager through HR.", category: "People & HR", route: "/leave", live: true, icon: "L" },
  { name: "Request something for the business", description: "Start a business request and let the configured workflow route it to the right people.", category: "Business services", route: "/procurement", live: true, icon: "R" },
  { name: "People directory", description: "Find colleagues, departments and company structure without leaving MemoFlo.", category: "People", route: "/people", live: true, icon: "P" },
];

const catalog = computed(() => {
  const apiServices = services.value.map((service) => ({
    name: service.name,
    description: service.description || "Company business service.",
    category: service.category || "Company service",
    route: "/memos/create",
    live: true,
    icon: service.icon || "S",
  }));
  return [...builtIns, ...apiServices];
});

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return catalog.value;
  return catalog.value.filter((item) => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(term));
});

async function load() {
  loading.value = true;
  const [serviceResult, workspaceResult] = await Promise.allSettled([api.listBusinessServices(), api.getCompanyWorkspace()]);
  if (serviceResult.status === "fulfilled") services.value = Array.isArray(serviceResult.value) ? serviceResult.value : serviceResult.value?.services || serviceResult.value?.data || [];
  if (workspaceResult.status === "fulfilled") workspace.value = workspaceResult.value?.data || workspaceResult.value;
  loading.value = false;
}

onMounted(load);
</script>

<template>
  <div class="experience-page">
    <section class="service-hero">
      <div>
        <span class="eyebrow">SERVICES</span>
        <h1>Tell MemoFlo what you need.</h1>
        <p>You choose the outcome. MemoFlo handles the form, people, approvals and workflow behind it.</p>
      </div>
      <div class="service-hero-note"><strong>{{ workspace?.company?.name || "Your company" }}</strong><span>Company service catalogue</span></div>
    </section>

    <section class="command-strip service-search"><span>⌕</span><input v-model="search" placeholder="Search services like laptop, leave, approval, signature…" /></section>

    <section class="service-section">
      <div class="section-title-row"><div><span class="eyebrow">CATALOGUE</span><h2>Available services</h2></div><span>{{ filtered.length }} services</span></div>
      <div v-if="loading" class="panel-empty">Loading services…</div>
      <div v-else class="service-list">
        <RouterLink v-for="service in filtered" :key="`${service.name}-${service.route}`" :to="service.route" class="service-row">
          <div class="service-icon">{{ service.icon }}</div>
          <div class="service-copy"><span>{{ service.category }}</span><strong>{{ service.name }}</strong><p>{{ service.description }}</p></div>
          <span class="service-arrow">→</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
