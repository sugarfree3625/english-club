<template>
  <img 
    :src="hasError || !src ? fallback : src" 
    :style="sizeStyle"
    :class="['app-avatar', round ? 'round' : '']"
    @error="hasError = true"
  >
</template>

<script>
export default {
  name: 'AppAvatar',
  props: {
    src: String,
    name: { type: String, default: 'U' },
    size: { type: Number, default: 48 },
    round: { type: Boolean, default: true }
  },
  data() { return { hasError: false }; },
  computed: {
    fallback() { return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}`; },
    sizeStyle() { return { width: this.size + 'px', height: this.size + 'px' }; }
  }
};
</script>

<style scoped>
.app-avatar { object-fit: cover; flex-shrink: 0; }
.app-avatar.round { border-radius: 50%; }
</style>
