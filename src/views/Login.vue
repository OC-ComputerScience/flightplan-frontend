<script setup>
import { ref, onMounted, computed } from "vue";
import eagle from "/Birb.png";
import { useDisplay } from "vuetify";
import SocialLogin from "../components/SocialLogin.vue";
import StudentOnboarding from "../components/StudentOnboarding.vue";
import { useRouter } from "vue-router";
import { userStore } from "../stores/userStore";
import studentServices from "../services/studentServices";
import { loginRedirect } from "../router/router.js";

const router = useRouter();
const store = userStore();

const eagleSrc = ref("");
const showOnboarding = ref(false);

const handleLoginSuccess = async (userData) => {
  try {
    // Skip onboarding for admin users
    if (await store.isAdmin()) {
      const redirect = await loginRedirect();
      router.push(redirect);
      return;
    }

    // Check if student exists and has completed onboarding
    const response = await studentServices.getStudentForUserId(userData.userId);
    if (!response.data?.graduationDate || !response.data?.semestersFromGrad) {
      showOnboarding.value = true;
    } else {
      const redirect = await loginRedirect();
      router.push(redirect);
    }
  } catch {
    // If student doesn't exist, show onboarding
    showOnboarding.value = true;
  }
};

onMounted(() => {
  eagleSrc.value = eagle;
});

// Get the display settings from Vuetify
const { smAndDown } = useDisplay();

// Computed property that returns true if the screen is mobile-sized
const isMobile = computed(() => smAndDown.value);
</script>

<template>
  <v-container fluid class="fill-height mx-auto">
    <v-row class="fill-height login-container justify-center">
      <!-- First Column -->
      <v-col v-if="!isMobile" class="d-flex flex-column" cols="5" xl="4">
        <v-card
          class="elevation-0 flex-grow-1 rounded-xl"
          color="backgroundDarken"
        >
          <v-col class="fill-height d-flex flex-column">
            <v-spacer></v-spacer>
            <v-img class="mb-n16 ml-n16" :src="eagleSrc" />
          </v-col>
        </v-card>
      </v-col>

      <!-- Second Column -->
      <v-col class="d-flex flex-column" cols="12" md="4" xl="3">
        <v-card
          v-if="!showOnboarding"
          class="elevation-0 flex-grow-1 rounded-xl h-25 pa-3"
          color="backgroundDarken"
        >
          <v-col class="fill-height d-flex flex-column">
            <p class="text-h6">Career Services:</p>
            <p class="text-h2 font-weight-bold">
              Eagle <br />
              Flight Plan
            </p>
            <br />
            <v-spacer></v-spacer>
            <p class="text-h5">The World Awaits Your Story</p>
          </v-col>
        </v-card>
        <v-card
          v-if="!showOnboarding"
          class="elevation-0 flex-grow-1 mt-5 rounded-xl"
          color="backgroundDarken"
        >
          <v-col
            class="h-75 mt-6 d-flex flex-column align-center justify-center"
          >
            <v-spacer />
            <p class="text-center">Log in with Google to get started</p>
            <v-spacer />
            <v-card
              class="elevation-0 h-auto py-7 px-6 rounded-lg"
              color="#ffffff"
            >
              <SocialLogin @login-success="handleLoginSuccess" />
            </v-card>
            <v-spacer />
          </v-col>
        </v-card>
        <transition name="slide-fade" mode="out-in">
          <StudentOnboarding v-if="showOnboarding" />
        </transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.login-container {
  max-height: 800px;
}

/* Enter and leave animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
