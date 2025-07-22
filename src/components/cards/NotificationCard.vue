<script setup>
import { ref, onMounted } from "vue";
import { userStore } from "../../stores/userStore";

const store = userStore();
const isAdmin = ref(false);

onMounted(async () => {
  isAdmin.value = await store.isAdmin();
});

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <v-card
    color="backgroundDarken"
    :class="{
      'opacity-40': props.notification.read,
      'opacity-100': !props.notification.read,
    }"
    class="pa-3 my-2 mx-3 rounded-lg"
  >
    <v-row align="center" class="d-flex w-100">
      <v-img
        src="/Birb.png"
        alt="Notification Image"
        max-width="40"
        max-height="40"
        class="mr-3 flex-shrink-0"
      />

      <div class=" mr-3">
        {{
          props.notification.user
            ? props.notification.user.fullName
            : "Eagle Flight Plan"
        }}
      </div>

      <div class="font-weight-bold mr-3">
        {{ props.notification.header }}
      </div>
    </v-row>
  </v-card>
</template>
