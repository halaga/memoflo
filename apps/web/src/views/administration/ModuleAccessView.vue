<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "../../services/api";

const workspace = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

const modules = computed(() => workspace.value?.modules || []);

const enabledCount = computed(
  () => modules.value.filter((module) => module.enabled).length
);

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const result = await api.getCompanyWorkspace();
    workspace.value = result?.data || result;
  } catch (err) {
    error.value =
      err.message || "Unable to load module access settings.";
  } finally {
    loading.value = false;
  }
}

function toggle(module) {
  module.enabled = !module.enabled;
  success.value = "";
}

async function save() {
  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    const enabledModuleIds = modules.value
      .filter((module) => module.enabled)
      .map((module) => module.id);

    const result = await api.updateCompanyModules(enabledModuleIds);
    workspace.value = result?.data || result;

    success.value =
      "Module access saved. The Module Hub has been updated.";
  } catch (err) {
    error.value = err.message || "Unable to save module access.";
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
        <h1>Module Access</h1>
        <p>
          Choose which MemoFlo modules this company has enabled.
        </p>
      </div>

      <button
        class="btn btn-primary"
        type="button"
        :disabled="loading || saving"
        @click="save"
      >
        {{ saving ? "Saving…" : "Save changes" }}
      </button>
    </div>

    <div class="admin-intro-strip">
      <strong>{{ enabledCount }}</strong>
      <span>of {{ modules.length }} modules enabled</span>
      <small>
        Company entitlement controls availability. Employee roles control
        actions.
      </small>
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

    <div
      v-if="loading"
      class="card empty-state"
    >
      Loading module catalogue…
    </div>

    <section
      v-else
      class="module-admin-grid"
    >
      <article
        v-for="module in modules"
        :key="module.id"
        class="card module-admin-card"
        :class="{ enabled: module.enabled }"
      >
        <div class="module-tile-icon">
          {{ module.icon }}
        </div>

        <div class="module-admin-copy">
          <div>
            <h3>{{ module.name }}</h3>
            <span
              :class="
                module.enabled
                  ? 'status-enabled'
                  : 'status-disabled'
              "
            >
              {{ module.enabled ? "Enabled" : "Disabled" }}
            </span>
          </div>

          <p>{{ module.description }}</p>

          <small>
            {{
              module.status === "live"
                ? "Available now"
                : "Module foundation ready"
            }}
          </small>
        </div>

        <button
          type="button"
          class="switch"
          :class="{ on: module.enabled }"
          :aria-label="`Toggle ${module.name}`"
          @click="toggle(module)"
        >
          <span></span>
        </button>
      </article>
    </section>

    <section class="card admin-note">
      <strong>Ringo development tenant</strong>
      <p>
        Ringo is our development company. Enable every module while we build
        and test the platform.
      </p>
    </section>
  </div>
</template>
