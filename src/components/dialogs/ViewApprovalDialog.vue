<script setup>
import { ref, watch } from "vue";
import { adminApprovalDialogStore } from "../../stores/adminApprovalDialogStore";
import { storeToRefs } from "pinia";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import studentServices from "../../services/studentServices";
import submissionServices from "../../services/submissionServices";
import { VueFilesPreview } from "vue-files-preview";
import { createNotification } from "../../utils/notificationHandler";
const emit = defineEmits(["reject", "approve"]);

const dialogStore = adminApprovalDialogStore();
const { visible, flightPlanItem } = storeToRefs(dialogStore);

const student = ref(null);
const showReject = ref(false);
const rejectMessage = ref("");
const rejectReason = ref("");
const approveMessage = ref("");
const errorMessage = ref("");
const submissions = ref([]);
const selectedSubmissionIndex = ref(0);
const selectedSubmissionType = ref("text");
const selectedFile = ref(null);
const approveDisabled = ref(false);

const getStudentForFlightPlanId = async () => {
  const student = await studentServices.getStudentForFlightPlanId(
    flightPlanItem.value.flightPlanId,
  );
  return student.data;
};

const getSubmissionsForFlightPlanItem = async () => {
  try {
    const response = await submissionServices.getSubmissionsForFlightPlanItem(
      flightPlanItem.value.id,
    );
    submissions.value = response.data.submissions;
  } catch (error) {
    console.error("Error fetching submissions:", error);
  }
};

const handleReject = async () => {
  try {
    const student = await getStudentForFlightPlanId();

    await flightPlanItemServices.rejectFlightPlanItem(flightPlanItem.value.id);

    if (student?.user?.id) {
      await createNotification({
        header: "Flight plan item rejected",
        description: rejectReason.value ?? "No reason provided",
        read: false,
        userId: student.user.id,
        sentBy: 1, // Sent by the system
      });
    }
    rejectMessage.value = "Flight plan item rejected";
    setTimeout(() => {
      rejectMessage.value = "";
      visible.value = false;
      emit("reject");
    }, 2000);
  } catch (error) {
    console.error("Error rejecting flight plan item:", error);
  }
};

const handleApprove = async () => {
  try {
    approveDisabled.value = true;
    await flightPlanItemServices.approveFlightPlanItem(flightPlanItem.value.id);

    approveMessage.value = "Flight plan item approved";
    setTimeout(() => {
      approveMessage.value = "";
      visible.value = false;
      approveDisabled.value = false;
      emit("approve");
    }, 2000);
  } catch (error) {
    console.error("Error approving flight plan item:", error);
    errorMessage.value = "Error approving flight plan item";
    setTimeout(() => {
      errorMessage.value = "";
    }, 2000);
  }
};

const getSubmission = () => {
  const selectedSubmission = submissions.value[selectedSubmissionIndex.value];
  if (selectedSubmission.submissionType === "text") {
    selectedSubmissionType.value = "text";
  } else if (selectedSubmission.submissionType === "file") {
    selectedSubmissionType.value = "file";
    getFile();
  }
};

const getFile = () => {
  try {
    const { fileName, value } =
      submissions.value[selectedSubmissionIndex.value];
    const file = new File([new Uint8Array(value.data.data)], fileName, {
      type: value.mimeType,
    });

    selectedFile.value = file;
  } catch (error) {
    console.error("Error getting file:", error);
  }
};

watch(visible, async (newValue) => {
  if (!newValue) {
    showReject.value = false;
    student.value = null;
  } else {
    student.value = await getStudentForFlightPlanId();
    await getSubmissionsForFlightPlanItem();
    getSubmission();
  }
});

watch(selectedSubmissionIndex, () => {
  getSubmission();
});
</script>
<template>
  <v-dialog v-model="visible" transition="dialog-bottom-transition">
    <v-card v-if="!showReject" color="backgroundDarken rounded-lg">
      <v-card-title class="d-flex flex-column align-center position-relative">
        <div class="text-center">
          Student:
          {{
            student?.user ? student.user.fName + " " + student.user.lName : ""
          }}
        </div>
        <div class="text-center mb-2">
          Submission: {{ flightPlanItem.name }}
        </div>

        <v-icon
          class="cursor-pointer position-absolute"
          style="top: 8px; right: 8px"
          @click="visible = false"
        >
          mdi-close
        </v-icon>
      </v-card-title>
      <v-card-text height="100%">
        <v-fade-transition mode="out-in">
          <div v-if="approveMessage">
            <v-alert type="success" variant="tonal" closable>{{
              approveMessage
            }}</v-alert>
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              closable
              >{{ errorMessage }}</v-alert
            >
          </div>
          <div v-else>
            <v-row
              v-if="submissions.length > 0"
              class="bg-background rounded-lg mb-1"
            >
              <v-col
                v-if="selectedSubmissionType === 'file'"
                :cols="12"
                class="d-flex justify-center align-center"
              >
                <VueFilesPreview
                  :file="selectedFile"
                  style="max-height: 60vh"
                ></VueFilesPreview>
              </v-col>
              <v-col
                v-if="selectedSubmissionType === 'text' && !selectedSubmissionType === 'manual'"
                :cols="12"
                class="pa-4 bg-background rounded-lg"
                style="white-space: pre-wrap"
              >
                {{ submissions[selectedSubmissionIndex].value }}
              </v-col>
              <v-col v-if="!selectedSubmissionType === 'manual'":cols="12" class="d-flex justify-center align-center">
                <v-btn
                  class="rounded-xl mr-6"
                  color="text"
                  variant="outlined"
                  :disabled="selectedSubmissionIndex === 0"
                  @click="selectedSubmissionIndex--"
                  >Prev</v-btn
                >
                <p class="mr-6">
                  {{ selectedSubmissionIndex + 1 }} /
                  {{ submissions.length }}
                </p>
                <v-btn
                  class="rounded-xl"
                  color="text"
                  variant="outlined"
                  :disabled="selectedSubmissionIndex === submissions.length - 1"
                  @click="selectedSubmissionIndex++"
                  >Next</v-btn
                >
              </v-col>
            </v-row>
            <v-alert v-else type="error" class="text-center"
              >No submission found!</v-alert
            >
            <v-row class="bg-background rounded-lg mb-1">
              <v-col cols="12">
                <p class="text-body-1">Description</p>
              </v-col>
              <v-col cols="12">
                <p class="text-body-2 ml-3">
                  {{ flightPlanItem?.task?.description || "No description" }}
                </p>
              </v-col>
            </v-row>
            <v-row class="d-flex justify-center">
              <v-btn
                class="rounded-xl mr-3"
                color="primary"
                :disabled="approveDisabled"
                @click="handleApprove"
                >Approve</v-btn
              >
              <v-btn
                class="rounded-xl"
                variant="outlined"
                color="danger"
                @click="showReject = true"
                >Reject</v-btn
              >
            </v-row>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
    <v-card v-if="showReject" color="backgroundDarken rounded-lg">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="flex-grow-1 text-center"
          >Reject: {{ flightPlanItem.name }}</span
        >
        <v-icon class="cursor-pointer" @click="visible = false"
          >mdi-close</v-icon
        >
      </v-card-title>
      <v-card-text>
        <v-fade-transition mode="out-in">
          <div v-if="rejectMessage">
            <v-alert type="success" variant="tonal" closable>{{
              rejectMessage
            }}</v-alert>
          </div>
          <div v-else>
            <v-row
              ><v-textarea
                v-model="rejectReason"
                label="Reject Reason (optional)"
                bg-color="background"
                variant="solo-filled"
                rounded="lg"
                class="mb-3"
            /></v-row>

            <v-row class="d-flex justify-center">
              <v-btn
                class="rounded-xl mr-3"
                variant="outlined"
                @click="showReject = false"
                >Cancel</v-btn
              >
              <v-btn class="rounded-xl" color="danger" @click="handleReject"
                >Reject</v-btn
              >
            </v-row>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
