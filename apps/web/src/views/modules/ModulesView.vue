<script setup>
import { computed, onMounted, ref } from "vue";
import { api, getSavedEmployee } from "../../services/api";

const employee = computed(() => getSavedEmployee());
const workspace = ref(null);
const loading = ref(true);
const error = ref("");

const company = computed(
  () => workspace.value?.company || employee.value?.company
);

const modules = computed(() => workspace.value?.modules || []);
const enabledModules = computed(() =>
  modules.value.filter((module) => module.enabled)
);

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const result = await api.getCompanyWorkspace();
    workspace.value = result?.data || result;
  } catch (err) {
    error.value =
      err.message || "Unable to load the company workspace.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page module-hub-page">
    <section class="hub-hero">
      <div>
        <span class="hero-kicker">
          {{ company?.name || "MEMOFLO WORKSPACE" }}
        </span>

        <h1>
          Good to see you, {{ employee?.firstName || "there" }}.
        </h1>

        <p>
          Choose a business module to enter its dedicated workspace.
          Your access is controlled by company entitlements and your role.
        </p>
      </div>

      <div class="hub-stat">
        <strong>{{ enabledModules.length }}</strong>
        <span>enabled modules</span>
      </div>
    </section>

    <div
      v-if="error"
      class="alert alert-error"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="card empty-state"
    >
      Loading company workspace…
    </div>

    <template v-else>
      <div class="section-heading">
        <div>
          <span class="page-kicker">YOUR WORKSPACE</span>
          <h2>Business modules</h2>
          <p>
            Only enabled and live modules can be opened.
          </p>
        </div>
      </div>

      <div class="module-grid polished-module-grid">
        <component
          v-for="module in modules"
          :key="module.id"
          :is="
            module.enabled &&
            module.status === 'live' &&
            module.route
              ? 'RouterLink'
              : 'div'
          "
          :to="
            module.enabled && module.status === 'live'
              ? module.route
              : undefined
          "
          class="module-tile"
          :class="{
            disabled:
              !module.enabled || module.status !== 'live',
          }"
        >
          <div class="module-tile-icon">
            {{ module.icon }}
          </div>

          <div class="module-tile-body">
            <div class="module-tile-title">
              <h3>{{ module.name }}</h3>

              <span>
                {{
                  !module.enabled
                    ? "Not enabled"
                    : module.status === "live"
                      ? "Live"
                      : "Coming soon"
                }}
              </span>
            </div>

            <p>{{ module.description }}</p>
          </div>

          <span
            v-if="
              module.enabled &&
              module.status === 'live' &&
              module.route
            "
            class="module-tile-arrow"
          >
            →
          </span>
        </component>
      </div>
    </template>
  </div>
</template>
