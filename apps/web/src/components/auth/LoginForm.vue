<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import { api, saveSession } from "../../services/api";

const router = useRouter();

const email = ref("melvin@memoflo.com");
const password = ref("password123");

const loading = ref(false);
const error = ref("");

async function login() {
  error.value = "";
  loading.value = true;

  try {
    const result = await api.login(
      email.value.trim(),
      password.value
    );

    if (!result?.token) {
      throw new Error("Login succeeded but no session token was returned.");
    }

    saveSession(result);

    await router.replace("/dashboard");
  } catch (err) {
    error.value =
      err?.message ||
      "Unable to sign in. Please check your credentials.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-screen">
    <form
      class="auth-card"
      @submit.prevent="login"
    >
      <div class="brand-mark">
        M
      </div>

      <h1>
        Welcome back
      </h1>

      <p>
        Sign in to your MemoFlo workspace.
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

      <div
        v-if="error"
        class="auth-error"
      >
        {{ error }}
      </div>

      <button
        class="primary-button full"
        type="submit"
        :disabled="loading"
      >
        {{ loading ? "Signing in..." : "Sign in →" }}
      </button>

      <small>
        Demo: melvin@memoflo.com / password123
      </small>
    </form>
  </div>
</template>