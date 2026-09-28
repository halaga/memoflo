<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, getSavedEmployee } from "../services/api";

const workspace = ref(null);
const loading = ref(true);
const employee = computed(() => getSavedEmployee());
const company = computed(() => workspace.value?.company || employee.value?.company || {});
const liveModules = computed(() => workspace.value?.modules?.filter((item) => item.enabled && item.status === "live") || []);

async function load() {
  try {
    const result = await api.getCompanyWorkspace();
    workspace.value = result?.data || result;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="experience-page">
    <section class="company-cover">
      <div class="company-brand-large">
        <img v-if="company?.branding?.logo || company?.logo" :src="company?.branding?.logo || company?.logo" alt="" />
        <span v-else>{{ company?.name?.[0] || "M" }}</span>
      </div>
      <div><span class="eyebrow">COMPANY</span><h1>{{ company?.name || "Your company" }}</h1><p>Your company's people, services, policies and working memory — brought together.</p></div>
    </section>

    <div class="company-layout">
      <section class="workspace-panel">
        <div class="panel-heading"><div><span class="eyebrow">THE ORGANIZATION</span><h2>Company at a glance</h2></div></div>
        <div class="company-facts">
          <div><span>People</span><strong>Directory</strong><RouterLink to="/people">Open →</RouterLink></div>
          <div><span>Services</span><strong>{{ liveModules.length || "—" }} enabled capabilities</strong><RouterLink to="/services">Explore →</RouterLink></div>
          <div><span>Work</span><strong>Requests & approvals</strong><RouterLink to="/work">Open →</RouterLink></div>
        </div>
      </section>

      <section class="workspace-panel">
        <div class="panel-heading"><div><span class="eyebrow">COMPANY CAPABILITIES</span><h2>What is enabled</h2></div></div>
        <div v-if="loading" class="panel-empty">Loading capabilities…</div>
        <div v-else class="capability-list">
          <div><span>◎</span><strong>People & organization</strong><small>Directory, departments, positions, roles and company structure.</small></div>
          <div><span>◈</span><strong>Services & workflows</strong><small>Employees ask for outcomes while MemoFlo routes the work through configured workflows.</small></div>
          <div><span>✓</span><strong>Memos & approvals</strong><small>Formal internal communication, decisions, approvals and permanent history.</small></div>
          <div><span>⌁</span><strong>Governance & memory</strong><small>Branding, access, notifications and company activity stay under company control.</small></div>
        </div>
      </section>
    </div>

    <section class="workspace-panel company-memory">
      <div class="panel-heading"><div><span class="eyebrow">COMPANY MEMORY</span><h2>Governance belongs here</h2></div><RouterLink to="/administration" class="panel-link">Administration →</RouterLink></div>
      <p>Organization structure, roles, workflows, branding, access and permanent activity history are company-owned foundations. Employees use the experience; administrators shape it here.</p>
    </section>
  </div>
</template>
