<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, getSavedEmployee, normalizeList } from "../../services/api";
import MemoStatusBadge from "../../components/memos/MemoStatusBadge.vue";
import WorkflowInstancePanel from "../../components/workflow/WorkflowInstancePanel.vue";

const route=useRoute(), router=useRouter();
const memo=ref(null), workflow=ref(null), instance=ref(null), workflows=ref([]);
const loading=ref(true), workflowLoading=ref(false), error=ref(""), actionError=ref("");
const employee=getSavedEmployee();
const memoId=computed(()=>route.params.id);
const canAct=computed(()=>{
  if(!memo.value||!instance.value||!['pending','running'].includes(String(instance.value.status||'').toLowerCase())) return false;
  const current=instance.value.currentEmployee?._id||instance.value.currentEmployee;
  return current && employee?._id && String(current)===String(employee._id);
});

async function load(){ loading.value=true; error.value=""; actionError.value="";
  try{
    const mr=await api.getMemo(memoId.value); memo.value=mr?.data||mr?.memo||mr;
    const wr=await api.listWorkflows(); workflows.value=normalizeList(wr,["workflows"]);
    const workflowId=memo.value?.workflow?._id||memo.value?.workflow;
    if(workflowId) await loadWorkflow(workflowId);
    else workflow.value=null;
    const instanceId=memo.value?.workflowInstance?._id||memo.value?.workflowInstance;
    if(instanceId) await loadInstance(instanceId); else instance.value=null;
  }catch(err){error.value=err.message||"Unable to load memo.";}finally{loading.value=false;}
}
async function loadWorkflow(id){const r=await api.getWorkflow(id); const w=r?.workflow||r?.data?.workflow||r?.data||r; workflow.value={...w,steps:r?.steps||r?.data?.steps||w?.steps||[]};}
async function loadInstance(id){const r=await api.getWorkflowInstance(id); instance.value=r?.data||r?.instance||r;}
async function startWorkflow(){ if(!memo.value)return; workflowLoading.value=true; actionError.value=""; try{const id=memo.value.workflow?._id||memo.value.workflow||workflows.value.find(w=>w.code==='PROCUREMENT')?._id; if(!id)throw new Error("No workflow is configured for this memo."); const r=await api.startWorkflow(id,"memo",memo.value._id); instance.value=r?.data||r?.instance||r; await load();}catch(err){actionError.value=err.message||"Unable to start workflow.";}finally{workflowLoading.value=false;} }
async function action(fn){if(!instance.value?._id)return;workflowLoading.value=true;actionError.value="";try{await fn(instance.value._id);await load();}catch(err){actionError.value=err.message||"Workflow action failed.";}finally{workflowLoading.value=false;}}
function approve(){return action(api.advanceWorkflow)} function reject(){if(confirm("Reject this memo?"))return action(api.rejectWorkflow)} function cancel(){if(confirm("Cancel this workflow?"))return action(api.cancelWorkflow)} function resubmit(){return action(api.resubmitWorkflow)}
onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header"><div><button type="button" class="btn btn-ghost back-button" @click="router.back()">← Back</button><span class="page-kicker">MEMO</span><h1>{{ memo?.title || "Memo details" }}</h1><p>{{ memo?.referenceNo || "" }}</p></div><MemoStatusBadge v-if="memo" :status="memo.status" /></div>
    <div v-if="loading" class="card empty-state">Loading memo…</div><div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else-if="memo">
      <div v-if="actionError" class="alert alert-error">{{ actionError }}</div>
      <div class="detail-grid-new">
        <section class="card detail-card-new"><div class="card-header"><div><span class="page-kicker">REQUEST</span><h2>{{ memo.title }}</h2></div></div><div class="detail-meta-new"><div><span>Service</span><strong>{{ memo.businessService?.name || "—" }}</strong></div><div><span>Category</span><strong>{{ memo.category || "—" }}</strong></div><div><span>Priority</span><strong>{{ memo.priority || "Normal" }}</strong></div><div><span>Requesting SBU</span><strong>{{ memo.requestingSbu?.name || "—" }}</strong></div><div><span>Created by</span><strong>{{ [memo.createdBy?.firstName,memo.createdBy?.lastName].filter(Boolean).join(" ") || "—" }}</strong></div></div><div class="memo-body-new"><span class="page-kicker">DESCRIPTION</span><p>{{ memo.body }}</p></div></section>
        <section class="card action-card-new"><div class="card-header"><div><span class="page-kicker">WORKFLOW</span><h2>{{ workflow?.name || "Approval workflow" }}</h2></div></div><div v-if="!instance" class="workflow-start-new"><p>This memo is ready to enter its approval workflow.</p><button type="button" class="btn btn-primary full" :disabled="workflowLoading" @click="startWorkflow">{{ workflowLoading ? "Starting…" : "Start workflow" }}</button></div><WorkflowInstancePanel v-else :workflow="workflow" :instance="instance" :loading="workflowLoading" :can-act="canAct" @approve="approve" @reject="reject" @cancel="cancel" @resubmit="resubmit" /></section>
      </div>
    </template>
  </div>
</template>
