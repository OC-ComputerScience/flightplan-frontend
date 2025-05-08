<script setup>
import { useRouter } from "vue-router";

const routes = [
  {
    name: "Rewards",
    routeName: "reward",
  },
  {
    name: "Tasks",
    routeName: "task",
  },
  {
    name: "Experiences",
    routeName: "experience",
  },
  {
    name: "Events",
    routeName: "event",
  },
  {
    name: "Users",
    routeName: "user",
  },
  {
    name: "Badges",
    routeName: "badge",
  },
  {
    name: "Majors",
    routeName: "majors",
  },
];
const router = useRouter();

const handleRouteClick = (routeName) => {
  router.push({ name: routeName });
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col
        v-for="(route, index) in routes"
        :key="index"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          class="pa-10 rounded-xl"
          color="backgroundDarken"
          @click="handleRouteClick(route.routeName)"
        >
          <v-card-text color="text" class="text-center text-h5">{{
            route.name
          }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
