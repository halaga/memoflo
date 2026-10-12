<script setup>
import { RouterLink, useRoute } from "vue-router";
import AppIcon from "../components/ui/AppIcon.vue";
const route = useRoute();
</script>

<template>
  <div class="experience-page error-page">
    <section class="workspace-panel error-panel">
      <span class="error-icon"><AppIcon name="search" :size="30" /></span>
      <span class="eyebrow">404 · NOT FOUND</span>
      <h1>We couldn't find that page.</h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <code>{{ route.fullPath }}</code>
      <div class="error-actions">
        <RouterLink to="/home" class="action-primary">Back to Home</RouterLink>
        <RouterLink to="/services" class="action-secondary">Browse services</RouterLink>
      </div>
    </section>
  </div>
</template>
