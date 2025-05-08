<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import experienceServices from "../../services/experienceServices";
import ExperienceCard from "../../components/cards/ExperienceCard.vue";
import CardTable from "../../components/CardTable.vue";
import CardHeader from "../../components/CardHeader.vue";

// Constants
const PAGE_SIZE = 8;
const label = "Experiences";

// Reactive states
const router = useRouter();
const experiences = ref([]);
const page = ref(1);
const searchQuery = ref("");
const count = ref(0);

// Fetch experiences
const getExperiences = async (pageNumber = page.value) => {
  try {
    const result = await experienceServices.getAllExperiences(
      pageNumber,
      PAGE_SIZE,
      searchQuery.value,
    );
    console.log(result);
    experiences.value = result.data.experiences;
    count.value = result.data.count;
  } catch (error) {
    console.error("Error fetching experiences:", error);
  }
};

// Handlers
const handleAdd = () => router.push({ name: "addExperience" });
const handleEdit = (experienceId) =>
  router.push({ name: "editExperience", params: { id: experienceId } });

const handleDelete = async (experienceId) => {
  try {
    await experienceServices.deleteExperience(experienceId);
    await getExperiences(); // Re-fetch experiences after delete
  } catch (error) {
    console.error("Error deleting experience:", error);
  }
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
  getExperiences(page.value);
};

// Initial fetch
onMounted(() => getExperiences());
</script>
<template>
  <v-container fluid>
    <CardHeader
      :label="label"
      @changed="handleSearchChange"
      @add="handleAdd"
    ></CardHeader>
    <v-row v-if="experiences.length === 0" class="justify-center">
      <v-col>
        <v-alert color="danger" class="text-center"> No results found </v-alert>
      </v-col>
    </v-row>
    <CardTable
      v-else
      :items="experiences"
      :per-row-lg="4"
      :per-row-md="3"
      :per-row-sm="2"
    >
      <template #item="{ item }">
        <ExperienceCard
          :experience="item"
          @edit="handleEdit"
          @delete="handleDelete"
        ></ExperienceCard>
      </template>
    </CardTable>
    <v-pagination
      v-model="page"
      :length="count"
      :total-visible="$vuetify.display.smAndDown ? 3 : 5"
      class="m-2"
      @next="getExperiences"
      @prev="getExperiences"
      @update:model-value="getExperiences"
    >
    </v-pagination>
  </v-container>
</template>
