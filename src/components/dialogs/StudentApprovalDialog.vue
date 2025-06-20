<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { studentApprovalDialogStore } from "../../stores/studentApprovalDialogStore";
import userServices from "../../services/userServices";
import submissionServices from "../../services/submissionServices";
import fileServices from "../../services/fileServices";

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
  console.log(flightPlanItem.value);

  if (flightPlanItem.value.task) {
    return flightPlanItem.value.task.submissionType;
  } else {
    return flightPlanItem.value.experience.submissionType;
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
  const manualSubmission = submissionType.value === "manual";

  if (noFiles && noText && submissionType.value !== "manual") {
    errorMessage.value = "Please upload a file or write a reflection";
    return;
  }

  try {
    switch (submissionType.value) {
      case "text":
        if (noText) {
          errorMessage.value = "Please write a reflection";
          return;
        }
        await submitReflection();
        break;

      case "file":
        if (noFiles) {
          errorMessage.value = "Please upload a file";
          return;
        }
        await submitFiles();
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

        await submissionServices.createSubmissions(submissions);
        break;
    }

    successMessage.value = "Submission successful!";
    debounceSubmit();
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
          {{ flightPlanItem.name }}
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
            <v-textarea
              v-if="submissionType === 'text'"
              v-model="reflectionText"
              label="Reflection"
              variant="solo"
              rounded="xl"
              bg-color="background"
            ></v-textarea>
            <v-file-upload
              v-else-if="submissionType === 'files'"
              v-model="files"
              label="Upload Files"
              multiple
              rounded="xl"
              color="background"
            ></v-file-upload>
            <div v-else-if="submissionType === 'both'">
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

            <div class="d-flex justify-center mt-4">
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
