<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { studentApprovalDialogStore } from "../../stores/studentApprovalDialogStore";
import userServices from "../../services/userServices";
import submissionServices from "../../services/submissionServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import fileServices from "../../services/fileServices";
import { required, characterLimit } from "../../utils/formValidators";
import { automaticSubmissionHandler } from "../../utils/flightPlanItemSubmissionHelper";

const emit = defineEmits(["submit"]);
const dialogStore = studentApprovalDialogStore();
const { visible, flightPlanItem } = storeToRefs(dialogStore);

const optionalReviewers = ref([{ label: "None", value: null }]);
const selectedOptionalReviewer = ref();
const reflectionText = ref("");
const files = ref([]);
const successMessage = ref(""); // Track success message
const errorMessage = ref("");

const submissionType = computed(() => {
  if (flightPlanItem.value.task) {
    return flightPlanItem.value.task.submissionType;
  } else {
    return flightPlanItem.value.experience.submissionType;
  }
});

const hasInstructions = computed(() => {
  if (flightPlanItem.value.task) {
    return flightPlanItem.value.task.instructions;
  } else {
    return flightPlanItem.value.experience.instructions;
  }
});

const hasInstructionsLink = computed(() => {
  if (flightPlanItem.value.task) {
    return flightPlanItem.value.task.instructionsLink;
  } else {
    return flightPlanItem.value.experience.instructionsLink;
  }
});

const fetchOptionalReviewers = async () => {
  try {
    const { data } = await userServices.getAllAdmins();
    optionalReviewers.value = [
      { label: "None", value: null },
      ...data.map((user) => ({
        label: user.fullName,
        value: user.id,
      })),
    ];
  } catch (error) {
    console.error("Error fetching reviewers:", error);
  }
};

const handleCancel = () => {
  files.value = null;
  reflectionText.value = "";
  dialogStore.toggleVisibility();
};

const handleSubmit = async () => {
  // Validate input
  const noFiles = !files.value || files.value.length === 0;
  const noText =
    !reflectionText.value || reflectionText.value.trim().length === 0;

  const manualSubmission = submissionType.value === "Manual Review";
  const automaticSubmission =
    submissionType.value.includes("Auto") ||
    submissionType.value.includes("Self-Approved");

  if (noFiles && noText && !manualSubmission && !automaticSubmission) {
    errorMessage.value = "Please upload a file or write a reflection";
    return;
  }

  try {
    console.log(submissionType.value);
    switch (submissionType.value) {
      case "Reflection - Review":
      case "Reflection - Auto Approve":
        if (noText) {
          errorMessage.value = "Please write a reflection";
          return;
        }
        if (automaticSubmission) {
          successMessage.value = "Submission successful!";
          handleAutoApproval();
          debounceSubmit();
        } else {
          await submitFiles();
        }
        break;

      case "Upload Document - Review":
      case "Upload Document - Auto Approve":
        if (noFiles) {
          errorMessage.value = "Please upload a file";
          return;
        }

        if (automaticSubmission) {
          successMessage.value = "Submission successful!";
          handleAutoApproval();
          debounceSubmit();
        } else {
          await submitFiles();
        }
        break;

      case "Upload Document & Reflection - Review":
      case "Upload Document & Reflection - Auto Approve": {
        console.log("Handling mixed submission type");

        if (noText) {
          errorMessage.value = "Please write a reflection";
          return;
        }

        if (noFiles) {
          errorMessage.value = "Please upload a file";
          return;
        }

        if (automaticSubmission) {
          successMessage.value = "Submission successful!";
          handleAutoApproval();
          debounceSubmit();
        } else {
          await submitFiles();
        }
        break;
      }

      default:
        // Mixed or other types
        /* eslint-disable no-case-declarations*/
        const submissions = [];
        if (!noFiles) {
          const fileNames = await Promise.all(
            files.value.map(async (file) => {
              const { data } = await fileServices.uploadFile(
                { file },
                "submissions",
              );
              return data.fileName;
            }),
          );

          fileNames.forEach((fileName) => {
            submissions.push({
              flightPlanItemId: flightPlanItem.value.id,
              submissionType: "file",
              value: fileName,
            });
          });
        }

        if (!noText) {
          submissions.push({
            flightPlanItemId: flightPlanItem.value.id,
            submissionType: "text",
            value: reflectionText.value,
          });
        }

        if (manualSubmission) {
          submissions.push({
            flightPlanItemId: flightPlanItem.value.id,
            submissionType: "manual",
            value: null,
          });
        }

        if (automaticSubmission) {
          let responseMessage = await automaticSubmissionHandler(
            submissionType.value,
          );

          if (responseMessage) {
            errorMessage.value = responseMessage;
          } else {
            successMessage.value = "Submission successful!";
            handleAutoApproval();
            debounceSubmit();
            break;
          }
        }

        if (!automaticSubmission) {
          await submissionServices.createSubmissions(submissions);
          successMessage.value = "Submission successful!";
          debounceSubmit();
        }
        break;
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || "An unexpected error occurred.";
  }
};

const debounceSubmit = () => {
  setTimeout(() => {
    successMessage.value = "";
    files.value = null;
    reflectionText.value = "";
    visible.value = false;
    emit("submit");
  }, 2000);
};

const submitFiles = async () => {
  const submissionData = {
    flightPlanItemId: flightPlanItem.value.id,
    submissionType: "file",
  };
  await Promise.all(
    files.value.map(async (file) => {
      const { data } = await fileServices.uploadFile({ file }, "submissions");
      return submissionServices.createSubmission({
        ...submissionData,
        value: data.fileName,
      });
    }),
  );
};

const submitReflection = async () => {
  const submissionData = {
    flightPlanItemId: flightPlanItem.value.id,
    submissionType: "text",
  };

  await submissionServices.createSubmission({
    ...submissionData,
    value: reflectionText.value,
  });
};

const handleAutoApproval = async () => {
  flightPlanItemServices
    .approveFlightPlanItem(flightPlanItem.value.id)
    .then(() => {
      successMessage.value = "Flight plan item submission approved";
    })
    .catch((error) => {
      errorMessage.value =
        error.response?.data?.message || "Failed to approve flight plan item.";
    });
};

watch(visible, () => {
  if (!visible.value) {
    files.value = null;
    reflectionText.value = "";
    selectedOptionalReviewer.value = null;
    successMessage.value = "";
    errorMessage.value = "";
  }
});

onMounted(fetchOptionalReviewers);
</script>

<template>
  <v-dialog v-model="visible" transition="dialog-bottom-transition">
    <v-card rounded="xl" color="backgroundDarken">
      <v-card-title class="text-h4 d-flex justify-center align-center">
        <span class="flex-grow-1 text-center">
          Complete {{ flightPlanItem.name }}
        </span>
        <v-icon
          class="cursor-pointer"
          size="extra-small"
          @click="visible = false"
          >mdi-close</v-icon
        >
      </v-card-title>
      <v-card-text>
        <v-fade-transition mode="out-in">
          <div v-if="successMessage">
            <v-alert type="success" variant="tonal" closable>{{
              successMessage
            }}</v-alert>
          </div>
          <div v-else>
            <div v-if="hasInstructions" class="mb-4">
              <strong>Instructions: </strong>
              <p class="text-body-1">{{ hasInstructions }}</p>
            </div>
            <div v-if="hasInstructionsLink" class="mb-4">
              <p class="text-body-1">
                <a
                  :href="hasInstructionsLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary"
                  >View More Instructions</a
                >
              </p>
            </div>
            <v-textarea
              v-if="
                submissionType === 'Reflection - Review' ||
                submissionType === 'Reflection - Auto Approve'
              "
              v-model="reflectionText"
              label="Reflection"
              variant="solo"
              rounded="xl"
              bg-color="background"
              counter
              :rules="[required, characterLimit(reflectionText, 400)]"
            ></v-textarea>
            <v-file-upload
              v-else-if="
                submissionType === 'Upload Document - Review' ||
                submissionType === 'Upload Document - Auto Approve'
              "
              v-model="files"
              label="Upload Files"
              multiple
              rounded="xl"
              color="background"
            ></v-file-upload>
            <div
              v-else-if="
                submissionType === 'Upload Document & Reflection - Review' ||
                submissionType === 'Upload Document & Reflection - Auto Approve'
              "
            >
              <v-expansion-panels class="mb-4 rounded-lg" color="background">
                <v-expansion-panel class="mb-2">
                  <v-expansion-panel-title>Reflection</v-expansion-panel-title>
                  <v-expansion-panel-text class="bg-backgroundDarken">
                    <v-textarea
                      v-model="reflectionText"
                      label="Reflection"
                      variant="solo"
                      rounded="xl"
                      bg-color="background"
                      counter
                      :rules="[required, characterLimit(reflectionText, 400)]"
                    ></v-textarea>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
              <v-expansion-panels class="mb-4 rounded-lg" color="background">
                <v-expansion-panel class="mb-2">
                  <v-expansion-panel-title>File Upload</v-expansion-panel-title>
                  <v-expansion-panel-text class="bg-backgroundDarken">
                    <v-file-upload
                      v-model="files"
                      label="Upload Files"
                      multiple
                      rounded="xl"
                      color="background"
                    ></v-file-upload>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>

            <div
              v-if="!submissionType.includes('Auto')"
              class="d-flex justify-center mt-4"
            >
              <p class="mr-2 mt-1">(Optional) Request Reviewer</p>
              <div class="w-25">
                <v-select
                  v-model="selectedOptionalReviewer"
                  density="compact"
                  variant="solo"
                  rounded="lg"
                  bg-color="background"
                  :items="optionalReviewers"
                  item-title="label"
                  item-value="value"
                ></v-select>
              </div>
            </div>
            <div v-if="errorMessage">
              <v-alert type="danger" variant="tonal" closable>{{
                errorMessage
              }}</v-alert>
            </div>

            <div class="d-flex justify-center mt-4">
              <v-btn
                variant="outlined"
                rounded="xl"
                class="mr-5"
                @click="handleCancel"
                >Cancel</v-btn
              >
              <v-btn rounded="xl" color="primary" @click="handleSubmit"
                >Submit</v-btn
              >
            </div>
          </div>
        </v-fade-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
