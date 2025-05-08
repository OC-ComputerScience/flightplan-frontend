<script setup>
import { computed, ref } from "vue";
import { useSelectedStudentsStore } from "../../src/stores/selectedStudents";
import eventServices from "../services/eventServices";
import ConfirmDialog from "./dialogs/ConfirmDialog.vue";

const selectedStudentsStore = useSelectedStudentsStore();

const emit = defineEmits(["attendance-updated"]);

const props = defineProps({
  headers: {
    type: Array,
    required: true,
  },
  students: {
    type: Array,
    required: true,
  },
});

const confirmDelete = ref(false);
const confirmRecord = ref(false);

const closeDialogs = () => {
  confirmRecord.value = false;
  confirmDelete.value = false;
};

const confirmationDialog = (isDelete) => {
  if (isDelete) confirmDelete.value = true;
  else confirmRecord.value = true;
};

const menuVisible = ref(false);
const checkedIn = ref(false);
const notCheckedIn = ref(false);

const hasAttendedSelected = computed(() => {
  return props.students.some(
    (student) =>
      selectedStudentsStore.selectedStudentIds.includes(student.studentId) &&
      student.attendedStatus,
  );
});

const hasNotAttendedSelected = computed(() => {
  return props.students.some(
    (student) =>
      selectedStudentsStore.selectedStudentIds.includes(student.studentId) &&
      !student.attendedStatus,
  );
});

const selectAllAttending = () => {
  checkedIn.value = true;
  notCheckedIn.value = false;
  const ids = props.students
    .filter((s) => s.attendedStatus)
    .map((s) => s.studentId);
  selectedStudentsStore.clearSelection();
  ids.forEach((id) => selectedStudentsStore.addStudent(id));
  if (ids.length === 0) checkedIn.value = false;
};

const selectAllNonAttending = () => {
  notCheckedIn.value = true;
  checkedIn.value = false;
  const ids = props.students
    .filter((s) => !s.attendedStatus)
    .map((s) => s.studentId);
  selectedStudentsStore.clearSelection();
  ids.forEach((id) => selectedStudentsStore.addStudent(id));
  if (ids.length === 0) notCheckedIn.value = false;
};

const selectAll = () => {
  checkedIn.value = true;
  notCheckedIn.value = true;
  const ids = props.students.map((s) => s.studentId);
  selectedStudentsStore.clearSelection();
  ids.forEach((id) => selectedStudentsStore.addStudent(id));
};

const resetSelection = () => {
  selectedStudentsStore.clearSelection();
  checkedIn.value = false;
  notCheckedIn.value = false;
  console.log("Reset");
  console.log(selectedStudentsStore.selectedStudentIds);
};

const handleBatchDelete = async () => {
  const attending = props.students.filter(
    (s) =>
      s.attendedStatus &&
      selectedStudentsStore.selectedStudentIds.includes(s.studentId),
  );

  await Promise.all(
    attending.map((s) =>
      eventServices
        .markAttendance(s.eventId, [s.studentId])
        .catch((err) => console.error(`Error deleting ${s.studentId}:`, err)),
    ),
  );

  emit("attendance-updated");
  resetSelection();
  closeDialogs();
};

const handleBatchCheckIn = async () => {
  const nonAttending = props.students.filter(
    (s) =>
      !s.attendedStatus &&
      selectedStudentsStore.selectedStudentIds.includes(s.studentId),
  );

  await Promise.all(
    nonAttending.map((s) =>
      eventServices
        .markAttendance(s.eventId, [s.studentId])
        .catch((err) => console.error(`Error recording ${s.studentId}:`, err)),
    ),
  );

  emit("attendance-updated");
  resetSelection();
  closeDialogs();
};

const handleCheckboxToggle = () => {
  if (selectedStudentsStore.selectedStudentIds.length > 0) {
    resetSelection();
  } else if (checkedIn.value || notCheckedIn.value) {
    resetSelection();
  } else {
    selectAll();
  }
};
</script>

<template>
  <v-row class="pt-2">
    <div class="button-container">
      <v-card
        color="primary"
        class="combined-button d-flex align-center rounded-lg px-2 py-1 ml-3"
        @click.stop
      >
        <v-checkbox
          hide-details
          density="compact"
          class="ma-0 pa-0"
          :model-value="hasAttendedSelected || hasNotAttendedSelected"
          color="white"
          @click="handleCheckboxToggle"
        />

        <v-menu v-model="menuVisible" offset-y>
          <!-- eslint-disable-next-line -->
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              class="dropdown-btn ma-0 pa-0"
              variant="plain"
              style="
                min-width: 0;
                background-color: transparent;
                box-shadow: none;
              "
              @click.stop
            >
              <v-icon color="white">mdi-menu-down</v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item @click="selectAll">
              <v-list-item-title>All</v-list-item-title>
            </v-list-item>
            <v-list-item @click="selectAllNonAttending">
              <v-list-item-title>Not Checked in</v-list-item-title>
            </v-list-item>
            <v-list-item @click="selectAllAttending">
              <v-list-item-title>Checked in</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card>

      <v-btn
        v-if="hasNotAttendedSelected"
        color="success"
        class="rounded-lg"
        size="small"
        @click.stop="confirmationDialog(false)"
      >
        <v-icon icon="mdi-account-check" size="x-large" color="white" />
      </v-btn>

      <v-btn
        v-if="hasAttendedSelected"
        color="danger"
        class="rounded-lg"
        size="small"
        @click.stop="confirmationDialog(true)"
      >
        <v-icon icon="mdi-account-off" size="x-large" color="white" />
      </v-btn>

      <div
        v-if="selectedStudentsStore.selectedStudentIds.length > 0"
        class="selected-count align-center px-2 py-1"
      >
        Selected: {{ selectedStudentsStore.selectedStudentIds.length }}
      </div>
    </div>
  </v-row>

  <v-card color="backgroundDarken" class="headerCard" role="row">
    <v-container class="pa-0" fluid>
      <v-row>
        <v-col
          v-for="(header, index) in headers"
          :key="index"
          :cols="header.cols"
        >
          <v-card-text v-if="index !== 0" class="pa-0 text-center">
            <p class="text-h6 font-weight-bold">
              {{ header.name }}
            </p>
          </v-card-text>
        </v-col>
      </v-row>
    </v-container>
  </v-card>

  <ConfirmDialog
    v-model="confirmDelete"
    title="Are you sure you want to mark selected students as absent?"
    confirm-text="Delete"
    confirm-color="danger"
    @confirm="handleBatchDelete"
  />

  <ConfirmDialog
    v-model="confirmRecord"
    title="Are you sure you want to mark selected students as present?"
    confirm-text="Record"
    confirm-color="success"
    @confirm="handleBatchCheckIn"
  />
</template>

<style scoped>
.headerCard {
  border-radius: 20px;
  height: 35px;
  margin: 5px 0;
  background-color: #333;
  color: #fff;
}
.button-container {
  display: flex;
  margin-bottom: -47px;
  gap: 4%;
}
.combined-button {
  height: 30px;
  min-width: 50px;
}
.combined-button .v-checkbox {
  width: 24px;
  flex-shrink: 0;
}

.selected-count {
  white-space: nowrap;
}
</style>
