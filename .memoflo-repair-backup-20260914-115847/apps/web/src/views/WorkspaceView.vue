<script setup>
import {onMounted,ref} from "vue";import Sidebar from "../components/layout/Sidebar.vue";import Topbar from "../components/layout/Topbar.vue";import {api} from "../services/api";
const branding=ref({});onMounted(async()=>{try{const r=await api.getCompanyWorkspace();branding.value=r?.data?.company?.branding||{};}catch{}});
</script>
<template><div class="app-shell branded-shell" :style="{'--company-primary':branding.primaryColor||'#2563EB','--company-secondary':branding.secondaryColor||'#0f172a','--company-wallpaper':branding.wallpaper?`url(${branding.wallpaper})`:''}"><Sidebar/><main class="main"><Topbar/><section class="content"><router-view/></section></main></div></template>
