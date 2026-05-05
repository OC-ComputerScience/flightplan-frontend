<script setup>
import { ref, onMounted } from "vue";
import { userStore } from "../../stores/userStore";

const store = userStore();
const isAdmin = ref(false);

onMounted(async () => {
  isAdmin.value = await store.isAdmin();
});

const emit = defineEmits(["deleteNotification"]);

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
    class="pa-3 my-2 rounded-lg d-flex flex-column"
  >
    <v-row>
      <v-img
        src="/Birb.png"
        alt="Notification Image"
        max-width="40"
        max-height="40"
        class="mr-3 flex-shrink-0 align-self-center"
      />

      <div class="mr-3 align-self-center">
        {{
          props.notification.user
            ? props.notification.user.fullName
            : "Eagle Flight Plan"
        }}
      </div>
      <v-spacer />
      <div>
        <v-btn
          variant="text"
          size="x-small"
          icon="mdi-close"
          @click="emit('deleteNotification', props.notification)"
        />
      </div>
    </v-row>
    <v-row>
      <div class="font-weight-bold ml-2 mr-3">
        {{ props.notification.header }}
      </div>
    </v-row>
  </v-card>
</template>
