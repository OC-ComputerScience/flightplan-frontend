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
const student = ref(null);

const emit = defineEmits(["submit"]);

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const closeDialogue = () => {
  emit("submit");
  visible.value = false;
};

const handleSubmit = async () => {
  await updateStrengths(student.value.id);
  emit("submit");
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

    student.value = (await studentServices.getStudentForUserId(props.id)).data;
    const studentStrengths = (
      await strengthServices.getStrengthsForStudent(student.value.id)
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
    <v-container
      class="bg-backgroundDarken rounded-t-xl"
      style="max-height: 90vh; overflow-y: auto"
    >
      <v-card-title class="text-h5 text-center pt-4 pr-4 pl-4">
        Add / Remove Clifton Strengths
      </v-card-title>
      <v-card class="rounded-xl">
        <p class="text-left pa-8">
          Add or remove your Clifton Strengths using the dropdown menu below:
        </p>
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
          :menu-props="{ top: true }"
        />
      </v-card>
      <v-row class="justify-center mb-4 mt-4">
        <v-btn
          class="mr-2"
          variant="outlined"
          rounded="xl"
          @click="closeDialogue"
          >Cancel</v-btn
        >
        <v-btn rounded="xl" color="primary" @click="handleSubmit">Update</v-btn>
      </v-row>
    </v-container>
  </v-dialog>
</template>
