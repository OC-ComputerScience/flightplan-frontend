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

const store = userStore();
const route = useRoute();
const router = useRouter();

const badgeAwardsStore = viewBadgeAwardsStore();
const noBadges = ref(false);
const noStrengths = ref(false);

const links = ref([]);
const strengths = ref([]);
const badges = ref([]);
const unviewedBadges = ref([]);
const selectedUser = ref([]);
const selectedStudent = ref([]);
const selectedMajor = ref([]);
const isAdmin = ref(false);

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

// Add watcher for pagination
watch(currentPage, (newPage) => {
  getBadges(route.params.userId, newPage);
});

onMounted(async () => {
  const passedId = route.params.userId;
  isAdmin.value = await store.isAdmin();

  if (!isAdmin.value) {
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
  <v-row class="background">
    <!-- Profile Section -->
    <v-card color="backgroundDarken" class="topBar">
      <v-row class="w-100">
        <v-col cols="2" class="d-flex flex-column align-center justify-center">
          <v-img
            src="/Birb.png"
            height="200"
            width="200"
            class="profile-pic"
            style="
              position: absolute;
              top: -20px;
              z-index: 10000;
              border-radius: 50%;
            "
          />
          <div style="margin-top: 160px">
            <p class="text-h6 font-weight-bold">
              {{ selectedUser.fullName }}
            </p>
          </div>
        </v-col>

        <v-col cols="4" class="d-flex flex-column justify-center">
          <h3 style="text-align: left">About Me:</h3>
          <p style="text-align: left; display: flex; font-size: 18px">
            {{ selectedUser.profileDescription }}
          </p>
        </v-col>
        <v-col class="v-col-2 d-flex flex-column justify-center text-right">
          <p style="font-size: 16px; text-align: right !important">Major</p>
          <p style="font-size: 16px; text-align: right !important">Email</p>
          <p
            v-for="(link, index) in links.slice(0, 3)"
            :key="index"
            style="text-align: right !important; font-size: 16px"
          >
            {{ link.websiteName }}
          </p>
        </v-col>
        <v-col cols="4" class="d-flex flex-column justify-center text-left">
          <p class="text-subtitle-1">
            {{ selectedMajor.map((major) => major.name).join(", ") }}
          </p>
          <a style="text-align: left !important">
            {{ selectedUser.email }}
          </a>
          <a
            v-for="(link, index) in links.slice(0, 3)"
            :key="index"
            style="text-align: left !important; font-size: 16px"
            :href="link.link"
            target="_blank"
          >
            {{ link.link }}
            <br />
          </a>
        </v-col>
        <v-col cols="1" class="d-flex align-right">
          <v-icon
            v-if="isAdmin"
            :size="32"
            style="margin-left: 85%; margin-top: 5%"
            color="primary"
            class="d-flex align-right"
            @click="toFlightPlan"
            >mdi-airplane</v-icon
          >
        </v-col>
        <v-spacer />
        <v-col cols="1" class="d-flex justify-end align-right">
          <v-btn
            v-if="canEditProfile()"
            color="primary"
            class="mr-2 cardButton elevation-0"
            @click.stop="handleEdit(route.params.userId)"
          >
            <v-icon icon="mdi-pencil" color="text" size="x-large"></v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <div class="adminItem">
          <v-card color="backgroundDarken" style="margin-bottom: 25px">
            <h2 style="margin: 10px 0px 5px 15px">Badges</h2>
          </v-card>
          <v-row v-if="!noBadges">
            <v-col
              v-for="(item, index) in badges"
              :key="index"
              cols="12"
              md="4"
            >
              <BadgeCard :badge="item" :is-profile-page="true" />
            </v-col>
          </v-row>
          <v-row v-else>
            <div class="adminItem" style="text-align: center">
              No badges! <br />
              Complete some flight plan items to be rewarded!
              <br />
              <br />
              <b
                >The LORD repay you for what you have done, and a full reward be
                given you by the LORD, the God of Israel, under whose wings you
                have come to take refuge!" <br />
                - Ruth 2:12</b
              >
            </div>
          </v-row>
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
            ></v-pagination>
          </v-row>
        </div>
      </v-col>

      <!-- Strengths Section (Stacked Vertically, Stretching Full Width) -->
      <v-col cols="12" md="6">
        <div class="adminItem" style="margin-right: 2vw">
          <v-card color="backgroundDarken" style="margin-bottom: 25px">
            <h2 style="margin: 10px 0px 5px 15px">Clifton Strengths</h2>
          </v-card>
          <!-- Stacked Strengths (Stretching Full Width) -->
          <v-row
            v-if="strengths && strengths.length > 0"
            class="strengths-list"
            style="margin: 0; padding: 0"
          >
            <v-col
              v-for="(item, index) in strengths.slice(0, 5)"
              :key="index"
              cols="12"
              style="padding: 0; margin: 0"
            >
              <StrengthCard :strength="item" />
            </v-col>
          </v-row>
          <v-row v-else>
            <div class="adminItem" style="text-align: center">
              No Clifton Strengths listed<br />
              Contact Charlotte Hamil to change this! <br /><br />
              <b
                >"Before I formed you in the womb I knew you, and before you
                were born I consecrated you; I appointed you a prophet to the
                nations." <br />
                - Jeremiah 1:5</b
              >
            </div>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </v-row>
  <ViewBadgeAwards :badges="unviewedBadges" />
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
  height: 25vh; /* Allows it to grow dynamically */
  max-width: 100%;
}

.adminItem {
  display: flex;
  flex-direction: column;
  padding: 15px 0px 5px 0px;
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
</style>
