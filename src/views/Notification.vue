<script setup>
import { onMounted, ref, watch } from "vue";
import NotificationCard from "../components/cards/NotificationCard.vue";
import notificationServices from "../services/notificationServices";
import apiClient from "../services/services";
import moment from "moment";
import { userStore } from "../stores/userStore";
import { useNotificationStore } from "../stores/notificationStore";
import { useSelectedNotificationsStore } from "../stores/selectedNotificationsStore";
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue";
import { sanitizeHtml } from "../utils/htmlSanitization";

const notifications = ref([]);
const selectedNotif = ref({});
const showsidebar = ref(false);
const noNotifications = ref(false);
const currentPage = ref(1);
const pageSize = ref(14);
const totalPages = ref(1);
const store = userStore();
const notifStore = useNotificationStore();
const isAdmin = ref(false);
const selectedNotificationsStore = useSelectedNotificationsStore();
const confirmDelete = ref(false);

const getNotifications = async (page = 1) => {
  try {
    const res = await notificationServices.getAllNotificationsForUser(
      store.user.userId,
      page,
      pageSize.value,
    );

    if (!res.data.notifications || res.data.notifications.length === 0) {
      noNotifications.value = true;
      return;
    }

    // Update the notifications array with the paginated results
    notifications.value = res.data.notifications;
    totalPages.value = Math.ceil(res.data.total / pageSize.value);
    currentPage.value = page;
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
};

// Watcher for pagination changes
watch(currentPage, (newPage) => {
  getNotifications(newPage);
});

onMounted(async () => {
  isAdmin.value = await store.isAdmin();
  await getNotifications();

  if (notifStore.activeNotification) {
    var chosenNotif = null;
    for (const notif of notifications.value) {
      if (notif.id === notifStore.activeNotification) {
        chosenNotif = notif;
        break;
      }
    }

    if (chosenNotif) {
      chosenNotif.read = true;
      selectedNotif.value = chosenNotif;
      showsidebar.value = true;
    }
  }
});

const formattedDateTime = (item) => {
  return moment(item).format("MM/DD/YYYY hh:mm A");
};

const editItem = async (item) => {
  try {
    const response = await apiClient.put(
      `/notification/user/${store.user.userId}/notification/${item.id}`,
      { read: true },
    );

    if (response.status === 200) {
      item.read = true; // Update the notification locally after successful API call
    } else {
      console.error("Failed to update notification:", response);
    }
  } catch (error) {
    console.error("Error updating notification:", error);
  }

  selectedNotif.value = item;
  showsidebar.value = true;
};

const handleCheckboxToggle = (notification) => {
  if (
    selectedNotificationsStore.selectedNotificationIds.includes(notification.id)
  ) {
    selectedNotificationsStore.removeNotification(notification.id);
  } else {
    selectedNotificationsStore.addNotification(notification.id);
  }
};

const handleSelectAll = () => {
  if (selectedNotificationsStore.selectedNotificationIds.length > 0) {
    selectedNotificationsStore.clearSelection();
  } else {
    notifications.value.forEach((notification) => {
      selectedNotificationsStore.addNotification(notification.id);
    });
  }
};

const handleBatchDelete = async () => {
  try {
    await Promise.all(
      selectedNotificationsStore.selectedNotificationIds.map((id) =>
        notificationServices.deleteNotification(id),
      ),
    );
    selectedNotificationsStore.clearSelection();
    await getNotifications(currentPage.value);
    closeDialogs();
  } catch (error) {
    console.error("Error deleting notifications:", error);
  }
};

const closeDialogs = () => {
  confirmDelete.value = false;
};
</script>

<template>
  <div class="container">
    <div class="notifContainer">
      <div class="d-flex align-center">
        <h1 class="mt-1">Notifications</h1>
        
        <v-card
          v-if="!noNotifications"
          color="primary"
          class="combined-button d-flex align-center rounded-lg px-2 py-1 ml-3"
          @click.stop
        >
          <v-checkbox
            hide-details
            density="compact"
            class="ma-0 pa-0"
            :model-value="
              selectedNotificationsStore.selectedNotificationIds.length > 0
            "
            color="white"
            @click="handleSelectAll"
          />
        </v-card>
        <v-row justify="center" class="mr-2">
          <v-col cols="12">
            <v-card color="backgroundDarken" style="border-radius: 25px">
              </v-card
            >
          </v-col>
        </v-row>
        <v-btn
          v-if="selectedNotificationsStore.selectedNotificationIds.length > 0"
          color="danger"
          class="rounded-lg ml-2"
          size="small"
          @click="confirmDelete = true"
        >
          <v-icon icon="mdi-delete" size="x-large" color="white" />
        </v-btn>
        <div
          v-if="selectedNotificationsStore.selectedNotificationIds.length > 0"
          class="selected-count align-center px-2 py-1 ml-2"
        >
          Selected:
          {{ selectedNotificationsStore.selectedNotificationIds.length }}
        </div>
      </div>
      <div v-if="!noNotifications" id="notifList">
        <div
          v-for="(item, index) in notifications"
          :key="index"
          class="d-flex align-center notification-item"
        >
          <v-checkbox
            hide-details
            density="compact"
            class="ma-0 pa-0 mr-2"
            :model-value="
              selectedNotificationsStore.selectedNotificationIds.includes(
                item.id,
              )
            "
            @click="handleCheckboxToggle(item)"
          />
          <NotificationCard
            :to="{
              name: isAdmin ? 'admin-notifications' : 'student-notifications',
            }"
            :notification="item"
            :class="{ unread: !item.read, read: item.read }"
            @click="editItem(item)"
          />
        </div>
      </div>
      <div v-else class="no-notifications">
        <h3>No Notifications!</h3>
        <p>Complete some flight plan items to be notified!</p>
      </div>
    </div>

    <v-card v-if="showsidebar" class="infoSidebar" color="backgroundDarken">
      <strong class="header">{{ selectedNotif.header }}</strong>
      <v-btn
        icon
        class="close-btn"
        aria-label="Close Sidebar"
        @click="showsidebar = false"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <p>
        Sent By:
        {{
          selectedNotif.user ? selectedNotif.user.fullName : "Eagle Flight Plan"
        }}
      </p>
      <p>Sent On: {{ formattedDateTime(selectedNotif.createdAt) }}</p>
      <p>
        ------------------------------------------------------------------------
      </p>
      <p
        class="description"
        v-html="sanitizeHtml(selectedNotif.description)"
      ></p>
    </v-card>
  </div>

  <v-row justify="center" align="center" class="pagination">
    <v-pagination
      v-model="currentPage"
      :length="totalPages"
      :total-visible="5"
    ></v-pagination>
  </v-row>

  <ConfirmDialog
    v-model="confirmDelete"
    title="Are you sure you want to delete the selected notifications?"
    confirm-text="Delete"
    confirm-color="danger"
    @confirm="handleBatchDelete"
  />
</template>

<style>
.container {
  display: flex;
  height: 90vh;
  margin-top: 2%;
  overflow-y: auto;
  overflow-x: auto;
}

.notifContainer {
  flex: 1;
  padding-left: 2vw;
  padding-right: 2vw;
  overflow-y: auto;
  overflow-x: auto;
}

.notification-item {
  width: 100%;
}

.notification-item .v-card {
  flex: 1;
}

.no-notifications {
  text-align: center;
  margin-top: 20px;
  color: var(--v-text-lighten1);
}

.header {
  font-size: 24px;
}

.infoSidebar {
  width: 40vw;
  margin: 2vh 2vw 2vh 2vw;
  flex-shrink: 0;
  padding: 10px 15px;
  border-radius: 25px;
}

.close-btn {
  position: fixed;
  top: 50px;
  right: 40px;
  z-index: 9999;
}

.selected-count {
  background-color: var(--v-background-darken1);
  border-radius: 4px;
  color: var(--v-text-base);
}

.description {
  white-space: pre-wrap;
}

.section-headers {
  font-size: 24px;
  margin-left: 10px;
}
</style>