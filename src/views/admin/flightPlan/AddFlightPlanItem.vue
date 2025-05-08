<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>
<template>
  <h1>Add a flight plan item to flight plan: {{ route.params.id }}</h1>
</template>
