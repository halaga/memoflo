<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api, normalizeList } from "../services/api";

const route = useRoute();
const services = ref([]);
const workspace = ref(null);
const search = ref(String(route.query.q || ""));
const selectedCategory = ref("All");
const loading = ref(true);

const builtIns = [
  {
    name: "General Memo",
    slug: "general-memo",
    description: "Send a direct memo to one or more colleagues.",
    category: "Communication",
    actionType: "memo-simple",
    moduleId: "communication",
    keywords: ["memo", "message", "communication", "letter"],
    route: "/services/general-memo/start",
    icon: "M",
  },
  {
    name: "Approval Memo",
    slug: "approval-memo",
    description: "Create a memo that enters the configured approval workflow.",
    category: "Communication",
    actionType: "memo-approval",
    moduleId: "communication",
    keywords: ["memo", "approval", "approve"],
    route: "/services/approval-memo/start",
    icon: "A",
  },
  {
    name: "Email Signature",
    slug: "email-signature",
    description: "Generate the company-approved email signature.",
    category: "Communication",
    actionType: "signature",
    moduleId: "signature",
    keywords: ["signature", "email", "mail"],
    route: "/email-signature",
    icon: "@",
  },
  {
    name: "Leave Request",
    slug: "leave-request",
    description: "Request leave through the HR route.",
    category: "People & HR",
    actionType: "leave",
    moduleId: "hr",
    keywords: ["hr", "leave", "vacation", "absence", "people"],
    route: "/leave",
    icon: "L",
  },
  {
    name: "Business Purchase",
    slug: "business-purchase-request",
    description: "Request equipment, supplies or other purchases requiring approval.",
    category: "Business Purchase",
    actionType: "procurement",
    moduleId: "procurement",
    keywords: ["purchase", "procurement", "business", "buy", "equipment"],
    route: "/procurement/requests/new",
    icon: "P",
  },
  {
    name: "People Directory",
    slug: "people-directory",
    description: "Find colleagues and company structure.",
    category: "People & HR",
    actionType: "people",
    moduleId: "hr",
    keywords: ["people", "employee", "staff", "hr", "directory"],
    route: "/people",
    icon: "P",
  },
  {
    name: "Laptop Request",
    slug: "laptop-request",
    description: "Request a laptop or business computing equipment through approval.",
    category: "Business Purchase",
    actionType: "procurement",
    moduleId: "procurement",
    keywords: ["laptop", "computer", "device", "hardware", "purchase", "equipment"],
    route: "/procurement/requests/new",
    icon: "L",
  },
  {
    name: "IT Support",
    slug: "it-support",
    description: "Report a technical issue or request IT assistance.",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
    keywords: ["it", "support", "help", "computer", "technical"],
    route: "/services/it-support/start",
    icon: "I",
  },
  {
    name: "IT Maintenance",
    slug: "it-maintenance",
    description: "Request device, system or other IT maintenance.",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
    keywords: ["it", "maintenance", "repair", "device", "technical"],
    route: "/services/it-maintenance/start",
    icon: "W",
  },
  {
    name: "Software Installation",
    slug: "software-installation",
    description: "Request approved software or application installation.",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
    keywords: ["software", "application", "install", "app", "it"],
    route: "/services/software-installation/start",
    icon: "S",
  },
  {
    name: "Internet Subscription",
    slug: "internet-subscription",
    description: "Request an internet, data or connectivity service.",
    category: "IT",
    actionType: "it-request",
    moduleId: "it",
    keywords: ["internet", "wifi", "data", "network", "it"],
    route: "/services/internet-subscription/start",
    icon: "N",
  },
];

const moduleEnabled = (service) => {
  const moduleId = service.moduleId;
  if (!moduleId) return true;

  const modules = workspace.value?.modules || [];
  const found = modules.find((module) => module.id === moduleId);

  return found ? Boolean(found.enabled) : true;
};

const catalog = computed(() => {
  const dynamic = services.value.map((service) => ({
    ...service,
    description: service.description || "Company service.",
    category: service.category || "Other",
    route: service.route || `/services/${service.slug}/start`,
    keywords: Array.isArray(service.keywords) ? service.keywords : [],
    actionType: service.actionType || "service-request",
    moduleId: service.moduleId || "",
    icon: service.icon || service.name?.[0] || "S",
  }));

  const map = new Map(
    [...builtIns, ...dynamic].map((service) => [service.slug, service]),
  );

  return [...map.values()];
});

const categories = computed(() => [
  "All",
  ...new Set(catalog.value.map((service) => service.category)),
]);

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  const category = selectedCategory.value;

  return catalog.value.filter((service) => {
    const categoryMatch =
      category === "All" || service.category === category;

    if (!categoryMatch) return false;
    if (!term) return true;

    const haystack = [
      service.name,
      service.description,
      service.category,
      service.slug,
      ...(service.keywords || []),
    ]
      .join(" ")
      .toLowerCase();

    return term
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => haystack.includes(token));
  });
});

const grouped = computed(() => {
  const groups = new Map();

  for (const service of filtered.value) {
    if (!groups.has(service.category)) groups.set(service.category, []);
    groups.get(service.category).push(service);
  }

  return [...groups.entries()];
});

watch(
  () => route.query.q,
  (value) => {
    search.value = String(value || "");
  },
);

async function load() {
  loading.value = true;

  const [serviceResult, workspaceResult] = await Promise.allSettled([
    api.listBusinessServices(),
    api.getCompanyWorkspace(),
  ]);

  if (serviceResult.status === "fulfilled") {
    services.value = normalizeList(serviceResult.value, [
      "services",
      "businessServices",
    ]);
  }

  if (workspaceResult.status === "fulfilled") {
    workspace.value =
      workspaceResult.value?.data || workspaceResult.value;
  }

  loading.value = false;
}

onMounted(load);
</script>

<template>
  <div class="experience-page services-page">
    <section class="service-hero">
      <div>
        <span class="eyebrow">SERVICES</span>
        <h1>Tell MemoFlo what you need.</h1>
        <p>
          Services are grouped by the team and company capability behind them.
          You only need to choose the outcome.
        </p>
      </div>

      <div class="service-hero-note">
        <strong>{{ workspace?.company?.name || "Your company" }}</strong>
        <span>Company service catalogue</span>
      </div>
    </section>

    <section class="command-strip service-search">
      <span>⌕</span>
      <input
        v-model="search"
        placeholder="Search services, outcomes or keywords…"
      />
      <button
        v-if="search"
        type="button"
        class="search-clear"
        @click="search = ''"
      >
        Clear
      </button>
    </section>

    <nav class="service-category-tabs" aria-label="Service groups">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        :class="{ active: selectedCategory === category }"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </nav>

    <section
      v-for="[category, items] in grouped"
      :key="category"
      class="service-group"
    >
      <div class="section-title-row">
        <div>
          <span class="eyebrow">{{ category }}</span>
          <h2>{{ items.length }} service{{ items.length === 1 ? "" : "s" }}</h2>
        </div>
      </div>

      <div class="service-list">
        <RouterLink
          v-for="service in items"
          :key="service.slug"
          :to="`/services/${service.slug}`"
          class="service-row"
          :class="{ 'service-disabled': !moduleEnabled(service) }"
        >
          <div class="service-icon">{{ service.icon }}</div>

          <div class="service-copy">
            <span>{{ service.category }}</span>
            <strong>{{ service.name }}</strong>
            <p>{{ service.description }}</p>
          </div>

          <span
            v-if="!moduleEnabled(service)"
            class="service-availability"
          >
            Unavailable
          </span>
          <span v-else class="service-arrow">→</span>
        </RouterLink>
      </div>
    </section>

    <section
      v-if="!loading && !grouped.length"
      class="workspace-panel panel-empty"
    >
      <strong>No matching service.</strong>
      <p>
        Try a department, outcome or keyword such as HR, memo, laptop,
        purchase or maintenance.
      </p>
    </section>
  </div>
</template>
