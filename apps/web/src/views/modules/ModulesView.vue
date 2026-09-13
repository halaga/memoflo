<script setup>
import { computed } from "vue";
import { getSavedEmployee } from "../../services/api";

const employee = computed(() => getSavedEmployee());
const company = computed(() => employee.value?.company);

const modules = [
  { id:"memos", name:"Memo Management", desc:"Create, route, approve and track business memos.", icon:"M", live:true, route:"/memos" },
  { id:"signature", name:"Email Signature", desc:"Manage company signatures and campaign banners.", icon:"@" },
  { id:"leave", name:"Leave Management", desc:"Employee leave requests, balances and approvals.", icon:"L" },
  { id:"procurement", name:"Procurement Management", desc:"Structured purchasing and approval workflows.", icon:"P" },
  { id:"assets", name:"Asset Management", desc:"Track assignments, custody and asset lifecycle.", icon:"A" },
  { id:"expenses", name:"Expense Management", desc:"Submit and approve business expenses.", icon:"₦" },
  { id:"documents", name:"Document Management", desc:"Organize controlled business documents.", icon:"D" },
  { id:"requests", name:"Employee Requests", desc:"Centralize internal service requests.", icon:"R" },
  { id:"meetings", name:"Meeting & Room Management", desc:"Manage rooms, meetings and shared resources.", icon:"◫" },
  { id:"visitors", name:"Visitor Management", desc:"Manage visitors and front-desk activities.", icon:"V" },
  { id:"maintenance", name:"Maintenance Management", desc:"Track facilities and maintenance requests.", icon:"⚙" },
];
const enabledModules = computed(() => {
  if (company.value?.code === "RINGO") return modules.map((m) => m.id);
  return company.value?.settings?.modules || modules.filter((m) => m.live).map((m) => m.id);
});
const visibleModules = computed(() => modules.map((module) => ({ ...module, enabled: enabledModules.value.includes(module.id) })));
const liveCount = computed(() => visibleModules.value.filter((m) => m.live && m.enabled).length);
</script>

<template>
  <div class="page module-hub-page">
    <section class="hub-hero">
      <div><span class="hero-kicker">{{ company?.name || "MemoFlo" }}</span><h1>Welcome, {{ employee?.firstName || "there" }}</h1><p>Your business workspace is ready. Choose a module to get started.</p></div>
      <div class="hub-hero-meta"><span>Signed in as</span><strong>{{ employee?.role?.name || "Employee" }}</strong><small>{{ liveCount }} modules active</small></div>
    </section>

    <div class="section-heading"><div><h2>Your workspace</h2><p>Modules available across the MemoFlo platform.</p></div></div>

    <div class="module-grid polished-module-grid">
      <component v-for="module in visibleModules" :key="module.id" :is="module.live && module.enabled && module.route ? 'router-link' : 'div'"  :to="module.enabled && module.route ? module.route : undefined" class="module-tile" :class="{ disabled: !module.live || !module.enabled }">
        <div class="module-tile-icon">{{ module.icon }}</div>
        <div class="module-tile-body"><div class="module-tile-title"><h3>{{ module.name }}</h3><span :class="module.live && module.enabled ? 'live' : ''">{{ module.live && module.enabled ? 'Live' : module.enabled ? 'Enabled / building' : 'Not subscribed' }}</span></div><p>{{ module.desc }}</p></div>
        <span v-if="module.live && module.enabled && module.route" class="module-tile-arrow">→</span>
      </component>
    </div>
  </div>
</template>
