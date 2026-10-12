<script setup>
import { RouterLink, useRoute } from "vue-router";
import AppIcon from "../components/ui/AppIcon.vue";
const route = useRoute();
</script>

<template>
  <div class="experience-page error-page">
    <section class="workspace-panel error-panel">
      <span class="error-icon"><AppIcon name="shield" :size="30" /></span>
      <span class="eyebrow">ACCESS CONTROL</span>
      <h1>Permission required</h1>
      <p>Your account does not have permission to open this page. Ask your MemoFlo administrator to review your role access.</p>
      <div class="error-actions">
        <RouterLink to="/home" class="action-primary">Back to Home</RouterLink>
        <RouterLink to="/services" class="action-secondary">Browse services</RouterLink>
      </div>
      <small v-if="route.query.from">Requested page: {{ route.query.from }}</small>
    </section>
  </div>
</template>
