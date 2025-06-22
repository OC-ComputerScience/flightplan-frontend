<script setup>
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { addLinkToUserStore } from "../../stores/addLinkToUserStore";
import { required, fromWebsite } from "../../utils/formValidators";
import { linkOptions } from "../../utils/linkOptions";

const store = addLinkToUserStore();
const { visible } = storeToRefs(store);

const form = ref(null);

const emit = defineEmits(["addLinkToUser", "close"]);
const links = ref();
const selectedLink = ref({ link: "", name: "" });

const handleAdd = async () => {
  const isValid = (await form.value?.validate())?.valid;
  if (!isValid) return;

  emit("addLinkToUser", {
    link: selectedLink.value,
  });
  store.toggleVisibility();
};

const selectWebsite = (val) => {
  selectedLink.value.link = val.link;
  selectedLink.value.name = val.name;
};

const sortLinks = (links) => {
  return links.sort((a, b) => a.name.localeCompare(b.name));
};

onMounted(async () => {
  links.value = sortLinks(linkOptions);
  const link = links.value[0];
  selectedLink.value.link = link.link;
  selectedLink.value.name = link.name;
});
</script>
<template>
  <v-dialog v-model="visible">
    <v-card class="rounded-lg bg-backgroundDarken w-75 mx-auto">
      <v-card-title class="text-center">Add Link</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-row no-gutters>
            <v-col cols="2" class="mr-4">
              <v-select
                :model-value="selectedLink.name"
                variant="solo"
                rounded="lg"
                label="Website"
                item-value="name"
                :items="links"
                item-title="name"
                :rules="[required]"
                return-object
                @update:model-value="selectWebsite"
              ></v-select>
            </v-col>
            <v-col cols="9.5">
              <v-text-field
                v-model="selectedLink.link"
                variant="solo"
                rounded="lg"
                label="Link"
                :rules="[
                  fromWebsite(
                    selectedLink.link,
                    links.find((link) => link.name === selectedLink.name).link,
                  ),
                ]"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-text>
        <v-row class="d-flex justify-center">
          <v-btn
            class="mr-2 rounded-lg"
            variant="outlined"
            @click="store.toggleVisibility()"
            >Cancel</v-btn
          >
          <v-btn class="rounded-lg" color="primary" @click="handleAdd"
            >Add</v-btn
          >
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
