<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { viewSelectEventExperienceStore } from "../../stores/viewSelectEventExperienceStore";
import FlightPlanitemCard from "../cards/FlightPlanItemCard.vue";
const store = viewSelectEventExperienceStore();
const { visible } = storeToRefs(store);

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  flightPlanItems: {
    type: [Array, Object, undefined],
    required: true,
  },
});

const emit = defineEmits(["register"]);

const selectedEvent = ref({});
const selectedFlightPlanItem = ref(null);

watch(visible, () => {
  if (visible.value) {
    selectedEvent.value = props.event;
    selectedFlightPlanItem.value = null;
  }
});

const handleShow = (flightPlanItem) => {
  selectedFlightPlanItem.value = flightPlanItem;
};

const register = () => {
  emit("register", selectedEvent.value, selectedFlightPlanItem.value);
  store.toggleVisibility();
};
</script>
<template>
  <v-dialog v-model="visible" max-width="1000px">
    <v-card class="rounded-xl" color="backgroundDarken">
      <v-card-title
        class="text-h6 d-flex justify-space-between align-center px-6 pt-4"
      >
        <span class="font-weight-regular">
          Qualifying Flight Plan Experiences for
          <strong class="text-lg font-weight-bold mx-1">
            {{ props.event.name }}
          </strong>
          Event:
        </span>
        <v-icon class="cursor-pointer" @click="store.toggleVisibility()">
          mdi-close
        </v-icon>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-0">
        <v-row no-gutters style="height: 500px; overflow: hidden">
          <v-col
            cols="5"
            class="pa-4"
            style="
              height: 100%;
              max-height: 500px;
              overflow-y: auto;
              border-right: 1px solid rgba(255, 255, 255, 0.1);
            "
          >
            <FlightPlanitemCard
              v-for="flightPlanItem in flightPlanItems"
              :key="flightPlanItem.id"
              :flight-plan-item="flightPlanItem"
              :is-admin="false"
              :is-flight-plan-view="true"
              :background-color="
                flightPlanItem == selectedFlightPlanItem
                  ? 'background thick-border'
                  : 'background'
              "
              @click="handleShow"
            />
          </v-col>

          <v-col cols="7" class="pa-4 d-flex flex-column justify-start">
            <v-card
              v-if="selectedFlightPlanItem"
              class="pa-4 rounded-xl flex-grow-1"
              color="background"
            >
              <h2>{{ selectedFlightPlanItem.name }}</h2>
              <p>
                <strong>Description: </strong
                >{{ selectedFlightPlanItem.experience.description }}
              </p>
              <p>
                <strong>Rationale: </strong
                >{{ selectedFlightPlanItem.experience.rationale }}
              </p>
              <p>{{ selectedFlightPlanItem.status }}</p>
              <p>Points: {{ selectedFlightPlanItem.experience.points }}</p>
              <div>
                <v-btn
                  v-if="selectedFlightPlanItem.status === 'Incomplete'"
                  :class="'mt-4'"
                  color="primary"
                  rounded="xl"
                  block
                  @click="register"
                >
                  Register
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
