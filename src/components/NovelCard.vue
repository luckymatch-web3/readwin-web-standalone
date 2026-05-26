<script setup lang="ts">
import type { Novel } from '@/types'
import { coverUrl } from '@/utils/cover'
import { capitalize } from '@/utils/text'
import StarRating from './StarRating.vue'
import Badge from './Badge.vue'

const props = withDefaults(defineProps<{
  novel: Novel
  mode?: 'vertical' | 'horizontal'
  rank?: number
  showProgress?: boolean
  progress?: number
}>(), { mode: 'vertical' })


function titleCase(str: string): string {
  const minor = new Set(['a','an','the','and','but','or','for','nor','in','on','at','to','of','by','with','as'])
  return str.split(' ').map((w, i) => {
    if (i === 0 || !minor.has(w.toLowerCase())) {
      return w.charAt(0).toUpperCase() + w.slice(1)
    }
    return w.toLowerCase()
  }).join(' ')
}
</script>

<template>
  <router-link :to="`/book/${novel.id}`" class="group block" :class="mode === 'horizontal' ? 'flex gap-4 p-3 rounded-lg transition-colors hover:bg-[var(--bg-hover)]' : ''">
    <!-- Cover -->
    <div class="relative shrink-0" :class="mode === 'horizontal' ? 'w-20' : 'w-full'">
      <div class="aspect-[3/4] rounded-lg overflow-hidden relative" :class="mode === 'vertical' ? 'shadow-sm group-hover:shadow-card-hover' : ''" style="background: linear-gradient(135deg, #667eea, #764ba2); min-height: 80px;">
        <img
          :src="coverUrl(novel.cover_url)" :alt="novel.title"
          class="w-full h-full object-cover transition-transform duration-300 relative z-10"
          :class="mode === 'vertical' ? 'group-hover:-translate-y-1' : ''"
          loading="lazy"
          @error="(e: Event) => { (e.target as HTMLImageElement).style.display = 'none'; }"
        />
        <div class="absolute inset-0 flex items-center justify-center text-white/60 text-3xl pointer-events-none">📖</div>
      </div>
      <!-- Rank badge -->
      <div v-if="rank" class="absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
        :class="rank === 1 ? 'bg-accent-400' : rank === 2 ? 'bg-secondary-300' : rank === 3 ? 'bg-[#CD7F32]' : 'bg-secondary-400'">
        {{ rank }}
      </div>
      <!-- Status badge -->
      <Badge v-if="novel.is_new && !rank" variant="new" class="absolute top-1.5 left-1.5" />
      <Badge v-else-if="novel.is_hot && !rank" variant="hot" class="absolute top-1.5 left-1.5" />
      <!-- Progress bar -->
      <div v-if="showProgress && progress" class="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-lg overflow-hidden">
        <div class="h-full bg-primary-500 transition-all" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>

    <!-- Info -->
    <div :class="mode === 'horizontal' ? 'flex-1 min-w-0 py-0.5' : 'mt-2'">
      <h3 class="font-semibold text-sm leading-snug line-clamp-2" style="color: var(--text-primary)">{{ titleCase(novel.title) }}</h3>
      <p v-if="mode === 'horizontal'" class="text-xs mt-1 line-clamp-2" style="color: var(--text-tertiary)">{{ novel.synopsis }}</p>
      <p class="text-xs mt-1" style="color: var(--text-tertiary)">{{ novel.author_name }}</p>
      <div v-if="mode === 'horizontal'" class="flex items-center gap-2 mt-2 flex-wrap">
        <StarRating :rating="novel.rating_avg" size="sm" />
        <span v-for="tag in novel.tags.slice(0, 2)" :key="tag" class="text-xs px-1.5 py-0.5 rounded bg-secondary-100 text-secondary-500">{{ capitalize(tag) }}</span>
      </div>
    </div>
  </router-link>
</template>
