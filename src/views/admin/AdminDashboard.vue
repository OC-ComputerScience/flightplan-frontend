<script setup>
import eventServices from "../../services/eventServices";
import notificationServices from "../../services/notificationServices";
import EventCard from "../../components/cards/EventCard.vue";
import { userStore } from "../../stores/userStore";
import { onMounted, ref, computed } from "vue";
import { useNotificationStore } from "../../stores/notificationStore";
import { useTheme } from "vuetify";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "vue-chartjs";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const events = ref([]);
const notifications = ref([]);
const isLoaded = ref(false);
const store = userStore();
const notifStore = useNotificationStore();
const currentPage = ref(1);
const pageSize = ref(14);
const totalPages = ref(1);

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const getChartColors = () => {
  if (isDark.value) {
    return {
      primary: "rgba(17, 138, 203, 1)", // primary
      secondary: "rgba(213, 223, 231, 1)", // secondary
      accent: "rgba(244, 236, 208, 1)", // accent
      warning: "rgba(249, 198, 51, 1)", // warning
    };
  } else {
    return {
      primary: "rgba(17, 138, 203, 1)", // primary
      secondary: "rgba(53, 56, 65, 1)", // secondary
      accent: "rgba(244, 236, 208, 1)", // accent
      warning: "rgba(249, 198, 51, 1)", // warning
    };
  }
};

// Chart data
const engagementData = ref({
  labels: ["Freshman", "Sophomore", "Junior", "Senior"],
  datasets: [
    {
      label: "Completed Flight Plan Items",
      data: [45, 65, 80, 90],
      backgroundColor: computed(() => [
        getChartColors().primary,
        getChartColors().secondary,
        getChartColors().accent,
        getChartColors().warning,
      ]),
      borderColor: computed(() => [
        getChartColors().primary,
        getChartColors().secondary,
        getChartColors().accent,
        getChartColors().warning,
      ]),
      borderWidth: 2,
      hoverOffset: 15,
      weight: 1,
    },
  ],
});

const onTrackData = ref({
  labels: ["Freshman", "Sophomore", "Junior", "Senior"],
  datasets: [
    {
      label: "Students On Track (%)",
      data: [60, 75, 85, 90],
      backgroundColor: computed(() => [
        getChartColors().primary,
        getChartColors().primary,
        getChartColors().primary,
        getChartColors().primary,
      ]),
      borderColor: computed(() => [
        getChartColors().primary,
        getChartColors().primary,
        getChartColors().primary,
        getChartColors().primary,
      ]),
      borderWidth: 2,
    },
  ],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "white",
        font: {
          size: 14,
        },
      },
    },
    title: {
      display: true,
      text: "Engagement by Classification",
      color: "white",
      font: {
        size: 16,
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.raw;
          return `${label}: ${value}%`;
        },
      },
    },
  },
  cutout: "60%", // Creates a donut chart effect
  rotation: -45, // Rotates the chart for better visual effect
  animation: {
    animateScale: true,
    animateRotate: true,
  },
  elements: {
    arc: {
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.3)",
      shadowColor: "rgba(0, 0, 0, 0.5)",
      shadowBlur: 10,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    },
  },
};

const onTrackOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "white",
        font: {
          size: 14,
        },
      },
    },
    title: {
      display: true,
      text: "Students On Track by Classification",
      color: "white",
      font: {
        size: 16,
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.dataset.label || "";
          const value = context.raw;
          return `${label}: ${value}%`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: "Percentage",
        color: "white",
      },
      ticks: {
        color: "white",
        callback: function (value) {
          return value + "%";
        },
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
    },
    x: {
      ticks: {
        color: "white",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
    },
  },
};

const getEvents = async () => {
  await eventServices
    .getAllEvents()
    .then((res) => {
      events.value = res.data.events;
      isLoaded.value = true;
    })
    .catch((err) => console.error(err));
};

const getNotifications = async (page = 1) => {
  try {
    const res = await notificationServices.getAllNotificationsForUser(
      store.user.userId,
      page,
      pageSize.value,
    );
    notifications.value = res.data.notifications;
    totalPages.value = Math.ceil(res.data.total / pageSize.value);
    currentPage.value = page;
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
};

const openNotification = (x) => {
  notifStore.setActiveNotification(x);
};

onMounted(() => {
  getEvents();
  getNotifications();
});
</script>

<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <div class="dashboard-row">
        <v-card color="backgroundDarken" class="adminItem adminItemSmall">
          <strong style="font-size: 20px; padding-bottom: 5px"
            >Upcoming Events</strong
          >
          <div class="scrollable-content">
            <EventCard
              v-for="(item, index) in events.splice(0, 2)"
              :key="index"
              :event="item"
              :view-only="true"
              color="background"
              :is-event-viewing="false"
              :to="{ name: 'admin-calendar' }"
            ></EventCard>
          </div>
          <v-btn
            variant="text"
            class="see-more-btn"
            :to="{ name: 'admin-calendar' }"
          >
            See More...
          </v-btn>
        </v-card>
        <v-card color="backgroundDarken" class="adminItem adminItemBig">
          <Pie
            :data="engagementData"
            :options="chartOptions"
            style="height: 100%; width: 100%"
          />
        </v-card>
      </div>
      <div class="dashboard-row">
        <v-card color="backgroundDarken" class="adminItem adminItemSmall">
          <strong style="font-size: 20px; padding-bottom: 5px"
            >Notifications</strong
          >
          <div id="notifList" class="scrollable-content">
            <v-card
              v-for="(item, index) in notifications.slice(0, 3)"
              :key="index"
              :to="{ name: 'admin-notifications' }"
              class="notification"
              color="background"
              @click="openNotification(item.id)"
            >
              <div style="display: flex; align-items: center">
                <img
                  style="height: 30px; margin-right: 5px"
                  src="../../../public/Birb.png"
                />
                <div>
                  <strong style="font-size: 18px">{{ item.header }}</strong>
                  <p style="font-size: 14px">{{ item.description }}</p>
                </div>
              </div>
            </v-card>
          </div>
          <v-btn
            variant="text"
            class="see-more-btn"
            :to="{ name: 'admin-notifications' }"
          >
            See More...
          </v-btn>
        </v-card>
        <v-card color="backgroundDarken" class="adminItem adminItemBig">
          <Bar
            :data="onTrackData"
            :options="onTrackOptions"
            style="height: 100%; width: 100%"
          />
        </v-card>
      </div>
    </div>
  </div>
</template>

<style>
.dashboard-wrapper {
  height: 85vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20px;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  max-width: 95vw;
}

.dashboard-row {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.adminItem {
  display: flex;
  flex-direction: column;
  text-align: left;
  height: 45vh;
  padding: 1vh 1vw;
  border-radius: 25px;
  overflow: hidden;
}

.adminItemSmall {
  width: 35vw;
}

.adminItemBig {
  justify-content: center;
  align-items: center;
  width: 45vw;
}

.see-more-btn {
  text-align: center;
  width: 100%;
}

.notification {
  margin: 10px 5px 10px 5px;
  height: 6vh;
  width: 100%;
}
</style>
