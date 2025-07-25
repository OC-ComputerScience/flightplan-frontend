<script setup>
import { ref, onMounted } from "vue";
import studentServices from "../../services/studentServices";
import strengthServices from "../../services/strengthServices";
import { noGreaterThan } from "../../utils/formValidators";

const visible = ref(true);
const strengths = ref([]);
const initialStrengths = ref([]);
const strengthOptions = ref([]);
const maximumNumberOfStrengths = 5;

const emit = defineEmits(["submit"]);

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
});

const closeDialogue = () => {
  emit("submit")
  visible.value = false;
};

const handleSubmit = async () => {
  await updateStrengths(props.id);
    emit("submit")
  visible.value = false;
};

const updateStrengths = async (studentId) => {
  for (const strength of strengths.value) {
    const strengthId = getId(strength);
    if (!initialStrengths.value.some((s) => getId(s) === strengthId)) {
      await studentServices.addStrength(studentId, strengthId);
    }
  }

  for (const strength of initialStrengths.value) {
    const strengthId = getId(strength);
    if (!strengths.value.some((s) => getId(s) === strengthId)) {
      await studentServices.removeStrength(studentId, strengthId);
    }
  }
};

const getId = (item) =>
  typeof item === "object" && item !== null ? item.id : item;

onMounted(async () => {
  try {
    const [strengthsRes] = await Promise.all([
      strengthServices.getAllStrengths(),
    ]);

    strengthOptions.value = strengthsRes.data.map((strength) => ({
      title: strength.name,
      value: strength.id,
      ...strength,
    }));

    const student = (await studentServices.getStudentForUserId(props.id))
      .data;
    const studentStrengths = (
      await strengthServices.getStrengthsForStudent(student.id)
    ).data;

    strengths.value = studentStrengths.map((studentStrengths) => ({
      title: studentStrengths.name,
      value: studentStrengths.id,
      ...studentStrengths,
    }));
    initialStrengths.value = strengths.value;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});
</script>

<template>
  <v-dialog v-model="visible" max-width="50%" class="rounded-xl">
    <v-card class="rounded-xl">
      <v-card-title class="text-h5 text-center pt-4 pr-4 pl-4">
        Add / Remove Clifton Strengths
      </v-card-title>
      <v-card-text class="text-center pb-8 pl-16 pr-16 pt-6">
        <p class="text-left pb-8">
          Add or remove your Clifton Strengths below:
        </p>
      </v-card-text>

      <v-autocomplete
        v-model="strengths"
        variant="solo"
        rounded="lg"
        label="Strengths"
        :items="strengthOptions"
        item-value="value"
        item-title="title"
        multiple
        chips
        :rules="[noGreaterThan(strengths, maximumNumberOfStrengths)]"
      />

      <v-card-actions class="pb-4 pr-4 pl-4">
        <v-col class="d-flex flex-column align-center">
          <v-btn rounded="xl" color="primary" @click="handleSubmit"
            >Submit</v-btn
          >
          <v-btn
            color="primary"
            variant="text"
            class="rounded-lg"
            @click="closeDialogue"
          >
            Cancel
          </v-btn>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
