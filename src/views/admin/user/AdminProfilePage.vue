<script setup>
const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
});
</script>
<template>
  <h1>Admin Profile Page with id: {{ props.id }}</h1>
</template>
