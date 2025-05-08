<template>
  <v-dialog v-model="showModal" max-width="500px">
    <v-card color="backgroundDarken rounded-xl pa-4">
      <v-card-title>Generate QR Code</v-card-title>
      <v-card-text>
        <v-radio-group v-model="expirationOption" class="mt-4">
          <v-radio label="Use event end time" value="eventEnd"></v-radio>
          <v-radio
            label="Custom duration from event start"
            value="custom"
          ></v-radio>
        </v-radio-group>

        <v-select
          v-if="expirationOption === 'custom'"
          v-model="durationMinutes"
          :items="durationOptions"
          label="Duration from event start"
          class="mt-4"
        ></v-select>
      </v-card-text>
      <v-row no-gutters>
        <v-spacer></v-spacer>
        <v-btn
          class="mr-4"
          color="secondary"
          variant="outlined"
          @click="closeModal"
          >Cancel</v-btn
        >
        <v-btn color="primary" :loading="generating" @click="generateQRCode">
          Generate QR Code
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  show: Boolean,
  event: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:show", "generate"]);

const showModal = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value),
});

const expirationOption = ref("eventEnd");
const durationMinutes = ref(60);
const generating = ref(false);

const durationOptions = [
  { title: "10 minutes", value: 10 },
  { title: "20 minutes", value: 20 },
  { title: "30 minutes", value: 30 },
  { title: "45 minutes", value: 45 },
  { title: "1 hour", value: 60 },
];

const closeModal = () => {
  showModal.value = false;
};

const generateQRCode = async () => {
  generating.value = true;
  try {
    let expirationTimestamp;
    if (expirationOption.value === "eventEnd") {
      expirationTimestamp = props.event.endTime;
    } else {
      const startTime = new Date(props.event.startTime);
      expirationTimestamp = new Date(
        startTime.getTime() + durationMinutes.value * 60000,
      );
    }

    emit("generate", expirationTimestamp);
    closeModal();
  } catch (error) {
    console.error("Error generating QR code:", error);
  } finally {
    generating.value = false;
  }
};
</script>
