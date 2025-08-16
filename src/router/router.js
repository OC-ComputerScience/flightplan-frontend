import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import TasksPage from "../views/admin/task/TasksPage.vue";
import EventCardPage from "../views/admin/EventsPage.vue";
import EventAddEditPage from "../views/admin/event/EventAddEditPage.vue";
import { userStore } from "../stores/userStore";
import NotFound from "../views/NotFound.vue";
import Unauthorized from "../views/Unauthorized.vue";
import TaskAddEditPage from "../views/admin/task/TaskAddEditPage.vue";
import BadgesPage from "../views/admin/badge/BadgesPage.vue";
import BadgeAddEditPage from "../views/admin/badge/BadgeAddEditPage.vue";
import ExperienceAddEditPage from "../views/admin/experience/ExperienceAddEditPage.vue";
import ExperiencesPage from "../views/admin/ExperiencesPage.vue";
import RewardPage from "../views/admin/reward/RewardPage.vue";
import RewardAddEditPage from "../views/admin/reward/RewardAddEditPage.vue";
import RewardRedemptionPage from "../views/admin/reward/RewardRedemptionPage.vue";
import MaintenanceLandingPage from "../views/admin/MaintenanceLandingPage.vue";
import MajorsPage from "../views/admin/major/MajorsPage.vue";
import MajorAddEditPage from "../views/admin/major/MajorAddEditPage.vue";
import Profile from "../views/Profile.vue";
import Notifications from "../views/Notification.vue";

import AdminDashboard from "../views/admin/AdminDashboard.vue";
import AdminCalendar from "../views/admin/AdminCalendar.vue";
import AdminUserPage from "../views/admin/user/AdminUserPage.vue";
import UserAddEditPage from "../views/admin/user/UserAddEditPage.vue";
import Approvals from "../views/admin/Approvals.vue";

import StudentDashboard from "../views/student/StudentDashboard.vue";
import StudentCalendar from "../views/student/StudentCalendar.vue";
import StudentEventCheckIn from "../views/student/StudentEventCheckIn.vue";
import StudentShop from "../views/student/StudentShop.vue";
import StudentBadges from "../views/student/StudentBadges.vue";

import FacultyLanding from "../views/faculty/FacultyLanding.vue";
import FacultyCalendar from "../views/faculty/FacultyCalendar.vue";
import FacultyFlightPlan from "../views/faculty/FacultyFlightPlan.vue";
import FlightPlan from "../views/FlightPlan.vue";
import AddFlightPlanItem from "../views/admin/flightPlan/AddFlightPlanItem.vue";
import EventAttendancePage from "../views/admin/event/EventAttendancePage.vue";

const adminRoutes = [
  {
    path: "calendar",
    name: "admin-calendar",
    component: AdminCalendar,
    props: { isAdmin: true },
  },
  {
    path: "notifications",
    name: "admin-notifications",
    component: Notifications,
  },
  {
    path: "dashboard",
    name: "admin-dashboard",
    component: AdminDashboard,
  },
  {
    path: "profile",
    name: "admin-profile",
    component: Profile,
  },
  {
    path: "approvals/:id?",
    name: "admin-approvals",
    component: Approvals,
  },
];

const adminTaskRoutes = [
  {
    path: "maintenance/task",
    name: "task",
    component: TasksPage,
  },
  {
    path: "maintenance/task/edit/:id",
    name: "editTask",
    component: TaskAddEditPage,
    props: { isAdd: false },
  },
  {
    path: "maintenance/task/add",
    name: "addTask",
    component: TaskAddEditPage,
    props: { isAdd: true },
  },
];

const adminRewardRoutes = [
  {
    path: "maintenance/reward",
    name: "reward",
    component: RewardPage,
  },
  {
    path: "maintenance/reward/edit/:id",
    name: "editReward",
    component: RewardAddEditPage,
    props: { isAdd: false },
  },
  {
    path: "maintenance/reward/add",
    name: "addReward",
    component: RewardAddEditPage,
    props: { isAdd: true },
  },
  {
    path: "maintenance/reward/redeem/:studentId",
    name: "redeemReward",
    component: RewardRedemptionPage,
  },
];

const adminExperienceRoutes = [
  {
    path: "maintenance/experience",
    name: "experience",
    component: ExperiencesPage,
  },
  {
    path: "maintenance/experience/edit/:id",
    name: "editExperience",
    component: ExperienceAddEditPage,
    props: { isAdd: false },
  },
  {
    path: "maintenance/experience/add",
    name: "addExperience",
    component: ExperienceAddEditPage,
    props: { isAdd: true },
  },
];

const adminEventRoutes = [
  {
    path: "maintenance/event",
    name: "event",
    component: EventCardPage,
  },
  {
    path: "maintenance/event/edit/:id",
    name: "editEvent",
    component: EventAddEditPage,
    props: { isAdd: false },
  },
  {
    path: "maintenance/event/add/:date?",
    name: "addEvent",
    component: EventAddEditPage,
    props: { isAdd: true },
  },
  {
    path: "maintenance/event/attendance/:id",
    name: "attendanceEvent",
    component: EventAttendancePage,
  },
];

const adminBadgeRoutes = [
  {
    path: "maintenance/badge",
    name: "badge",
    component: BadgesPage,
  },
  {
    path: "maintenance/badge/edit/:id",
    name: "editBadge",
    component: BadgeAddEditPage,
    props: { isAdd: false },
  },
  {
    path: "maintenance/badge/add",
    name: "addBadge",
    component: BadgeAddEditPage,
    props: { isAdd: true },
  },
];

const adminFlightPlanRoutes = [
  {
    path: "maintenance/user/studentFlightPlan/:id",
    name: "adminStudentFlightPlan",
    component: FlightPlan,
    props: { isAdmin: true },
  },
  {
    path: "user/:studentName/flightPlan/:id/add",
    name: "addItemToFlightPlan",
    component: AddFlightPlanItem,
  },
];
const adminMajorRoutes = [
  {
    path: "maintenance/major",
    name: "majors",
    component: MajorsPage,
  },
  {
    path: "maintenance/major/edit/:id",
    name: "editMajor",
    component: MajorAddEditPage,
    props: { isAdd: false },
  },
  {
    path: "maintenance/major/add",
    name: "addMajor",
    component: MajorAddEditPage,
    props: { isAdd: true },
  },
];

const adminMaintenanceRoutes = [
  {
    path: "maintenance",
    name: "maintenance",
    component: MaintenanceLandingPage,
  },
  {
    path: "maintenance/user",
    name: "user",
    component: AdminUserPage,
  },
  {
    path: "maintenanc/user/edit/:id",
    name: "editUser",
    component: UserAddEditPage,
    props: { isAdd: false, isAdmin: true },
  },
  {
    path: "user/profile/:userId",
    name: "adminProfile",
    component: Profile,
    props: { isAdmin: true },
  },
  {
    path: "profile/:id/edit",
    name: "adminEditProfile",
    beforeEnter: isCorrectUserOrAdmin,
    component: UserAddEditPage,
    props: { isAdd: false, isAdmin: true },
  },
  ...adminTaskRoutes,
  ...adminRewardRoutes,
  ...adminExperienceRoutes,
  ...adminEventRoutes,
  ...adminBadgeRoutes,
  ...adminFlightPlanRoutes,
  ...adminMajorRoutes,
];

const facultyRoutes = [
  {
    path: "calendar",
    name: "faculty-calendar",
    component: FacultyCalendar,
  },
  {
    path: "flightPlan",
    name: "faculty-flightPlan",
    component: FacultyFlightPlan,
  },
  {
    path: "notifications",
    name: "faculty-notifications",
    component: Notifications,
  },
  {
    path: "faculty-profile/:userId",
    name: "faculty-profile",
    component: Profile,
  },
];

const studentRoutes = [
  {
    path: "calendar",
    name: "student-calendar",
    component: StudentCalendar,
    props: { isAdmin: false },
  },
  {
    path: "flightPlan",
    name: "student-flightPlan",
    component: FlightPlan,
    props: { isAdmin: false },
  },
  {
    path: "dashboard",
    name: "student-dashboard",
    component: StudentDashboard,
  },
  {
    path: "notifications",
    name: "student-notifications",
    component: Notifications,
  },
  {
    path: "profile/:userId",
    name: "student-profile",
    component: Profile,
  },
  {
    path: "profile/:id/edit",
    name: "studentEditProfile",
    beforeEnter: isCorrectUserOrAdmin,
    component: UserAddEditPage,
    props: { isAdd: false },
  },
  {
    path: "event/checkIn/:eventToken",
    name: "studentEventCheckin",
    component: StudentEventCheckIn,
    props: true,
  },
  {
    path: "shop",
    name: "student-shop",
    component: StudentShop,
  },
  {
    path: "badges",
    name: "studentBadges",
    component: StudentBadges,
  },
];
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Authentication Routes
    {
      path: "/",
      alias: "/login",
      name: "login",
      component: Login,
    },

    // Admin Routes
    {
      path: "/admin",
      name: "admin",
      beforeEnter: isAdmin,
      redirect: { name: "admin-dashboard" },
      children: [...adminRoutes, ...adminMaintenanceRoutes],
    },

    // Faculty Routes
    {
      path: "/faculty",
      name: "faculty",
      component: FacultyLanding,
      beforeEnter: isFaculty,
      children: [...facultyRoutes],
    },

    // Student Routes
    {
      path: "/student",
      name: "student",
      redirect: { name: "student-dashboard" },
      children: [...studentRoutes],
    },

    // Error Routes
    {
      path: "/:pathMatch(.*)*",
      component: NotFound,
    },
    {
      path: "/Unauthorized",
      name: "unauthorized",
      component: Unauthorized,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const store = userStore();
  const isAuthenticated = await store.isAuthenticated();
  if (!isAuthenticated) {
    if (to.path !== "/login" && to.path !== "/") {
      // Store the intended destination in localStorage
      localStorage.setItem("redirectAfterLogin", to.fullPath);
      next({ name: "login" });
    } else {
      next();
    }
  } else {
    const redirectPath = localStorage.getItem("redirectAfterLogin");
    if (from.path === "/" && redirectPath) {
      // Check if there's a stored redirect path
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        next(redirectPath);
      } else {
        next(await loginRedirect());
      }
    } else if (!redirectPath) {
      next();
    } else {
      next();
    }
  }
});

export async function loginRedirect() {
  const store = userStore();
  if (await store.isAdmin()) {
    return { name: "admin" };
  } else if (await store.isFaculty()) {
    return { name: "faculty" };
  } else {
    return { name: "student" };
  }
}

async function isCorrectUserOrAdmin(to) {
  const store = userStore();
  const userId = to.params.id;
  const response =
    (await store.user.userId) == userId || (await store.isAdmin())
      ? true
      : { name: "unauthorized" };
  return response;
}
async function isAdmin() {
  const store = userStore();
  const response = (await store.isAdmin()) ? true : { name: "unauthorized" };
  return response;
}
async function isFaculty() {
  const store = userStore();
  const response = (await store.isFaculty()) ? true : { name: "unauthorized" };
  return response;
}

export default router;
