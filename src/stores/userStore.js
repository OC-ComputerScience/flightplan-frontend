import { defineStore } from "pinia";
import Utils from "../config/utils";

import roleServices from "../services/roleServices";
import authServices from "../services/authServices";

export const userStore = defineStore("user", {
  state: () => ({
    user: null,
    roles: null,
    currentRoute: null,
  }),
  actions: {
    async checkRole(roleName) {
      // If the roles are null because of a reload, then the roles need to be requeried from the database
      if (!this.roles) {
        await this.setupStore();
      }
      return this.roles
        ? this.roles.some(
            (role) => role.name.toLowerCase() === roleName.toLowerCase(),
          )
        : false;
    },
    async isAdmin() {
      return await this.checkRole("admin");
    },
    async isFaculty() {
      return await this.checkRole("faculty");
    },
    async isAuthenticated() {
      if (!this.user) this.$patch({ user: Utils.getStore("user") });
      if (!this.user) return false;
      try {
        const { data } = await authServices.validateToken(this.user);
        return data.isValid;
      } catch (error) {
        console.log("Token validation failed:", error);
        return false;
      }
    },
    async setupStore() {
      const user = Utils.getStore("user");
      let roles = [];
      if (user) {
        roles = await roleServices.getRolesByEmail(user.email);
      }

      this.$patch({ user, roles: roles.data });
    },
    initalSetup() {
      const user = Utils.getStore("user");
      this.$patch({ user });
    },
  },
});
