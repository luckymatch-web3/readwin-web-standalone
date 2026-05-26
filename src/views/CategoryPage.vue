<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNovelStore } from '@/stores/novel'
import NovelCard from '@/components/NovelCard.vue'
import NativeExploreScreen from '@/components/app/NativeExploreScreen.vue'
import { isNativeApp } from '@/services/admob'
import { Analytics } from '@/services/analytics'

const route = useRoute()
const store = useNovelStore()
const nativeApp = isNativeApp()
onMounted(() => store.init())

const slug = computed(() => (route.params.slug as string) || '')
const activeCategory = ref(slug.value)

watch(slug, (newSlug) => {
  activeCategory.value = newSlug
})
const sortBy = ref('popular')
const statusFilter = ref('all')

const filteredNovels = computed(() => {
  let list = activeCategory.value === 'all'
    ? store.novels
    : store.getNovelsByCategory(activeCategory.value)

  if (statusFilter.value === 'ongoing') list = list.filter(n => n.status === 1)
  else if (statusFilter.value === 'completed') list = list.filter(n => n.status === 2)

  if (sortBy.value === 'rating') list = [...list].sort((a, b) => b.rating_avg - a.rating_avg)
  else if (sortBy.value === 'newest') list = [...list].sort((a, b) => b.id - a.id)
  else list = [...list].sort((a, b) => b.view_count - a.view_count)

  return list
})

function setCategory(category: string) {
  activeCategory.value = category
  Analytics.filterChanged('category', category, {
    screen_name: 'category',
    result_count: filteredNovels.value.length,
  })
}

function handleStatusChange() {
  Analytics.filterChanged('status', statusFilter.value, {
    screen_name: 'category',
    category: activeCategory.value,
    result_count: filteredNovels.value.length,
  })
}

function handleSortChange() {
  Analytics.filterChanged('sort', sortBy.value, {
    screen_name: 'category',
    category: activeCategory.value,
    result_count: filteredNovels.value.length,
  })
}
</script>

<template>
  <NativeExploreScreen
    v-if="nativeApp"
    :initial-category="slug"
    title="Category Library"
    subtitle="Free category picks that earn coins"
  />

  <main v-else class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <h1 class="text-2xl font-bold mb-6" style="color: var(--text-primary)">Browse by Category</h1>

    <!-- Category tabs -->
    <div class="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
      <button
        v-for="cat in [{ name: 'all', display_name: 'All' }, ...store.categories]" :key="cat.name"
        @click="setCategory(cat.name.toLowerCase())"
        class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
        :class="activeCategory === cat.name.toLowerCase() ? 'bg-primary-600 text-white' : 'border hover:border-primary-500'"
        :style="activeCategory !== cat.name.toLowerCase() ? 'border-color: var(--border-default); color: var(--text-secondary)' : ''"
      >{{ cat.display_name }}</button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4 mb-6">
      <select v-model="statusFilter" class="px-3 py-2 text-sm rounded-lg border outline-none" style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" @change="handleStatusChange">
        <option value="all">All Status</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
      </select>
      <select v-model="sortBy" class="px-3 py-2 text-sm rounded-lg border outline-none" style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)" @change="handleSortChange">
        <option value="popular">Most Popular</option>
        <option value="rating">Highest Rated</option>
        <option value="newest">Newest</option>
      </select>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      <NovelCard v-for="novel in filteredNovels" :key="novel.id" :novel="novel" />
    </div>
    <p v-if="filteredNovels.length === 0" class="text-center py-16" style="color: var(--text-tertiary)">No novels found in this category.</p>
  </main>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
