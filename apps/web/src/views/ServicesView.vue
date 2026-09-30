<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { api, normalizeList } from "../services/api";

const route = useRoute();
const services = ref([]);
const workspace = ref(null);
const search = ref(String(route.query.q || ""));
const loading = ref(true);

const builtIns = [
  { name: "Simple Memo", slug: "general-memo", description: "Send a memo directly to a colleague. No long approval workflow.", category: "Communication", actionType: "memo-simple", moduleId: "communication", keywords: ["memo", "message", "communication", "letter"], route: "/services/general-memo/start", icon: "M" },
  { name: "Approval Memo", slug: "approval-memo", description: "Create a memo that enters a configured approval workflow.", category: "Communication", actionType: "memo-approval", moduleId: "communication", keywords: ["memo", "approval", "approve"], route: "/services/approval-memo/start", icon: "A" },
  { name: "Email Signature", slug: "email-signature", description: "Generate the company-approved email signature.", category: "Communication", actionType: "signature", moduleId: "signature", keywords: ["signature", "email", "mail"], route: "/email-signature", icon: "@" },
  { name: "My Approvals", slug: "my-approvals", description: "Review work waiting for your decision.", category: "Approvals", actionType: "approvals", moduleId: "memos", keywords: ["approval", "approve", "decision"], route: "/approvals", icon: "✓" },
  { name: "Leave Request", slug: "leave-request", description: "Request leave and follow the configured HR route.", category: "People & HR", actionType: "leave", moduleId: "hr", keywords: ["hr", "leave", "vacation", "absence", "people"], route: "/leave", icon: "L" },
  { name: "Business Purchase Request", slug: "business-purchase-request", description: "Request equipment, supplies or other business purchases.", category: "Business", actionType: "procurement", moduleId: "procurement", keywords: ["purchase", "procurement", "business", "buy", "equipment"], route: "/procurement/requests/new", icon: "P" },
  { name: "People Directory", slug: "people-directory", description: "Find colleagues and company structure.", category: "People & HR", actionType: "people", moduleId: "hr", keywords: ["people", "employee", "staff", "hr", "directory"], route: "/people", icon: "P" },
];

const moduleEnabled = (service) => {
  const id = service.moduleId;
  if (!id) return true;
  const modules = workspace.value?.modules || [];
  const found = modules.find((m) => m.id === id);
  if (!found) return true;
  return Boolean(found.enabled);
};

const catalog = computed(() => {
  const dynamic = services.value.map((service) => ({
    ...service,
    slug: service.slug,
    description: service.description || "Company service.",
    category: service.category || "Company service",
    route: `/services/${service.slug}/start`,
    keywords: Array.isArray(service.keywords) ? service.keywords : [],
    actionType: service.actionType || "service-request",
    moduleId: service.moduleId || "",
    icon: service.icon || "S",
  }));
  const map = new Map([...builtIns, ...dynamic].map((s) => [s.slug, s]));
  return [...map.values()];
});

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return catalog.value;
  const tokens = term.split(/\s+/).filter(Boolean);
  return catalog.value.filter((item) => {
    const haystack = `${item.name} ${item.description} ${item.category} ${(item.keywords || []).join(" ")} ${item.slug}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
});

watch(() => route.query.q, (value) => { search.value = String(value || ""); });

async function load() {
  loading.value = true;
  const [serviceResult, workspaceResult] = await Promise.allSettled([api.listBusinessServices(), api.getCompanyWorkspace()]);
  if (serviceResult.status === "fulfilled") services.value = normalizeList(serviceResult.value, ["services", "businessServices"]);
  if (workspaceResult.status === "fulfilled") workspace.value = workspaceResult.value?.data || workspaceResult.value;
  loading.value = false;
}
onMounted(load);
</script>

<template>
  <div class="experience-page">
    <section class="service-hero"><div><span class="eyebrow">SERVICES</span><h1>Tell MemoFlo what you need.</h1><p>Search by outcome, department, service or keyword. You don't need to know the internal module or approval route.</p></div><div class="service-hero-note"><strong>{{ workspace?.company?.name || "Your company" }}</strong><span>Company service catalogue</span></div></section>
    <section class="command-strip service-search"><span>⌕</span><input v-model="search" placeholder="Try HR, memo, laptop, signature, purchase…" /><button v-if="search" type="button" class="search-clear" @click="search=''">Clear</button></section>
    <section class="service-section">
      <div class="section-title-row"><div><span class="eyebrow">CATALOGUE</span><h2>{{ search ? `Results for “${search}”` : "Available services" }}</h2></div><span>{{ filtered.length }} services</span></div>
      <div v-if="loading" class="panel-empty">Loading services…</div>
      <div v-else-if="!filtered.length" class="panel-empty"><strong>No matching service.</strong><p>Try a department, outcome or keyword such as HR, memo, laptop or purchase.</p></div>
      <div v-else class="service-list">
        <RouterLink v-for="service in filtered" :key="service.slug" :to="`/services/${service.slug}`" class="service-row" :class="{ 'service-disabled': !moduleEnabled(service) }">
          <div class="service-icon">{{ service.icon }}</div>
          <div class="service-copy"><span>{{ service.category }}</span><strong>{{ service.name }}</strong><p>{{ service.description }}</p></div>
          <span v-if="!moduleEnabled(service)" class="service-availability">Unavailable</span><span v-else class="service-arrow">→</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
