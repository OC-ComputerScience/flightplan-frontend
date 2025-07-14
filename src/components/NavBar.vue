<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { userStore } from "../stores/userStore"; // Adjust this import based on your store path
import apiClient from "../services/services";
import ConfirmDialog from "./dialogs/ConfirmDialog.vue";
import { useTheme } from "vuetify";

const theme = useTheme();
const isDark = ref(false);

// Initialize theme from localStorage or system preference
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    theme.global.name.value = savedTheme;
    isDark.value = savedTheme === "darkTheme";
  } else {
    // If no saved theme, use system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    theme.global.name.value = prefersDark ? "darkTheme" : "lightTheme";
    isDark.value = prefersDark;
    localStorage.setItem("theme", theme.global.name.value);
  }
});

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark ? "lightTheme" : "darkTheme";
  theme.global.name.value = newTheme;
  isDark.value = theme.global.current.value.dark;
  localStorage.setItem("theme", newTheme);
};

const admin = [
  { "route-name": "adminProfile", "link-text": "Profile" },
  { "route-name": "admin", "link-text": "Dashboard" },
  { "route-name": "admin-calendar", "link-text": "Calendar" },
  { "route-name": "admin-notifications", "link-text": "Notifications" },
  { "route-name": "maintenance", "link-text": "Maintenance" },
  { "route-name": "admin-approvals", "link-text": "Approvals" },
];

const student = [
  { "route-name": "student-profile", "link-text": "Profile" },
  { "route-name": "student", "link-text": "Dashboard" },
  { "route-name": "student-flightPlan", "link-text": "Flight Plan" },
  { "route-name": "student-calendar", "link-text": "Calendar" },
  { "route-name": "student-notifications", "link-text": "Notifications" },
  { "route-name": "student-shop", "link-text": "Rewards" },
];

const role = ref("");
const route = useRoute();
const userId = ref(null);
const router = useRouter();
const showLogoutDialog = ref(false);
const isAdmin = ref(false);

onMounted(async () => {
  const store = userStore();

  isAdmin.value = await store.isAdmin();
  const isFaculty = await store.isFaculty();

  // Set the initial role based on authentication and role checks
  role.value = isAdmin.value ? "admin" : isFaculty ? "faculty" : "student";

  // Get the user ID from the store
  userId.value = store.user.userId;

  // Override role if the path explicitly starts with '/admin', '/faculty', or '/student'
  if (route.path.startsWith("/admin")) {
    role.value = "admin";
  } else if (route.path.startsWith("/faculty")) {
    role.value = "faculty";
  } else if (route.path.startsWith("/student")) {
    role.value = "student";
  }
});

const toggleView = () => {
  if (role.value === "admin") {
    router.push({ name: "student" });
    role.value = "student";
  } else {
    router.push({ name: "admin" });
    role.value = "admin";
  }
};

const getIcon = (linkText) => {
  const icons = {
    Profile: "mdi-account",
    Dashboard: "mdi-view-dashboard",
    "Flight Plan": "mdi-airplane",
    Calendar: "mdi-calendar",
    Notifications: "mdi-bell",
    Maintenance: "mdi-cog",
    Approvals: "mdi-check",
    "Rewards" : "mdi-cart",
  };


  return icons[linkText] || "mdi-circle"; // Default if not found
};

const handleLogout = async () => {
  try {
    // Clear user data from store
    const store = userStore();
    store.$reset();

    // Clear localStorage first
    localStorage.clear();

    try {
      // Try to notify backend of logout, but don't wait for response
      await apiClient.post("/auth/logout", { userId: userId.value });
    } catch (error) {
      // Ignore any errors from the logout API call
      console.log(
        "Logout API call failed, continuing with client-side logout",
        error,
      );
    }

    // Redirect to login page
    router.push({ name: "login" });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, try to redirect to login
    router.push({ name: "login" });
  }
};
</script>

<template>
  <v-container class="d-flex flex-column pa-2 userNav bg-secondary">
    <v-list
      v-if="role === 'admin'"
      class="pa-0 d-flex flex-column bg-secondary"
      style="height: 100%"
    >
      <div class="flex-grow-1">
        <div v-for="(item, index) in admin" :key="index">
          <v-list-item
            :to="
              item['link-text'] === 'Profile' && userId
                ? {
                    name: item['route-name'],
                    params: { userId: userId },
                  }
                : { name: item['route-name'] }
            "
            class="bg-secondary"
            exact
          >
            <div>
              <v-list-item-title
                class="text-body-1 font-weight-bold text-backgroundDarken"
              >
                <div class="nav-item-content">
                  <v-icon :size="32" color="backgroundDarken" class="mr-2">
                    {{ getIcon(item["link-text"]) }}
                  </v-icon>
                  <span class="nav-text text-backgroundDarken">{{
                    item["link-text"]
                  }}</span>
                </div>
              </v-list-item-title>
            </div>
          </v-list-item>
        </div>
      </div>
      <div class="mt-auto">
        <v-list-item v-if="isAdmin" class="bg-secondary" @click="toggleView">
          <div>
            <v-list-item-title
              class="text-body-1 font-weight-bold text-backgroundDarken"
            >
              <div class="nav-item-content">
                <v-icon :size="32" color="backgroundDarken" class="mr-2">
                  mdi-account-switch
                </v-icon>
                <span class="nav-text text-backgroundDarken">
                  To {{ role === "admin" ? "Student" : "Admin" }}
                </span>
              </div>
            </v-list-item-title>
          </div>
        </v-list-item>
        <v-list-item class="bg-secondary" @click="toggleTheme">
          <div>
            <v-list-item-title
              class="text-body-1 font-weight-bold text-backgroundDarken"
            >
              <div class="nav-item-content">
                <v-icon :size="32" color="backgroundDarken" class="mr-2">
                  {{ isDark ? "mdi-weather-sunny" : "mdi-weather-night" }}
                </v-icon>
                <span class="nav-text text-backgroundDarken">{{
                  isDark ? "Light Mode" : "Dark Mode"
                }}</span>
              </div>
            </v-list-item-title>
          </div>
        </v-list-item>
        <v-list-item class="bg-secondary" @click="showLogoutDialog = true">
          <div>
            <v-list-item-title
              class="text-body-1 font-weight-bold text-backgroundDarken"
            >
              <div class="nav-item-content">
                <v-icon :size="32" color="backgroundDarken" class="mr-2"
                  >mdi-logout</v-icon
                >
                <span class="nav-text text-backgroundDarken">Logout</span>
              </div>
            </v-list-item-title>
          </div>
        </v-list-item>
      </div>
    </v-list>

    <v-list
      v-if="role === 'student'"
      class="pa-0 d-flex flex-column bg-secondary"
      style="height: 100%"
    >
      <div class="flex-grow-1">
        <div v-for="(item, index) in student" :key="index">
          <v-list-item
            :to="
              item['link-text'] === 'Profile' && userId
                ? {
                    name: item['route-name'],
                    params: { userId: userId },
                  }
                : { name: item['route-name'] }
            "
            class="bg-secondary"
            exact
          >
            <div>
              <v-list-item-title
                class="text-body-1 font-weight-bold text-backgroundDarken"
              >
                <div class="nav-item-content">
                  <v-icon :size="32" color="backgroundDarken" class="mr-2">
                    {{ getIcon(item["link-text"]) }}
                  </v-icon>
                  <span class="nav-text text-backgroundDarken">{{
                    item["link-text"]
                  }}</span>
                </div>
              </v-list-item-title>
            </div>
          </v-list-item>
        </div>
      </div>
      <div class="mt-auto">
        <v-list-item v-if="isAdmin" class="bg-secondary" @click="toggleView">
          <div>
            <v-list-item-title
              class="text-body-1 font-weight-bold text-backgroundDarken"
            >
              <div class="nav-item-content">
                <v-icon :size="32" color="backgroundDarken" class="mr-2">
                  mdi-account-switch
                </v-icon>
                <span class="nav-text text-backgroundDarken">
                  To {{ role === "admin" ? "Student" : "Admin" }}
                </span>
              </div>
            </v-list-item-title>
          </div>
        </v-list-item>
        <v-list-item class="bg-secondary" @click="toggleTheme">
          <div>
            <v-list-item-title
              class="text-body-1 font-weight-bold text-backgroundDarken"
            >
              <div class="nav-item-content">
                <v-icon :size="32" color="backgroundDarken" class="mr-2">
                  {{ isDark ? "mdi-weather-sunny" : "mdi-weather-night" }}
                </v-icon>
                <span class="nav-text text-backgroundDarken">{{
                  isDark ? "Light Mode" : "Dark Mode"
                }}</span>
              </div>
            </v-list-item-title>
          </div>
        </v-list-item>
        <v-list-item class="bg-secondary" @click="showLogoutDialog = true">
          <div>
            <v-list-item-title
              class="text-body-1 font-weight-bold text-backgroundDarken"
            >
              <div class="nav-item-content">
                <v-icon :size="32" color="backgroundDarken" class="mr-2"
                  >mdi-logout</v-icon
                >
                <span class="nav-text text-backgroundDarken">Logout</span>
              </div>
            </v-list-item-title>
          </div>
        </v-list-item>
      </div>
    </v-list>

    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <ConfirmDialog
        v-model="showLogoutDialog"
        title="Are you sure you want to logout?"
        confirm-text="Logout"
        cancel-text="Cancel"
        confirm-color="danger"
        @confirm="handleLogout"
        @cancel="showLogoutDialog = false"
      />
    </v-dialog>
  </v-container>
</template>

<style>
/* Styling for the navigation bar */
.userNav .nav-item-content {
  display: flex;
  align-items: center;
}

.userNav .nav-text {
  display: none;
}

.userNav:hover .nav-text {
  display: inline;
}

.userNav {
  width: 80px;
  height: 98vh;
  transition: width 0.5s;
  border-top-right-radius: 25px;
  border-top-left-radius: 25px;
  margin: 2vh 2vh 0vh 2vh;
}

.userNav:hover {
  width: 200px;
  align-items: left;
}

.navOption {
  display: flex;
  align-items: center;
  margin: 3vh;
  white-space: nowrap;
}

.navOption p {
  font-size: 20px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.5s;
}

.userNav:hover .navOption p {
  opacity: 1;
}

.pi {
  padding-left: 5px;
  font-weight: 700;
  font-size: 30px;
  margin: 5px 15px 10px 0px;
}

@media screen and (max-width: 500px) {
  .userNav {
    width: 100vh;
    height: 60px;
    flex-direction: row;
  }
}

.userNav .mt-auto {
  margin-top: auto;
}
</style>
