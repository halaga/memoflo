<script setup>
import { computed, onMounted, ref } from "vue";
import { api, getSavedEmployee } from "../services/api";
import { RouterLink } from "vue-router";

const employees = ref([]);
const search = ref("");
const loading = ref(true);
const current = computed(() => getSavedEmployee());

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return employees.value;
  return employees.value.filter((person) => `${person.firstName || ""} ${person.lastName || ""} ${person.email || ""} ${person.department?.name || person.department || ""} ${person.position?.title || person.position || ""}`.toLowerCase().includes(term));
});

async function load() {
  loading.value = true;
  try {
    const result = await api.listEmployees();
    employees.value = Array.isArray(result) ? result : result?.employees || result?.data || [];
  } finally {
    loading.value = false;
  }
}

function name(person) { return `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || "Employee"; }
function initials(person) { return name(person).split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function relation(value) { return value?.name || value?.title || value || "—"; }

onMounted(load);
</script>

<template>
  <div class="experience-page">
    <section class="page-intro-row">
      <div><span class="eyebrow">PEOPLE</span><h1>Know who keeps the company moving.</h1><p>A living directory for people, roles, departments and the relationships behind every workflow.</p></div>
      <RouterLink v-if="current?.role?.permissions?.includes('*')" to="/administration/organization" class="action-secondary">Manage structure</RouterLink>
    </section>

    <section class="people-toolbar"><div class="command-strip"><span>⌕</span><input v-model="search" placeholder="Search people, department or position…" /></div><span>{{ filtered.length }} people</span></section>

    <section class="workspace-panel directory-panel">
      <div v-if="loading" class="panel-empty">Loading people…</div>
      <div v-else-if="filtered.length === 0" class="panel-empty">No people match your search.</div>
      <div v-else class="people-list">
        <article v-for="person in filtered" :key="person._id" class="person-row">
          <div class="person-avatar">{{ initials(person) }}</div>
          <div class="person-main"><strong>{{ name(person) }}</strong><span>{{ relation(person.position) }} · {{ relation(person.department) }}</span></div>
          <div class="person-meta"><span>{{ relation(person.sbu) }}</span><small>{{ person.email || "No email" }}</small></div>
        </article>
      </div>
    </section>
  </div>
</template>
