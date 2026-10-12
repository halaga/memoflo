<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const route = useRoute();
const router = useRouter();
const query = ref(String(route.query.q || ""));
const employee = getSavedEmployee();
const canViewEmployeeProfiles = Boolean(employee?.role?.permissions?.includes("*") || employee?.role?.permissions?.includes("employees.view"));
const loading = ref(false);
const error = ref("");
const allResults = ref([]);
const kinds = [
  { key: "all", label: "Everything" },
  { key: "people", label: "People" },
  { key: "services", label: "Services" },
  { key: "memos", label: "Memos" },
  { key: "requests", label: "Requests" },
  { key: "inventory", label: "Inventory" },
  { key: "organization", label: "Departments" },
  { key: "workflows", label: "Workflows" },
  { key: "roles", label: "Roles" },
  { key: "notifications", label: "Notifications" },
];
const selectedKind = ref("all");
const filtered = computed(() => {
  const term = query.value.trim().toLowerCase();
  return allResults.value.filter((item) => {
    const kindMatches = selectedKind.value === "all" || item.kind === selectedKind.value;
    const haystack = `${item.title} ${item.description} ${item.keywords || ""}`.toLowerCase();
    const queryMatches = !term || term.split(/\s+/).every((token) => haystack.includes(token));
    return kindMatches && queryMatches;
  });
});

function unwrap(result, keys) {
  return normalizeList(result, keys);
}

function safeRoute(value, fallback) {
  return typeof value === "string" && value.startsWith("/") ? value : fallback;
}

async function load() {
  const term = query.value.trim();
  if (!term) {
    allResults.value = [];
    loading.value = false;
    error.value = "";
    return;
  }
  loading.value = true;
  error.value = "";
  const sources = [
    ["people", () => api.listEmployeeDirectory(), ["employees"]],
    ["services", () => api.listBusinessServices(), ["services", "businessServices"]],
    ["memos", () => api.listMemos(), ["memos"]],
    ["inventory", () => api.listInventory(), ["items", "inventory"]],
    ["notifications", () => api.listNotifications(), ["notifications"]],
    ["requests", () => api.listServiceRequests(), ["requests", "serviceRequests"]],
    ["requests", () => api.listProcurementRequests("mine"), ["requests", "procurementRequests"]],
    ["requests", () => api.listLeaveRequests("mine"), ["requests", "leaveRequests"]],
    // Keep this source registry as the single place to extend global search when new modules are added.
    ["organization", () => api.listDepartments(), ["departments"]],
    ["workflows", () => api.listWorkflows(), ["workflows"]],
    ["roles", () => api.listRoles(), ["roles"]],
  ];
  const results = await Promise.allSettled(sources.map(([, loadSource]) => loadSource()));
  const mapped = [];

  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const [kind, , keys] = sources[index];
    for (const item of unwrap(result.value, keys)) {
      if (kind === "people") {
        mapped.push({
          id: `person-${item._id}`,
          kind,
          title: `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email || "Employee",
          description: [item.employeeNo, item.email, item.position?.title, item.position?.department?.name, item.department?.name].filter(Boolean).join(" · "),
          route: canViewEmployeeProfiles ? `/people/${item._id}` : "/people",
          icon: "user",
          keywords: item.phone || "",
        });
      } else if (kind === "services") {
        mapped.push({
          id: `service-${item._id || item.slug}`,
          kind,
          title: item.name || "Service",
          description: [item.category, item.description].filter(Boolean).join(" · "),
          route: `/services/${item.slug}`,
          icon: item.icon || "services",
          keywords: `${item.slug || ""} ${(item.keywords || []).join(" ")}`,
        });
      } else if (kind === "memos") {
        mapped.push({
          id: `memo-${item._id}`,
          kind,
          title: item.title || "Untitled memo",
          description: [item.referenceNo, item.status, item.businessService?.name, item.createdBy?.firstName, item.createdBy?.lastName].filter(Boolean).join(" · "),
          route: `/memos/${item._id}`,
          icon: "memo",
          keywords: item.body || "",
        });
      } else if (kind === "inventory") {
        mapped.push({
          id: `inventory-${item._id}`,
          kind,
          title: item.name || "Inventory item",
          description: [item.itemCode, item.serialNumber, item.category, item.location, item.ownerDepartment?.name, item.custodian?.firstName, item.custodian?.lastName].filter(Boolean).join(" · "),
          route: "/administration/inventory",
          icon: "box",
          keywords: item.notes || "",
        });
      } else if (kind === "organization") {
        mapped.push({
          id: `department-${item._id}`,
          kind,
          title: item.name || "Department",
          description: item.code || item.description || "Company department",
          route: "/administration/organization",
          icon: "company",
          keywords: item.description || "",
        });
      } else if (kind === "workflows") {
        mapped.push({
          id: `workflow-${item._id}`,
          kind,
          title: item.name || "Workflow",
          description: item.description || item.status || "Configured workflow",
          route: "/administration/workflows",
          icon: "approval",
          keywords: item.memoType || item.resourceType || "",
        });
      } else if (kind === "roles") {
        mapped.push({
          id: `role-${item._id}`,
          kind,
          title: item.name || "Role",
          description: item.description || (item.permissions || []).join(", "),
          route: "/administration/roles",
          icon: "shield",
          keywords: item.code || "",
        });
      } else if (kind === "notifications") {
        mapped.push({
          id: `notification-${item._id}`,
          kind,
          title: item.title || "Notification",
          description: item.message || "",
          route: safeRoute(item.link || item.actionUrl, "/notifications"),
          icon: "bell",
          keywords: item.type || "",
        });
      } else {
        const requestId = item._id;
        const isLeave = Boolean(item.leaveType || item.startDate || item.leaveTypeName);
        const isProcurement = Boolean(item.requestNumber || item.items || item.requestingSbu);
        const routePath = isLeave
          ? `/leave/requests/${requestId}`
          : isProcurement
            ? `/procurement/requests/${requestId}`
            : `/work/requests/${requestId}`;
        mapped.push({
          id: `${kind}-${requestId}`,
          kind,
          title: item.title || item.subject || item.requestNumber || "Request",
          description: [item.status, item.category, item.service?.name, item.referenceNo].filter(Boolean).join(" · "),
          route: routePath,
          icon: isLeave ? "calendar" : isProcurement ? "purchase" : "file",
          keywords: `${item.details || ""} ${item.description || ""}`,
        });
      }
    }
  });

  const termLower = term.toLowerCase();
  allResults.value = mapped.filter((item) => {
    const text = `${item.title} ${item.description} ${item.keywords || ""}`.toLowerCase();
    return termLower.split(/\s+/).every((token) => text.includes(token));
  });
  if (!results.some((result) => result.status === "fulfilled")) {
    error.value = "Search could not load data. Check your connection and permissions.";
  }
  loading.value = false;
}

function open(item) {
  router.push(item.route);
}

watch(() => route.query.q, (value) => {
  query.value = String(value || "");
  load();
});
onMounted(load);
</script>

<template>
  <div class="experience-page global-search-page">
    <section class="page-intro-row">
      <div>
        <span class="eyebrow">GLOBAL SEARCH</span>
        <h1>Search across MemoFlo.</h1>
        <p>People, services, memos, requests, inventory and notifications in one place.</p>
      </div>
    </section>
    <div class="search-filters" role="tablist" aria-label="Search categories">
      <button v-for="kind in kinds" :key="kind.key" type="button" :class="{ active: selectedKind === kind.key }" @click="selectedKind = kind.key">{{ kind.label }}</button>
      <span class="search-result-count">{{ filtered.length }} results</span>
    </div>
    <div v-if="loading" class="workspace-panel panel-empty">Searching your workspace…</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else-if="!query.trim()" class="workspace-panel panel-empty">Enter a keyword above to search all available workspace data.</div>
    <div v-else-if="!filtered.length" class="workspace-panel panel-empty">No results for “{{ query }}”. Try another keyword.</div>
    <section v-else class="search-results workspace-panel">
      <button v-for="item in filtered" :key="item.id" type="button" class="search-result-row" @click="open(item)">
        <span class="search-result-icon"><AppIcon :name="item.icon" :size="20" /></span>
        <span class="search-result-copy"><strong>{{ item.title }}</strong><small>{{ item.description || item.kind }}</small></span>
        <span class="search-result-type">{{ item.kind }}</span>
        <AppIcon name="arrow" :size="18" />
      </button>
    </section>
  </div>
</template>
