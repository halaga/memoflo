<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import {
  api,
  saveSession,
  tenantSlug,
} from "../../services/api";

const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const tenant = ref(null);
const tenantLoading = ref(true);
const slug = tenantSlug();

onMounted(async () => {
  if (!slug) {
    tenantLoading.value = false;
    return;
  }

  try {
    const result = await api.getTenant(slug);
    tenant.value = result?.data || null;
  } catch (requestError) {
    error.value = requestError.message || "Unable to load company.";
  } finally {
    tenantLoading.value = false;
  }
});

async function login() {
  error.value = "";
  loading.value = true;

  try {
    const result = await api.login(
      email.value.trim(),
      password.value
    );

    if (!result?.token) {
      throw new Error(
        "Login succeeded but no session token was returned."
      );
    }

    saveSession(result);
    await router.replace("/modules");
  } catch (requestError) {
    error.value =
      requestError.message || "Unable to sign in.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="tenant-login"
    :style="{
      '--tenant-primary': tenant?.primaryColor || '#2563EB',
      '--tenant-secondary': tenant?.secondaryColor || '#0f172a',
      '--tenant-wallpaper': tenant?.wallpaper
        ? `url(${tenant.wallpaper})`
        : '',
    }"
  >
    <div class="login-brand">
      <div v-if="!tenant?.logo" class="brand-mark">M</div>
      <img
        v-else
        :src="tenant.logo"
        class="tenant-logo"
        alt="Company logo"
      />

      <div>
        <strong>{{ tenant?.name || "MemoFlo" }}</strong>
        <span>
          {{
            tenant
              ? "Secure company workspace"
              : "Business workflow platform"
          }}
        </span>
      </div>
    </div>

    <form class="auth-card premium-login" @submit.prevent="login">
      <span class="page-kicker">
        {{ tenant ? tenant.name : "MEMOFLO" }}
      </span>

      <h1>{{ tenant ? "Welcome back" : "Sign in to MemoFlo" }}</h1>
      <p>
        {{
          tenant
            ? "Enter your company credentials to continue."
            : "Access your business workspace."
        }}
      </p>

      <label>
        Email
        <input
          v-model="email"
          type="email"
          autocomplete="username"
          placeholder="you@company.com"
          required
        />
      </label>

      <label>
        Password
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Password"
          required
        />
      </label>

      <div v-if="error" class="auth-error">
        {{ error }}
      </div>

      <button
        class="primary-button full"
        type="submit"
        :disabled="loading || tenantLoading"
      >
        {{ loading ? "Signing in…" : "Sign in →" }}
      </button>

      <RouterLink
        v-if="tenant"
        to="/platform"
        class="login-switch"
      >
        Powered by MemoFlo
      </RouterLink>
    </form>
  </div>
</template>
