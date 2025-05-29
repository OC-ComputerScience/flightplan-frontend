<script setup>
import { computed } from "vue";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { userStore } from "../../stores/userStore";

dayjs.extend(advancedFormat);

const emit = defineEmits(["edit", "cancel", "delete", "show-info"]);
const store = userStore();

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  viewOnly: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "primary",
  },
  statusLabel: {
    type: String,
    default: "",
  },
  adminView: {
    type: Boolean,
    default: false,
  },
});

const eventDate = computed(() => {
  const dateString = dayjs(props.event.date).format("dddd, MMMM Do");
  return dateString;
});

const eventTime = computed(() => {
  const startTime = dayjs(props.event.startTime).format("h:mma");
  const endTime = dayjs(props.event.endTime).format("h:mma");

  return `${startTime} - ${endTime}`;
});

const viewCard = () => {};

const editEvent = () => {
  emit("edit", props.event.id);
};

const cancelEvent = () => {
  emit("cancel", props.event.id);
};

const showEventInfo = () => {
  emit("show-info", props.event.id);
};

const resolvedStatusLabel = computed(() => {
  if (props.statusLabel && props.statusLabel !== "primary") {
    return props.statusLabel;
  }

  switch (props.status) {
    case "success":
      return "Checked In";
    case "warning":
      return "Registered";
    case "grey":
      return "Cancelled";
    default:
      return "Not Registered";
  }
});
</script>

<template>
  <v-card v-if="!viewOnly" color="backgroundDarken" class="cardContainer">
    <v-row no-gutters>
      <v-col>
        <v-card-text>
          <p class="text-h5 text-no-wrap text-truncate">
            {{ props.event.name }}
          </p>
          <p
            class="text-subtitle-1 font-weight-regular text-no-wrap text-truncate"
          >
            {{ props.event.location || "No Location" }}
          </p>
          <p class="text-subtitle-1 font-weight-regular">
            {{ eventDate }}
          </p>
          <p class="text-subtitle-1 font-weight-regular">
            {{ eventTime }}
          </p>
          <p v-if="!store.isAdmin" class="text-subtitle-2 font-weight-medium">
            Status: {{ resolvedStatusLabel }}
          </p>
        </v-card-text>
        <v-row class="ma-2 float-right">
          <v-btn
            color="primary"
            class="mr-2 cardButton elevation-0"
            @click="showEventInfo"
          >
            <v-icon icon="mdi-eye" color="text" size="x-large"></v-icon>
          </v-btn>
          <v-btn
            color="warning"
            class="mr-2 cardButton elevation-0"
            @click="editEvent"
          >
            <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
          </v-btn>
          <v-btn
            color="danger"
            class="cardButton elevation-0"
            @click="emit('delete', props.event.id)"
            ><v-icon icon="mdi-delete" color="text" size="x-large"></v-icon
          ></v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
  <v-card
    v-else
    color="background"
    class="cardContainer mb-2"
    @click="viewCard"
  >
    <v-row no-gutters>
      <div class="h-fill left-accent my-2 ml-2" :class="`bg-${status}`"></div>
      <v-col>
        <v-card-text>
          <p class="text-h6 text-truncate w-100">
            {{ props.event.name }}
          </p>
          <p class="text-subtitle-2 font-weight-regular">
            {{ props.event.location }}
          </p>
          <p class="text-subtitle-2 font-weight-regular">
            {{ eventDate }}
          </p>
          <p class="text-subtitle-2 font-weight-regular">
            {{ eventTime }}
          </p>
          <p class="text-subtitle-2 font-weight-medium">
            {{ statusLabel }}
          </p>
        </v-card-text>
        <v-row v-if="props.adminView" class="ma-2 float-left">
          <v-btn
            color="warning"
            class="mr-2 cardButton elevation-0"
            @click.stop="editEvent"
          >
            <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
          </v-btn>
          <v-btn
            v-if="props.status !== 'grey'"
            color="error"
            class="mr-2 cardButton elevation-0"
            @click.stop="cancelEvent"
          >
            <v-icon icon="mdi-cancel" color="text" size="x-large"></v-icon>
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
.left-accent {
  width: 20px;
  border-radius: 20px 0px 0px 20px;
}
.cardContainer {
  min-width: 250px;
  border-radius: 25px;
}
.card-radius {
  border-radius: 25px;
}
.cardButton {
  border-radius: 13px;
}
</style>
