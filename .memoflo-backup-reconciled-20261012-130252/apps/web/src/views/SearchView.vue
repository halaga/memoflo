<template>
  <section class="search-page">
    <div class="search-card">
      <p class="eyebrow">MemoFlo Search</p>
      <h1>Search</h1>
      <p>Search results for <strong>{{ query || 'everything' }}</strong> will appear here.</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const query = computed(() => String(route.query.q || '').trim());
</script>

<style scoped>
.search-page { padding: 32px; }
.search-card { max-width: 900px; margin: 0 auto; padding: 32px; border-radius: 20px; background: var(--surface, #fff); color: var(--text, #17202a); box-shadow: 0 10px 30px rgba(0,0,0,.06); }
.eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: .65; }
h1 { margin: 0 0 8px; }
</style>
