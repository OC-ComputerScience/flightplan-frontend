<script setup>
import { ref, onMounted, watch, computed } from "vue";
import {
  required,
  positiveNumber,
  isLink
} from "../../../utils/formValidators";
import { semesters } from "../../../utils/semesterFormatter";
import experienceServices from "../../../services/experienceServices";
import strengthServices from "../../../services/strengthServices";
import majorServices from "../../../services/majorServices";

// Props for dialog control and experience ID
const props = defineProps({
  modelValue: Boolean, // Controls dialog visibility
  isAdd: Boolean,      // True for add, false for edit
  experienceId: Number,     // ID of the experience being edited
});

const emit = defineEmits(["update:modelValue", "saved"]);

// v-model proxy for dialog
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});


const form = ref(null);
const formData = ref({});
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);
const semesterTypes = ref(semesters);
const statusTypes = ref([]);
const strengths = ref([]);
const initialStrengths = ref([]);
const strengthOptions = ref([]);
const majors = ref([]);
const initialMajors = ref([]);
const majorOptions = ref([]);

// Handles the canceling of the dialog without saving
const handleCancel = () => {
  dialog.value = false;
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
      for (const major of majors.value) {
        await experienceServices.addMajor(experience.id, major);
      }
    } else {
      await experienceServices.updateExperience(props.experienceId, submitData);

      const getId = (item) =>
        typeof item === "object" && item !== null ? item.id : item;

      // Adds new experience strengths
      for (const strength of strengths.value) {
        const strengthId = getId(strength);
        if (!initialStrengths.value.some((s) => getId(s) === strengthId)) {
          await experienceServices.addStrength(props.experienceId, strengthId);
        }
      }
      // Removes deselected experience strengths
      for (const strength of initialStrengths.value) {
        const strengthId = getId(strength);
        if (!strengths.value.some((s) => getId(s) === strengthId)) {
          await experienceServices.removeStrength(props.experienceId, strengthId);
        }
      }

      // Adds new experience majors
      for (const major of majors.value) {
        const majorId = getId(major);
        if (!initialMajors.value.some((m) => getId(m) === majorId)) {
          await experienceServices.addMajor(props.experienceId, majorId);
        }
      }
      // Removes deselected experience majors
      for (const major of initialMajors.value) {
        const majorId = getId(major);
        if (!majors.value.some((m) => getId(m) === majorId)) {
          await experienceServices.removeMajor(props.experienceId, majorId);
        }
      }
    }
    emit("saved");
    dialog.value = false;
  } catch (error) {
    console.error("Error saving experience:", error);
  }
};

const fetchData = async () => {
  try {
    const [
      categoriesRes,
      schedulingRes,
      submissionTypesRes,
      statusTypesRes,
      strengthsRes,
      majorsRes,
    ] = await Promise.all([
      experienceServices.getCategories(),
      experienceServices.getSchedulingTypes(),
      experienceServices.getSubmissionTypes(),
      experienceServices.getStatusTypes(),
      strengthServices.getAllStrengths(),
      majorServices.getAllMajors(),
    ]);

    categories.value = categoriesRes.data;
    schedulingTypes.value = schedulingRes.data;
    submissionTypes.value = submissionTypesRes.data.map((type) =>
      type === "both" ? "text & files" : type,
    );
    statusTypes.value = statusTypesRes.data;

    // Fetch strengths and map them to options
    strengthOptions.value = strengthsRes.data.map((strength) => ({
      title: strength.name,
      value: strength.id,
      ...strength,
    }));

    // Fetch majors and map them to options
    majorOptions.value = majorsRes.data.majors.map((major) => ({
      title: major.name,
      value: major.id,
      ...major,
    }));

    if (!props.isAdd) {
      const experience = (
        await experienceServices.getExperience(props.experienceId)
      ).data;

      // Convert 'both' to 'text & files' for display
      if (experience.submissionType === "both") {
        experience.submissionType = "text & files";
      }

      formData.value = experience;

      // Load existing strength associations
      const experienceStrengths =
        await strengthServices.getStrengthForExperience(props.experienceId);
      strengths.value = experienceStrengths.data.map((experienceStrength) => ({
        title: experienceStrength.name,
        value: experienceStrength.id,
        ...experienceStrength,
      }));
      initialStrengths.value = strengths.value;

      // Load existing majors associations
      const experienceMajors = await majorServices.getMajorForExperience(
        props.experienceId,
      );
      majors.value = experienceMajors.data.map((experienceMajor) => ({
        title: experienceMajor.name,
        value: experienceMajor.id,
        ...experienceMajor,
      }));
      initialMajors.value = majors.value;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) fetchData();
  },
);

onMounted(async () => {
  if (props.modelValue) fetchData();
});
</script>

<template>
  <v-dialog v-model="dialog" max-width="1000">
    <h1 class="text-center ma-5">
      {{ props.isAdd ? "Add Experience" : "Edit Experience" }}
    </h1>
    <v-form ref="form" @submit.prevent>
      <v-container
        class="bg-backgroundDarken rounded-t-xl"
        style="max-height: 90vh; overflow-y: auto"
      >
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
              v-model="formData.submissionType"
              variant="solo"
              rounded="lg"
              label="Submission Type"
              :items="submissionTypes"
              :rules="[required]"
            ></v-select>
          </v-col>
          <v-col :cols="6">
            <v-checkbox
              v-model="formData.eventRequired"
              label="OC Event Registration Required for Completion?"
            />
          </v-col>

          <v-col size="6">
            <v-text-field
              v-model="formData.points"
              variant="solo"
              rounded="lg"
              label="Points"
              :rules="[required, positiveNumber]"
            ></v-text-field>
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
          <v-col :cols="12">
            <v-select
              v-model="formData.semesterEnd"
              variant="solo"
              rounded="lg"
              label="Semester End"
              :items="[{ name: 'None', value: null }, ...semesterTypes]"
              item-value="value"
              item-title="name"
            ></v-select>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col size="6">
            <v-text-field
              v-model="formData.sequenceNumber"
              variant="solo"
              rounded="lg"
              label="Flight Plan Sequence Number"
              :rules="[required, positiveNumber]"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-autocomplete
            v-model="formData.status"
            variant="solo"
            rounded="lg"
            label="Status"
            :items="statusTypes"
            item-value="value"
            item-title="title"
            :rules="[required]"
          ></v-autocomplete>
        </v-row>
        <v-row dense>
          <v-col :cols="6">
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
            ></v-autocomplete>
          </v-col>
          <v-col :cols="6">
            <v-autocomplete
              v-model="majors"
              variant="solo"
              rounded="lg"
              label="Majors"
              :items="majorOptions"
              item-value="value"
              item-title="title"
              multiple
              chips
            ></v-autocomplete>
          </v-col>
        </v-row>

        <!-- Removed duplicate category select -->

        <v-textarea
          v-model="formData.description"
          variant="solo"
          rounded="lg"
          label="Description"
          :rules="[required]"
        ></v-textarea>
        <v-textarea
          v-model="formData.instructions"
          variant="solo"
          rounded="lg"
          label="Completion Instructions"
        ></v-textarea>
        <v-text-field
          v-model="formData.instructionsLinkDescription"
          variant="solo"
          rounded="lg"
          label="Additional Instructions Link Description"
        ></v-text-field>
        <v-text-field
          v-model="formData.instructionsLink"
          variant="solo"
          rounded="lg"
          label="Additional Instructions Link"
          :rules="formData.instructionsLinkDescription ? [isLink] : []"
        ></v-text-field>
        <v-text-field
          v-model="formData.rationale"
          variant="solo"
          rounded="lg"
          label="Rationale"
          :rules="[required]"
        ></v-text-field>

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
  </v-dialog>
</template>
