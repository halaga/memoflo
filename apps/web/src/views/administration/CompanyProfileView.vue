<script setup>
import { onMounted, reactive, ref } from "vue";
import { api } from "../../services/api";

const form = reactive({ name: "", email: "", phone: "", website: "", industry: "", address: "", city: "", state: "", country: "Nigeria", timezone: "Africa/Lagos" });
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

const timezones = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "UTC"];

async function load() {
  loading.value = true; error.value = "";
  try {
    const result = await api.getCompanyWorkspace();
    const company = (result?.data || result)?.company || {};
    for (const key of Object.keys(form)) form[key] = company[key] ?? form[key];
  } catch (err) { error.value = err.message || "Unable to load company profile."; }
  finally { loading.value = false; }
}

async function save() {
  error.value = ""; success.value = ""; saving.value = true;
  try {
    const result = await api.updateCompanyProfile({ ...form });
    const company = (result?.data || result)?.company || {};
    for (const key of Object.keys(form)) form[key] = company[key] ?? form[key];
    success.value = "Company profile updated successfully.";
  } catch (err) { error.value = err.message || "Unable to save company profile."; }
  finally { saving.value = false; }
}

onMounted(load);
</script>

<template>
  <div class="page administration-page">
    <div class="page-header">
      <div><span class="page-kicker">ADMINISTRATION</span><h1>Company profile</h1><p>Maintain the organization details and regional settings used across this workspace.</p></div>
      <button class="btn btn-primary" :disabled="loading || saving" @click="save">{{ saving ? "Saving…" : "Save profile" }}</button>
    </div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <section v-if="loading" class="card empty-state">Loading company profile…</section>
    <form v-else class="card company-profile-form" @submit.prevent="save">
      <div class="section-heading"><div><span class="page-kicker">ORGANIZATION DETAILS</span><h2>Company information</h2></div></div>
      <div class="form-grid">
        <label>Company name<input v-model.trim="form.name" class="input" required minlength="2" maxlength="120"></label>
        <label>Industry<input v-model.trim="form.industry" class="input" maxlength="80" placeholder="e.g. Telecommunications"></label>
        <label>Company email<input v-model.trim="form.email" class="input" type="email" maxlength="254"></label>
        <label>Phone number<input v-model.trim="form.phone" class="input" maxlength="40"></label>
        <label>Website<input v-model.trim="form.website" class="input" type="url" placeholder="https://example.com" maxlength="200"></label>
        <label>Country<input v-model.trim="form.country" class="input" maxlength="80"></label>
        <label>State / Region<input v-model.trim="form.state" class="input" maxlength="80"></label>
        <label>City<input v-model.trim="form.city" class="input" maxlength="80"></label>
        <label class="span-all">Office address<textarea v-model.trim="form.address" class="input" rows="3" maxlength="240"></textarea></label>
        <label>Time zone<select v-model="form.timezone" class="input"><option v-for="zone in timezones" :key="zone" :value="zone">{{ zone }}</option></select></label>
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? "Saving…" : "Save changes" }}</button></div>
    </form>
    <p class="muted company-profile-note">The workspace address (company slug) is intentionally not editable here. Changing it requires a coordinated domain and tenant-routing migration.</p>
  </div>
</template>

<style scoped>
.company-profile-form { padding: 24px; }
.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin-top:22px; }
.form-grid label { display:flex; flex-direction:column; gap:7px; font-weight:600; font-size:13px; }
.form-grid .input { width:100%; min-width:0; }
.span-all { grid-column:1/-1; }
.form-actions { display:flex; justify-content:flex-end; margin-top:22px; }
.company-profile-note { margin-top:14px; font-size:12px; }
@media(max-width:680px){ .form-grid{grid-template-columns:1fr;} .span-all{grid-column:auto;} .company-profile-form{padding:16px;} }
</style>
