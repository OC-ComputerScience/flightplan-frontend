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
import { createNotification } from "../../utils/notificationHandler";
import { userStore } from "../../stores/userStore";
import eventServices from "../../services/eventServices";
import studentServices from "../../services/studentServices";

const emit = defineEmits(["submit"]);
const dialogStore = studentApprovalDialogStore();
const { visible, flightPlanItem } = storeToRefs(dialogStore);

const optionalReviewers = ref([{ label: "None", value: null }]);
const selectedOptionalReviewer = ref();
const selfApprovedCheck = ref(false);
const reflectionText = ref("");
const files = ref([]);
const successMessage = ref(""); // Track success message
const errorMessage = ref("");

const submissionId = ref(null);
const cannotSubmitText = ref("")

const avaliableToSubmit = ref(false);

watch(
  () => flightPlanItem.value,
  async (item) => {
    avaliableToSubmit.value = false;

    if (
      item.task ||
      (!item.experience.submissionType === "Attendance - Reflection" &&
        !item.experience.submissionType === "Attendance - Auto Approve")
    ) {
      avaliableToSubmit.value = true;
      return;
    }

    let eventId = item.eventId;
    if (eventId) {
      try {
        const event = await eventServices.getEvent(eventId);
        if (event.data.status === 'Past') {
          avaliableToSubmit.value = true;
        } else {
          cannotSubmitText.value = `Cannot complete ${flightPlanItem.value.name}. Please check back after the event, ${event.data.name}, has ended to complete this item.`;
          avaliableToSubmit.value = false;
        }
      } catch {
        cannotSubmitText.value = "Cannot find the event for this experience. Please contact Career Services for assistance.";
        avaliableToSubmit.value = false;
      }
    } else {
      cannotSubmitText.value = "You have not registered for an event for this experience. Please click the register button to find an upcoming event."
      avaliableToSubmit.value = false;
    }
  },
  { immediate: true }
);

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
    return (
      flightPlanItem.value.experience.instructionsLink &&
      flightPlanItem.value.experience.instructionsLinkDescription
    );
  }
});

const hasInstructionsDescription = computed(() => {
  if (flightPlanItem.value.task) {
    return flightPlanItem.value.task.instructionsLinkDescription;
  } else {
    return flightPlanItem.value.experience.instructionsLinkDescription;
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
    switch (submissionType.value) {
      case "Reflection - Review":
      case "Reflection - Auto Approve":
        if (noText) {
          errorMessage.value = "Please write a reflection";
          return;
        }
        console.log(reflectionText.length);
        if (reflectionText.value.length < 400) {
          errorMessage.value =
            "Your reflection must be at least 400 characters";
          return;
        }

        if (automaticSubmission) {
          successMessage.value = "Submission successful!";
          await handleAutoApproval();
        }
        await submitReflection(automaticSubmission);
        break;

      case "Upload Document - Review":
      case "Upload Document - Auto Approve":
        if (noFiles) {
          errorMessage.value = "Please upload a file";
          return;
        }
        if (automaticSubmission) {
          successMessage.value = "Submission successful!";
          await handleAutoApproval();
        }
        await submitFiles(automaticSubmission);

        break;

      case "Upload Document & Reflection - Review":
      case "Upload Document & Reflection - Auto Approve": {
        if (noText) {
          errorMessage.value = "Please write a reflection";
          return;
        }

        if (reflectionText.value.length < 400) {
          errorMessage.value =
            "Your reflection must be at least 400 characters";
          return;
        }

        if (noFiles) {
          errorMessage.value = "Please upload a file";
          return;
        }

        if (automaticSubmission) {
          successMessage.value = "Submission successful!";
          await handleAutoApproval();
        }

        await submitFiles(automaticSubmission);
        await submitReflection(automaticSubmission);
        break;
      }

      case "Attendance - Reflection":
        /*
         * TODO:
         * Check the following:
         * 1. If event date has passed
         *   If yes, continue
         *   If no, then display "Please check back after the event has ended to complete this item"
         * 2. If attendance has been posted
         *   If yes, then allow to submit if student has attendance marked (if not, then display "Your attendance for this event was not recorded. Please Contact <a href="mailto:careerservices@oc.edu">Career Services</a>")
         *   If no, then allow the student to submit and set item status to "Pending Registration""
         * 3. Continue
         */
        if (noText) {
          errorMessage.value = "Please write a reflection";
          return;
        }
        await submitAttendanceReflection();
        await handleAutoApproval();

        break;

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
          if (!selfApprovedCheck.value) {
            errorMessage.value =
              "You must certify that you have completed this item.";
            return;
          }
          let responseMessage = await automaticSubmissionHandler(
            submissionType.value,
          );

          if (responseMessage) {
            errorMessage.value = responseMessage;
          } else {
            successMessage.value = "Submission successful!";

            const submissionData = {
              flightPlanItemId: flightPlanItem.value.id,
              submissionType: "automatic",
              value: `This was an automatic approval submission for ${flightPlanItem.value.name} flight plan item`,
              isAutomatic: true,
            };

            await submissionServices.createSubmission(submissionData);
            handleAutoApproval();
            debounceSubmit();
            break;
          }
          break;
        }

        if (!automaticSubmission) {
          submissionId.value = (
            await submissionServices.createSubmissions(submissions)
          ).data[0].id;
          successMessage.value = "Submission successful!";
          debounceSubmit();
        }
        break;
    }
    if (!automaticSubmission) {
      generateNotification();
      successMessage.value = "Submission successful!";
      debounceSubmit();
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

const submitFiles = async (autoSubmission = false) => {
  const submissionData = {
    flightPlanItemId: flightPlanItem.value.id,
    submissionType: "file",
  };
  let result = await Promise.all(
    files.value.map(async (file) => {
      const { data } = await fileServices.uploadFile({ file }, "submissions");
      return submissionServices.createSubmission({
        ...submissionData,
        value: data.fileName,
        isAutomatic: autoSubmission,
      });
    }),
  );

  submissionId.value = result[0].data.id;
};

const submitReflection = async (autoSubmission = false) => {
  const submissionData = {
    flightPlanItemId: flightPlanItem.value.id,
    submissionType: "text",
  };

  submissionId.value = (
    await submissionServices.createSubmission({
      ...submissionData,
      value: reflectionText.value,
      isAutomatic: autoSubmission,
    })
  ).data.id;
};

const submitAttendanceReflection = async () => {
  const submissionData = {
    flightPlanItemId: flightPlanItem.value.id,
    submissionType: "text",
  };

  submissionId.value = (
    await submissionServices.createSubmission({
      ...submissionData,
      value: reflectionText.value,
      isAutomatic: true,
    })
  ).data.id;
};

const generateNotification = async () => {
  let response = await userServices.getAllAdmins();
  let admins = response.data;
  let store = userStore();
  let userId = store.user?.userId;
  let baseUrl = window.location.origin;
  let submissionUrl = `${baseUrl}/admin/approvals?id=${submissionId.value}`;
  let header = `New Flight Plan Item Submission - ${String(store.user?.fullName)}`;
  let body = `A new submission has been made for the flight plan item ${String(flightPlanItem.value.name)}. View it by clicking <a href="${submissionUrl}">here</a>.`;

  if (selectedOptionalReviewer.value == null) {
    admins.forEach((admin) => {
      createNotification(
        header,
        body,
        false,
        admin.id,
        userId,
        true,
        admin.email,
      );
    });
  } else {
    let reviewer = await userServices.getUserById(
      selectedOptionalReviewer.value,
    );
    let reviewerEmail = reviewer.data.email;
    createNotification(
      header,
      body,
      false,
      selectedOptionalReviewer.value,
      userId,
      true,
      reviewerEmail,
    );
  }
};

const handleAutoApproval = async () => {
  flightPlanItemServices
    .approveFlightPlanItem(flightPlanItem.value.id)
    .then(() => {
      successMessage.value = "Flight plan item submission approved";
      debounceSubmit();
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
    selfApprovedCheck.value = false;
  }
});

onMounted(() => {
  fetchOptionalReviewers();
});
</script>

<template>
  <v-dialog
    v-model="visible"
    style="width: 50%"
    transition="dialog-bottom-transition"
  >
    <v-card rounded="xl" color="backgroundDarken">
      <v-card-title class="text-h5 d-flex justify-center align-center">
        <span
          class="flex-grow-1 text-center"
          style="
            overflow-wrap: break-word;
            white-space: normal;
            word-break: break-word;
          "
        >
          Complete {{ flightPlanItem.name }}
        </span>
        <v-icon
          class="cursor-pointer"
          size="extra-small"
          @click="visible = false"
          >mdi-close</v-icon
        >
      </v-card-title>
      <v-card-text v-if="avaliableToSubmit">
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
            <div
              v-if="hasInstructionsLink && hasInstructionsDescription"
              class="mb-4"
            >
              <p class="text-body-1">
                <a
                  :href="hasInstructionsLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary"
                  >{{ hasInstructionsDescription }}</a
                >
              </p>
            </div>
            <v-textarea
              v-if="
                submissionType === 'Reflection - Review' ||
                submissionType === 'Reflection - Auto Approve' ||
                submissionType === 'Attendance - Reflection'
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
              v-if="
                !submissionType.includes('Auto') &&
                !submissionType.includes('Self-Approved')
              "
              class="d-flex justify-center mt-4"
            >
              <p class="mr-2 mt-1">(Optional) Request Specific Reviewer</p>
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

            <div
              v-if="
                submissionType.includes('Self-Approved') ||
                submissionType.includes('Auto')
              "
              class="d-flex align-center justify-center mt-4"
            >
              <v-checkbox
                v-model="selfApprovedCheck"
                class="ma-0 pa-0"
                hide-details
                density="compact"
              />
              <span class="ml-2"
                >I certify that I have completed this item</span
              >
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
      <v-card-text v-else>
        <v-alert type="warning" variant="tonal">
          {{ cannotSubmitText }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
