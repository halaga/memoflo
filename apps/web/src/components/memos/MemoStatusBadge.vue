<script setup>
import { computed } from "vue";
const props=defineProps({status:{type:String,default:"Draft"}});
const label=computed(()=>props.status||"Draft");
const statusClass=computed(()=>`status-${label.value.toLowerCase().replaceAll(" ","-")}`);
</script>
<template><span class="status-badge" :class="statusClass">{{label}}</span></template>
