<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../services/api";
const route = useRoute();
const router = useRouter();
const token = computed(() => String(route.query.token || ""));
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const invitation = ref(null);
const password = ref("");
const passwordConfirmation = ref("");
const success = ref(false);
onMounted(async () => {
    if (!token.value) {
        error.value = "This invitation link is incomplete.";
        loading.value = false;
        return;
    }
    try {
        const result = await api.getEmployeeInvitation(token.value);
        invitation.value = result?.data || result;
    }
    catch (err) {
        error.value = err.message || "Unable to validate this invitation.";
    }
    finally {
        loading.value = false;
    }
});
async function activate() {
    error.value = "";
    if (password.value.length < 10) {
        error.value = "Your password must contain at least 10 characters.";
        return;
    }
    if (password.value !== passwordConfirmation.value) {
        error.value = "The password confirmation does not match.";
        return;
    }
    submitting.value = true;
    try {
        await api.acceptEmployeeInvitation(token.value, password.value, passwordConfirmation.value);
        success.value = true;
    }
    catch (err) {
        error.value = err.message || "Unable to activate your account.";
    }
    finally {
        submitting.value = false;
    }
}
</script>

<template>
<main class="tenant-login login-refresh invitation-page">
  <section class="login-form-side">
    <div class="auth-card premium-login invitation-activation-card">
      <span class="page-kicker">
        MEMOFLO · ACCOUNT ACTIVATION
      </span>
      <template v-if="loading">
        <h1>
          Checking invitation…
        </h1>
        <p>
          Please wait while we validate your invitation link.
        </p>
      </template>
      <template v-else-if="success">
        <h1>
          Your account is ready
        </h1>
        <p>
          Your password has been set successfully. You can now sign in to {{ invitation?.companyName || "your company" }}.
        </p>
        <button class="btn btn-primary" type="button" @click="router.replace('/login')">
          Continue to login
        </button>
      </template>
      <template v-else-if="invitation">
        <h1>
          Welcome, {{ invitation.firstName }}
        </h1>
        <p>
          You have been invited to join
          <strong>
            {{ invitation.companyName }}
          </strong>
          .
        </p>
        <div class="invitation-summary">
          <span>
            {{ invitation.firstName }} {{ invitation.lastName }}
          </span>
          <strong>
            {{ invitation.email }}
          </strong>
          <small>
            Invitation expires {{ new Date(invitation.expiresAt).toLocaleString() }}
          </small>
        </div>
        <form class="invitation-password-form" @submit.prevent="activate">
          <label>
            Create password
            <input v-model="password" class="input" type="password" autocomplete="new-password" minlength="10" maxlength="128" required />
          </label>
          <label>
            Confirm password
            <input
              v-model="passwordConfirmation"
              class="input"
              type="password"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
             />
          </label>
          <p class="subtle-text">
            Use 10–128 characters, including uppercase, lowercase, a number and a special character. This invitation can only be used once.
          </p>
          <button class="btn btn-primary" type="submit" :disabled="submitting">
            {{ submitting ? "Activating…" : "Activate account" }}
          </button>
        </form>
      </template>
      <template v-else>
        <h1>
          Invitation unavailable
        </h1>
        <p>
          {{ error || "This invitation link is invalid or has expired." }}
        </p>
        <button class="btn btn-secondary" type="button" @click="router.replace('/login')">
          Back to login
        </button>
      </template>
      <div v-if="error && invitation" class="alert alert-error">
        {{ error }}
      </div>
    </div>
  </section>
</main>
</template>

<style scoped>
.invitation-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.invitation-form-side {
  width: 100%;
}
.invitation-activation-card {
  width: min(100% - 32px,520px);
  margin: 0 auto;
  padding: 32px;
  display: grid;
  gap: 16px;
}
.invitation-summary {
  display: grid;
  gap: 5px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--surface-muted);
}
.invitation-summary span,.invitation-summary small {
  color: var(--text-muted);
}
.invitation-password-form {
  display: grid;
  gap: 14px;
}
.invitation-password-form label {
  display: grid;
  gap: 7px;
}
.invitation-password-form .btn {
  width: 100%;
}
</style>
