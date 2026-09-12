<script setup>
import Sidebar from "../components/layout/Sidebar.vue";
import Topbar from "../components/layout/Topbar.vue";
</script>

<template>
  <div class="workspace-shell">
    <Sidebar />

    <div class="workspace-main">
      <Topbar />

      <main class="workspace-content">
        <router-view />
      </main>
    </div>
  </div>
</template>