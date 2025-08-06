<script setup>
const props = defineProps({
  strength: {
    type: Object,
    required: true,
  },
});

// Map domain values to colors
const categoryColor = (domain) => {
  const domainColors = {
    Executing: "#8B5CF6", // Blue
    Influencing: "#D97706", // Orange
    "Relationship Building": "#0070CA", // Green
    "Strategic Planning": "#10B981", // Purple
  };
  return domainColors[domain] || "#0070CA";
};
</script>

<template>
  <v-card
    color="backgroundDarken"
    class="rounded-xl pa-4 mb-3 strengthCard"
    elevation="2"
    style="width: 100%"
  >
    <div class="d-flex align-center mb-2">
      <v-card
        class="category mr-3"
        :style="{ backgroundColor: categoryColor(props.strength.domain) }"
        flat
        style="
          width: 35px;
          border-radius: 8px 0 0 8px;
          display: flex;
          justify-content: center;
          align-items: center;
        "
      >
        <h3 class="mb-0">{{ props.strength.number }}</h3>
      </v-card>
      <div>
        <h3 class="mb-1" style="font-size: 1.1rem; font-weight: 500">
          {{ props.strength.name }}
        </h3>
        <div class="text-caption" style="color: #888">
          {{ props.strength.domain }}
        </div>
      </div>
    </div>
    <div
      class="strength-description"
      style="font-size: 0.95rem; line-height: 1.4"
    >
      {{ props.strength.description || "Description not available." }}
    </div>
  </v-card>
</template>

<style scoped>
.strengthCard {
  width: 100%;
  min-width: 200px;
  max-width: 100%;
  box-sizing: border-box;
}
.category {
  width: 35px;
  border-radius: 8px 0 0 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  height: 40px;
}
.strength-description {
  margin-top: 10px;
  font-size: 0.95rem;
  line-height: 1.4;
}
</style>
