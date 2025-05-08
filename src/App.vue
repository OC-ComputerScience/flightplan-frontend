<script setup>
import NavBar from "./components/NavBar.vue";
</script>

<template>
  <v-app>
    <v-row no-gutters class="flex-nowrap">
      <NavBar
        v-if="$route.path !== '/' && $route.path !== '/student/onboarding'"
      />
      <v-col>
        <v-main
          color="background"
          class="main-content d-flex flex-column h-100"
        >
          <router-view />
        </v-main>
      </v-col>
    </v-row>
  </v-app>
</template>
