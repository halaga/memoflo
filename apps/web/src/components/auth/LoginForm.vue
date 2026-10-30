<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api, saveSession, tenantSlug } from "../../services/api";

const router = useRouter();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const tenant = ref(null);
const tenantLoading = ref(true);
const slug = tenantSlug();

onMounted(async () => {
  if (slug) {
    try {
      const result = await api.getTenant(slug);
      tenant.value = result?.data || result || null;
    } catch (e) {
      error.value = e?.message || "We could not load your company workspace details.";
    }
  }
  tenantLoading.value = false;
});

async function login() {
  error.value = "";
  loading.value = true;
  try {
    const result = await api.login(email.value.trim(), password.value);
    if (!result?.token) throw new Error("Login succeeded but no session token was returned.");
    saveSession(result);
    await router.replace("/home");
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Unable to sign in. Please check your details and try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="tenant-login login-refresh" :style="{
    '--tenant-primary': tenant?.primaryColor || '#2563eb',
    '--tenant-secondary': tenant?.secondaryColor || '#10213b',
    '--tenant-wallpaper': tenant?.wallpaper ? `url(${tenant.wallpaper})` : 'none'
  }">
    <div class="login-decoration login-decoration-one"></div>
    <div class="login-decoration login-decoration-two"></div>

    <section class="login-story" aria-label="MemoFlo introduction">
      <RouterLink to="/platform" class="login-brand login-brand-link">
        <img class="tenant-logo login-logo" :src="tenant?.logo || '/memoflo-mark.svg'" alt="Company logo" />
        <span class="login-brand-copy"><strong>{{ tenant?.name || 'MemoFlo' }}</strong><small>{{ tenant?.tagline || 'Workflow, simplified.' }}</small></span>
      </RouterLink>
      <div class="login-story-copy">
        <span class="login-overline"><i></i> YOUR WORKSPACE, CONNECTED</span>
        <h1>Good work flows<br /><em>better together.</em></h1>
        <p>One calm place for your requests, approvals, people and everyday work. Sign in to pick up right where your team left off.</p>
        <div class="login-benefits">
          <span><b>✓</b> Clear, trackable workflows</span>
          <span><b>✓</b> One home for work updates</span>
          <span><b>✓</b> The right actions, in fewer clicks</span>
        </div>
      </div>
      <div class="login-story-footer"><span>MEMOFLO · WORKFLOW, SIMPLIFIED</span><RouterLink to="/platform">Explore MemoFlo ↗</RouterLink></div>
    </section>

    <section class="login-form-side">
      <form class="auth-card premium-login login-card-refresh" @submit.prevent="login">
        <div class="login-card-heading">
          <span class="login-mobile-brand">{{ tenant?.name || 'MemoFlo' }}</span>
          <span class="page-kicker">{{ tenant?.name || 'SECURE WORKSPACE ACCESS' }}</span>
          <h2>Welcome back<span>.</span></h2>
          <p>Enter your details to sign in to your workspace.</p>
        </div>

        <label for="login-email">Work email</label>
        <div class="login-input-wrap"><span aria-hidden="true">✉</span><input id="login-email" v-model="email" type="email" autocomplete="username" placeholder="you@company.com" required /></div>

        <label for="login-password" class="password-label">Password</label>
        <div class="login-input-wrap"><span aria-hidden="true">▣</span><input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" required /><button class="password-toggle" type="button" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide password' : 'Show password'">{{ showPassword ? 'Hide' : 'Show' }}</button></div>

        <div v-if="error" class="auth-error login-error" role="alert">{{ error }}</div>
        <button class="primary-button full login-submit" type="submit" :disabled="loading || tenantLoading"><span>{{ loading ? 'Signing you in…' : tenantLoading ? 'Preparing workspace…' : 'Sign in to workspace' }}</span><span aria-hidden="true">→</span></button>
        <p v-if="!tenant" class="login-demo-note">Demo access: <strong>melvin@memoflo.com</strong> / <strong>password123</strong></p>
        <div class="login-divider"><span>Need a different workspace?</span></div>
        <RouterLink to="/platform" class="login-platform-link">Visit the MemoFlo platform <span>↗</span></RouterLink>
        <p class="login-security-note"><span>●</span> Your workspace access is protected by your company account.</p>
      </form>
      <footer class="login-credit login-credit-refresh"><span>Workflow, simplified.</span><a href="https://xplicitcrafted.netlify.app/" target="_blank" rel="noopener noreferrer">Crafted with care by Xplicit_Crafted ↗</a></footer>
    </section>
  </main>
</template>
