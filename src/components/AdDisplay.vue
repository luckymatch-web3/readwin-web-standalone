<script setup lang="ts">
import { computed } from 'vue'
import { useAdsenseSlot } from '@/composables/useAdsenseSlot'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const shouldRender = computed(() => !userStore.isVip)
const { adRef } = useAdsenseSlot()
</script>

<template>
  <div v-if="shouldRender" class="ad-display">
    <ins ref="adRef" class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-8148693514304068"
         data-ad-slot="7444790729"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  </div>
</template>

<style scoped>
.ad-display {
  margin: 24px auto;
  max-width: 100%;
}
</style>
