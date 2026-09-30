<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../../services/api";
const router = useRouter(); const saving = ref(false); const error = ref("");
const form = ref({ title: "", description: "", category: "General", urgency: "Normal", neededBy: "", requestScope: "sbu", items: [{ description: "", quantity: 1, unit: "item", estimatedUnitCost: 0 }] });
function addItem(){form.value.items.push({description:"",quantity:1,unit:"item",estimatedUnitCost:0})}
function removeItem(i){if(form.value.items.length>1)form.value.items.splice(i,1)}
async function submit(){error.value="";saving.value=true;try{const result=await api.createProcurementRequest({...form.value,items:form.value.items.map(x=>({...x,quantity:Number(x.quantity),estimatedUnitCost:Number(x.estimatedUnitCost)}))});const request=result?.data||result;router.push(`/procurement/requests/${request._id}`)}catch(e){error.value=e.message||"Unable to create purchase request."}finally{saving.value=false}}
onMounted(()=>{});
</script>
<template>
  <div class="experience-page procurement-create-page"><button class="text-button" type="button" @click="router.push('/services')">← Services</button><header class="page-intro-row"><div><span class="eyebrow">BUSINESS PURCHASE</span><h1>Start a purchase request.</h1><p>Company-level requests do not require an SBU. SBU requests follow the requesting SBU Head route.</p></div></header>
    <form class="workspace-panel service-action-form" @submit.prevent="submit"><div class="segmented-tabs"><button type="button" :class="{active:form.requestScope==='sbu'}" @click="form.requestScope='sbu'">SBU request</button><button type="button" :class="{active:form.requestScope==='company'}" @click="form.requestScope='company'">Company-level request</button></div>
      <label>Title<input v-model="form.title" class="input" placeholder="Laptop purchase" required /></label><label>Description<textarea v-model="form.description" class="textarea" rows="5" placeholder="What does the business need?"></textarea></label>
      <div class="form-two-col"><label>Category<input v-model="form.category" class="input" /></label><label>Urgency<select v-model="form.urgency" class="input"><option>Normal</option><option>Urgent</option><option>Critical</option></select></label></div>
      <div class="form-section-title"><span>1</span><div><strong>Items</strong><small>Add the things you are requesting.</small></div></div>
      <div v-for="(item,i) in form.items" :key="i" class="form-two-col request-item-row"><label>Description<input v-model="item.description" class="input" placeholder="4TB external drive" required /></label><label>Quantity<input v-model="item.quantity" class="input" type="number" min="0.01" step="0.01" /></label><label>Unit<input v-model="item.unit" class="input" /></label><label>Estimated unit cost<input v-model="item.estimatedUnitCost" class="input" type="number" min="0" step="0.01" /></label><button v-if="form.items.length>1" type="button" class="text-button" @click="removeItem(i)">Remove item</button></div>
      <button type="button" class="btn btn-secondary" @click="addItem">+ Add item</button><div v-if="error" class="alert alert-error">{{ error }}</div><div class="form-actions"><button type="button" class="btn btn-secondary" @click="router.push('/services')">Cancel</button><button class="btn btn-primary" :disabled="saving">{{ saving?'Creating…':'Create purchase request' }}</button></div>
    </form>
  </div>
</template>
