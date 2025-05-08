<script setup>
import { watch } from "vue";
import { VRow, VCol, VCard } from "vuetify/components";

const emit = defineEmits([
  "update-filters",
  "clear-filters",
  "close-filter-menu",
  "close-info",
]);

// Props for number of items per row and items array
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

// Return the number of columns based on the screen size
const getCols = (screenSize) => {
  const sizes = {
    xs: props.perRowXs,
    sm: props.perRowSm,
    md: props.perRowMd,
    lg: props.perRowLg,
    default: props.perRow,
  };
  return 12 / (sizes[screenSize] || sizes.default);
};

const handleClearFilters = () => {
  emit("clear-filters");
};
const handleUpdateFilters = () => {
  emit("update-filters");
};
const handleCloseFilters = () => {
  emit("close-filter-menu");
};
const handleCloseInfo = () => {
  emit("close-info");
};
</script>

<template>
  <v-container fluid class="mt-2">
    <v-row>
      <v-slide-x-transition>
        <v-col v-if="showFilters" cols="12" md="3" lg="3">
          <v-card
            class="pa-4 filter-card card-radius elevation-0"
            color="backgroundDarken"
          >
            <v-row class="justify-space-between align-center" no-gutters>
              <v-card-title>Filters</v-card-title>
              <v-icon class="mr-2" @click="handleCloseFilters">
                mdi-close
              </v-icon>
            </v-row>
            <v-card-text>
              <slot name="filters">
                <v-card-text>
                  <p>No filters provided</p>
                </v-card-text>
              </slot>
            </v-card-text>
            <v-row class="w-100 justify-end" no-gutters>
              <v-btn
                class="cardButton elevation-0"
                variant="text"
                @click="handleClearFilters"
              >
                Clear
              </v-btn>
              <v-btn
                color="primary"
                class="cardButton elevation-0"
                @click="handleUpdateFilters"
              >
                Apply
              </v-btn>
            </v-row>
          </v-card>
        </v-col>
      </v-slide-x-transition>
      <v-col>
        <v-row v-if="props.items.length === 0" class="justify-center">
          <v-col>
            <v-alert color="success" class="text-center">
              No results found
            </v-alert>
          </v-col>
        </v-row>
        <v-row v-else>
          <template v-for="(item, index) in props.items" :key="index">
            <v-col
              :cols="getCols('xs')"
              :sm="getCols('sm')"
              :md="getCols('md')"
              :lg="getCols('lg')"
              :xl="getCols('default')"
            >
              <slot name="item" :item="item">
                <!-- Default slot content if none provided -->
                <v-card>
                  <v-card-title>{{ item.title }}</v-card-title>
                  <v-card-text>{{ item.description }}</v-card-text>
                </v-card>
              </slot>
            </v-col>
          </template>
        </v-row>
        <slot name="pagination"></slot>
      </v-col>
      <v-slide-x-reverse-transition>
        <v-col
          v-if="showInfo"
          cols="12"
          md="3"
          lg="3"
          class="align-start ml-2a"
        >
          <v-card
            class="pa-4 h-100 card-radius elevation-0 px-6"
            color="backgroundDarken"
          >
            <v-row
              class="justify-space-between align-center flex-nowrap"
              no-gutters
            >
              <h2>{{ props.infoLabel }}</h2>
              <v-icon @click="handleCloseInfo"> mdi-close </v-icon>
            </v-row>

            <slot name="info">
              <v-card-text>
                <p>No Info Available</p>
              </v-card-text>
            </slot>
          </v-card>
        </v-col>
      </v-slide-x-reverse-transition>
    </v-row>
  </v-container>
</template>

<style scoped>
.scrollable-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 4px; /* Prevent content from hiding under scrollbar */
  margin-top: 10px;
}

.filter-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-radius {
  border-radius: 25px;
}
</style>
