<template>
  <div class="skeleton-wrapper">
    <div class="skeleton-card" v-for="n in count" :key="n">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-40"></div>
        </div>
      </div>
      <div class="skeleton-line w-80 mb-3"></div>
      <div class="skeleton-line w-100 mb-2"></div>
      <div class="skeleton-line w-90 mb-2"></div>
      <div class="skeleton-line w-70"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: { count: { type: Number, default: 3 } }
};
</script>

<style scoped>
.skeleton-wrapper { display: flex; flex-direction: column; gap: 20px; max-width: 720px; margin: 0 auto; }
.skeleton-card { background: var(--surface, #fff); border-radius: 22px; padding: 28px; box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.06)); border: 1px solid var(--b, #e2e8f0); }
.skeleton-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.skeleton-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(90deg, var(--b, #e2e8f0) 0%, #f0f0f0 50%, var(--b, #e2e8f0) 100%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.skeleton-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg, var(--b, #e2e8f0) 0%, #f0f0f0 50%, var(--b, #e2e8f0) 100%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.w-40 { width: 40%; } .w-60 { width: 60%; } .w-70 { width: 70%; } .w-80 { width: 80%; } .w-90 { width: 90%; } .w-100 { width: 100%; }
.mb-2 { margin-bottom: 10px; } .mb-3 { margin-bottom: 16px; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
body.dark .skeleton-avatar, body.dark .skeleton-line { background: linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%); background-size: 200% 100%; }
</style>
