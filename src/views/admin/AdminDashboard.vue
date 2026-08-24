<script setup>
import eventServices from "../../services/eventServices";
import notificationServices from "../../services/notificationServices";
import statisticsServices from "../../services/statisticsServices";
import semesterServices from "../../services/semesterServices";
import EventCard from "../../components/cards/EventCard.vue";
import { userStore } from "../../stores/userStore";
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";
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
import { getEventCardColor } from "../../utils/eventStatus";

const props = defineProps({
  hideNotifications: {
    type: Boolean,
    default: false,
  },
});

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
const route = useRoute();
const upcomingEvents = computed(() => events.value.slice(0, 6));
const calendarRouteName = computed(() =>
  route.path.startsWith("/faculty") ? "faculty-calendar" : "admin-calendar",
);
const notifStore = useNotificationStore();
const currentPage = ref(1);
const pageSize = ref(14);
const totalPages = ref(1);
const semesters = ref([]);
const selectedSemesterId = ref(null);

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const getChartColors = () => {
  if (isDark.value) {
    return {
      primary: "rgba(17, 138, 203, 1)", // primary
      secondary: "rgba(213, 223, 231, 1)", // secondary
      tertiary: "rgba(255, 99, 132, 1)", // tertiary
      accent: "rgba(244, 236, 208, 1)", // accent
      warning: "rgba(249, 198, 51, 1)", // warning
    };
  } else {
    return {
      primary: "rgba(17, 138, 203, 1)", // primary
      secondary: "rgba(53, 56, 65, 1)", // secondary
      tertiary: "rgba(255, 99, 132, 1)", // tertiary
      accent: "rgba(244, 236, 208, 1)", // accent
      warning: "rgba(249, 198, 51, 1)", // warning
    };
  }
};

// Chart data
const studentCountsData = ref([]);
const studentSemesterCount = ref(0);

const engagementData = computed(() => {
  // Group data into ranges: 1-2, 3-6, 7-10, 11-15, 16-20
  const groupedData = {
    "1-2": 0,
    "3-6": 0,
    "7-10": 0,
    "11-15": 0,
    "16-20": 0,
  };

  studentCountsData.value.forEach((item) => {
    const count = item.fpItemCount;
    const students = item.numOfStudents;

    if (count >= 1 && count <= 2) {
      groupedData["1-2"] += students;
    } else if (count >= 3 && count <= 6) {
      groupedData["3-6"] += students;
    } else if (count >= 7 && count <= 10) {
      groupedData["7-10"] += students;
    } else if (count >= 11 && count <= 15) {
      groupedData["11-15"] += students;
    } else if (count >= 16 && count <= 20) {
      groupedData["16-20"] += students;
    }
  });

  const labels = Object.keys(groupedData);
  const data = Object.values(groupedData);

  return {
    labels,
    datasets: [
      {
        label: "Students by Number of Completed Flight Plan Items",
        data,
        backgroundColor: [
          getChartColors().primary,
          getChartColors().warning,
          getChartColors().secondary,
          getChartColors().accent,
          getChartColors().tertiary,
        ],
        borderColor: [
          getChartColors().primary,
          getChartColors().warning,
          getChartColors().secondary,
          getChartColors().accent,
          getChartColors().tertiary,
        ],
        borderWidth: 2,
        hoverOffset: 15,
        weight: 1,
      },
    ],
  };
});

const onTrackData = computed(() => {
  return {
    labels: ["Active Students This Semester"],
    datasets: [
      {
        label: "Number of Students",
        data: [studentSemesterCount.value],
        backgroundColor: [getChartColors().primary],
        borderColor: [getChartColors().primary],
        borderWidth: 2,
      },
    ],
  };
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
      display: false,
      text: "Students by Number of Completed Flight Plan Items",
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
          return `${label} items: ${value} students`;
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
      display: false,
      text: "Active Students in Selected Semester",
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
          return `${label}: ${value} students`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Number of Students",
        color: "white",
      },
      ticks: {
        color: "white",
        stepSize: 1,
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
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const res = await eventServices.getAllEvents(1, 1000, "", {
      startDate: startOfToday,
      sortAttribute: "date",
      sortDirection: "ASC",
    });
    events.value = (res.data?.events || [])
      .filter((event) => {
        if (
          event.status === "Cancelled" ||
          event.status === "Completed" ||
          event.status === "Past"
        ) {
          return false;
        }

        const eventDate = new Date(event.date);
        if (eventDate.toDateString() === now.toDateString()) {
          return new Date(event.endTime) > now;
        }
        return eventDate > startOfToday;
      })
      .sort((a, b) => {
        const dateDiff = new Date(a.date) - new Date(b.date);
        if (dateDiff !== 0) return dateDiff;
        return new Date(a.startTime) - new Date(b.startTime);
      });
  } catch (err) {
    console.error("Error fetching upcoming events:", err);
    events.value = [];
  } finally {
    isLoaded.value = true;
  }
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

const getStudentCounts = async () => {
  try {
    const res = await statisticsServices.getStudentCountsForCompletedItems(
      selectedSemesterId.value,
    );
    studentCountsData.value = res.data.studentCounts || [];
  } catch (err) {
    console.error("Error fetching student counts:", err);
    studentCountsData.value = [];
  }
};

const getStudentSemesterCount = async () => {
  try {
    const res = await statisticsServices.getStudentSemesterCount(
      selectedSemesterId.value,
    );
    studentSemesterCount.value = res.data.studentCount || 0;
  } catch (err) {
    console.error("Error fetching student semester count:", err);
    studentSemesterCount.value = 0;
  }
};

const openNotification = (x) => {
  notifStore.setActiveNotification(x);
};

const loadSemesters = async () => {
  try {
    const res = await semesterServices.getAllSemestersUnfiltered();
    semesters.value = res.data || [];
    if (!selectedSemesterId.value && semesters.value.length > 0) {
      const currentSemester = semesters.value.find((semester) => {
        const now = new Date();
        return (
          new Date(semester.startDate) <= now && new Date(semester.endDate) >= now
        );
      });
      selectedSemesterId.value = currentSemester?.id || semesters.value[0].id;
    }
  } catch (err) {
    console.error("Error fetching semesters:", err);
    semesters.value = [];
  }
};

const semesterOptions = computed(() =>
  semesters.value.map((semester) => ({
    title: `${semester.term.charAt(0).toUpperCase()}${semester.term.slice(1)} ${semester.year}`,
    value: semester.id,
  })),
);

const handleSemesterChange = async () => {
  await getStudentCounts();
  if (!props.hideNotifications) {
    await getStudentSemesterCount();
  }
};

onMounted(async () => {
  await loadSemesters();
  getEvents();
  if (!props.hideNotifications) {
    getNotifications();
    await getStudentSemesterCount();
  }
  await getStudentCounts();
});
</script>

<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <div class="header-ui-section">
        <h2 class="text-h4 font-weight-bold mb-2">
          Welcome, {{ store.user ? store.user.fullName : "User" }}!
        </h2>
      </div>
      <div class="dashboard-row">
        <v-card color="backgroundDarken" class="adminItem adminItemSmall">
          <strong style="font-size: 20px; padding-bottom: 5px"
            >Upcoming Events</strong
          >
          <div class="scrollable-content">
            <EventCard
              v-for="item in upcomingEvents"
              :key="item.id"
              :event="item"
              :view-only="true"
              :no-actions="true"
              :status-label="getEventCardColor(item, [], [], [])"
            ></EventCard>
            <p v-if="isLoaded && upcomingEvents.length === 0" class="mt-2">
              No upcoming events.
            </p>
          </div>
          <v-btn
            variant="text"
            class="see-more-btn"
            :to="{ name: calendarRouteName }"
          >
            See More...
          </v-btn>
        </v-card>
        <v-card color="backgroundDarken" class="adminItem adminItemBig">
          <div class="chart-header">
            <strong class="chart-title">
              Students by Number of Completed Flight Plan Items
            </strong>
            <v-select
              v-model="selectedSemesterId"
              :items="semesterOptions"
              item-title="title"
              item-value="value"
              label="Semester"
              variant="solo"
              rounded="lg"
              density="compact"
              class="chart-semester-select"
              @update:model-value="handleSemesterChange"
            />
          </div>
          <div class="chart-body">
            <Pie
              :data="engagementData"
              :options="chartOptions"
              style="height: 100%; width: 100%"
            />
          </div>
        </v-card>
      </div>
      <div class="dashboard-row">
        <v-card
          v-if="!props.hideNotifications"
          color="backgroundDarken"
          class="adminItem adminItemSmall"
        >
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
        <v-card
          v-if="!props.hideNotifications"
          color="backgroundDarken"
          :class="[
            'adminItem',
            props.hideNotifications ? 'adminItemWide' : 'adminItemBig',
          ]"
        >
          <div class="chart-header">
            <strong class="chart-title">
              Active Students in Selected Semester
            </strong>
            <v-select
              v-model="selectedSemesterId"
              :items="semesterOptions"
              item-title="title"
              item-value="value"
              label="Semester"
              variant="solo"
              rounded="lg"
              density="compact"
              class="chart-semester-select"
              @update:model-value="handleSemesterChange"
            />
          </div>
          <div class="chart-body">
            <Bar
              :data="onTrackData"
              :options="onTrackOptions"
              style="height: 100%; width: 100%"
            />
          </div>
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

.semester-filter-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.semester-select {
  max-width: 320px;
}

.header-ui-section {
  display: flex;
  flex-direction: column;
}

.chart-header {
  width: 100%;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-title {
  display: block;
  font-size: 16px;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-text));
  font-weight: 700;
}

.chart-semester-select {
  max-width: 320px;
  width: 100%;
}

.chart-body {
  flex: 1;
  min-height: 0;
  width: 100%;
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

.scrollable-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.adminItemSmall {
  width: 35vw;
}

.adminItemBig {
  justify-content: flex-start;
  align-items: stretch;
  width: 45vw;
}

.adminItemWide {
  justify-content: flex-start;
  align-items: stretch;
  width: 80vw;
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
