<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNovelStore } from '@/stores/novel'
import NovelCard from '@/components/NovelCard.vue'
import NativeExploreScreen from '@/components/app/NativeExploreScreen.vue'
import { isNativeApp } from '@/services/admob'
import { Analytics } from '@/services/analytics'

const store = useNovelStore()
const nativeApp = isNativeApp()
onMounted(() => store.init())
const activeTab = ref('hot')
const tabs = [
  { key: 'hot', label: 'Hot', icon: '🔥' },
  { key: 'trending', label: 'Trending', icon: '📈' },
  { key: 'completed', label: 'Completed', icon: '✅' },
  { key: 'rating', label: 'Rating', icon: '⭐' },
]

const rankings = computed(() => store.getRankings(activeTab.value))

function setRankingTab(tab: string) {
  activeTab.value = tab
  Analytics.filterChanged('ranking_tab', tab, {
    screen_name: 'rankings',
    result_count: rankings.value.length,
  })
}
</script>

<template>
  <NativeExploreScreen
    v-if="nativeApp"
    initial-sort="popular"
    title="Rankings"
    subtitle="Top free novels readers are earning with"
  />

  <main v-else class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <h1 class="text-2xl font-bold mb-6" style="color: var(--text-primary)">Rankings</h1>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 rounded-xl mb-6" style="background-color: var(--bg-hover)">
      <button
        v-for="tab in tabs" :key="tab.key"
        @click="setRankingTab(tab.key)"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all"
        :class="activeTab === tab.key ? 'shadow-sm text-primary-600' : ''"
        :style="activeTab === tab.key ? 'background-color: var(--bg-card)' : 'color: var(--text-secondary)'"
      >
        <span>{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- List -->
    <div class="space-y-1">
      <NovelCard
        v-for="(novel, i) in rankings" :key="novel.id"
        :novel="novel" mode="horizontal" :rank="i + 1"
      />
    </div>

    <p v-if="rankings.length === 0" class="text-center py-16" style="color: var(--text-tertiary)">
      No novels in this category yet.
    </p>
  </main>
</template>
