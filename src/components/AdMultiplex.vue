<script setup lang="ts">
import { computed } from 'vue'
import { useAdsenseSlot } from '@/composables/useAdsenseSlot'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const shouldRender = computed(() => !userStore.isVip)
const { adRef } = useAdsenseSlot()
</script>

<template>
  <div v-if="shouldRender" class="ad-multiplex">
    <ins ref="adRef" class="adsbygoogle"
         style="display:block"
         data-ad-format="autorelaxed"
         data-ad-client="ca-pub-8148693514304068"
         data-ad-slot="8036506022"></ins>
  </div>
</template>

<style scoped>
.ad-multiplex {
  margin: 24px auto;
  max-width: 100%;
}
</style>
