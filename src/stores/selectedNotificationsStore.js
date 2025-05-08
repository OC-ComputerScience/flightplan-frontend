import { defineStore } from "pinia";

export const useSelectedNotificationsStore = defineStore(
  "selectedNotifications",
  {
    state: () => ({
      selectedNotificationIds: [],
    }),
    actions: {
      addNotification(id) {
        if (!this.selectedNotificationIds.includes(id)) {
          this.selectedNotificationIds.push(id);
        }
      },
      removeNotification(id) {
        this.selectedNotificationIds = this.selectedNotificationIds.filter(
          (notificationId) => notificationId !== id,
        );
      },
      clearSelection() {
        this.selectedNotificationIds = [];
      },
    },
  },
);
