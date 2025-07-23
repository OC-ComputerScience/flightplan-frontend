<script setup>
import CardHeader from "../../components/CardHeader.vue";
import CardTable from "../../components/CardTable.vue";
import flightPlanItemServices from "../../services/flightPlanItemServices";
import FlightPlanItemApprovalCard from "../../components/cards/FlightPlanItemApprovalCard.vue";
import ViewApprovalDialog from "../../components/dialogs/ViewApprovalDialog.vue";
import { ref, onMounted, computed, watch } from "vue";
import { adminApprovalDialogStore } from "../../stores/adminApprovalDialogStore";
import { useDisplay } from "vuetify";
import { useRoute } from "vue-router";

const route = useRoute();
const specificIdParam = !!route.query.id;

const dialogStore = adminApprovalDialogStore();

const pendingApprovals = ref([]);
const page = ref(1);
const count = ref(1);
const searchQuery = ref("");

const display = useDisplay();

const numCardColumns = computed(() => {
  if (display.xxl.value) return 4;
  if (display.xl.value) return 3;
  if (display.lg.value) return 3;
  if (display.md.value) return 2;
  if (display.sm.value) return 1;
  return 1; // Default for xs
});
const pageSize = computed(() => numCardColumns.value * 2);

const fetchPendingApprovals = async () => {
  try {
    const response = await flightPlanItemServices.getPendingApprovals(
      page.value,
      pageSize.value,
      searchQuery.value,
    );
    pendingApprovals.value = response.data.flightPlanItems;
    count.value = response.data.count;
    page.value = 1;
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
};

const handleApprove = (flightPlanItem) => {
  dialogStore.setFlightPlanItem(flightPlanItem);
  dialogStore.toggleVisibility();
};

watch([page, searchQuery], fetchPendingApprovals);

onMounted(async () => {
  let allSubmissions = (await flightPlanItemServices.getPendingApprovals()).data.flightPlanItems;
  await fetchPendingApprovals();
  if (specificIdParam) {
    let foundItem = null;
    allSubmissions.forEach((item) => {
      if (
        item.submission &&
        item.submission.find((sub) => sub.id == route.query.id)
      ) {
        foundItem = item;
        return;
      }
    });

    if (foundItem) {
      handleApprove(foundItem);
    }
  }
});
</script>
<template>
  <v-container>
    <CardHeader
      label="Approvals"
      :add-button="false"
      :filter-button="false"
      @changed="handleSearchChange"
    />
    <CardTable
      :items="pendingApprovals"
      :per-row-lg="3"
      :per-row-md="2"
      :per-row-sm="2"
    >
      <template #item="{ item }">
        <FlightPlanItemApprovalCard
          :flight-plan-item="item"
          @approve="handleApprove(item)"
        />
      </template>
      <template #pagination>
        <v-pagination
          v-model="page"
          :length="count"
          :total-visible="$vuetify.display.smAndDown ? 3 : 5"
          class="mt-4"
          @next="fetchPendingApprovals"
          @prev="fetchPendingApprovals"
          @update:model-value="fetchPendingApprovals"
        >
        </v-pagination>
      </template>
    </CardTable>
    <ViewApprovalDialog
      @approve="fetchPendingApprovals"
      @reject="fetchPendingApprovals"
    />
  </v-container>
</template>
