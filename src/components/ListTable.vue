<script setup>
import { watch } from "vue";

const emit = defineEmits([
  "update-filters",
  "clear-filters",
  "close-filter-menu",
  "close-info",
]);

const props = defineProps({
  items: { type: Array, required: true },
  showFilters: Boolean,
  showInfo: Boolean,
  infoLabel: {
    type: String,
    default: "Info",
  },
  perRow: { type: Number, default: 4 },
  perRowLg: { type: Number, default: 3 },
  perRowMd: { type: Number, default: 2 },
  perRowSm: { type: Number, default: 1 },
  perRowXs: { type: Number, default: 1 },
});

watch(
  () => [props.showFilters, props.showInfo],
  ([newShowFilters, newShowInfo], [oldShowFilters, oldShowInfo]) => {
    if (oldShowInfo && newShowFilters) {
      emit("close-info");
    } else if (oldShowFilters && newShowInfo) {
      emit("close-filter-menu");
    }
  },
);
</script>

<template>
  <div class="scrollable-container">
    <slot name="header"></slot>

    <v-row class="ma-0 pa-0" no-gutters>
      <v-col
        v-for="(item, index) in props.items"
        :key="index"
        cols="12"
        class="ma-0 pa-0 cardRow"
      >
        <slot :item="item"></slot>
      </v-col>
    </v-row>

    <slot name="pagination"></slot>
  </div>
</template>

<style scoped>
.scrollable-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 4px;
  margin-top: 10px;
}

.card-radius {
  border-radius: 25px;
}
</style>
