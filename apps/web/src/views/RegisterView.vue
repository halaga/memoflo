<script setup>
import { reactive, ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { api, saveSession } from "../services/api";

const router = useRouter();
const loading = ref(false);
const error = ref("");
const form = reactive({
  companyName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  industry: "",
  website: "",
  password: "",
  confirmPassword: "",
});

async function submitRegistration() {
  error.value = "";
  if (form.password !== form.confirmPassword) {
    error.value = "The passwords do not match.";
    return;
  }
  loading.value = true;
  try {
    const { confirmPassword, ...payload } = form;
    const result = await api.registerCompany(payload);
    if (!result?.token || !result?.employee) {
      throw new Error("Registration completed without a valid session. Please sign in.");
    }
    saveSession(result);
    await router.replace("/home");
  } catch (e) {
    error.value = e?.message || "Unable to register your company. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="tenant-login login-refresh register-page">
    <div class="login-decoration login-decoration-one"></div>
    <div class="login-decoration login-decoration-two"></div>
    <section class="login-story" aria-label="MemoFlo introduction">
      <RouterLink to="/platform" class="login-brand login-brand-link">
        <span class="marketing-mark">M</span>
        <span class="login-brand-copy"><strong>MemoFlo</strong><small>Workflow, simplified.</small></span>
      </RouterLink>
      <div class="login-story-copy">
        <span class="login-overline"><i></i> YOUR COMPANY, CONNECTED</span>
        <h1>Make work flow<br /><em>from day one.</em></h1>
        <p>Create a dedicated company workspace for your people, requests, approvals and everyday operations.</p>
        <div class="login-benefits">
          <span><b>✓</b> A separate company workspace</span>
          <span><b>✓</b> Your first account is an administrator</span>
          <span><b>✓</b> Configure people and workflows as you grow</span>
        </div>
      </div>
      <div class="login-story-footer"><span>MEMOFLO · WORKFLOW, SIMPLIFIED</span><RouterLink to="/platform">Explore MemoFlo ↗</RouterLink></div>
    </section>

    <section class="login-form-side register-form-side">
      <form class="auth-card premium-login login-card-refresh register-card" @submit.prevent="submitRegistration">
        <div class="login-card-heading">
          <span class="page-kicker">NEW COMPANY WORKSPACE</span>
          <h2>Create your workspace<span>.</span></h2>
          <p>Register your company and set up its first administrator account.</p>
        </div>

        <div class="register-fields">
          <label>Company name<input v-model="form.companyName" autocomplete="organization" maxlength="120" required placeholder="e.g. Acme Limited" /></label>
          <div class="register-field-row">
            <label>First name<input v-model="form.firstName" autocomplete="given-name" maxlength="80" required /></label>
            <label>Last name<input v-model="form.lastName" autocomplete="family-name" maxlength="80" required /></label>
          </div>
          <label>Work email<input v-model="form.email" type="email" autocomplete="email" maxlength="254" required placeholder="you@company.com" /></label>
          <div class="register-field-row">
            <label>Phone <span>(optional)</span><input v-model="form.phone" type="tel" autocomplete="tel" maxlength="40" /></label>
            <label>Industry <span>(optional)</span><input v-model="form.industry" maxlength="80" placeholder="e.g. Technology" /></label>
          </div>
          <label>Company website <span>(optional)</span><input v-model="form.website" type="url" autocomplete="url" maxlength="200" placeholder="https://example.com" /></label>
          <div class="register-field-row">
            <label>Password<input v-model="form.password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required /></label>
            <label>Confirm password<input v-model="form.confirmPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128" required /></label>
          </div>
        </div>
        <p class="register-password-hint">Use at least 10 characters. Keep this password private.</p>
        <div v-if="error" class="auth-error login-error" role="alert">{{ error }}</div>
        <button class="primary-button full login-submit" type="submit" :disabled="loading"><span>{{ loading ? 'Creating workspace…' : 'Create company workspace' }}</span><span aria-hidden="true">→</span></button>
        <div class="login-divider"><span>Already have an account?</span></div>
        <RouterLink to="/login" class="login-platform-link">Sign in to MemoFlo <span>↗</span></RouterLink>
        <p class="login-security-note"><span>●</span> Your company gets its own workspace and administrator account.</p>
      </form>
    </section>
  </main>
</template>
