<script setup>
import { onMounted, ref } from "vue";
import userServices from "../../services/userServices";

const users = ref([]);
const x = ref([]);

const getUsers = async () => {
  try {
    const res = await userServices.getAllUser(); // PASS IN THE ID
    users.value = res.data; // Update links
    x.value = users.value.rows;
  } catch (err) {
    console.error("Error fetching user:", err); // Error handling
  }
};

const sendToProfile = async () => {};

onMounted(() => {
  getUsers();
});
</script>

<template>
  <v-row>
    <v-btn
      v-for="user in x"
      :key="user.id"
      class="ma-2"
      @onclick="sendToProfile"
    >
      <router-link :to="`/student/profile/${user.id}`" class="text-body-1">
        {{ user.fName }}
      </router-link>
    </v-btn>
  </v-row>
</template>

<style scoped>
/* No custom styles needed as we're using Vuetify classes */
</style>
