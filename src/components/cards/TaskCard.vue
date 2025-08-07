<script setup>
const props = defineProps({
  task: {
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
        {{ props.task.name }}
      </p>
            <p class="text-subtitle-1 font-weight-regular">
        Sequence: {{ props.task.sequenceNumber }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Category: {{ props.task.category }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Completion Type: {{ props.task.submissionType }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Status: {{ props.task.status }}
      </p>
    </v-card-text>
    <v-row class="ma-2 float-right">
      <v-btn
        color="warning"
        class="mr-2 cardButton"
        @click="emit('edit', props.task.id)"
      >
        <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
      </v-btn>
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
