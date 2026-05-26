<script setup lang="ts">
import { coverUrl } from '@/utils/cover'
import { ref, onMounted, onUnmounted } from 'vue'
import type { Banner } from '@/types'

const current = ref(0)
let timer: ReturnType<typeof setInterval>

const props = defineProps<{ banners: Banner[] }>()

onMounted(() => {
  timer = setInterval(() => {
    if (props.banners.length) {
      current.value = (current.value + 1) % props.banners.length
    }
  }, 5000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="relative rounded-2xl overflow-hidden h-[320px] lg:h-[400px]">
    <transition-group name="banner-slide">
      <div
        v-for="(banner, i) in banners" :key="banner.id"
        v-show="current === i"
        class="absolute inset-0 flex items-center"
        :style="{ background: `linear-gradient(135deg, ${banner.gradient_from}, ${banner.gradient_to})` }"
      >
        <div class="max-w-[1280px] mx-auto w-full px-6 lg:px-12 flex items-center gap-8">
          <div class="flex-1 text-white">
            <h1 class="text-xl sm:text-3xl lg:text-5xl font-bold leading-tight mb-2 lg:mb-3">{{ banner.title }}</h1>
            <p class="text-sm sm:text-base lg:text-lg opacity-90 mb-4 lg:mb-6 max-w-lg line-clamp-2 lg:line-clamp-none">{{ banner.subtitle }}</p>
            <router-link
              :to="banner.link_type === 'novel' ? `/book/${banner.link_value}` : banner.link_value"
              class="inline-flex px-6 py-2.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-white/90 transition-colors active:scale-95"
            >Read Now</router-link>
          </div>
          <div class="w-32 sm:w-40 lg:w-52 shrink-0">
            <img :src="coverUrl(banner.image_url)" :alt="banner.title" class="w-full aspect-[3/4] object-cover rounded-xl shadow-2xl ring-1 ring-white/20" />
          </div>
        </div>
      </div>
    </transition-group>

    <!-- Dots with 44px tap targets -->
    <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex">
      <button
        v-for="(_, i) in banners" :key="i"
        @click="current = i"
        class="min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <span class="block rounded-full transition-all" :class="current === i ? 'bg-white w-6 h-2.5' : 'bg-white/50 w-2.5 h-2.5'" />
      </button>
    </div>
  </div>
</template>
