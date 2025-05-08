<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  strength: {
    type: Object,
    required: true,
  },
});

// Reactive property to track the hovered strength name
const hoveredStrength = ref(null);

// Use the description from the strength object
const strengthDescription = computed(() => {
  return props.strength.description || "Description not available.";
});

// Map domain values to colors
const categoryColor = computed(() => {
  const domainColors = {
    Executing: "#8B5CF6", // Blue
    Influencing: "#D97706", // Orange
    "Relationship Building": "#0070CA", // Green
    "Strategic Planning": "#10B981", // Purple
  };

  return domainColors[props.strength.domain] || "#0070CA"; // Default to blue if no match
});
</script>

<template>
  <v-card
    v-show="hoveredStrength === null || hoveredStrength === strength.name"
    color="backgroundDarken"
    class="pa-2 my-1 rounded-lg strengthCard"
    :class="{
      expanded: hoveredStrength === strength.name,
    }"
    @mouseover="hoveredStrength = strength.name"
    @mouseleave="hoveredStrength = null"
  >
    <v-row align="center" class="strength-header">
      <v-card class="category" :style="{ backgroundColor: categoryColor }">
        <h3>{{ props.strength.number }}</h3>
      </v-card>
      <h3 class="strength-name">{{ props.strength.name }}</h3>
      <p class="ml-auto domain">{{ props.strength.domain }}</p>
    </v-row>

    <!-- Show the description only when hovered -->
    <p v-if="hoveredStrength === strength.name" class="strength-description">
      {{ strengthDescription }}
    </p>
  </v-card>
</template>

<style scoped>
.strengthCard {
  height: 4vh;
  align-items: center;
  transition: height 0.2s ease;
  width: 100%;
  overflow: hidden;
  padding: 12px 0;
}

.strength-header {
  display: flex;
  align-items: center;
  width: 100%;
  height: 4vh;
  padding: 0;
}

.strength-name {
  margin: 0 15px;
  font-size: 1.1rem;
  font-weight: 500;
  align-items: center;
  padding: 8px 0;
}

.category {
  height: 5vh;
  width: 35px;
  border-top-left-radius: 8px;
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
  border-bottom-left-radius: 8px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  padding: 0;
}

.domain {
  margin-right: 15px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  padding: 0;
}

.strength-description {
  margin: 40px 15px 0px 15px;
  font-size: 0.95rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
}

.expanded {
  height: auto;
  min-height: 4vh;
}
</style>
