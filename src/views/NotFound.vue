<script setup>
import { loginRedirect } from "../router/router";
import { userStore } from "../stores/userStore";
import { useRouter } from "vue-router";

const router = useRouter();

const redirect = async () => {
  const store = userStore();
  const isAuthenticated = await store.isAuthenticated();
  if (isAuthenticated) {
    const redirectResponse = await loginRedirect();
    router.push(redirectResponse);
  } else {
    router.push({ name: "login" });
  }
};
</script>
<template>
  <v-container
    class="d-flex flex-column align-center justify-center fill-height"
  >
    <v-icon size="128" color="danger">mdi-alert-circle-outline</v-icon>
    <h1 class="text-h4 font-weight-bold my-4">Page Not Found</h1>
    <p class="text-body-1 mb-6 text-center">
      The page you are looking for does not exist.
    </p>
    <v-btn color="primary" to="/" large @click="redirect()">
      Go Back Home
    </v-btn>
  </v-container>
</template>

<style scoped>
.v-container {
  text-align: center;
}
</style>
