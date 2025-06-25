<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import userServices from "../../../services/userServices";
import studentServices from "../../../services/studentServices";
import strengthServices from "../../../services/strengthServices";
import majorServices from "../../../services/majorServices";
import { required, atLeast } from "../../../utils/formValidators";
import { semesters } from "../../../utils/semesterFormatter";
import DatePickerFieldForModal from "../../../components/DatePickerFieldForModal.vue";
import { userStore } from "../../../stores/userStore";

const props = defineProps({ isAdd: Boolean });
const store = userStore();

const form = ref(null);
const formData = ref({});
const selectedDate = ref(null);
const strengths = ref([]);
const initialStrengths = ref([]);
const strengthOptions = ref([]);
const majors = ref([]);
const initialMajors = ref([]);
const majorOptions = ref([]);
const semesterTypes = ref(semesters);

const isStudent = ref(true);

const route = useRoute();
const router = useRouter();

const requiredNumberOfStrengths = 1;
const requiredNumberOfMajors = 1;

const handleCancel = () => router.back();

const addMajorsAndStrengths = async (studentId) => {
  await addStrengths(studentId);
  await addMajors(studentId);
};

const addStrengths = async (studentId) => {
  for (const strength of strengths.value) {
    await studentServices.addStrength(studentId, strength);
  }
};

const addMajors = async (studentId) => {
  for (const major of majors.value) {
    await studentServices.addMajor(studentId, major);
  }
};

const updateMajorsAndStrengths = async (studentId) => {
  await updateMajors(studentId);
  await updateStrengths(studentId);
};

const updateMajors = async (studentId) => {
  // Adds new experience majors
  for (const major of majors.value) {
    const majorId = getId(major);
    if (!initialMajors.value.some((m) => getId(m) === majorId)) {
      await studentServices.addMajor(studentId, majorId);
    }
  }
  // Removes deselected experience majors
  for (const major of initialMajors.value) {
    const majorId = getId(major);
    if (!majors.value.some((m) => getId(m) === majorId)) {
      await studentServices.removeMajor(studentId, majorId);
    }
  }
};

const updateStrengths = async (studentId) => {
  // Adds new experience strengths
  for (const strength of strengths.value) {
    const strengthId = getId(strength);
    if (!initialStrengths.value.some((s) => getId(s) === strengthId)) {
      await studentServices.addStrength(studentId, strengthId);
    }
  }
  // Removes deselected experience strengths
  for (const strength of initialStrengths.value) {
    const strengthId = getId(strength);
    if (!strengths.value.some((s) => getId(s) === strengthId)) {
      await studentServices.removeStrength(studentId, strengthId);
    }
  }
};

const getId = (item) =>
  typeof item === "object" && item !== null ? item.id : item;

const handleSubmit = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid || !selectedDate.value) return;

  const date = new Date(selectedDate.value); // Ensure it's a valid Date object
  if (isNaN(date.getTime())) {
    console.error("Invalid date selected:", selectedDate.value);
    return;
  }

  // Update formData with ISO formatted values
  formData.value.graduationDate = date.toISOString();

  try {
    const submitData = { ...formData.value };

    if (props.isAdd) {
      const user = (await userServices.createUser(submitData)).data;

      if (isStudent.value) {
        submitData.student.userId = user.id;
        const student = (
          await studentServices.createStudent(submitData.student)
        ).data;
        await addMajorsAndStrengths(student.id);
      }
    } else {
      await userServices.updateUser(submitData);

      if (isStudent.value) {
        if (submitData.student.id) {
          await studentServices.updateStudent(submitData.student);
          await updateMajorsAndStrengths(submitData.student.id);
        } else {
          submitData.student.userId = route.params.id;
          const student = (await userServices.createUser(submitData.student))
            .data;
          await addMajorsAndStrengths(student.id);
        }
      }
    }
    router.back();
  } catch (error) {
    console.error("Error saving event:", error);
  }
};

onMounted(async () => {
  try {
    const [strengthsRes, majorsRes] = await Promise.all([
      strengthServices.getAllStrengths(),
      majorServices.getAllMajors(),
    ]);

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
      const user = (await userServices.getUserById(route.params.id)).data;
      const student = (
        await studentServices.getStudentForUserId(route.params.id)
      ).data;
      const studentStrengths = (
        await strengthServices.getStrengthsForStudent(student.id)
      ).data;
      const studentMajors = (
        await majorServices.getMajorsForStudent(student.id)
      ).data;

      formData.value = user;
      formData.value.student = student;
      selectedDate.value = new Date(student.graduationDate);

      strengths.value = studentStrengths.map((studentStrengths) => ({
        title: studentStrengths.name,
        value: studentStrengths.id,
        ...studentStrengths,
      }));
      initialStrengths.value = strengths.value;

      majors.value = studentMajors.map((studentMajors) => ({
        title: studentMajors.name,
        value: studentMajors.id,
        ...studentMajors,
      }));
      initialMajors.value = majors.value;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});
</script>

<template>
  <h1 class="text-center ma-5">
    {{ props.isAdd ? "Add User" : "Edit User" }}
  </h1>
  <v-form ref="form" @submit.prevent>
    <v-container
      class="bg-backgroundDarken rounded-t-xl"
      style="max-height: 90vh; overflow-y: auto"
    >
      <v-text-field
        v-model="formData.fullName"
        variant="solo"
        rounded="lg"
        label="Full Name"
        :rules="[required]"
      ></v-text-field>

      <v-row no-gutters>
        <v-col size="6" class="mr-4">
          <v-text-field
            v-model="formData.fName"
            variant="solo"
            rounded="lg"
            label="First Name"
            :rules="[required]"
          ></v-text-field>
        </v-col>
        <v-col size="6">
          <v-text-field
            v-model="formData.lName"
            variant="solo"
            rounded="lg"
            label="Last Name"
            :rules="[required]"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-text-field
        v-model="formData.email"
        variant="solo"
        rounded="lg"
        label="Email"
        disabled
      ></v-text-field>

      <v-textarea
        v-model="formData.profileDescription"
        variant="solo"
        rounded="lg"
        label="Profile Description"
      ></v-textarea>
      <v-row no-gutters>
        <v-col v-if="store.isAdmin" cols="1" class="mr-11">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-checkbox
                v-model="isStudent"
                label="Student"
                v-bind="props"
              ></v-checkbox>
            </template>
            <span>Functionality Not Implemented</span>
          </v-tooltip>
        </v-col>
        <v-col cols="5.3" class="mr-2">
          <DatePickerFieldForModal
            v-if="isStudent"
            v-model="selectedDate"
            :rules="[required]"
            label="Graduation Date"
          />
        </v-col>
        <v-col cols="5.3" class="mr-2">
          <v-select
            v-if="isStudent"
            :model-value="formData.student?.semestersFromGrad || ''"
            variant="solo"
            rounded="lg"
            label="Semester"
            item-value="value"
            :items="semesterTypes"
            item-title="name"
            :rules="[required]"
            @update:model-value="
              (val) => (formData.student.semestersFromGrad = val)
            "
          ></v-select>
        </v-col>
      </v-row>

      <div v-if="isStudent">
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
          :rules="[atLeast(strengths, requiredNumberOfStrengths)]"
        />

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
        />
      </div>

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
