<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { addFlightPlanItemToFlightPlanStore } from "../../stores/addFlightPlanItemToFlightPlanStore";
import FlightPlanItemCard from "../cards/FlightPlanItemCard.vue";
import experienceServices from "../../services/experienceServices";
import taskServices from "../../services/taskServices";
import flightPlanServices from "../../services/flightPlanServices";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import { useDisplay } from "vuetify";
// Props and Emits
const props = defineProps({
  studentId: {
    type: Number,
  },
});
const emit = defineEmits(["addItems"]);

// Store and State
const store = addFlightPlanItemToFlightPlanStore();
const { visible } = storeToRefs(store);
const searchQuery = ref("");
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const confirmation = ref(false);
const flightPlanItems = ref([]);
const selectedFlightPlanItems = ref([]);
const { lgAndDown } = useDisplay();

// Methods
const handleAddItems = async () => {
  loading.value = true;
  try {
    await Promise.all(
      selectedFlightPlanItems.value.map((item) => {
        return flightPlanItemServices.createFlightPlanItem(item);
      }),
    );
    loading.value = false;
    successMessage.value = "Items added to flight plan";
    setTimeout(() => {
      successMessage.value = "";
      store.toggleVisibility();
      confirmation.value = false;
      selectedFlightPlanItems.value = [];
      flightPlanItems.value = [];
      emit("addItems");
    }, 2000);
  } catch (err) {
    console.log(err);
    errorMessage.value = "Error adding items to flight plan";
    loading.value = false;
  }
};

const handleCardClick = (item) => {
  if (selectedFlightPlanItems.value.includes(item)) {
    selectedFlightPlanItems.value = selectedFlightPlanItems.value.filter(
      (selectedItem) => {
        if (selectedItem.flightPlanItemType === "Experience") {
          return selectedItem.experienceId !== item.experienceId;
        }
        return selectedItem.taskId !== item.taskId;
      },
    );
    flightPlanItems.value = filterFlightPlanItems([
      ...flightPlanItems.value,
      item,
    ]);
  } else {
    selectedFlightPlanItems.value.push(item);
  }
  flightPlanItems.value = filterFlightPlanItems([...flightPlanItems.value]);
};

const filterFlightPlanItems = (items) => {
  const filteredItems = items.filter((item) => {
    return !selectedFlightPlanItems.value.some((selectedItem) => {
      if (selectedItem.flightPlanItemType === "Experience") {
        return selectedItem.experienceId === item.experienceId;
      }
      return selectedItem.taskId === item.taskId;
    });
  });
  return filteredItems.sort((a, b) => a.name.localeCompare(b.name));
};

const fetchItems = async () => {
  const [experienceResponse, taskResponse, flightPlanResponse] =
    await Promise.all([
      experienceServices.getAllOptionalExperiencesForStudent(
        props.studentId,
        searchQuery.value,
      ),
      taskServices.getAllOptionalTasksForStudent(
        props.studentId,
        searchQuery.value,
      ),
      flightPlanServices.getFlightPlanForStudent(props.studentId),
    ]);

  const flightPlans = flightPlanResponse.data;
  const mostRecentFlightPlan = flightPlans.sort(
    (a, b) => a.semestersFromGrad < b.semestersFromGrad,
  )[0];

  const tasks = taskResponse.data.map((task) => ({
    flightPlanItemType: "Task",
    flightPlanId: mostRecentFlightPlan.id,
    name: task.name,
    status: "Incomplete",
    taskId: task.id,
    task: task,
  }));

  const experiences = experienceResponse.data.map((experience) => ({
    flightPlanItemType: "Experience",
    flightPlanId: mostRecentFlightPlan.id,
    name: experience.name,
    status: "Incomplete",
    experienceId: experience.id,
    experience: experience,
  }));

  flightPlanItems.value = filterFlightPlanItems([...tasks, ...experiences]);
};

const handleChange = (value) => {
  searchQuery.value = value;
};

// Watchers
watch(
  searchQuery,
  async () => {
    await fetchItems();
  },
  { debounce: 2000 },
);

watch(visible, async () => {
  if (visible.value) {
    await fetchItems();
  }
});
</script>

<template>
  <v-dialog v-model="visible">
    <!-- Selection Card -->
    <v-card v-if="!confirmation" class="rounded-lg bg-background">
      <v-card-title class="text-center mb-2">
        <p class="mb-2">Add Flight Plan Item to Flight Plan</p>
        <v-text-field
          label="Search"
          append-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          variant="solo"
          rounded="xl"
          bg-color="backgroundDarken"
          color="text"
          @update:model-value="handleChange"
        />
      </v-card-title>

      <v-row class="justify-center">
        <!-- Unselected Items -->
        <v-col :cols="5">
          <p class="text-center">Unselected Items</p>
          <v-list
            v-if="flightPlanItems.length > 0"
            class="bg-background scrollable-list"
          >
            <v-row>
              <v-col
                v-for="item in flightPlanItems"
                :key="item.id"
                :cols="lgAndDown ? 12 : 6"
              >
                <v-list-item>
                  <FlightPlanItemCard
                    :flight-plan-item="item"
                    :is-flight-plan-view="true"
                    @click="handleCardClick(item)"
                  />
                </v-list-item>
              </v-col>
            </v-row>
          </v-list>
        </v-col>

        <!-- Divider -->
        <v-col :cols="1" class="d-flex justify-center">
          <v-divider vertical class="my-4" />
        </v-col>

        <!-- Selected Items -->
        <v-col :cols="5">
          <p class="text-center">
            Selected Items ({{ selectedFlightPlanItems.length }})
          </p>
          <v-list class="bg-background scrollable-list">
            <v-row>
              <v-col
                v-for="item in selectedFlightPlanItems"
                :key="item.id"
                :cols="lgAndDown ? 12 : 6"
              >
                <v-list-item>
                  <FlightPlanItemCard
                    :flight-plan-item="item"
                    :is-flight-plan-view="true"
                    @click="handleCardClick(item)"
                  />
                </v-list-item>
              </v-col>
            </v-row>
          </v-list>
        </v-col>
      </v-row>

      <div class="d-flex justify-center ma-4">
        <v-btn
          class="mr-4 rounded-lg"
          color="primary"
          :disabled="selectedFlightPlanItems.length === 0"
          @click="confirmation = true"
        >
          Add Items
        </v-btn>
        <v-btn
          color="text"
          variant="outlined"
          class="rounded-lg"
          @click="store.toggleVisibility"
        >
          Cancel
        </v-btn>
      </div>
    </v-card>

    <!-- Confirmation Card -->
    <v-card v-else class="rounded-lg bg-background">
      <v-card-title class="text-center">
        <p class="mb-2">
          Are you sure you want to add these items to the flight plan?
        </p>
      </v-card-title>
      <v-fade-transition mode="out-in">
        <v-alert v-if="loading" type="info" class="mb-4">
          Adding items to flight plan...
        </v-alert>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-alert v-if="successMessage" type="success" class="mb-4">
          {{ successMessage }}
        </v-alert>
        <div v-else>
          <p class="text-center">
            Selected Flight Plan Items ({{ selectedFlightPlanItems.length }})
          </p>
          <v-list class="bg-background scrollable-list">
            <v-list-item v-for="item in selectedFlightPlanItems" :key="item.id">
              <v-row>
                <v-col :cols="3" />
                <v-col :cols="6">
                  <FlightPlanItemCard
                    :flight-plan-item="item"
                    :is-flight-plan-view="true"
                  />
                </v-col>
                <v-col :cols="3" />
              </v-row>
            </v-list-item>
          </v-list>
        </div>
      </v-fade-transition>

      <div class="d-flex justify-center ma-4">
        <v-btn class="mr-4 rounded-lg" color="primary" @click="handleAddItems">
          Confirm
        </v-btn>
        <v-btn
          color="text"
          variant="outlined"
          class="rounded-lg"
          @click="confirmation = false"
        >
          Cancel
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.scrollable-list {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
