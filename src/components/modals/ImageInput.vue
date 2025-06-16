<script setup>
import { fileTypeRule } from "../../utils/formValidators";
import fileServices from "../../services/fileServices";
import { loadImage } from "../../components/componentUtilities";
import { onUnmounted, ref, watch } from "vue";
import defaultImage from "../../assets/DefaultBadgeImage.png";

const props = defineProps({
  modelValue: {
    type: [Object, null, undefined],
    required: true,
  },
  imageName: {
    type: [String, null],
    required: true,
  },
});

const innerImage = ref(props.modelValue);
const innerImageName = ref(props.imageName);
const imageSrc = ref("");

const emit = defineEmits(["update:modelValue"]);

watch(
  () => props.modelValue,
  (val) => {
    innerImage.value = val;
  },
);
watch(innerImage, async (val) => {
  if (!val) {
    innerImage.value = null;
    imageSrc.value = "";
    emitFile();
    return;
  }
  innerImageName.value = val.name;
  await refreshImage();
});

async function emitFile() {
  emit("update:modelValue", innerImage.value);
}

const fetchImage = async () => {
  const response = await fileServices.getFileForName(innerImageName.value);
  if (!response.data.image) return;
  imageSrc.value = loadImage(response.data.image.data);
};

const refreshImage = async () => {
  const file = innerImage.value;
  if (file.type === "") {
    await fetchImage();
    return;
  }
  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result;
      imageSrc.value = base64String;
    };
  }
};

onUnmounted(() => URL.revokeObjectURL(imageSrc.value));
</script>

<template>
  <v-row no-gutters>
    <v-col :cols="1" class="mr-2">
      <v-img
        v-if="imageSrc"
        class="image"
        :src="imageSrc"
        alt="Uploaded Image"
      ></v-img>
      <v-img
        v-else
        class="image"
        :src="defaultImage"
        alt="Generic Merchandise Image"
      ></v-img>
    </v-col>
    <v-col :cols="10.5">
      <v-file-input
        v-model="innerImage"
        variant="solo"
        rounded="lg"
        label="Image File"
        chips
        :rules="[fileTypeRule]"
        prepend-icon=""
        @change="emitFile"
      ></v-file-input>
    </v-col>
  </v-row>
</template>
