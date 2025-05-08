<script setup>
import { computed, ref } from "vue";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import eventServices from "../services/eventServices";
import { useSelectedStudentsStore } from "../../src/stores/selectedStudents";
import ConfirmDialog from "./dialogs/ConfirmDialog.vue";

dayjs.extend(advancedFormat);

const selectedStudentsStore = useSelectedStudentsStore();

const isHovered = ref(false);
const confirmDelete = ref(false);
const confirmRecord = ref(false);

const props = defineProps({
  student: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update-student"]);

const toggleSelected = () => {
  selectedStudentsStore.toggleStudent(props.student.studentId);
};

const recordedTime = computed(() => {
  if (!props.student.recordedTime) return null;
  return dayjs(props.student.recordedTime).format("h:mm a [on] MM/DD/YYYY");
});

const confirmationDialog = (isDelete) => {
  if (isDelete) confirmDelete.value = true;
  else confirmRecord.value = true;
};

const handleCardCrud = () => {
  const newAttendedStatus = !props.student.attendedStatus;

  console.log(props.student.eventId);

  eventServices
    .markAttendance(props.student.eventId, [props.student.studentId])
    .then(() => {
      const updatedStudent = {
        ...props.student,
        attendedStatus: newAttendedStatus,
        recordedTime: newAttendedStatus ? dayjs().toISOString() : null,
      };

      emit("update-student", updatedStudent);
    })
    .catch((err) => {
      console.error("Error marking attendance:", err);
    });

  closeDialogs();
};

const closeDialogs = () => {
  confirmRecord.value = false;
  confirmDelete.value = false;
};
</script>

<template>
  <v-card
    :class="{
      hovered: isHovered,
      attended: props.student.attendedStatus,
      selected: isSelected,
    }"
    :ripple="false"
    :color="
      selectedStudentsStore.selectedStudentIds.includes(props.student.studentId)
        ? 'secondary'
        : 'backgroundDarken'
    "
    class="roundedCard"
    role="row"
    :aria-label="`Attendance card for ${props.student.fName ?? 'Unknown'} with ID ${props.student.studentId ?? 'N/A'}`"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="toggleSelected"
  >
    <v-container class="row-container" fluid>
      <v-row class="align-center pl-1">
        <v-col :cols="1">
          <v-sheet
            :color="props.student.attendedStatus ? 'success' : 'info'"
            class="accentChip"
          ></v-sheet>
        </v-col>

        <v-col :cols="2">
          <v-card-text class="pa-0">
            <p class="text-h6 font-weight-bold">
              {{ props.student.studentId ?? "N/A" }}
            </p>
          </v-card-text>
        </v-col>

        <v-col :cols="2">
          <v-card-text class="pa-0">
            <p class="text-h6 font-weight-bold">
              {{
                props.student.lName + ", " + props.student.fName ?? "Unknown"
              }}
            </p>
          </v-card-text>
        </v-col>

        <v-col :cols="2">
          <v-card-text class="pa-0">
            <p class="text-h6 font-weight-bold">
              {{ props.student.attendedStatus ? "Checked in" : "Registered" }}
            </p>
          </v-card-text>
        </v-col>

        <v-col :cols="3">
          <v-card-text class="pa-0">
            <p class="text-h6 font-weight-bold">
              {{ recordedTime }}
            </p>
          </v-card-text>
        </v-col>

        <v-col v-if="isHovered" :cols="2">
          <v-card-text v-if="!props.student.attendedStatus" class="pa-0">
            <v-btn
              color="success"
              class="rounded-lg"
              size="small"
              @click.stop="confirmationDialog(false)"
            >
              <v-icon icon="mdi-account-check" size="x-large" color="white" />
            </v-btn>
          </v-card-text>

          <v-card-text v-if="props.student.attendedStatus" class="pa-0">
            <v-btn
              color="danger"
              class="rounded-lg"
              size="small"
              @click.stop="confirmationDialog(true)"
            >
              <v-icon icon="mdi-account-off" size="x-large" color="white" />
            </v-btn>
          </v-card-text>
        </v-col>
      </v-row>
    </v-container>
  </v-card>

  <ConfirmDialog
    v-model="confirmDelete"
    title="Are you sure you want to mark student as absent?"
    confirm-text="Delete"
    confirm-color="danger"
    @confirm="handleCardCrud"
  />

  <ConfirmDialog
    v-model="confirmRecord"
    title="Are you sure you want to mark student as present?"
    confirm-text="Record"
    confirm-color="success"
    @confirm="handleCardCrud"
  />
</template>

<style scoped>
.roundedCard {
  border-radius: 20px;
}

.row-container {
  text-align: center;
}
.accentChip {
  width: 15px;
  height: 25px;
  border-radius: 25px 0 0 25px;
}
</style>
