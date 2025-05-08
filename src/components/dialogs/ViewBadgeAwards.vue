<script setup>
import { watch } from "vue";
import { storeToRefs } from "pinia";
import { viewBadgeAwardsStore } from "../../stores/viewBadgeAwardsStore";
import badgeServices from "../../services/badgeServices";
const store = viewBadgeAwardsStore();
const { visible } = storeToRefs(store);

const props = defineProps({
  badges: {
    type: Array,
    required: true,
  },
});

watch(visible, () => {
  if (!visible.value) {
    props.badges.forEach((badge) => {
      badgeServices.viewBadge(badge.id);
    });
  }
});
</script>
<template>
  <v-dialog v-model="visible" max-width="500">
    <v-card class="rounded-xl bg-backgroundDarken" max-height="500">
      <v-card-title class="text-h5 text-center pa-4">
        Congratulations! 🎉
      </v-card-title>

      <v-card-text class="text-center pa-4">
        <p class="text-h6">
          {{
            props.badges.length === 1
              ? "You have earned a badge!"
              : `You have earned ${props.badges.length} badges!`
          }}
        </p>
        <p class="text-body-1 mt-2">Keep up the great work!</p>
        <v-list class="bg-backgroundDarken">
          <v-list-item
            v-for="badge in props.badges"
            :key="badge.id"
            class="text-left"
          >
            <v-list-item-title>{{ badge.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ badge.description }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions class="justify-center pa-4">
        <v-btn
          color="primary"
          variant="text"
          class="rounded-lg"
          @click="store.toggleVisibility()"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
