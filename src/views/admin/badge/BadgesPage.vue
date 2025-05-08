<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import CardTable from "../../../components/CardTable.vue";
import CardHeader from "../../../components/CardHeader.vue";
import BadgeCard from "../../../components/cards/BadgeCard.vue";
import badgeServices from "../../../services/badgeServices";
import fileServices from "../../../services/fileServices";

// Constants
const PAGE_SIZE = 8;
const label = "Badges";

// Reactive states
const router = useRouter();
const badges = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);

// Handlers
const handleAdd = () => {
  router.push({ name: "addBadge" });
};
const handleEdit = (badgeId) =>
  router.push({ name: "editBadge", params: { id: badgeId } });

const handleDelete = async (badgeId, badgeFileName) => {
  try {
    if (badgeFileName) {
      await fileServices.deleteFileForName(badgeFileName);
    }
    await badgeServices.deleteBadge(badgeId);
    await getBadges(); // Re-fetch badges after delete
  } catch (error) {
    console.error("Error deleting badge:", error);
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
};

// Fetch badges
const getBadges = async (
  pageNumber = page.value,
  query = searchQuery.value,
) => {
  try {
    const result = await badgeServices.getAllBadges(
      pageNumber,
      PAGE_SIZE,
      query,
    );
    badges.value = result.data.badges || [];
    count.value = result.data.count || 0;
  } catch (error) {
    console.error("Error fetching badges:", error);
  }
};

// Watch for changes in page and search query
watch([page, searchQuery], () => getBadges(page.value, searchQuery.value), {
  immediate: true,
});

// Initial fetch
onMounted(() => getBadges());
</script>
<template>
  <v-container fluid>
    <CardHeader
      :label="label"
      @changed="handleSearchChange"
      @add="handleAdd"
    ></CardHeader>
    <v-row v-if="badges.length === 0" class="justify-center">
      <v-col>
        <v-alert color="danger" class="text-center"> No results found </v-alert>
      </v-col>
    </v-row>
    <CardTable
      v-else
      :items="badges"
      :per-row-lg="4"
      :per-row-md="3"
      :per-row-sm="2"
    >
      <template #item="{ item }">
        <BadgeCard
          :key="item.id"
          :badge="item"
          @edit="handleEdit"
          @delete="handleDelete"
        ></BadgeCard>
      </template>
    </CardTable>
    <v-pagination
      v-model="page"
      :length="count"
      :total-visible="$vuetify.display.smAndDown ? 3 : 5"
      class="m-2"
      @next="getBadges"
      @prev="getBadges"
      @update:model-value="getBadges"
    >
    </v-pagination>
  </v-container>
</template>
