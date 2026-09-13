<script setup>
import { computed, onMounted, ref } from "vue";
import { api, getSavedEmployee } from "../../services/api";

const employee = computed(() => getSavedEmployee());
const workspace = ref(null);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true; error.value = "";
  try { const result = await api.getCompanyWorkspace(); workspace.value = result?.data || result; }
  catch (err) { error.value = err.message || "Unable to load company modules."; }
  finally { loading.value = false; }
}

const company = computed(() => workspace.value?.company || employee.value?.company);
const modules = computed(() => workspace.value?.modules || []);
const enabledCount = computed(() => modules.value.filter((m) => m.enabled).length);

onMounted(load);
</script>

<template>
  <div class="page module-hub-page">
    <section class="hub-hero">
      <div>
        <span class="hero-kicker">{{ company?.name || "MemoFlo" }}</span>
        <h1>Welcome, {{ employee?.firstName || "there" }}</h1>
        <p>Your company workspace. Open an enabled module or explore what MemoFlo can provide.</p>
      </div>
      <div class="hub-hero-meta"><span>Signed in as</span><strong>{{ employee?.role?.name || "Employee" }}</strong><small>{{ enabledCount }} modules enabled</small></div>
    </section>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="card empty-state">Loading your workspace…</div>

    <template v-else>
      <div class="section-heading"><div><h2>Company modules</h2><p>Availability comes from the company's MemoFlo entitlement.</p></div></div>
      <div class="module-grid polished-module-grid">
        <component v-for="module in modules" :key="module.id" :is="module.enabled && module.status === 'live' && module.route ? 'router-link' : 'div'" :to="module.enabled && module.route ? module.route : undefined" class="module-tile" :class="{ disabled: !module.enabled || module.status !== 'live' }">
          <div class="module-tile-icon">{{ module.icon }}</div>
          <div class="module-tile-body"><div class="module-tile-title"><h3>{{ module.name }}</h3><span :class="module.enabled && module.status === 'live' ? 'live' : ''">{{ !module.enabled ? 'Not enabled' : module.status === 'live' ? 'Live' : 'Coming soon' }}</span></div><p>{{ module.description }}</p></div>
          <span v-if="module.enabled && module.status === 'live' && module.route" class="module-tile-arrow">→</span>
        </component>
      </div>
    </template>
  </div>
</template>
