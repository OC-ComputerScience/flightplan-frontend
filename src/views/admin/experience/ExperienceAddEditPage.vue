<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { required } from "../../../utils/formValidators";
import { semesters } from "../../../utils/semesterFormatter";
import experienceServices from "../../../services/experienceServices";

const props = defineProps({ isAdd: Boolean });

const form = ref(null);
const formData = ref({});
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);
const semesterTypes = ref(semesters);

const route = useRoute();
const router = useRouter();

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
      await experienceServices.createExperience(submitData);
    } else {
      await experienceServices.updateExperience(route.params.id, submitData);
    }

    router.push({ name: "experience" });
  } catch (error) {
    console.error("Error saving experience:", error);
  }
};

onMounted(async () => {
  try {
    const [categoriesRes, schedulingRes, submissionTypesRes] =
      await Promise.all([
        experienceServices.getCategories(),
        experienceServices.getSchedulingTypes(),
        experienceServices.getSubmissionTypes(),
      ]);

    categories.value = categoriesRes.data;
    schedulingTypes.value = schedulingRes.data;
    submissionTypes.value = submissionTypesRes.data.map((type) =>
      type === "both" ? "text & files" : type,
    );

    if (!props.isAdd) {
      const experience = (
        await experienceServices.getExperience(route.params.id)
      ).data;

      // Convert 'both' to 'text & files' for display
      if (experience.submissionType === "both") {
        experience.submissionType = "text & files";
      }

      formData.value = experience;
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
