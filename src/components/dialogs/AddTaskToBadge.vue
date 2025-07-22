<script setup>
import { ref, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import taskServices from "../../services/taskServices";
import { addTaskToBadgeStore } from "../../stores/addTaskToBadgeStore";
import { required, positiveNumber } from "../../utils/formValidators";

const store = addTaskToBadgeStore();
const { visible, selectedRuleTask } = storeToRefs(store);

const emit = defineEmits(["addTaskToBadge", "close"]);
const tasks = ref([]);
const quantity = ref(1);
const selectedTask = ref(null);

watch(
  () => selectedRuleTask,
  (ruleTask) => {
    quantity.value = ruleTask?.value?.quantity ?? 1;
    selectedTask.value = ruleTask?.value?.task ?? null;
  },
  { deep: true },
);

const fetchTasks = async () => {
  const response = await taskServices.getAllTasks();
  tasks.value = sortTasks(response.data.tasks);
  selectedTask.value = tasks.value[0];
};

const handleAdd = () => {
  if (quantity.value <= 0) {
    return;
  }
  emit("addTaskToBadge", {
    task: selectedTask.value,
    quantity: quantity.value,
  });
  store.toggleVisibility();
};

const sortTasks = (tasks) => {
  return tasks.sort((a, b) => a.name.localeCompare(b.name));
};

onMounted(async () => {
  await fetchTasks();
});
</script>
<template>
  <v-dialog v-model="visible">
    <v-card class="rounded-lg bg-backgroundDarken">
      <v-card-title class="text-center">Add Task Rule to Badge</v-card-title>
      <v-card-text>
        <v-autocomplete
          v-model="selectedTask"
          :items="tasks"
          item-title="name"
          return-object
          label="Task"
          variant="solo"
          :rules="[required]"
        ></v-autocomplete>
        <v-text-field
          v-model="quantity"
          type="number"
          label="Quantity"
          variant="solo"
          :rules="[required, positiveNumber]"
        ></v-text-field>
        <v-row class="d-flex justify-center">
          <v-btn
            class="mr-2 rounded-lg"
            variant="outlined"
            @click="store.toggleVisibility()"
            >Cancel</v-btn
          >
          <v-btn class="rounded-lg" color="primary" @click="handleAdd"
            >Add</v-btn
          >
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
