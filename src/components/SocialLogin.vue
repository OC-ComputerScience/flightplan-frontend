<script setup>
import { ref, onMounted } from "vue";
import AuthServices from "../services/authServices";
import StudentServices from "../services/studentServices.js";
import roleServices from "../services/roleServices.js";
import Utils from "../config/utils.js";
import { userStore } from "../stores/userStore.js";
import { studentStore } from "../stores/studentStore.js";
import StrengthServices from "../services/strengthServices.js";

const emit = defineEmits(["login-success"]);
const store = userStore();
const localStudentStore = studentStore();
const fName = ref("");
const lName = ref("");
const user = ref({});

const loginWithGoogle = () => {
  window.handleCredentialResponse = handleCredentialResponse;
  const client = import.meta.env.VITE_APP_CLIENT_ID;
  window.google.accounts.id.initialize({
    client_id: client,
    cancel_on_tap_outside: false,
    auto_select: true,
    callback: window.handleCredentialResponse,
  });
  window.google.accounts.id.renderButton(document.getElementById("parent_id"), {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signup_with",
    width: 400,
  });
};

const handleCredentialResponse = async (response) => {
  let token = {
    credential: response.credential,
  };
  let email = "";
  try {
    const authResponse = await AuthServices.loginUser(token);
    user.value = authResponse.data;
    Utils.setStore("user", user.value);
    fName.value = user.value.fName;
    lName.value = user.value.lName;
    email = user.value.email;

    const roles = await roleServices.getRolesByEmail(email);
    store.$patch({ user: user.value, roles: roles.data });

    const student = (
      await StudentServices.getStudentForUserId(user.value.userId)
    ).data;
    if (student?.id) {
      Utils.setStore("student", student);
      const strengths = (
        await StrengthServices.getStrengthsForStudent(student.id)
      ).data;
      localStudentStore.$patch({ student: student, strengths: strengths });
    }

    // Emit the login success event with the user data
    emit("login-success", user.value);
  } catch (error) {
    console.error("Login error:", error);
  }
};

onMounted(() => {
  loginWithGoogle();
});
</script>

<template>
  <div class="signup-buttons">
    <v-row justify="center">
      <div id="parent_id" display="flex" />
    </v-row>
  </div>
</template>
