import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/router.js";
import vuetify from "./plugins/vuetify.js";
import { createPinia } from "pinia";
import { userStore } from "./stores/userStore.js";
import VCalendar from "v-calendar";
import VueFilesPreview from "vue-files-preview";
import "vue-files-preview/lib/style.css";
import "v-calendar/style.css";
import "./custom-vcalendar-overrides.css"; // your overrides

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(vuetify);
app.use(pinia);
app.use(VCalendar, {});
app.use(VueFilesPreview);
const store = userStore();
store.initalSetup();

app.mount("#app");
