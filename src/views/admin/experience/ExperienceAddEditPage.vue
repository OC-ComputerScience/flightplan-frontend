<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { required, atLeast } from "../../../utils/formValidators";
import { semesters } from "../../../utils/semesterFormatter";
import experienceServices from "../../../services/experienceServices";
import strengthServices from "../../../services/strengthServices";

const props = defineProps({ isAdd: Boolean });

const form = ref(null);
const formData = ref({});
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);
const semesterTypes = ref(semesters);
const strengths = ref([]);
const initialStrengths = ref([]);
const strengthOptions = ref([]);

const route = useRoute();
const router = useRouter();

const requiredNumberOfStrengths = 1;

const handleCancel = () => {
  router.push({ name: "experience" });
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;

  try {
    const submitData = { ...formData.value };

    // Convert 'text & files' back to 'both' before submitting
    if (submitData.submissionType === "text & files") {
      submitData.submissionType = "both";
    }

    if (props.isAdd) {
      const experience = (await experienceServices.createExperience(submitData))
        .data;
      for (const strength of strengths.value) {
        await experienceServices.addStrength(experience.id, strength);
      }
    } else {
      await experienceServices.updateExperience(route.params.id, submitData);

      // Adds new experience strengths
      for (const strength of strengths.value) {
        if (!initialStrengths.value.some((s) => s.id === strength)) {
          await experienceServices.addStrength(route.params.id, strength);
        }
      }

      // Removes deselected experience strengths
      for (const strength of initialStrengths.value) {
        if (!strengths.value.some((s) => s === strength.id)) {
          await experienceServices.removeStrength(route.params.id, strength.id);
        }
      }
    }

    router.push({ name: "experience" });
  } catch (error) {
    console.error("Error saving experience:", error);
  }
};

onMounted(async () => {
  try {
    const [categoriesRes, schedulingRes, submissionTypesRes, strengthsRes] =
      await Promise.all([
        experienceServices.getCategories(),
        experienceServices.getSchedulingTypes(),
        experienceServices.getSubmissionTypes(),
        strengthServices.getAllStrengths(),
      ]);

    categories.value = categoriesRes.data;
    schedulingTypes.value = schedulingRes.data;
    submissionTypes.value = submissionTypesRes.data.map((type) =>
      type === "both" ? "text & files" : type,
    );

    // Fetch strengths and map them to options
    strengthOptions.value = strengthsRes.data.map((strength) => ({
      title: strength.name,
      value: strength.id,
      ...strength,
    }));

    if (!props.isAdd) {
      const experience = (
        await experienceServices.getExperience(route.params.id)
      ).data;

      // Convert 'both' to 'text & files' for display
      if (experience.submissionType === "both") {
        experience.submissionType = "text & files";
      }

      formData.value = experience;

      // Load existing strength associations
      const experienceStrengths =
        await strengthServices.getStrengthForExperience(route.params.id);
      strengths.value = experienceStrengths.data.map((experienceStrength) => ({
        title: experienceStrength.name,
        value: experienceStrength.id,
        ...experienceStrength,
      }));
      initialStrengths.value = strengths.value;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});
</script>

<template>
  <h1 class="text-center ma-5">
    {{ props.isAdd ? "Add Experience" : "Edit Experience" }}
  </h1>
  <v-form ref="form" @submit.prevent>
    <v-container class="bg-backgroundDarken rounded-t-xl">
      <v-text-field
        v-model="formData.name"
        variant="solo"
        rounded="lg"
        label="Name"
        :rules="[required]"
      ></v-text-field>

      <v-row dense>
        <v-col :cols="6">
          <v-select
            v-model="formData.category"
            variant="solo"
            rounded="lg"
            label="Category"
            :items="categories"
            :rules="[required]"
          ></v-select>
        </v-col>
        <v-col :cols="6">
          <v-select
            v-model="formData.submissionType"
            variant="solo"
            rounded="lg"
            label="Submission Type"
            :items="submissionTypes"
            :rules="[required]"
          ></v-select>
        </v-col>
        <v-col :cols="6">
          <v-select
            v-model="formData.schedulingType"
            variant="solo"
            rounded="lg"
            label="Scheduling Type"
            :items="schedulingTypes"
            :rules="[required]"
          ></v-select>
        </v-col>
        <v-col :cols="6">
          <v-select
            v-model="formData.semestersFromGrad"
            variant="solo"
            rounded="lg"
            label="Semester"
            :items="semesterTypes"
            item-value="value"
            item-title="name"
            :rules="[required]"
          ></v-select>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-select
          v-model="strengths"
          variant="solo"
          rounded="lg"
          label="Strengths"
          :items="strengthOptions"
          item-value="value"
          item-title="title"
          multiple
          chips
          :rules="[atLeast(strengths, requiredNumberOfStrengths)]"
        ></v-select>
      </v-row>

      <v-text-field
        v-model="formData.rationale"
        variant="solo"
        rounded="lg"
        label="Rationale"
        :rules="[required]"
      ></v-text-field>

      <!-- Removed duplicate category select -->

      <v-textarea
        v-model="formData.description"
        variant="solo"
        rounded="lg"
        label="Description"
        :rules="[required]"
      ></v-textarea>

      <v-row class="justify-center mb-1">
        <v-btn
          class="mr-2"
          variant="outlined"
          rounded="xl"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn rounded="xl" color="primary" @click="handleSubmit">
          Submit
        </v-btn>
      </v-row>
    </v-container>
  </v-form>
</template>
