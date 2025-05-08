<script setup>
const props = defineProps({
  major: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["edit", "delete"]);
</script>

<template>
  <v-card color="backgroundDarken" class="cardContainer">
    <v-card-text>
      <p class="text-h5 mb-2">
        {{ props.major.name }}
      </p>
    </v-card-text>
    <v-row class="ma-2 float-right">
      <v-btn
        color="warning"
        class="mr-2 cardButton"
        @click="emit('edit', props.major.id)"
      >
        <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
      </v-btn>
      <v-btn
        color="danger"
        class="cardButton"
        @click="emit('delete', props.major.id)"
        ><v-icon icon="mdi-delete" color="text" size="x-large"></v-icon
      ></v-btn>
    </v-row>
  </v-card>
</template>

<style scoped>
.cardContainer {
  min-width: 280px;
  border-radius: 25px;
}
.cardButton {
  border-radius: 13px;
}
</style>
