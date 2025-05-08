<script setup>
import { ref, onMounted, computed } from "vue";
const props = defineProps({
  user: { type: Object, required: true },
});
const emit = defineEmits(["cardPressed"]);
const initials = ref("");

const isAdmin = computed(() => {
  return props.user.roles?.some((role) => role.name.toLowerCase() === "admin");
});

const isDirector = computed(() => {
  return props.user.roles?.some(
    (role) => role.name.toLowerCase() === "director",
  );
});

const roleColor = computed(() => {
  if (isDirector.value) return "success";
  if (isAdmin.value) return "warning";
  return "info";
});

onMounted(() => {
  initials.value =
    props.user.fName[0].toUpperCase() + props.user.lName[0].toUpperCase();
});
</script>
<template>
  <v-card
    color="backgroundDarken"
    class="cardContainer pa-0 ma-0"
    @click="emit('cardPressed', props.user)"
  >
    <v-container class="pa-2">
      <v-row no-gutters style="align-self: stretch">
        <v-sheet
          :color="roleColor"
          class="accentChip mr-2"
          width="25"
        ></v-sheet>
        <v-col align-self="center" cols="3">
          <v-avatar color="secondary" class="mx-2" size="50">
            <span class="accent--text font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </v-col>
        <v-col align-self="center" cols="7">
          <v-card-text class="text-no-wrap">
            <p class="text-subtitle-1">
              {{ props.user.fName + " " + props.user.lName }}
            </p>
            <p>
              {{ props.user.student?.majors[0]?.name || "Undeclared" }}
            </p>
          </v-card-text>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<style scoped>
.cardContainer {
  border-radius: 25px;
}
.accentChip {
  border-radius: 25px 0px 0px 25px;
}
</style>
