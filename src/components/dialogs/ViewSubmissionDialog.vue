<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { studentViewSubmissionDialogStore } from "../../stores/studentViewSubmissionDialogStore";
import submissionServices from "../../services/submissionServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import { VueFilesPreview } from "vue-files-preview";

const emit = defineEmits(["discard"]);
const dialogStore = studentViewSubmissionDialogStore();
const { visible, flightPlanItem } = storeToRefs(dialogStore);

const submissions = ref([]);
const successMessage = ref("");
const selectedSubmissionIndex = ref(0);
const selectedFile = ref(null);
const selectedSubmissionType = ref("text");

const getSubmissionsForFlightPlanItem = async () => {
  try {
    const response = await submissionServices.getSubmissionsForFlightPlanItem(
      flightPlanItem.value.id,
    );
    submissions.value = response.data.submissions;
    selectedSubmissionIndex.value = submissions.value.length-1
  } catch (error) {
    console.error("Error fetching submissions:", error);
  }
};

const handleDiscardSubmission = async () => {
  try {
    await submissionServices.discardSubmissionForFlightPlanItem(
      flightPlanItem.value.id,
    );
    await flightPlanItemServices.updateFlightPlanItem({
      ...flightPlanItem.value,
      status: "Incomplete",
    });

    successMessage.value = "Submission discarded successfully";

    setTimeout(() => {
      successMessage.value = "";
      visible.value = false;
      emit("discard");
    }, 2000);
  } catch (error) {
    console.error("Error discarding submission:", error);
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

watch(selectedSubmissionIndex, () => {
  getSubmission();
});

watch(visible, async () => {
  if (visible.value) {
    await getSubmissionsForFlightPlanItem();
    getSubmission();
  }
});
</script>

<template>
  <v-dialog v-model="visible" transition="dialog-bottom-transition">
    <v-card rounded="xl" color="backgroundDarken">
      <v-card-title class="d-flex justify-space-between align-center ma-2">
        <span>Submissions for {{ flightPlanItem.name }}</span>
        <v-icon class="cursor-pointer" @click="visible = false"
          >mdi-close</v-icon
        >
      </v-card-title>
      <v-card-text>
        <v-fade-transition mode="out-in">
          <div v-if="successMessage">
            <v-alert type="success" variant="tonal">{{
              successMessage
            }}</v-alert>
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
                v-if="selectedSubmissionType === 'text'"
                :cols="12"
                class="pa-4 bg-background rounded-lg"
                style="white-space: pre-wrap"
              >
                {{ submissions[selectedSubmissionIndex].value }}
              </v-col>
              <v-col :cols="12" class="d-flex justify-center align-center">
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

            <div class="d-flex justify-center mt-4">
              <v-btn
                color="danger"
                variant="outlined"
                class="mt-3"
                @click="handleDiscardSubmission"
              >
                Discard Submission
              </v-btn>
            </div>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
