<script setup>
import { onMounted, ref } from "vue";
import { api } from "../../services/api";

const branding = ref({
  companyName: "",
  logo: "",
  wallpaper: "",
  primaryColor: "#2563EB",
  secondaryColor: "#1E293B",
});

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
  } catch (err) {
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
  } catch (err) {
    error.value = err.message || "Unable to save branding.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <span class="page-kicker">ADMINISTRATION</span>
        <h1>Company Branding</h1>
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
        <h2>Brand assets</h2>
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
            <span v-else>M</span>
          </div>

          <div>
            <small>COMPANY WORKSPACE</small>
            <h2>{{ branding.companyName || "Company workspace" }}</h2>
            <p>Same MemoFlo experience. Your company's identity.</p>
          </div>

          <button type="button">
            Module Hub
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
