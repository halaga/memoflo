<script setup>
import { onMounted, ref } from "vue";
import { api } from "../../services/api.js";

const logs = ref([]);
const loading = ref(true);
const error = ref("");
const page = ref(1);
const pages = ref(1);
const search = ref("");
const outcome = ref("");
const selected = ref(null);

function actorName(actor) {
  if (!actor) return "System";
  return `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || actor.email || "User";
}
function formatDate(value) { return new Date(value).toLocaleString(); }
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.listAuditLogs({ page: page.value, search: search.value || undefined, outcome: outcome.value || undefined });
    logs.value = result?.data?.items || [];
    pages.value = result?.data?.pagination?.pages || 1;
  } catch (err) { error.value = err.message || "Unable to load platform activity."; }
  finally { loading.value = false; }
}
function applyFilters() { page.value = 1; load(); }
function nextPage(delta) { page.value += delta; load(); }
onMounted(load);
</script>

<template>
  <section class="activity-page">
    <header class="activity-header">
      <div><span class="activity-eyebrow">MEMOFLO PLATFORM</span><h1>Activity Log</h1><p>A permanent company-scoped record of meaningful MemoFlo activity — who did what, when, and against which resource.</p></div>
      <div class="activity-purpose"><strong>Reference history</strong><span>Use this when you need to trace a change, approval, configuration action or failed operation.</span></div>
    </header>

    <div class="activity-toolbar">
      <input v-model="search" placeholder="Search person, action, resource or ID" @keyup.enter="applyFilters">
      <select v-model="outcome" @change="applyFilters"><option value="">All outcomes</option><option value="success">Successful</option><option value="failure">Failed</option></select>
      <button type="button" @click="applyFilters">Search activity</button>
    </div>

    <div v-if="error" class="activity-error">{{ error }}</div>
    <div v-if="loading" class="activity-empty">Loading activity history…</div>
    <div v-else-if="!logs.length" class="activity-empty"><strong>No activity found</strong><span>Once people create, edit, approve or configure things in MemoFlo, their activity will appear here.</span></div>

    <div v-else class="activity-layout">
      <section class="activity-list">
        <article v-for="log in logs" :key="log._id" class="activity-row" :class="{ selected: selected?._id === log._id }" @click="selected = log">
          <div class="activity-icon" :class="log.outcome">{{ log.outcome === 'success' ? '✓' : '!' }}</div>
          <div class="activity-row-main"><div class="activity-row-top"><strong>{{ log.summary || log.action }}</strong><time>{{ formatDate(log.occurredAt) }}</time></div><p>{{ actorName(log.actor) }} · {{ log.module || 'MemoFlo Platform' }}</p><small>{{ log.resourceType }}<span v-if="log.resourceId"> · {{ log.resourceId }}</span></small></div>
          <span class="activity-arrow">→</span>
        </article>
        <div class="activity-pagination" v-if="pages > 1"><button :disabled="page <= 1" @click="nextPage(-1)">← Previous</button><span>{{ page }} / {{ pages }}</span><button :disabled="page >= pages" @click="nextPage(1)">Next →</button></div>
      </section>

      <aside v-if="selected" class="activity-detail">
        <div class="activity-detail-head"><div><span>ACTIVITY DETAIL</span><h2>{{ selected.summary || selected.action }}</h2></div><button @click="selected = null">×</button></div>
        <dl><div><dt>Actor</dt><dd>{{ actorName(selected.actor) }}</dd></div><div><dt>Module</dt><dd>{{ selected.module || 'MemoFlo Platform' }}</dd></div><div><dt>Action</dt><dd>{{ selected.action }}</dd></div><div><dt>Resource</dt><dd>{{ selected.resourceType }}{{ selected.resourceId ? ` · ${selected.resourceId}` : '' }}</dd></div><div><dt>Time</dt><dd>{{ formatDate(selected.occurredAt) }}</dd></div><div><dt>Request</dt><dd>{{ selected.method }} · {{ selected.statusCode }} · {{ selected.path }}</dd></div><div><dt>Outcome</dt><dd>{{ selected.outcome }}</dd></div></dl>
        <div class="activity-fields"><span>Fields involved</span><div v-if="selected.metadata?.fields?.length"><b v-for="field in selected.metadata.fields" :key="field">{{ field }}</b></div><em v-else>No request fields recorded.</em></div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.activity-page{max-width:1400px;margin:0 auto;padding:4px 0 50px}.activity-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:18px}.activity-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#7690ad}.activity-header h1{font-size:40px;letter-spacing:-.045em;margin:5px 0;color:#14213d}.activity-header p{margin:0;max-width:760px;color:#758398;line-height:1.6;font-size:12px}.activity-purpose{max-width:300px;padding:14px 16px;border:1px solid #dce6f7;border-radius:15px;background:#f6f8ff}.activity-purpose strong,.activity-purpose span{display:block}.activity-purpose strong{font-size:12px;color:#315dff}.activity-purpose span{font-size:10px;color:#708099;line-height:1.55;margin-top:4px}.activity-toolbar{display:grid;grid-template-columns:1fr 180px auto;gap:8px;padding:7px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 10px 25px #18263d08;margin-bottom:14px}.activity-toolbar input,.activity-toolbar select{border:1px solid #e1e7ef;background:#fbfcfe;border-radius:11px;padding:11px 12px;outline:none;color:#33445c}.activity-toolbar button{border:0;border-radius:11px;background:#14213d;color:#fff;font-weight:750;padding:0 16px;cursor:pointer}.activity-error{padding:12px;background:#fff1f2;color:#be123c;border-radius:12px}.activity-empty{min-height:300px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#7f8da1;gap:6px}.activity-empty strong{color:#273650}.activity-layout{display:grid;grid-template-columns:minmax(0,1fr) 370px;gap:14px}.activity-list,.activity-detail{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 12px 30px #18263d08}.activity-row{display:flex;align-items:center;gap:12px;padding:14px;border-bottom:1px solid #edf1f5;cursor:pointer;transition:.15s}.activity-row:last-of-type{border-bottom:0}.activity-row:hover,.activity-row.selected{background:#f7f9fc}.activity-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:800;font-size:12px;flex:none}.activity-icon.success{background:#ecfdf5;color:#047857}.activity-icon.failure{background:#fff1f2;color:#be123c}.activity-row-main{min-width:0;flex:1}.activity-row-top{display:flex;justify-content:space-between;gap:10px}.activity-row-top strong{font-size:12px;color:#273650}.activity-row-top time{font-size:9px;color:#98a4b3;white-space:nowrap}.activity-row-main p{margin:4px 0 2px;color:#708096;font-size:10px}.activity-row-main small{font-size:9px;color:#9ba6b5}.activity-arrow{color:#a0aaba}.activity-detail{padding:18px;height:max-content;position:sticky;top:90px}.activity-detail-head{display:flex;justify-content:space-between;gap:12px;padding-bottom:15px;border-bottom:1px solid #edf1f5}.activity-detail-head>div>span{font-size:9px;letter-spacing:.12em;color:#8290a3;font-weight:800}.activity-detail h2{font-size:17px;color:#263650;margin:5px 0 0}.activity-detail-head button{width:28px;height:28px;border:0;background:#f1f4f8;border-radius:9px;color:#6b7789;cursor:pointer}.activity-detail dl{display:flex;flex-direction:column;gap:0;margin:10px 0}.activity-detail dl>div{display:grid;grid-template-columns:90px 1fr;gap:8px;padding:10px 0;border-bottom:1px solid #f0f2f6}.activity-detail dt{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#9aa5b3;font-weight:800}.activity-detail dd{margin:0;font-size:10px;color:#526178;overflow-wrap:anywhere}.activity-fields>span{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#9aa5b3;font-weight:800}.activity-fields>div{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.activity-fields b{font-size:9px;padding:5px 7px;border-radius:7px;background:#f2f5f9;color:#5c6b81}.activity-fields em{display:block;margin-top:8px;color:#9aa5b3;font-size:10px}.activity-pagination{display:flex;justify-content:center;align-items:center;gap:12px;padding:12px;border-top:1px solid #edf1f5}.activity-pagination button{border:1px solid #dbe3ed;background:#fff;border-radius:9px;padding:8px 10px;color:#506078;font-weight:700;cursor:pointer}.activity-pagination button:disabled{opacity:.4;cursor:not-allowed}.activity-pagination span{font-size:10px;color:#8794a7}@media(max-width:850px){.activity-header{display:block}.activity-purpose{max-width:none;margin-top:14px}.activity-layout{grid-template-columns:1fr}.activity-detail{position:static}.activity-toolbar{grid-template-columns:1fr}.activity-toolbar button{padding:11px}}
</style>
