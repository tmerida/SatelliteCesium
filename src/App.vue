<template>
  <CesiumViewer />
</template>

<script>
import CesiumViewer from './components/CesiumViewer.vue';

export default {
  name: 'App',
  components: {
    CesiumViewer,
  },
};
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>