// src/composables/useEventCheckIn.js
import { ref, computed } from "vue";
import dayjs from "dayjs";
import eventServices from "../services/eventServices";
import { generateEventQRCodePDF } from "../utils/pdfGenerator";
import studentServices from "../services/studentServices";
import { userStore } from "../stores/userStore";

export function useEventCheckIn() {
  const store = userStore();

  const eventToShow = ref({});
  const generatedToken = ref(null);
  const generatingToken = ref(false);
  const generatingPDF = ref(false);
  const checkingToken = ref(false);
  const registered = ref(false);
  const attending = ref(false);
  const successMessage = ref("");

  const isEventInFuture = computed(() => {
    if (!eventToShow.value?.date) return false;
    return dayjs(eventToShow.value.date).isAfter(dayjs());
  });

  const setEvent = (event) => {
    eventToShow.value = event;
  };

  const getCurrentToken = async () => {
    if (!eventToShow.value?.id) return;
    checkingToken.value = true;
    try {
      const response = await eventServices.getCheckInToken(
        eventToShow.value.id,
      );
      generatedToken.value = response.data;
    } catch (error) {
      console.error("Error getting check-in token:", error);
      generatedToken.value = null;
    } finally {
      checkingToken.value = false;
    }
  };

  const generateToken = async (expirationTimestamp) => {
    if (!eventToShow.value?.id) return;
    generatingToken.value = true;
    try {
      const response = await eventServices.generateCheckInToken(
        eventToShow.value.id,
        expirationTimestamp,
      );
      generatedToken.value = response.data;
    } catch (error) {
      console.error("Error generating check-in token:", error);
    } finally {
      generatingToken.value = false;
    }
  };

  const downloadQRCode = async () => {
    if (!generatedToken.value) return;
    generatingPDF.value = true;
    try {
      await generateEventQRCodePDF(eventToShow.value, generatedToken.value);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      generatingPDF.value = false;
    }
  };

  const checkIfStudentIsRegistered = async () => {
    try {
      const userId = store.user?.userId;
      if (!userId || !eventToShow.value?.id) return;

      const studentRes = await studentServices.getStudentForUserId(userId);
      const studentId = studentRes.data.id;

      const registeredRes = await eventServices.getRegisteredStudents(
        eventToShow.value.id,
      );
      registered.value = registeredRes.data.some(
        (s) => s.studentId === studentId,
      );

      const attendingRes = await eventServices.getAttendingStudents(
        eventToShow.value.id,
      );
      attending.value = attendingRes.data.some(
        (s) => s.studentId === studentId,
      );
    } catch (err) {
      console.error("Error checking registration:", err);
    }
  };

  return {
    eventToShow,
    setEvent,
    generatedToken,
    getCurrentToken,
    generateToken,
    downloadQRCode,
    generatingToken,
    generatingPDF,
    checkingToken,
    successMessage,
    isEventInFuture,
    checkIfStudentIsRegistered,
    registered,
    attending,
  };
}
