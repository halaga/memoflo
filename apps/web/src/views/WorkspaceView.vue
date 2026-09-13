<script setup>
import Sidebar from "../components/layout/Sidebar.vue";
import Topbar from "../components/layout/Topbar.vue";
</script>

<template>
  <div class="app-shell">
    <Sidebar />
    <main class="main">
      <Topbar />
      <section class="content"><router-view /></section>
    </main>
  </div>
</template>
