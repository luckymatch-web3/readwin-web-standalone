<script setup lang="ts">
import { computed } from 'vue'
import { useAdsenseSlot } from '@/composables/useAdsenseSlot'
import { useUserStore } from '@/stores/user'

const props = withDefaults(defineProps<{
  side?: 'left' | 'right'
}>(), { side: 'left' })

const userStore = useUserStore()
const shouldRender = computed(() => !userStore.isVip)
const { adRef } = useAdsenseSlot()
</script>

<template>
  <div v-if="shouldRender" class="ad-sidebar hidden xl:block" :class="`ad-sidebar--${side}`">
    <div class="sticky top-20">
      <div class="ad-sidebar-card">
        <span class="ad-sidebar-label">Advertisement</span>
        <ins
          ref="adRef"
          class="adsbygoogle"
          style="display:inline-block;width:160px;height:600px"
          data-ad-client="ca-pub-8148693514304068"
          data-ad-slot="4097261012"
          data-ad-format="vertical"
          data-full-width-responsive="false"
        ></ins>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ad-sidebar {
  width: 160px;
  flex-shrink: 0;
}

.ad-sidebar-card {
  width: 160px;
  min-height: 600px;
  padding: 10px 0 0;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(239, 246, 255, 0.88));
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 22px 50px -40px rgba(15, 23, 42, 0.45);
  overflow: hidden;
}

.ad-sidebar-label {
  display: block;
  margin-bottom: 8px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
</style>
