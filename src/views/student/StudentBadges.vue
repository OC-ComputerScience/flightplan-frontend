<script setup>
import { ref, watch, onMounted } from "vue";
import badgeServices from "../../services/badgeServices";
import StudentBadgeCard from "../../components/cards/StudentBadgeCard.vue";
import { userStore } from "../../stores/userStore";

const PAGE_SIZE = 6;
const page = ref(1);
const count = ref(0);
const badges = ref([]);
const loading = ref(true);
const store = userStore();

const getBadges = async (pageNumber = page.value) => {
  loading.value = true;
  try {
    // Ensure pageNumber is a valid number
    const currentPage = parseInt(pageNumber, 10) || 1;
    const result = await badgeServices.getAllActiveBadges(
      currentPage,
      PAGE_SIZE,
    );
    badges.value = result.data.badges || [];
    count.value = result.data.count || 0;
  } catch (error) {
    console.error("Error fetching badges:", error);
    badges.value = [];
    count.value = 0;
  } finally {
    loading.value = false;
  }
};

// Add watch to handle page changes
watch(page, (newPage) => getBadges(newPage));
onMounted(() => getBadges());
</script>

<template>
  <v-container>
    <v-row class="align-center mb-4">
      <v-col cols="8" class="d-flex align-center">
        <h1 class="mb-0">All Badges You Can Earn</h1>
      </v-col>
      <v-col cols="4" class="d-flex justify-end">
        <v-btn
          color="primary"
          :to="{
            name: 'student-profile',
            params: { userId: store.user.userId },
          }"
          rounded="xl"
          class="ml-auto mr-4 elevation-0"
        >
          Return to Profile
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <p class="mb-4">
          Below are all the badges available in the system. Complete flight plan
          items to earn them!
        </p>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-for="badge in badges"
        :key="badge.id"
        cols="12"
        sm="6"
        class="d-flex justify-center"
      >
        <StudentBadgeCard :badge="badge" :is-profile-page="true" />
      </v-col>
      <v-col v-if="!loading && badges.length === 0" cols="12">
        <v-alert type="info" class="text-center">
          No badges are currently available.
        </v-alert>
      </v-col>
    </v-row>
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

<style scoped>
.profile-card {
  max-width: 200px;
  min-width: 200px;
}
</style>
