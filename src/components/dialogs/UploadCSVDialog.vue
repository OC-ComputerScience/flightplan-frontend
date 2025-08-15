<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { uploadCSVDialogStore } from "../../stores/uploadCSVDialogStore";
import Papa from "papaparse";

const props = defineProps({
  closeDialogAfterDataSent: {
    type: Boolean,
    default: true,
  },
  successMessage: {
    type: String,
    default: "",
  },
  showPreview: {
    type: Boolean,
    default: false,
  },
  previewHeader: {
    type: String,
    default: "",
  },
  previewName: {
    type: String,
    default: "",
  },
  uploadMessage: {
    type: String,
    default: "",
  },
  waitForLoading: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit"]);
const dialogStore = uploadCSVDialogStore();
const { visible, error, errorMessage } = storeToRefs(dialogStore);

const file = ref(null);
const filePreview = ref("");

const handleSubmit = () => {
  if (file.value?.type !== "text/csv") {
    console.log("bad or no files");
    dialogStore.setErrorMessage("No CSV File Uploaded");
    dialogStore.setError(true);
    return;
  }
  Papa.parse(file.value, {
    skipEmptyLines: true,
    complete: (results) => {
      emit("submit", results.data);
      if (props.closeDialogAfterDataSent) dialogStore.toggleVisibility();
    },
  });
};

const handleCancel = () => {
  file.value = null;
  dialogStore.toggleVisibility();
};

watch(visible, () => {
  if (!visible.value) {
    dialogStore.setErrorMessage("");
    dialogStore.setError(false);
    file.value = null;
    filePreview.value = "";
  }
});

watch(file, () => {
  filePreview.value = "";

  if (!file.value) return;

  setTimeout(() => {
    if (
      props.showPreview &&
      file.value?.type === "text/csv" &&
      !props.previewHeader
    ) {
      Papa.parse(file.value, {
        skipEmptyLines: true,
        complete: (results) => {
          filePreview.value = [
            ...results.data.map((line) =>
              line[0].replace(/['"<>`\\;, \t]/g, ""),
            ),
          ].join("\n");
        },
      });
    } else if (
      props.showPreview &&
      file.value?.type === "text/csv" &&
      props.previewHeader
    ) {
      Papa.parse(file.value, {
        skipEmptyLines: true,
        complete: (results) => {
          const header = results.data[0];
          const emailColIndex = header.findIndex(
            (col) => col.trim().toLowerCase() === "email",
          );
          if (emailColIndex === -1) {
            filePreview.value = `Ensure there is a column with the title '${props.previewHeader}'`;
            return;
          }

          filePreview.value = [
            ...results.data
              .slice(1)
              .map((line) =>
                line[emailColIndex].replace(/['"<>`\\;, \t]/g, ""),
              ),
          ].join("\n");
        },
      });
    } else if (file.value?.type !== "text/csv") {
      filePreview.value = "Please upload a CSV file to see a preview";
    }
  });
});
</script>

<template>
  <v-dialog
    v-model="visible"
    style="width: 65%"
    transition="dialog-bottom-transition"
  >
    <v-card rounded="xl" color="backgroundDarken">
      <v-card-title class="text-h5 d-flex justify-center align-center">
        <span
          class="flex-grow-1 text-center"
          style="
            overflow-wrap: break-word;
            white-space: pre-line;
            word-break: break-word;
          "
        >
          {{ uploadMessage ? uploadMessage : "Upload CSV File" }}
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
          <div>
            <div v-if="successMessage">
              <v-alert type="success" variant="tonal" closable>
                {{ successMessage }}
              </v-alert>
            </div>
            <v-row>
              <v-col :cols="showPreview ? 8 : 12">
                <v-file-upload
                  v-model="file"
                  label="Upload Files"
                  rounded="xl"
                  color="background"
                  accept=".csv,text/csv"
                ></v-file-upload>
              </v-col>
              <v-col
                v-if="showPreview"
                cols="4"
                class="d-flex justify-center rounded-xl"
              >
                <v-textarea
                  v-model="filePreview"
                  :label="`${previewName}`"
                  readonly
                  rounded="xl"
                />
              </v-col>
            </v-row>

            <v-alert
              v-model="error"
              type="error"
              variant="tonal"
              closable
              style="white-space: pre-wrap"
              >{{ errorMessage }}</v-alert
            >

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
    <v-overlay
      v-if="waitForLoading"
      :model-value="loading"
      persistent
      opacity="0.75"
      scrim="background"
      class="d-flex flex-column align-center justify-center"
    >
      <div class="d-flex flex-column align-center text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          width="6"
        ></v-progress-circular>
      </div>
    </v-overlay>
  </v-dialog>
</template>
