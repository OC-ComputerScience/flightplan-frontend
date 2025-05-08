<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { required, positiveNumber } from "../../../utils/formValidators";
import taskServices from "../../../services/taskServices";

const props = defineProps({ isAdd: Boolean });

const form = ref(null);
const formData = ref({});
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);

const route = useRoute();
const router = useRouter();

const handleCancel = () => {
  router.push({ name: "task" });
};

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;

  try {
    if (props.isAdd) {
      await taskServices.createTask(formData.value);
    } else {
      await taskServices.updateTask(route.params.id, formData.value);
    }
    router.push({ name: "task" });
  } catch (error) {
    console.error("Error saving task:", error);
  }
};

onMounted(async () => {
  try {
    const [categoriesRes, schedulingRes, submissionTypesRes] =
      await Promise.all([
        taskServices.getCategories(),
        taskServices.getSchedulingTypes(),
        taskServices.getSubmissionTypes(),
      ]);

    categories.value = categoriesRes.data;
    schedulingTypes.value = schedulingRes.data;
    submissionTypes.value = submissionTypesRes.data;

    if (!props.isAdd) {
      formData.value = (await taskServices.getTask(route.params.id)).data;
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
        <v-col size="6">
          <v-text-field
            v-model="formData.semestersFromGrad"
            variant="solo"
            rounded="lg"
            label="Semesters from Graduation"
            :rules="[required, positiveNumber]"
          ></v-text-field>
        </v-col>
      </v-row>
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
