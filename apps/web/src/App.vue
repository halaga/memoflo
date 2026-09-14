<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

function handleUnauthorized() {
  router.replace("/login");
}

onMounted(() => {
  window.addEventListener(
    "memoflo:unauthorized",
    handleUnauthorized
  );
});

onBeforeUnmount(() => {
  window.removeEventListener(
    "memoflo:unauthorized",
    handleUnauthorized
  );
});
</script>

<template>
  <router-view />
</template>
