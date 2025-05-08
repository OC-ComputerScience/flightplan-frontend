<script setup>
import { useRouter } from "vue-router";
import CardHeader from "../../../components/CardHeader.vue";
import UserCard from "../../../components/cards/UserCard.vue";
import CardTable from "../../../components/CardTable.vue";
import userServices from "../../../services/userServices";
import { ref, watch, computed, onMounted } from "vue";
import { userStore } from "../../../stores/userStore.js";

const users = ref([]);
const page = ref(1);
const count = ref(0);
const searchQuery = ref("");
const showInfo = ref(false);
const userToShow = ref(null);
const hasPermission4 = ref(false);

const router = useRouter();
const store = userStore();

// Get current user's roles
const currentUser = computed(() => store.user);

const checkDirectorPermission = async () => {
  hasPermission4.value = await store.checkRole("director");
};

// Log current user on mount
onMounted(async () => {
  await store.setupStore();
  await checkDirectorPermission();
});

const fetchUsers = async ({
  pageNumber = page.value,
  query = searchQuery.value,
}) => {
  const response = await userServices.getAllUserForAdmin(pageNumber, 8, query);
  users.value = response.data.users;
  count.value = response.data.count;
};

const handleSearchChange = (input) => {
  searchQuery.value = input;
  page.value = 1; // Reset to first page on search change
};

const handleCardClick = (user) => {
  userToShow.value = user;
  showInfo.value = true;
};

const handleViewFlightPlan = () => {
  router.push({
    name: "adminStudentFlightPlan",
    params: { id: userToShow.value.student.id },
  });
};

const handleViewProfile = () => {
  router.push({
    name: "adminProfile",
    params: { userId: userToShow.value.id },
  });
};

const handleRedeemRewards = () => {
  router.push({
    name: "redeemReward",
    params: { studentId: userToShow.value.student.id },
  });
};

const handlePromoteToAdmin = async () => {
  if (isViewingSelf.value) {
    alert("You cannot promote yourself");
    return;
  }
  try {
    await userServices.promoteToAdmin(userToShow.value.id);
    await fetchUsers({ pageNumber: page.value, query: searchQuery.value });
    showInfo.value = false;
    location.reload();
  } catch (error) {
    alert(`Failed to promote user to admin: ${error.message}`);
  }
};

const handleDemoteFromAdmin = async () => {
  if (isViewingSelf.value) {
    alert("You cannot demote yourself");
    return;
  }
  try {
    await userServices.demoteFromAdmin(userToShow.value.id);
    await fetchUsers({ pageNumber: page.value, query: searchQuery.value });
    showInfo.value = false;
    location.reload();
  } catch (error) {
    alert(`Failed to demote user from admin: ${error.message}`);
  }
};

const isAdmin = computed(() => {
  return userToShow.value?.roles?.some(
    (role) => role.name.toLowerCase() === "admin",
  );
});

const isViewingSelf = computed(() => {
  return userToShow.value?.id === currentUser.value?.userId;
});

watch([page, searchQuery], fetchUsers, { immediate: true });
</script>
<template>
  <v-container>
    <CardHeader
      label="Users"
      :add-button="false"
      :filter-button="false"
      @changed="handleSearchChange"
    ></CardHeader>
    <v-row v-if="users.length === 0" class="justify-center">
      <v-col>
        <v-alert color="danger" class="text-center"> No results found </v-alert>
      </v-col>
    </v-row>
    <CardTable
      v-else
      :items="users"
      :per-row-lg="showInfo ? 3 : 4"
      :per-row-md="showInfo ? 2 : 3"
      :per-row-sm="showInfo ? 1 : 2"
      :show-info="showInfo"
      :info-label="userToShow?.fullName"
      @close-info="showInfo = false"
    >
      <template #item="{ item }">
        <UserCard
          :key="item.id"
          :user="item"
          @card-pressed="handleCardClick"
        ></UserCard>
      </template>
      <template #info>
        <div class="d-flex flex-column" style="height: 90%">
          <div>
            <p>
              Major:
              {{ userToShow.student?.majors[0]?.name || "Undeclared" }}
            </p>
            <p>
              Roles:
              {{
                userToShow.roles?.map((role) => role.name).join(", ") ||
                "Student"
              }}
            </p>
          </div>
          <v-spacer></v-spacer>
          <div>
            <v-btn
              block
              color="primary"
              class="mb-2"
              @click="handleViewFlightPlan"
              >View Flight Plan</v-btn
            >
            <v-btn block color="primary" class="mb-2" @click="handleViewProfile"
              >View Profile</v-btn
            >
            <v-btn
              block
              color="primary"
              class="mb-2"
              @click="handleRedeemRewards"
              >Redeem Rewards</v-btn
            >
            <v-btn
              v-if="hasPermission4 && !isAdmin && !isViewingSelf"
              block
              color="warning"
              class="mb-2"
              @click="handlePromoteToAdmin"
              >Promote to Admin</v-btn
            >
            <v-btn
              v-if="hasPermission4 && isAdmin && !isViewingSelf"
              block
              color="error"
              class="mb-2"
              @click="handleDemoteFromAdmin"
              >Demote to Student</v-btn
            >
          </div>
        </div>
      </template>
    </CardTable>
    <v-pagination
      v-model="page"
      :length="count"
      :total-visible="$vuetify.display.smAndDown ? 3 : 5"
      class="m-2"
      @next="fetchUsers"
      @prev="fetchUsers"
      @update:model-value="fetchUsers"
    >
    </v-pagination>
  </v-container>
</template>
