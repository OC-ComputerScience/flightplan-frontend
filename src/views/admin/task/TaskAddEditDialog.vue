<script setup>
import { ref, onMounted, watch, computed } from "vue";
import {
  required,
  positiveNumber,
  isLink,
} from "../../../utils/formValidators";
import { semesters } from "../../../utils/semesterFormatter";
import taskServices from "../../../services/taskServices";
import majorServices from "../../../services/majorServices";
import strengthServices from "../../../services/strengthServices";

const props = defineProps({
  modelValue: Boolean,
  isAdd: Boolean,
  taskId: Number,
});
const emit = defineEmits(["update:modelValue", "saved"]);

const form = ref(null);
const formData = ref({});
const categories = ref([]);
const schedulingTypes = ref([]);
const submissionTypes = ref([]);
const statusTypes = ref([]);
const semesterTypes = ref(semesters);

const majors = ref([]);
const initialMajors = ref([]);
const majorOptions = ref([]);

const strengths = ref([]);
const initialStrengths = ref([]);
const strengthOptions = ref([]);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const getId = (item) =>
  typeof item === "object" && item !== null ? item.id : item;

const handleCancel = () => {
  dialog.value = false;
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
      for (const strength of strengths.value) {
        await taskServices.addStrength(task.id, strength);
      }
    } else {
      await taskServices.updateTask(props.taskId, submitData);

      for (const major of majors.value) {
        const majorId = getId(major);
        if (!initialMajors.value.some((m) => getId(m) === majorId)) {
          await taskServices.addMajor(props.taskId, majorId);
        }
      }
      for (const strength of strengths.value) {
        const strengthId = getId(strength);
        if (!initialStrengths.value.some((s) => getId(s) === strengthId)) {
          await taskServices.addStrength(props.taskId, strengthId);
        }
      }

      for (const major of initialMajors.value) {
        const majorId = getId(major);
        if (!majors.value.some((m) => getId(m) === majorId)) {
          await taskServices.removeMajor(props.taskId, majorId);
        }
      }
      for (const strength of initialStrengths.value) {
        const strengthId = getId(strength);
        if (!strengths.value.some((s) => getId(s) === strengthId)) {
          await taskServices.removeStrength(props.taskId, strengthId);
        }
      }
    }
    emit("saved");
    dialog.value = false;
  } catch (error) {
    console.error("Error saving task:", error);
  }
};

const fetchData = async () => {
  try {
    const [
      categoriesRes,
      schedulingRes,
      submissionTypesRes,
      majorsRes,
      strengthsRes,
      statusTypesRes,
    ] = await Promise.all([
      taskServices.getCategories(),
      taskServices.getSchedulingTypes(),
      taskServices.getSubmissionTypes(),
      majorServices.getAllMajors(),
      strengthServices.getAllStrengths(),
      taskServices.getStatusTypes(),
    ]);

    categories.value = categoriesRes.data;
    schedulingTypes.value = schedulingRes.data;
    submissionTypes.value = submissionTypesRes.data;
    statusTypes.value = statusTypesRes.data;

    // Fetch majors and map them to options
    majorOptions.value = majorsRes.data.majors.map((major) => ({
      title: major.name,
      value: major.id,
      ...major,
    }));
    strengthOptions.value = strengthsRes.data.map((strength) => ({
      title: strength.name,
      value: strength.id,
      ...strength,
    }));

    // Fetch the task and its associated majors
    if (!props.isAdd && props.taskId) {
      const task = (await taskServices.getTask(props.taskId)).data;
      formData.value = task;

      const taskMajors = await majorServices.getMajorForTask(props.taskId);
      majors.value = taskMajors.data.map((taskMajor) => ({
        value: taskMajor.id,
        title: taskMajor.name,
        ...taskMajor,
      }));
      initialMajors.value = majors.value; // Store initial majors for comparison

      const taskStrengths = await strengthServices.getStrengthForTask(
        props.taskId,
      );
      strengths.value = taskStrengths.data.map((taskStrength) => ({
        value: taskStrength.id,
        title: taskStrength.name,
        ...taskStrength,
      }));
      // Store initial strengths for comparison
      initialStrengths.value = strengths.value;
    } else {
      formData.value = {};
      majors.value = [];
      strengths.value = [];
      initialMajors.value = [];
      initialStrengths.value = [];
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) fetchData();
  }
);

onMounted(() => {
  if (props.modelValue) fetchData();
});
</script>

<template>
  <v-dialog v-model="dialog" max-width="800">
    <v-card>
      <v-card-title>
        <span class="text-h6">{{ props.isAdd ? "Add Task" : "Edit Task" }}</span>
      </v-card-title>
      <v-card-text>
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
            <v-row no-gutters>
              <v-select
                v-model="formData.semesterEnd"
                variant="solo"
                rounded="lg"
                label="Semester End"
                :items="[{ name: 'None', value: null }, ...semesterTypes]"
                item-value="value"
                item-title="name"
              ></v-select>
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
              <v-select
                v-model="formData.status"
                variant="solo"
                rounded="lg"
                label="Status"
                :items="statusTypes"
                item-value="value"
                item-title="title"
                :rules="[required]"
              ></v-select>
            </v-row>
            <v-row no-gutters>
              <v-col size="6" class="mr-4">
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
            </v-row>
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
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" rounded="xl" @click="handleCancel">Cancel</v-btn>
        <v-btn rounded="xl" color="primary" @click="handleSubmit">Submit</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
