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
        md="4"
        lg="3"
        class="d-flex justify-center"
      >
        <BadgeCard :badge="badge" :is-profile-page="true" />
      </v-col>
      <v-col v-if="!loading && badges.length === 0" cols="12">
        <v-alert type="info" class="text-center">
          No badges are currently available.
        </v-alert>
      </v-col>
    </v-row>
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import badgeServices from "../../services/badgeServices";
import BadgeCard from "../../components/cards/BadgeCard.vue";
import { userStore } from "../../stores/userStore"; // <-- import the store

const badges = ref([]);
const loading = ref(true);
const store = userStore(); // <-- use the store

const fetchBadges = async () => {
  loading.value = true;
  try {
    const response = await badgeServices.getAllActiveBadges();
    badges.value = response.data.badges || [];
  } catch (error) {
    console.error("Error fetching badges:", error);
    badges.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchBadges);
</script>

<style scoped>
.profile-card {
  max-width: 200px;
  min-width: 200px;
}
</style>
