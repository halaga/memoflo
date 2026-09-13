<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api, saveSession } from "../../services/api";

const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function login() {
  error.value = "";
  loading.value = true;
  try {
    const result = await api.login(email.value.trim(), password.value);
    if (!result?.token || !result?.employee) throw new Error("Login succeeded but no session was returned.");
    saveSession(result);
    await router.replace("/modules");
  } catch (err) {
    error.value = err?.message || "Unable to sign in. Check your email and password.";
  } finally { loading.value = false; }
}
</script>

<template>
  <main class="auth-screen">
    <div class="auth-visual">
      <div class="auth-logo">M</div>
      <span class="auth-kicker">WORKFLOW PLATFORM</span>
      <h1>Work moves better<br />with MemoFlo.</h1>
      <p>Digitize requests, approvals and business workflows in one workspace.</p>
      <div class="auth-mini-grid">
        <span>✓ Approval workflows</span><span>✓ Role-based access</span><span>✓ Company workspace</span><span>✓ Audit-ready processes</span>
      </div>
    </div>

    <div class="auth-panel">
      <form class="auth-card" @submit.prevent="login">
        <div class="mobile-auth-brand"><div class="auth-logo small">M</div><strong>MemoFlo</strong></div>
        <span class="auth-kicker">SIGN IN</span>
        <h2>Welcome back</h2>
        <p class="auth-subtitle">Sign in to your company workspace.</p>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <label>Email<input v-model="email" type="email" autocomplete="username" placeholder="you@company.com" required /></label>
        <label>Password<input v-model="password" type="password" autocomplete="current-password" placeholder="Your password" required /></label>

        <button class="btn btn-primary btn-large full" type="submit" :disabled="loading">
          {{ loading ? "Signing in…" : "Sign in" }}
        </button>

        <div class="demo-note">Demo account: <strong>melvin@memoflo.com</strong> · password123</div>
      </form>
    </div>
  </main>
</template>
