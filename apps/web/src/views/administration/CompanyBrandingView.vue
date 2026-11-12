<script setup>
import { onMounted, ref } from "vue";
import { api } from "../../services/api";
const branding = ref({
    companyName: "",
    logo: "",
    wallpaper: "",
    primaryColor: "#2563EB",
    secondaryColor: "#1E293B",
    tagline: "Workflow, simplified.",
});
const signature = ref({ bannerUrl: "", previewUrl: "", address: "", website: "", socials: { facebook: "", x: "", instagram: "",
    linkedin: "" } });
const signatureSaving = ref(false);
const signatureSuccess = ref("");
const signatureError = ref("");
const saving = ref(false);
const error = ref("");
const success = ref("");
async function load() {
    try {
        const result = await api.getCompanyWorkspace();
        const workspace = result?.data || result;
        branding.value = {
            ...branding.value,
            companyName: workspace?.company?.name || "",
            ...(workspace?.company?.branding || {}),
        };
        signature.value = {
            ...signature.value,
            ...(workspace?.signature || {}),
            socials: { ...signature.value.socials, ...(workspace?.signature?.socials || {}) },
        };
    }
    catch (err) {
        error.value = err.message || "Unable to load company branding.";
    }
}
async function save() {
    saving.value = true;
    error.value = "";
    success.value = "";
    try {
        const { companyName, ...payload } = branding.value;
        await api.updateCompanyBranding(payload);
        success.value =
            "Branding saved. The tenant workspace will use the new identity.";
    }
    catch (err) {
        error.value = err.message || "Unable to save branding.";
    }
    finally {
        saving.value = false;
    }
}
async function saveSignature() {
    signatureSaving.value = true;
    signatureError.value = "";
    signatureSuccess.value = "";
    try {
        await api.updateCompanySignature({ ...signature.value, socials: { ...signature.value.socials } });
        signatureSuccess.value = "Email signature identity saved for this company.";
    }
    catch (err) {
        signatureError.value = err.message || "Unable to save email signature settings.";
    }
    finally {
        signatureSaving.value = false;
    }
}
onMounted(load);
</script>

<template>
<div class="page">
  <div class="page-header">
    <div>
      <span class="page-kicker">
        ADMINISTRATION
      </span>
      <h1>
        Company Branding
      </h1>
      <p>
        Give this tenant its own identity while keeping the MemoFlo product
        system consistent.
      </p>
    </div>
    <button
        class="btn btn-primary"
        type="button"
        :disabled="saving"
        @click="save"
      >
      {{ saving ? "Saving…" : "Save branding" }}
    </button>
  </div>
  <div
      v-if="error"
      class="alert alert-error"
    >
    {{ error }}
  </div>
  <div
      v-if="success"
      class="alert alert-success"
    >
    {{ success }}
  </div>
  <div class="branding-layout">
    <section class="card">
      <h2>
        Brand assets
      </h2>
      <p class="muted">
        URL-based assets are used for now. Storage uploads can be added when
        the platform storage layer is ready.
      </p>
      <label>
        Logo URL
        <input
          v-model="branding.logo"
          class="input"
          placeholder="https://…/ringo-logo.png"
         />
      </label>
      <label>
        Product / workspace tagline
        <input v-model="branding.tagline" class="input" placeholder="Workflow, simplified." />
      </label>
      <label>
        Tenant wallpaper URL
        <input
          v-model="branding.wallpaper"
          class="input"
          placeholder="https://…/workspace-bg.jpg"
         />
      </label>
      <div class="form-row">
        <label>
          Primary colour
          <input
              v-model="branding.primaryColor"
              class="input"
            />
        </label>
        <label>
          Secondary colour
          <input
              v-model="branding.secondaryColor"
              class="input"
            />
        </label>
      </div>
    </section>
    <section class="card signature-settings-card">
      <h2>
        Email signature identity
      </h2>
      <p class="muted">
        These settings belong only to {{ branding.companyName || "this company" }}. They do not change other tenants. Leave the banner fields empty if your company does not use a banner.
      </p>
      <label>
        Banner image URL
        <input v-model.trim="signature.bannerUrl" class="input" type="url" placeholder="https://your-company.com/email-banner.png" />
      </label>
      <label>
        In-app preview image URL or public path
        <input v-model.trim="signature.previewUrl" class="input" placeholder="/signatures/company-banner.gif or https://…" />
      </label>
      <label>
        Signature address
        <textarea v-model.trim="signature.address" class="input" rows="2" maxlength="240" />
      </label>
      <label>
        Signature website
        <input v-model.trim="signature.website" class="input" type="url" placeholder="https://your-company.com" />
      </label>
      <div class="form-row">
        <label>
          Facebook URL
          <input v-model.trim="signature.socials.facebook" class="input" type="url" />
        </label>
        <label>
          X URL
          <input v-model.trim="signature.socials.x" class="input" type="url" />
        </label>
        <label>
          Instagram URL
          <input v-model.trim="signature.socials.instagram" class="input" type="url" />
        </label>
        <label>
          LinkedIn URL
          <input v-model.trim="signature.socials.linkedin" class="input" type="url" />
        </label>
      </div>
      <div v-if="signatureError" class="alert alert-error">
        {{ signatureError }}
      </div>
      <div v-if="signatureSuccess" class="alert alert-success">
        {{ signatureSuccess }}
      </div>
      <button class="btn btn-primary" type="button" :disabled="signatureSaving" @click="saveSignature">
        {{ signatureSaving ? "Saving…" : "Save signature identity" }}
      </button>
    </section>
    <section
      class="card branding-preview"
      :style="{
          '--preview-primary': branding.primaryColor,
          '--preview-secondary': branding.secondaryColor,
          '--preview-bg': branding.wallpaper
            ? `url(${branding.wallpaper})`
            : '',
        }"
    >
      <div class="preview-window">
        <div class="preview-logo">
          <img
              v-if="branding.logo"
              :src="branding.logo"
              alt="Company logo"
            />
          <span v-else>
            M
          </span>
        </div>
        <div>
          <small>
            COMPANY WORKSPACE
          </small>
          <h2>
            {{ branding.companyName || "Company workspace" }}
          </h2>
          <p>
            Same MemoFlo experience. Your company's identity.
          </p>
        </div>
        <button type="button">
          Company
        </button>
      </div>
    </section>
  </div>
</div>
</template>

