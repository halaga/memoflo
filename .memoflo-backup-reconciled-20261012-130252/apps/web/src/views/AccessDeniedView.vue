<template>
  <section class="state-page">
    <div class="state-card">
      <div class="icon">403</div>
      <h1>Access denied</h1>
      <p>You do not have permission to access this page.</p>
      <RouterLink to="/home">Return to Home</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.state-page { min-height: 60vh; display: grid; place-items: center; padding: 32px; }
.state-card { text-align: center; max-width: 520px; padding: 40px; border-radius: 20px; background: var(--surface, #fff); color: var(--text, #17202a); box-shadow: 0 10px 30px rgba(0,0,0,.06); }
.icon { font-weight: 800; font-size: 14px; opacity: .6; }
h1 { margin: 10px 0; }
a { display: inline-block; margin-top: 18px; }
</style>
