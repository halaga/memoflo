<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api, normalizeList } from "../services/api";
import AppIcon from "../components/ui/AppIcon.vue";

const route = useRoute();
const request = ref(null);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await api.listServiceRequests();
    request.value = normalizeList(result, ["requests", "serviceRequests"]).find((item) => String(item._id) === String(route.params.id)) || null;
    if (!request.value) error.value = "Request not found, or it is not available to your account.";
  } catch (err) {
    error.value = err.message || "Unable to load request.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="experience-page request-detail-page">
    <div class="service-breadcrumb"><RouterLink to="/work">My Work</RouterLink><AppIcon name="chevron" :size="15" /><strong>Service request</strong></div>
    <div v-if="loading" class="workspace-panel panel-empty">Loading request…</div>
    <div v-else-if="error" class="workspace-panel panel-empty"><AppIcon name="file" :size="28" /><strong>{{ error }}</strong><RouterLink to="/work" class="action-secondary">Back to My Work</RouterLink></div>
    <template v-else-if="request">
      <section class="workspace-panel request-detail-hero">
        <span class="service-detail-icon"><AppIcon name="file" :size="28" /></span>
        <div><span class="eyebrow">{{ request.category || "SERVICE REQUEST" }}</span><h1>{{ request.title }}</h1><p>{{ request.service?.name || "Internal request" }}</p></div>
        <span class="queue-status">{{ request.status }}</span>
      </section>
      <section class="workspace-panel request-detail-content">
        <h2>Request details</h2>
        <p class="request-detail-text">{{ request.details || "No additional details were supplied." }}</p>
        <dl class="request-metadata">
          <div><dt>Priority</dt><dd>{{ request.priority || "Normal" }}</dd></div>
          <div><dt>Created</dt><dd>{{ request.createdAt ? new Date(request.createdAt).toLocaleString() : "—" }}</dd></div>
          <div><dt>Last updated</dt><dd>{{ request.updatedAt ? new Date(request.updatedAt).toLocaleString() : "—" }}</dd></div>
        </dl>
        <p class="muted-note">Updates and approval actions for this service will appear here when supported by the service workflow.</p>
        <RouterLink to="/work" class="action-secondary">Back to My Work</RouterLink>
      </section>
    </template>
  </div>
</template>
