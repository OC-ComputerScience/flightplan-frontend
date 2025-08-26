<script setup>
const props = defineProps({
  experience: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["edit", "delete"]);
</script>
<template>
  <v-card
    color="backgroundDarken"
    class="h-100 cardContainer d-flex flex-column"
  >
    <v-card-text class="flex-grow-1">
      <p class="text-h5 mb-2">
        {{ props.experience.name }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Sequence: {{ props.experience.sequenceNumber }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Type: {{ props.experience.submissionType }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Scheduling Type: {{ props.experience.schedulingType }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Category: {{ props.experience.category }}
      </p>
      <p class="text-subtitle-1 font-weight-regular">
        Status: {{ props.experience.status }}
      </p>
    </v-card-text>
    <v-card-subtitle class="mt-auto">
      <div class="ma-2 float-end">
        <v-btn
          color="warning"
          class="mr-2 cardButton"
          @click="emit('edit', props.experience.id)"
        >
          <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
        </v-btn>
      </div>
    </v-card-subtitle>
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
