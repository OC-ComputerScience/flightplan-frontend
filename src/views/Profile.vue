<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import linkServices from "../services/linkServices";
import strengthServices from "../services/strengthServices";
import badgeServices from "../services/badgeServices";
import userServices from "../services/userServices";
import studentServices from "../services/studentServices";
import StrengthCard from "../components/cards/StrengthCard.vue";
import BadgeCard from "../components/cards/BadgeCard.vue";
import { userStore } from "../stores/userStore";
import { useRouter } from "vue-router";
import { viewBadgeAwardsStore } from "../stores/viewBadgeAwardsStore";
import ViewBadgeAwards from "../components/dialogs/ViewBadgeAwards.vue";
import { viewAwardedBadgeStore } from "../stores/viewAwardedBadgeStore";
import ViewAwardedBadge from "../components/dialogs/ViewAwardedBadge.vue";
import StudentMaintainCliftonStrengths from "../components/dialogs/StudentMaintainCliftonStrengths.vue";

const store = userStore();
const route = useRoute();
const router = useRouter();

const badgeAwardsStore = viewBadgeAwardsStore();
const viewBadgeStore = viewAwardedBadgeStore();
const noBadges = ref(false);
const noStrengths = ref(false);

const links = ref([]);
const strengths = ref([]);
const badges = ref([]);
const unviewedBadges = ref([]);
const selectedBadge = ref({});
const selectedUser = ref([]);
const selectedStudent = ref([]);
const selectedMajor = ref([]);
const isAdmin = ref(false);

const showStrengthsDialog = ref(false);

// Add pagination variables
const currentPage = ref(1);
const pageSize = ref(6);
const totalPages = ref(1);

const getUser = async (id) => {
  try {
    const res = await userServices.getOneUser(id); // PASS IN THE ID
    selectedUser.value = res.data; // Update links
  } catch (err) {
    console.error("Error fetching user:", err); // Error handling
  }
};

const getLinks = async (id) => {
  try {
    const res = await linkServices.getAllLinksForUser(id); // API call
    links.value = res.data; // Update links
  } catch (err) {
    console.error("Error fetching links:", err); // Error handling
  }
};

const getStrengths = async (id) => {
  try {
    const res = await strengthServices.getStrengthsForStudent(id); // API call
    strengths.value = res.data; // Update strengths

    if (!res.data || res.data.length === 0) {
      console.error("Invalid response structure:", res);
      noStrengths.value = true;
      return;
    }

    if (!strengths.value || strengths.value.length === 0) {
      noStrengths.value = true;
    }
  } catch (err) {
    console.error("Error fetching strengths:", err); // Error handling
  }
};

const getBadges = async (id, page = 1) => {
  try {
    const res = await badgeServices.getBadgesForStudent(
      id,
      page,
      pageSize.value,
    ); // API call
    badges.value = res.data.badges; // Update badges

    totalPages.value = Math.ceil(res.data.total / pageSize.value);
    currentPage.value = page;

    if (!badges.value || badges.value.length === 0) {
      noBadges.value = true;
    } else {
      noBadges.value = false;
    }
  } catch (err) {
    console.error("Error fetching badges:", err); // Error handling
    noBadges.value = true;
  }
};

const canEditProfile = () => {
  return store.user.userId == route.params.userId || isAdmin.value;
};

// Handlers
const handleEdit = (userId) =>
  router.push({ name: "editProfile", params: { id: userId } });

const handleViewBadge = (badge) => {
  selectedBadge.value = badge;
  viewBadgeStore.toggleVisibility();
};

const fetchUnviewedBadges = async () => {
  const response = await badgeServices.getUnviewedBadges(route.params.userId);
  if (response.data.length > 0) {
    unviewedBadges.value = response.data;
    badgeAwardsStore.toggleVisibility();
  }
};

const toFlightPlan = () => {
  router.push({ name: "student-flightPlan" });
};

const getStudent = async (userId) => {
  try {
    const res = await studentServices.getStudentForUserId(userId);
    selectedStudent.value = res.data;
    if (selectedStudent.value.id) {
      // Get majors from the student response
      if (selectedStudent.value.majors) {
        selectedMajor.value = selectedStudent.value.majors;
      }
    }
  } catch (err) {
    console.error("Error fetching student:", err);
  }
};

const openStrengthsDialog = () => {
  showStrengthsDialog.value = true;
};

// Add watcher for pagination
watch(currentPage, (newPage) => {
  getBadges(route.params.userId, newPage);
});

onMounted(async () => {
  const passedId = route.params.userId;
  isAdmin.value = await store.isAdmin();

  if (store.user.userId == route.params.userId) {
    await fetchUnviewedBadges();
  }

  getLinks(passedId);
  getStrengths(passedId);
  getBadges(passedId);
  getUser(passedId);
  getStudent(passedId);
});
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- Page Header -->
    <v-row class="mb-3">
      <v-col cols="12">
        <h1 class="text-h3 font-weight-bold" style="font-size: 2.5vw">
          Your Profile
        </h1>
      </v-col>
    </v-row>

    <!-- Profile Section -->
    <v-row class="mb-3">
      <v-col cols="12">
        <v-card color="backgroundDarken" class="topBar pa-4 rounded-xl">
          <v-row class="w-100" no-gutters>
            <v-col
              cols="12"
              md="6"
              class="d-flex flex-column justify-center"
              style="min-width: 0"
            >
              <div class="align-center mb-2" style="width: 100%">
                <span
                  class="text-h4 font-weight-bold mr-3"
                  style="flex: 1; font-size: 2vw"
                >
                  {{ selectedUser.fullName }}
                </span>
                <v-btn
                  v-if="canEditProfile()"
                  color="primary"
                  class="ml-auto cardButton elevation-0"
                  rounded="xl"
                  @click="handleEdit(selectedUser.id)"
                >
                  <v-icon icon="mdi-pencil" color="text" size="large"></v-icon>
                  Edit Profile
                </v-btn>
                <v-btn
                  v-if="isAdmin"
                  color="primary"
                  class="ml-2 cardButton elevation-0"
                  rounded="xl"
                  @click="toFlightPlan"
                >
                  <v-icon
                    icon="mdi-airplane"
                    color="text"
                    size="large"
                  ></v-icon>
                  View Flight Plan
                </v-btn>
              </div>
              <div class="mb-1" style="text-align: left">
                <span class="text-h6" style="text-align: left; font-size: 1.1vw"
                  >Email:</span
                >
                <span class="text-body-1 ml-1" style="font-size: 0.7vw">{{
                  selectedUser.email
                }}</span>
              </div>
              <div class="mb-1" style="text-align: left">
                <span class="text-h6" style="font-size: 1.1vw">Major(s):</span>
                <span
                  v-if="selectedMajor.length"
                  class="text-body-1 ml-1"
                  style="font-size: 0.7vw"
                >
                  {{ selectedMajor.map((major) => major.name).join(", ") }}
                </span>
              </div>
              <div class="mb-2">
                <h3
                  class="text-h6 mb-1"
                  style="text-align: left; font-size: 1.5vw"
                >
                  About Me:
                </h3>
                <p
                  class="text-body-1"
                  style="text-align: left; font-size: 1.1vw"
                >
                  {{ selectedUser.profileDescription }}
                </p>
              </div>
              <div>
                <span v-for="(link, index) in links" :key="index" class="mr-2">
                  <a :href="link.link" target="_blank" style="font-size: 1vw">
                    {{ link.websiteName }}
                  </a>
                </span>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6" dense>
      <!-- Badges Section -->
      <v-col cols="12" md="6">
        <v-card color="backgroundDarken" class="dashboard-cell pa-4">
          <div class="d-flex align-center justify-start mb-2">
            <strong class="section-headers" style="font-size: 2vw"
              >Badges</strong
            >
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="20" class="ml-2"
                  >mdi-information-outline</v-icon
                >
              </template>
              <span
                >Your badges earned so far. Continue progressing through your
                flight plans to earn more!</span
              >
            </v-tooltip>
          </div>
          <div id="badgeList">
            <v-row v-if="!noBadges">
              <v-col v-for="(item, index) in badges" :key="index" cols="12">
                <BadgeCard
                  :badge="item"
                  :is-profile-page="true"
                  @view="handleViewBadge"
                />
              </v-col>
            </v-row>
            <div v-else class="text-center pa-4" style="font-size: 1vw">
              No badges!<br />
              Complete some flight plan items to be rewarded!<br /><br />
              <b>
                "The LORD repay you for what you have done..." <br />– Ruth 2:12
              </b>
            </div>
          </div>
          <v-row
            v-if="!noBadges"
            justify="center"
            align="center"
            class="pagination"
          >
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="5"
            />
          </v-row>
        </v-card>
      </v-col>

      <!-- Strengths Section -->
      <v-col cols="12" md="6">
        <v-card color="backgroundDarken" class="dashboard-cell pa-4">
          <div class="d-flex align-center justify-start mb-2">
            <strong class="section-headers" style="font-size: 2vw"
              >Clifton Strengths</strong
            >
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="20" class="ml-2"
                  >mdi-information-outline</v-icon
                >
              </template>
              <span>Your top 5 Clifton Strengths</span>
            </v-tooltip>
            <v-btn
              rounded="xl"
              class="ml-auto"
              color="primary"
              @click="openStrengthsDialog"
              >Update Strengths</v-btn
            >
          </div>
          <div id="strengthList">
            <v-row
              v-if="strengths && strengths.length > 0"
              class="strengths-list"
            >
              <v-col
                v-for="(item, index) in strengths"
                :key="index"
                cols="12"
                class="px-4"
              >
                <StrengthCard :strength="item" />
              </v-col>
            </v-row>
            <div v-else class="text-center pa-4" style="font-size: 1vw">
              No Clifton Strengths found.<br />
              Take the Gallup Strengths Assessment or contact Charlotte
              Hamil.<br /><br />
              <b>
                "Before I formed you in the womb I knew you..." <br />– Jeremiah
                1:5
              </b>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <ViewBadgeAwards :badges="unviewedBadges" />
  <ViewAwardedBadge :badge="selectedBadge" />
  <StudentMaintainCliftonStrengths
    v-if="showStrengthsDialog"
    :id="route.params.userId"
    @close="showStrengthsDialog = false"
    @submit="
      getStrengths(route.params.userId);
      showStrengthsDialog = false;
    "
  />
</template>

<style scoped>
.background {
  margin: 2vh 2vw 5vh 1vw;
  width: 100%;
  display: flex;
}

.topBar {
  width: 100%;
  margin-right: 2vw;
  max-width: 100%;
}

.adminItem {
  display: flex;
  flex-direction: column;
  padding: 15px 0px 5px 0px;
  margin: 0 2vw 2vh 2vw;
  border-radius: 25px;
  height: 100%;
}

.pagination {
  margin-top: 20px;
  padding: 10px 0;
}

.strengths-list {
  margin: 0;
  padding: 0;
}

.strengths-list .v-col {
  margin: 0;
  padding: 0;
}

#badgeList,
#strengthList {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 10px;
  padding-right: 5px;
}

.dashboard-cell {
  display: flex;
  flex-direction: column;
  height: 62vh;
  padding: 10px 5px;
  border-radius: 25px;
}

.section-headers {
  font-size: 24px;
  margin-left: 10px;
  margin-right: 10px;
}
</style>
