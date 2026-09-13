<script setup>
import { computed, onMounted, ref } from "vue";
import { api, normalizeList } from "../../services/api";

const workflows = ref([]), positions = ref([]);
const selectedId = ref(""), selectedWorkflow = ref(null);
const loading = ref(true), saving = ref(false), error = ref(""), success = ref("");
const showStepForm = ref(false), editingStep = ref(null);
const workflowName = ref(""), workflowDescription = ref("");
const stepForm = ref({ name:"", action:"approve", position:"", required:true, allowDelegate:false });
const actions = ["submit","minute","approve","reject","forward","review","complete","archive","cancel","reopen","resubmit","pay","receive","acknowledge"];
const sortedSteps = computed(() => [...(selectedWorkflow.value?.steps || [])].sort((a,b) => Number(a.order)-Number(b.order)));

async function loadWorkflows() {
  loading.value = true; error.value = "";
  try {
    const [wr, pr] = await Promise.all([api.listWorkflows(), api.listPositions()]);
    workflows.value = normalizeList(wr,["workflows"]); positions.value = normalizeList(pr,["positions"]);
    if (workflows.value.length) await selectWorkflow(selectedId.value || workflows.value[0]._id);
    else selectedWorkflow.value = null;
  } catch(err) { error.value = err.message || "Unable to load workflows."; }
  finally { loading.value = false; }
}

async function selectWorkflow(id) {
  if (!id) return; selectedId.value = id; error.value = "";
  try {
    const result = await api.getWorkflow(id);
    const workflow = result?.workflow || result?.data?.workflow || result?.data || result;
    const steps = result?.steps || result?.data?.steps || workflow?.steps || [];
    selectedWorkflow.value = { ...workflow, steps };
    workflowName.value = workflow?.name || ""; workflowDescription.value = workflow?.description || "";
    resetStepForm();
  } catch(err) { error.value = err.message || "Unable to load workflow."; }
}

function resetStepForm() { editingStep.value=null; stepForm.value={name:"",action:"approve",position:"",required:true,allowDelegate:false}; showStepForm.value=false; }
function openAddStep() { error.value=""; editingStep.value=null; stepForm.value={name:"",action:"approve",position:"",required:true,allowDelegate:false}; showStepForm.value=true; }
function editStep(step) { editingStep.value=step; stepForm.value={name:step.name||"",action:step.action||"approve",position:step.position?._id||step.position||"",required:step.required!==false,allowDelegate:step.allowDelegate===true}; showStepForm.value=true; }

async function saveWorkflow() {
  if (!selectedWorkflow.value?._id) return; saving.value=true; error.value=""; success.value="";
  try { const result=await api.updateWorkflow(selectedWorkflow.value._id,{name:workflowName.value.trim(),description:workflowDescription.value.trim()}); await selectWorkflow(selectedWorkflow.value._id); success.value="Workflow saved."; } catch(err){ error.value=err.message||"Unable to save workflow."; } finally{saving.value=false;}
}

async function saveStep() {
  if (!selectedWorkflow.value?._id) return; error.value=""; success.value="";
  if (!stepForm.value.name.trim()) return (error.value="Step name is required.");
  if (!stepForm.value.action) return (error.value="Choose an action.");
  if (stepForm.value.action !== "submit" && !stepForm.value.position) return (error.value="Select the responsible position.");
  saving.value=true;
  try {
    const wasEditing = Boolean(editingStep.value);
    if (wasEditing) {
      await api.updateWorkflowStep(selectedWorkflow.value._id, editingStep.value._id, {...stepForm.value});
    } else {
      const nextOrder = sortedSteps.value.reduce((max,s)=>Math.max(max,Number(s.order)||0),0)+1;
      await api.addWorkflowStep(selectedWorkflow.value._id,{...stepForm.value,order:nextOrder});
    }
    await selectWorkflow(selectedWorkflow.value._id); success.value=wasEditing?"Step updated.":"Step added.";
  } catch(err){ error.value=err.message||"Unable to save workflow step."; } finally{saving.value=false;}
}

async function deleteStep(step) {
  if (!confirm(`Delete “${step.name}”?`)) return; saving.value=true; error.value="";
  try { await api.deleteWorkflowStep(selectedWorkflow.value._id,step._id); await selectWorkflow(selectedWorkflow.value._id); success.value="Step removed."; } catch(err){ error.value=err.message||"Unable to delete step."; } finally{saving.value=false;}
}

function positionLabel(p){ if(!p) return "Unassigned"; return [p.title,p.code?`(${p.code})`:""].filter(Boolean).join(" "); }

onMounted(loadWorkflows);
</script>

<template>
  <div class="page">
    <div class="page-header"><div><span class="page-kicker">ADMINISTRATION</span><h1>Workflow settings</h1><p>Configure the sequence, action and responsible position for each workflow.</p></div></div>
    <div v-if="error" class="alert alert-error">{{ error }}</div><div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="loading" class="card empty-state">Loading workflows…</div>
    <div v-else class="workflow-builder">
      <aside class="card workflow-list"><div class="builder-title"><div><span class="page-kicker">WORKFLOWS</span><h2>Definitions</h2></div><span class="count-pill">{{ workflows.length }}</span></div>
        <button v-for="item in workflows" :key="item._id" type="button" class="workflow-list-item" :class="{active:item._id===selectedId}" @click="selectWorkflow(item._id)"><strong>{{ item.name }}</strong><small>{{ item.steps?.length || "—" }} steps</small></button>
        <div v-if="!workflows.length" class="empty-state compact">No workflows found.</div>
      </aside>

      <main v-if="selectedWorkflow" class="workflow-editor">
        <section class="card">
          <div class="builder-title"><div><span class="page-kicker">WORKFLOW</span><h2>{{ selectedWorkflow.name }}</h2><p>{{ selectedWorkflow.code }}</p></div><span class="status-badge status-approved">Active</span></div>
          <div class="form-row"><label>Name<input v-model="workflowName" class="input" /></label><label>Description<input v-model="workflowDescription" class="input" /></label></div>
          <div class="form-actions"><button type="button" class="btn btn-primary" :disabled="saving" @click="saveWorkflow">Save workflow</button></div>
        </section>

        <section class="card">
          <div class="builder-title"><div><h2>Workflow steps</h2><p>Steps run in order. Positions determine who receives the action.</p></div><button type="button" class="btn btn-primary" @click="openAddStep">+ Add step</button></div>
          <div class="builder-step-list">
            <div v-for="(step,index) in sortedSteps" :key="step._id" class="builder-step">
              <div class="step-index">{{ index+1 }}</div><div class="builder-step-main"><strong>{{ step.name }}</strong><div class="step-meta"><span class="workflow-action">{{ step.action }}</span><span>{{ positionLabel(step.position) }}</span><span>{{ step.required ? "Required" : "Optional" }}</span></div></div>
              <div class="builder-step-actions"><button type="button" class="btn btn-secondary btn-small" @click="editStep(step)">Edit</button><button type="button" class="btn btn-danger btn-small" @click="deleteStep(step)">Delete</button></div>
            </div>
            <div v-if="!sortedSteps.length" class="empty-state compact">No active steps.</div>
          </div>
        </section>

        <section v-if="showStepForm" class="card step-form-card">
          <div class="builder-title"><div><span class="page-kicker">{{ editingStep ? "EDIT" : "NEW" }}</span><h2>{{ editingStep ? "Edit step" : "Add workflow step" }}</h2></div><button type="button" class="icon-close" @click="resetStepForm">×</button></div>
          <div class="form-row"><label>Step name<input v-model="stepForm.name" class="input" placeholder="e.g. Finance Approval" /></label><label>Action<select v-model="stepForm.action" class="input"><option v-for="action in actions" :key="action" :value="action">{{ action }}</option></select></label></div>
          <label v-if="stepForm.action !== 'submit'">Responsible position<select v-model="stepForm.position" class="input"><option value="">Select position</option><option v-for="position in positions" :key="position._id" :value="position._id">{{ positionLabel(position) }}</option></select></label>
          <div class="checkbox-row"><label class="check-label"><input v-model="stepForm.required" type="checkbox" /> Required</label><label class="check-label"><input v-model="stepForm.allowDelegate" type="checkbox" /> Allow delegation</label></div>
          <div class="form-actions"><button type="button" class="btn btn-secondary" @click="resetStepForm">Cancel</button><button type="button" class="btn btn-primary" :disabled="saving" @click="saveStep">{{ saving ? "Saving…" : "Save step" }}</button></div>
        </section>
      </main>
    </div>
  </div>
</template>
