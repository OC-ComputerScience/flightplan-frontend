<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  required,
  positiveNumber,
  atLeast,
} from "../../../utils/formValidators";
import { semesters } from "../../../utils/semesterFormatter";
import taskServices from "../../../services/taskServices";
import majorServices from "../../../services/majorServices";

const props = defineProps({ isAdd: Boolean });

const form = ref(null);
const formData = ref({});
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);
const semesterTypes = ref(semesters);

const majors = ref([]);
const initialMajors = ref([]);
const majorOptions = ref([]);

const route = useRoute();
const router = useRouter();

const requiredNumberOfMajors = 1;

const getId = (item) =>
  typeof item === "object" && item !== null ? item.id : item;

const handleCancel = () => {
  router.push({ name: "task" });
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;

  try {
    const submitData = { ...formData.value };

    if (props.isAdd) {
      const task = (await taskServices.createTask(submitData)).data;
      for (const major of majors.value) {
        await taskServices.addMajor(task.id, major);
      }
    } else {
      await taskServices.updateTask(route.params.id, submitData);

      for (const major of majors.value) {
        const majorId = getId(major);
        if (!initialMajors.value.some((m) => getId(m) === majorId)) {
          await taskServices.addMajor(route.params.id, majorId);
        }
      }

      for (const major of initialMajors.value) {
        const majorId = getId(major);
        if (!majors.value.some((m) => getId(m) === majorId)) {
          await taskServices.removeMajor(route.params.id, majorId);
        }
      }
    }
    router.push({ name: "task" });
  } catch (error) {
    console.error("Error saving task:", error);
  }
};

onMounted(async () => {
  try {
    const [categoriesRes, schedulingRes, submissionTypesRes, majorsRes] =
      await Promise.all([
        taskServices.getCategories(),
        taskServices.getSchedulingTypes(),
        taskServices.getSubmissionTypes(),
        majorServices.getAllMajors(),
      ]);

    categories.value = categoriesRes.data;
    schedulingTypes.value = schedulingRes.data;
    submissionTypes.value = submissionTypesRes.data;

    // Fetch majors and map them to options
    majorOptions.value = majorsRes.data.majors.map((major) => ({
      title: major.name,
      value: major.id,
      ...major,
    }));

    if (!props.isAdd) {
      // Fetch the task and its associated majors
      const task = (await taskServices.getTask(route.params.id)).data;
      formData.value = task;

      const taskMajors = await majorServices.getMajorForTask(route.params.id);
      majors.value = taskMajors.data.map((taskMajor) => ({
        value: taskMajor.id,
        title: taskMajor.name,
        ...taskMajor,
      }));
      initialMajors.value = majors.value; // Store initial majors for comparison
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});
</script>
<template>
  <h1 class="text-center ma-5">
    {{ props.isAdd ? "Add Task" : "Edit Task" }}
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
      <v-row no-gutters>
        <v-col size="6" class="mr-4">
          <v-select
            v-model="formData.category"
            variant="solo"
            rounded="lg"
            label="Category"
            :items="categories"
            :rules="[required]"
          ></v-select>
        </v-col>
        <v-col size="6">
          <v-select
            v-model="formData.submissionType"
            variant="solo"
            rounded="lg"
            label="Submission Type"
            :items="submissionTypes"
            :rules="[required]"
          ></v-select>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-select
          v-model="formData.schedulingType"
          variant="solo"
          rounded="lg"
          label="Scheduling Type"
          :items="schedulingTypes"
          :rules="[required]"
        ></v-select>
      </v-row>
      <v-row no-gutters>
        <v-col size="6" class="mr-4">
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
      </v-row>
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
        :rules="[atLeast(majors, requiredNumberOfMajors)]"
      ></v-autocomplete>
      <v-textarea
        v-model="formData.description"
        variant="solo"
        rounded="lg"
        label="Description"
        :rules="[required]"
      ></v-textarea>
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
          >Cancel</v-btn
        >
        <v-btn rounded="xl" color="primary" @click="handleSubmit">Submit</v-btn>
      </v-row>
    </v-container>
  </v-form>
</template>
