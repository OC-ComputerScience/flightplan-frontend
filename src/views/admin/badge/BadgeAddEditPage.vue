<script setup>
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { required } from "../../../utils/formValidators";
import badgeServices from "../../../services/badgeServices";
import fileServices from "../../../services/fileServices";
import { addTaskToBadgeStore } from "../../../stores/addTaskToBadgeStore";
import { addExperienceToBadgeStore } from "../../../stores/addExperienceToBadgeStore";
import AddTaskToBadge from "../../../components/dialogs/AddTaskToBadge.vue";
import AddExperienceToBadge from "../../../components/dialogs/AddExperienceToBadge.vue";
import ImageInput from "../../../components/modals/ImageInput.vue";
// Define statements for vue
const props = defineProps({
  isAdd: Boolean,
});

// Vue specific statements
const route = useRoute();
const router = useRouter();
const addTaskStore = addTaskToBadgeStore();
const addExperienceStore = addExperienceToBadgeStore();
// Reactive states
const errorMessage = ref("");
const form = ref(null);
const formData = ref({ imageName: null });
const image = ref(null);
const rules = ref([]);
const selectedRule = ref("Task and Experience Defined");
const ruleTasks = ref([]);
const ruleExperiences = ref([]);

// Functions
const handleCancel = () => {
  router.push({ name: "badge" });
};

const handleAddTaskToBadge = (response) => {
  const existingTaskIndex = ruleTasks.value.findIndex(
    (task) => task.task.id === response.task.id,
  );

  if (existingTaskIndex !== -1) {
    ruleTasks.value[existingTaskIndex] = response;
  } else {
    ruleTasks.value = [...ruleTasks.value, response];
  }
};

const handleAddExperienceToBadge = (response) => {
  const existingExperienceIndex = ruleExperiences.value.findIndex(
    (experience) => experience.experience.id === response.experience.id,
  );

  if (existingExperienceIndex !== -1) {
    ruleExperiences.value[existingExperienceIndex] = response;
  } else {
    ruleExperiences.value = [...ruleExperiences.value, response];
  }
};

const removeTask = (task) => {
  ruleTasks.value = ruleTasks.value.filter((t) => t.task.id !== task.task.id);
};

const removeExperience = (experience) => {
  ruleExperiences.value = ruleExperiences.value.filter(
    (e) => e.experience.id !== experience.experience.id,
  );
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;

  formData.value.ruleType = selectedRule.value;

  if (selectedRule.value === "Task and Experience Defined") {
    if (ruleTasks.value.length === 0 && ruleExperiences.value.length === 0) {
      errorMessage.value = "You must add at least one task or experience";
      return;
    }
    formData.value.tasks = ruleTasks.value;
    formData.value.experiences = ruleExperiences.value;
  }

  if (!isValid) return;

  try {
    if (props.isAdd) {
      await uploadImage();
      await badgeServices.createBadge(formData.value);
    } else {
      await handleImageUpdate();
      await badgeServices.updateBadge(route.params.id, formData.value);
    }
    router.push({ name: "badge" });
  } catch (error) {
    errorMessage.value = "An error occurred while trying to submit.";
    console.error("Error saving task:", error);
  }
};

const uploadImage = async () => {
  if (!image.value) return;
  const response = await fileServices.uploadFile({
    file: image.value,
    folder: "photos",
  });
  formData.value.imageName = response.data.fileName;
};

const handleImageUpdate = async () => {
  if (image.value && !formData.value.imageName) {
    await uploadImage();
  }
  // Case where image is changed
  else if (image.value && formData.value.imageName !== image.value.name) {
    await fileServices.deleteFileForName(formData.value.imageName);
    await uploadImage();
  }
  // Case where image is deleted
  else if (!image.value && formData.value.imageName) {
    await fileServices.deleteFileForName(formData.value.imageName);
    formData.value.imageName = null;
  }
  formData.value.image = undefined;
};

// Helper Functions
const fetchRuleTypes = async () => {
  try {
    const response = await badgeServices.getRuleTypes();
    rules.value = response.data;
  } catch (error) {
    console.error("Error fetching rule types:", error);
    errorMessage.value = "Failed to load rule types";
  }
};

const mapTasksToRuleFormat = (tasks) => {
  return (
    tasks?.map((task) => ({
      task: task,
      quantity: task.badExpTask.quantity,
    })) || []
  );
};

const mapExperiencesToRuleFormat = (experiences) => {
  return (
    experiences?.map((experience) => ({
      experience: experience,
      quantity: experience.badExpTask.quantity,
    })) || []
  );
};

const fetchBadgeImage = async (imageName) => {
  try {
    const response = await fileServices.getFileForName(imageName);
    return new File([response.data.image], imageName);
  } catch (error) {
    console.error("Error fetching badge image:", error);
    return null;
  }
};

// Lifecycle Hooks
onMounted(async () => {
  await fetchRuleTypes();
  if (props.isAdd) return;

  try {
    // Fetch badge data
    const response = await badgeServices.getBadge(route.params.id);
    const badgeData = response.data;

    // Update form data
    formData.value = badgeData;

    // Map tasks and experiences
    ruleTasks.value = mapTasksToRuleFormat(badgeData.tasks);
    ruleExperiences.value = mapExperiencesToRuleFormat(badgeData.experiences);

    // Set rule type
    selectedRule.value = badgeData.ruleType;

    // Fetch and set image if exists
    if (badgeData.imageName) {
      const imageFile = await fetchBadgeImage(badgeData.imageName);
      if (imageFile) {
        image.value = imageFile;
        formData.value.image = imageFile;
      }
    }
  } catch (error) {
    console.error("Error loading badge data:", error);
    // TODO: Add user-facing error notification
  }
});
</script>
<template>
  <v-alert v-if="errorMessage" closable type="error">
    {{ errorMessage }}
  </v-alert>
  <h1 class="text-center ma-5">
    {{ props.isAdd ? "Add Badge" : "Edit Badge" }}
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
      <v-textarea
        v-model="formData.description"
        variant="solo"
        rounded="lg"
        label="Description"
        :rules="[required]"
      ></v-textarea>
      <v-select
        v-model="selectedRule"
        variant="solo"
        rounded="lg"
        label="Rule Type"
        :items="rules"
      ></v-select>
      <div v-if="selectedRule === 'Task and Experience Defined'">
        <v-expansion-panels class="mb-4 rounded-lg">
          <v-expansion-panel class="mb-2">
            <v-expansion-panel-title>Tasks</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row
                v-for="ruleTask in ruleTasks"
                :key="ruleTask.id"
                class="bg-backgroundDarken my-2 rounded-lg d-flex justify-space-between"
                ><div class="ma-5">
                  {{ ruleTask.task.name }}
                </div>

                <div class="ma-2 d-flex">
                  <div class="ma-3">Quantity: {{ ruleTask.quantity }}</div>
                  <v-btn
                    class="rounded-lg bg-warning mr-3"
                    @click="addTaskStore.editRuleTask(ruleTask)"
                  >
                    <v-icon icon="mdi-pencil" color="text" size="x-large" />
                  </v-btn>
                  <v-btn
                    class="rounded-lg bg-danger"
                    @click="removeTask(ruleTask)"
                  >
                    <v-icon icon="mdi-delete" color="text" size="x-large" />
                  </v-btn>
                </div>
              </v-row>
              <v-row>
                <v-btn
                  block
                  class="rounded-lg bg-backgroundDarken mb-2 mt-4"
                  @click="addTaskStore.addRuleTask()"
                  >Add Task</v-btn
                ></v-row
              >
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-expansion-panels class="mb-4 rounded-lg">
          <v-expansion-panel class="mb-2">
            <v-expansion-panel-title>Experiences</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row
                v-for="ruleExperience in ruleExperiences"
                :key="ruleExperience.id"
                class="bg-backgroundDarken my-2 rounded-lg d-flex justify-space-between"
              >
                <div class="ma-5">
                  {{ ruleExperience.experience.name }}
                </div>

                <div class="ma-2 d-flex">
                  <div class="ma-3">
                    Quantity: {{ ruleExperience.quantity }}
                  </div>
                  <v-btn
                    class="rounded-lg bg-warning mr-3"
                    @click="
                      addExperienceStore.editRuleExperience(ruleExperience)
                    "
                  >
                    <v-icon icon="mdi-pencil" color="text" size="x-large" />
                  </v-btn>
                  <v-btn
                    class="rounded-lg bg-danger"
                    @click="removeExperience(ruleExperience)"
                  >
                    <v-icon icon="mdi-delete" color="text" size="x-large" />
                  </v-btn>
                </div>
              </v-row>
              <v-row>
                <v-btn
                  block
                  class="rounded-lg bg-backgroundDarken mb-2 mt-4"
                  @click="addExperienceStore.addRuleExperience()"
                  >Add Experience</v-btn
                ></v-row
              >
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      <ImageInput v-model="image" :image-name="formData.imageName" />
      <v-row class="justify-center my-1">
        <v-btn
          class="mr-2"
          variant="outlined"
          rounded="xl"
          @click="handleCancel"
          >Cancel</v-btn
        >
        <v-btn rounded="xl" color="primary" @click="handleSubmit">Submit</v-btn>
      </v-row>
    </v-container>
  </v-form>
  <AddTaskToBadge @add-task-to-badge="handleAddTaskToBadge" />
  <AddExperienceToBadge @add-experience-to-badge="handleAddExperienceToBadge" />
</template>
