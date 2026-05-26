<script setup lang="ts">
import { computed } from 'vue'
import { useAdsenseSlot } from '@/composables/useAdsenseSlot'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const shouldRender = computed(() => !userStore.isVip)
const { adRef } = useAdsenseSlot()
</script>

<template>
  <div v-if="shouldRender" class="ad-in-article">
    <ins ref="adRef" class="adsbygoogle"
         style="display:block; text-align:center;"
         data-ad-layout="in-article"
         data-ad-format="fluid"
         data-ad-client="ca-pub-8148693514304068"
         data-ad-slot="6970836369"></ins>
  </div>
</template>

<style scoped>
.ad-in-article {
  margin: 24px auto;
  max-width: 100%;
}
</style>
