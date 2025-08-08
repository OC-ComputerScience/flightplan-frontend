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
import flightPlanServices from "../services/flightPlanServices.js";

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
    let studentResponse = await studentServices.getStudentForUserId(
      userData.userId,
    );
    if (
      !studentResponse.data?.graduationDate ||
      !studentResponse.data?.semestersFromGrad
    ) {
      showOnboarding.value = true;
    } else {
      // Check if student has a flight plan for their current semester from graduation if they have not graduated
      const flightPlanForCurrentSemester = (
        await flightPlanServices.getFlightPlanForStudentAndSemester(
          studentResponse.data.id,
          studentResponse.data.semestersFromGrad,
        )
      ).data;
      if (!flightPlanForCurrentSemester.id) {
        // If no flight plan, generate one
        generateNewFlightPlan(studentResponse.data);
      } else {
        // Else check semester end
        await studentServices.checkStudentSemesterFromGraduation(
          studentResponse.data.id,
        );
        const checkStudentResponse = (
          await studentServices.getStudentForUserId(userData.userId)
        ).data;

        // If student's semester from graduation was updated
        if (
          checkStudentResponse?.semestersFromGrad &&
          checkStudentResponse.semestersFromGrad !==
            studentResponse.data.semestersFromGrad
        ) {
          // Generate a new flight plan
          generateNewFlightPlan(checkStudentResponse);
        }
      }

      const redirect = await loginRedirect();
      router.push(redirect);
    }
  } catch {
    // If student doesn't exist, show onboarding
    showOnboarding.value = true;
  }
};

const generateNewFlightPlan = async (student) => {
  if (student.semestersFromGrad > 0) {
    try {
      await flightPlanServices.generateFlightPlan(student.id);
    } catch (error) {
      console.error("Error generating flight plan: ", error);
    }
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
      <v-col v-if="!isMobile" class="d-flex flex-column" cols="6" xl="4">
      </v-col>

      <!-- Second Column -->
      <v-col class="d-flex flex-column" cols="12" sm="10" md="4" xl="3">
        <v-card
          v-if="!showOnboarding"
          class="elevation-0 flex-grow-1 rounded-xl h-50 pa-3"
          style="background-color: rgba(var(--v-theme-backgroundDarken), 0.8)"
        >
          <v-col class="fill-height d-flex flex-column">
            <p class="text-h3">Career Services:</p>
            <p class="text-h1 font-weight-bold">
              Eagle <br />
              Flight Plan
            </p>
            <br />
            <v-spacer></v-spacer>
            <p class="text-h4">The World Awaits Your Story</p>
          </v-col>
        </v-card>
        <v-card
          v-if="!showOnboarding"
          class="elevation-0 flex-grow-1 mt-5 rounded-xl"
          style="background-color: rgba(var(--v-theme-backgroundDarken), 0.8)"
        >
          <v-col
            class="h-75 mt-6 d-flex flex-column align-center justify-center"
          >
            <v-spacer />
            <p class="text-h5 text-center">Log in with Google to get started</p>
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
  background-image: url("../assets/eagle-login-background.jpg");
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  margin-left: -10px;
  box-shadow: 20 8px 12px rgba(0, 0, 0, 20);
  overflow: hidden;
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
