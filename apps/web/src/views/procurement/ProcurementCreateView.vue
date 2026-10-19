<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../../services/api";
const router = useRouter(); const saving = ref(false); const error = ref("");
const form = ref({ title: "", description: "", category: "Laptop / computer", urgency: "Normal", neededBy: "", requestScope: "sbu", items: [{ description: "", quantity: 1, unit: "item", estimatedUnitCost: 0 }] });
function addItem(){form.value.items.push({description:"",quantity:1,unit:"item",estimatedUnitCost:0})}
function removeItem(i){if(form.value.items.length>1)form.value.items.splice(i,1)}
async function submit(){error.value="";saving.value=true;try{const result=await api.createProcurementRequest({...form.value,items:form.value.items.map(x=>({...x,quantity:Number(x.quantity),estimatedUnitCost:Number(x.estimatedUnitCost)}))});const request=result?.data||result;router.push(`/procurement/requests/${request._id}`)}catch(e){error.value=e.message||"Unable to create purchase request."}finally{saving.value=false}}
onMounted(()=>{});
</script>
<template>
  <div class="experience-page procurement-create-page"><button class="text-button" type="button" @click="router.push('/services')">← Services</button><header class="page-intro-row"><div><span class="eyebrow">BUSINESS PURCHASE</span><h1>Start a purchase request.</h1><p>Use one form for laptops, IT equipment, data subscriptions, software, office supplies and other business needs. Company-level requests do not require an SBU; SBU requests follow the requesting SBU Head route.</p></div></header>
    <form class="workspace-panel service-action-form" @submit.prevent="submit"><div class="segmented-tabs"><button type="button" :class="{active:form.requestScope==='sbu'}" @click="form.requestScope='sbu'">SBU request</button><button type="button" :class="{active:form.requestScope==='company'}" @click="form.requestScope='company'">Company-level request</button></div>
      <label>Title<input v-model="form.title" class="input" placeholder="Laptop purchase" required /></label><label>Description<textarea v-model="form.description" class="textarea" rows="5" placeholder="What does the business need?"></textarea></label>
      <div class="form-two-col"><label class="form-field">Purchase type<select v-model="form.category" class="input" required><option>Laptop / computer</option><option>IT equipment / peripherals</option><option>Data or internet subscription</option><option>Software / licence</option><option>Office supplies</option><option>Furniture</option><option>Facilities / maintenance</option><option>Other business purchase</option></select></label><label class="form-field">Urgency<select v-model="form.urgency" class="input"><option>Normal</option><option>Urgent</option><option>Critical</option></select></label></div>
      <div class="form-section-title"><span>1</span><div><strong>Items</strong><small>Add the things you are requesting.</small></div></div>
      <div v-for="(item,i) in form.items" :key="i" class="form-two-col request-item-row"><label>Description<input v-model="item.description" class="input" placeholder="4TB external drive" required /></label><label>Quantity<input v-model="item.quantity" class="input" type="number" min="0.01" step="0.01" /></label><label>Unit<input v-model="item.unit" class="input" /></label><label>Estimated unit cost<input v-model="item.estimatedUnitCost" class="input" type="number" min="0" step="0.01" /></label><button v-if="form.items.length>1" type="button" class="text-button" @click="removeItem(i)">Remove item</button></div>
      <button type="button" class="btn btn-secondary" @click="addItem">+ Add item</button><div v-if="error" class="alert alert-error">{{ error }}</div><div class="form-actions"><button type="button" class="btn btn-secondary" @click="router.push('/services')">Cancel</button><button class="btn btn-primary" :disabled="saving">{{ saving?'Creating…':'Create purchase request' }}</button></div>
    </form>
  </div>
</template>

<style scoped>
.procurement-create-page .service-action-form { width:100%; box-sizing:border-box; gap:18px; }
.procurement-create-page .request-item-row { grid-template-columns:minmax(0,2fr) minmax(95px,.7fr) minmax(100px,.8fr) minmax(145px,1fr); align-items:end; gap:12px; }
.procurement-create-page .request-item-row label { min-width:0; }
@media(max-width:760px) { .procurement-create-page .request-item-row { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:520px) { .procurement-create-page .request-item-row { grid-template-columns:minmax(0,1fr); } }
</style>
