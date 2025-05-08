<script setup>
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import experienceServices from "../../services/experienceServices";
import { addExperienceToBadgeStore } from "../../stores/addExperienceToBadgeStore";
import { required, positiveNumber } from "../../utils/formValidators";

const store = addExperienceToBadgeStore();
const { visible } = storeToRefs(store);

const emit = defineEmits(["addExperienceToBadge", "close"]);
const experiences = ref([]);
const quantity = ref(1);
const selectedExperience = ref(null);

const fetchExperiences = async () => {
  const response = await experienceServices.getAllExperiences();
  experiences.value = response.data.experiences;
  selectedExperience.value = experiences.value[0];
};

const handleAdd = () => {
  if (quantity.value <= 0) {
    return;
  }
  emit("addExperienceToBadge", {
    experience: selectedExperience.value,
    quantity: quantity.value,
  });
  store.toggleVisibility();
};

onMounted(async () => {
  await fetchExperiences();
});
</script>
<template>
  <v-dialog v-model="visible">
    <v-card class="rounded-lg bg-backgroundDarken">
      <v-card-title class="text-center"
        >Add Experience Rule to Badge</v-card-title
      >
      <v-card-text>
        <v-autocomplete
          v-model="selectedExperience"
          :items="experiences"
          item-title="name"
          return-object
          label="Experience"
          variant="solo"
          :rules="[required]"
        ></v-autocomplete>
        <v-text-field
          v-model="quantity"
          type="number"
          label="Quantity"
          variant="solo"
          :rules="[required, positiveNumber]"
        ></v-text-field>
        <v-row class="d-flex justify-center">
          <v-btn
            class="mr-2 rounded-lg"
            variant="outlined"
            @click="store.toggleVisibility()"
            >Cancel</v-btn
          >
          <v-btn class="rounded-lg" color="primary" @click="handleAdd"
            >Add</v-btn
          >
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
