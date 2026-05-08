import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import TasksPage from "../views/admin/task/TasksPage.vue";
import EventCardPage from "../views/admin/event/EventsPage.vue";
import { userStore } from "../stores/userStore";
import NotFound from "../views/NotFound.vue";
import Unauthorized from "../views/Unauthorized.vue";
import BadgesPage from "../views/admin/badge/BadgesPage.vue";
import ExperiencesPage from "../views/admin/experience/ExperiencesPage.vue";
import RewardPage from "../views/admin/reward/RewardPage.vue";
import RewardRedemptionPage from "../views/admin/reward/RewardRedemptionPage.vue";

import MajorsPage from "../views/admin/major/MajorsPage.vue";
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

import FlightPlan from "../views/FlightPlan.vue";
import AddFlightPlanItem from "../views/admin/flightPlan/AddFlightPlanItem.vue";
import EventAttendancePage from "../views/admin/event/EventAttendancePage.vue";
import FacultyTaskCompletion from "../views/faculty/FacultyTaskCompletion.vue";
import FacultyStudentLookup from "../views/faculty/FacultyStudentLookup.vue";

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
];

const adminRewardRoutes = [
  {
    path: "maintenance/reward",
    name: "reward",
    component: RewardPage,
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
];

const adminEventRoutes = [
  {
    path: "maintenance/event",
    name: "event",
    component: EventCardPage,
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
];

const adminMaintenanceRoutes = [

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
    component: AdminCalendar,
    props: { isAdmin: true },
  },
  {
    path: "dashboard",
    name: "faculty-dashboard",
    component: AdminDashboard,
    props: { hideNotifications: true },
  },
  {
    path: "notifications",
    name: "faculty-notifications",
    component: Notifications,
  },
  {
    path: "approvals/:id?",
    name: "faculty-approvals",
    component: Approvals,
  },
  {
    path: "profile/:userId",
    name: "faculty-profile",
    component: Profile,
  },
  {
    path: "task-completion",
    name: "faculty-taskCompletion",
    component: FacultyTaskCompletion,
  },
  {
    path: "experiences",
    name: "faculty-experienceList",
    component: ExperiencesPage,
    props: { readOnly: true },
  },
  {
    path: "student-lookup",
    name: "faculty-studentLookup",
    component: FacultyStudentLookup,
  },
];

const facultyTaskRoutes = [
  {
    path: "tasks",
    name: "faculty-task",
    component: TasksPage,
    props: { readOnly: true },
  },
];

const facultyRewardRoutes = [
  {
    path: "maintenance/reward",
    name: "faculty-reward",
    component: RewardPage,
  },
  {
    path: "maintenance/reward/redeem/:studentId",
    name: "faculty-redeemReward",
    component: RewardRedemptionPage,
  },
];

const facultyExperienceRoutes = [
  {
    path: "maintenance/experience",
    name: "faculty-experience",
    component: ExperiencesPage,
  },
];

const facultyEventRoutes = [
  {
    path: "maintenance/event",
    name: "faculty-event",
    component: EventCardPage,
  },
  {
    path: "maintenance/event/attendance/:id",
    name: "faculty-attendanceEvent",
    component: EventAttendancePage,
  },
];

const facultyBadgeRoutes = [
  {
    path: "maintenance/badge",
    name: "faculty-badge",
    component: BadgesPage,
  },
];

const facultyFlightPlanRoutes = [
  {
    path: "maintenance/user/studentFlightPlan/:id",
    name: "faculty-studentFlightPlan",
    component: FlightPlan,
    props: { isAdmin: true },
  },
  {
    path: "user/:studentName/flightPlan/:id/add",
    name: "faculty-addItemToFlightPlan",
    component: AddFlightPlanItem,
  },
];

const facultyMajorRoutes = [
  {
    path: "maintenance/major",
    name: "faculty-majors",
    component: MajorsPage,
  },
];

const facultyMaintenanceRoutes = [
  {
    path: "maintenance/user",
    name: "faculty-user",
    component: AdminUserPage,
  },
  {
    path: "maintenanc/user/edit/:id",
    name: "faculty-editUser",
    component: UserAddEditPage,
    props: { isAdd: false, isAdmin: true },
  },
  {
    path: "user/profile/:userId",
    name: "faculty-userProfile",
    component: Profile,
    props: { isAdmin: true },
  },
  {
    path: "profile/:id/edit",
    name: "faculty-editProfile",
    beforeEnter: isCorrectUserOrAdmin,
    component: UserAddEditPage,
    props: { isAdd: false, isAdmin: true },
  },
  ...facultyTaskRoutes,
  ...facultyRewardRoutes,
  ...facultyExperienceRoutes,
  ...facultyEventRoutes,
  ...facultyBadgeRoutes,
  ...facultyFlightPlanRoutes,
  ...facultyMajorRoutes,
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
      redirect: { name: "faculty-dashboard" },
      beforeEnter: isFaculty,
      children: [...facultyRoutes, ...facultyMaintenanceRoutes],
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
