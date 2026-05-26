<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelStore } from '@/stores/novel'
import type { Novel } from '@/types'
import SearchInput from '@/components/SearchInput.vue'
import NovelCard from '@/components/NovelCard.vue'
import AdDisplay from '@/components/AdDisplay.vue'
import NativeExploreScreen from '@/components/app/NativeExploreScreen.vue'
import { Analytics } from '@/services/analytics'
import { isNativeApp } from '@/services/admob'
import { coverUrl } from '@/utils/cover'
import { capitalize } from '@/utils/text'

const route = useRoute()
const router = useRouter()
const store = useNovelStore()
const nativeApp = isNativeApp()

onMounted(() => store.init())

const activeTab = ref((route.query.tab as string) || 'categories')
const activeCategory = ref(((route.query.category as string) || 'all').toLowerCase())
const sortBy = ref('popular')
const statusFilter = ref((route.query.status as string) || 'all')
const activeRankTab = ref('hot')
const selectedTags = ref<string[]>([])
const searchQuery = ref('')
const visibleCount = ref(30)

const tropeTags = [
  { tag: 'CEO', emoji: '👔' },
  { tag: 'Werewolf', emoji: '🐺' },
  { tag: 'Billionaire', emoji: '💰' },
  { tag: 'Arranged Marriage', emoji: '💍' },
  { tag: 'Second Chance', emoji: '🔄' },
  { tag: 'Enemies to Lovers', emoji: '⚔️' },
  { tag: 'Revenge', emoji: '🔥' },
  { tag: 'Secret Identity', emoji: '🎭' },
  { tag: 'Forbidden Love', emoji: '💔' },
  { tag: 'Reborn', emoji: '🌟' },
  { tag: 'Vampire', emoji: '🧛' },
  { tag: 'Royal', emoji: '👑' },
  { tag: 'Mafia', emoji: '🔫' },
  { tag: 'Slow Burn', emoji: '🕯️' },
  { tag: 'Dark Romance', emoji: '🖤' },
]

const categoryIcons: Record<string, string> = {
  romance: '❤️',
  fantasy: '🐉',
  werewolf: '🐺',
  urban: '🌃',
  mafia: '🔫',
  mystery_thriller: '🔍',
  scifi: '🚀',
  paranormal: '👻',
  historical: '🏰',
  ya_teen: '🎓',
  system: '⚡',
  lgbtq: '🏳️‍🌈',
}

function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index >= 0) selectedTags.value.splice(index, 1)
  else selectedTags.value.push(tag)
  Analytics.filterChanged('trope', tag, {
    selected: index < 0,
    selected_count: selectedTags.value.length,
    screen_name: 'explore',
  })
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function loadMore() {
  visibleCount.value += 30
  Analytics.uiClick({
    click_id: 'explore_load_more',
    screen_name: 'explore',
    visible_count: visibleCount.value,
    result_count: filteredNovels.value.length,
  })
}

function submitSearch() {
  const query = searchQuery.value.trim()
  Analytics.searchPerformed(query, {
    source: 'explore_submit',
    result_count: query ? store.searchNovels(query).length : 0,
    screen_name: 'explore',
  })
  router.push({ name: 'search', query: searchQuery.value.trim() ? { q: searchQuery.value.trim() } : {} })
}

function setActiveCategory(category: string) {
  activeCategory.value = category
  Analytics.filterChanged('category', category, {
    screen_name: 'explore',
    result_count: filteredNovels.value.length,
  })
}

function setActiveTab(tab: string) {
  activeTab.value = tab
  Analytics.filterChanged('explore_tab', tab, {
    screen_name: 'explore',
  })
}

function setRankTab(tab: string) {
  activeRankTab.value = tab
  Analytics.filterChanged('ranking_tab', tab, {
    screen_name: 'explore',
    result_count: rankingData.value.length,
  })
}

function handleSortChange() {
  Analytics.filterChanged('sort', sortBy.value, {
    screen_name: 'explore',
    result_count: filteredNovels.value.length,
  })
}

function handleStatusChange() {
  Analytics.filterChanged('status', statusFilter.value, {
    screen_name: 'explore',
    result_count: filteredNovels.value.length,
  })
}

const categoryHighlights = computed(() =>
  store.categories
    .map(category => ({
      ...category,
      count: store.novels.filter(n => n.category?.id === category.id).length,
    }))
    .sort((a, b) => b.count - a.count),
)

const discoveryLead = computed(() =>
  store.featuredNovels[0] || store.hotNovels[0] || store.novels[0] || null,
)

const curatedShelf = computed(() =>
  store.featuredNovels
    .filter(n => n.id !== discoveryLead.value?.id)
    .slice(0, 6),
)

const completedShelf = computed(() =>
  store.novels
    .filter(n => n.status === 2)
    .sort((a, b) => b.rating_avg - a.rating_avg)
    .slice(0, 6),
)

const trendingPreview = computed(() => store.hotNovels.slice(0, 8))
const rankingLead = computed(() => trendingPreview.value.slice(0, 3))
const rankingListPreview = computed(() => trendingPreview.value.slice(3, 8))

const filteredNovels = computed(() => {
  let list = activeCategory.value === 'all' ? store.novels : store.getNovelsByCategory(activeCategory.value)

  if (statusFilter.value === 'ongoing') list = list.filter(n => n.status === 1)
  else if (statusFilter.value === 'completed') list = list.filter(n => n.status === 2)

  if (selectedTags.value.length > 0) {
    list = list.filter(n =>
      selectedTags.value.some(tag => n.tags?.some(novelTag => novelTag.toLowerCase().includes(tag.toLowerCase()))),
    )
  }

  if (sortBy.value === 'rating') list = [...list].sort((a, b) => b.rating_avg - a.rating_avg)
  else if (sortBy.value === 'newest') list = [...list].sort((a, b) => b.id - a.id)
  else if (sortBy.value === 'chapters') list = [...list].sort((a, b) => b.total_chapters - a.total_chapters)
  else list = [...list].sort((a, b) => b.view_count - a.view_count)

  return list
})

const rankingData = computed<Novel[]>(() => {
  const all = [...store.novels]
  switch (activeRankTab.value) {
    case 'hot':
      return all.sort((a, b) => b.view_count - a.view_count).slice(0, 30)
    case 'weekly':
      return all.sort((a, b) => b.view_count - a.view_count).slice(0, 30)
    case 'rising':
      return all.sort((a, b) => b.id - a.id).slice(0, 30)
    case 'completed':
      return all.filter(n => n.status === 2).sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 30)
    case 'rated':
      return all.sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 30)
    default:
      return all.slice(0, 30)
  }
})
</script>

<template>
  <NativeExploreScreen v-if="nativeApp" />
  <main v-else class="explore-page pb-20">
    <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
      <div class="explore-hero">
        <div class="explore-hero-copy">
          <p class="explore-kicker">Discovery lounge</p>
          <h1 class="explore-title">Discover your next obsession.</h1>
          <p class="explore-summary">
            Browse trending web novels, filter by your favorite tropes, and jump straight into the stories readers are binging hardest right now.
          </p>

          <div class="explore-search">
            <SearchInput
              v-model="searchQuery"
              large
              placeholder="Search novels, authors, tags..."
              @submit="submitSearch"
            />
          </div>

          <div class="explore-stats">
            <span>{{ store.novels.length }} stories</span>
            <span>{{ store.categories.length }} categories</span>
            <span>{{ formatCount(store.hotNovels[0]?.view_count || 0) }} top reads</span>
          </div>
        </div>

        <router-link
          v-if="discoveryLead"
          :to="`/book/${discoveryLead.id}`"
          class="explore-feature-card"
        >
          <div class="explore-feature-copy">
            <p class="explore-feature-label">Curated excellence</p>
            <h2>{{ capitalize(discoveryLead.title) }}</h2>
            <p class="line-clamp-3">{{ discoveryLead.synopsis }}</p>
            <div class="explore-feature-meta">
              <span>{{ formatCount(discoveryLead.view_count) }} readers</span>
              <span>{{ discoveryLead.total_chapters }} chapters</span>
              <span>{{ Number(discoveryLead.rating_avg || 0).toFixed(1) }} stars</span>
            </div>
          </div>
          <img :src="coverUrl(discoveryLead.cover_url)" :alt="discoveryLead.title" class="explore-feature-cover" />
        </router-link>
      </div>
    </section>

    <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
      <div class="discover-ad-shell">
        <AdDisplay />
      </div>
    </section>

    <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
      <div class="section-head">
        <div>
          <p class="section-kicker">Quick genre jumps</p>
          <h2 class="section-title">Browse by mood</h2>
        </div>
      </div>

      <div class="genre-chip-row scrollbar-hide">
        <button
          @click="setActiveCategory('all')"
          class="genre-chip"
          :class="{ 'genre-chip-active': activeCategory === 'all' }"
        >
          <span>✨</span>
          <span>All</span>
        </button>
        <button
          v-for="category in categoryHighlights"
          :key="category.id"
          @click="setActiveCategory(category.name.toLowerCase())"
          class="genre-chip"
          :class="{ 'genre-chip-active': activeCategory === category.name.toLowerCase() }"
        >
          <span>{{ categoryIcons[category.name] || '📖' }}</span>
          <span>{{ category.display_name }}</span>
          <span class="genre-chip-count">{{ category.count }}</span>
        </button>
      </div>
    </section>

    <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
      <div class="section-head">
        <div>
          <p class="section-kicker">Front shelf</p>
          <h2 class="section-title">Curated picks</h2>
        </div>
        <router-link to="/rankings" class="section-link">See rankings</router-link>
      </div>

      <div class="curated-grid">
        <div class="curated-shelf scrollbar-hide">
          <div
            v-for="novel in curatedShelf"
            :key="novel.id"
            class="curated-item"
          >
            <NovelCard :novel="novel" />
            <p class="curated-item-copy line-clamp-2">{{ novel.synopsis }}</p>
          </div>
        </div>

        <div class="ranking-preview">
          <div
            v-for="(novel, index) in rankingLead"
            :key="novel.id"
            class="ranking-preview-card"
          >
            <span class="ranking-preview-index">0{{ index + 1 }}</span>
            <img :src="coverUrl(novel.cover_url)" :alt="novel.title" class="ranking-preview-cover" />
            <div class="min-w-0">
              <p class="ranking-preview-title">{{ capitalize(novel.title) }}</p>
              <p class="ranking-preview-meta">{{ formatCount(novel.view_count) }} reads · {{ Number(novel.rating_avg || 0).toFixed(1) }}★</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
      <div class="toggle-shell">
        <button
          v-for="tab in [{ key: 'categories', label: 'Browse Library' }, { key: 'rankings', label: 'Ranking Rail' }]"
          :key="tab.key"
          @click="setActiveTab(tab.key)"
          class="toggle-button"
          :class="{ 'toggle-button-active': activeTab === tab.key }"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <template v-if="activeTab === 'categories'">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
        <div class="section-head">
          <div>
            <p class="section-kicker">Trope filters</p>
            <h2 class="section-title">Refine the vibe</h2>
          </div>
          <p class="results-count">{{ filteredNovels.length }} results</p>
        </div>

        <div class="trope-wrap">
          <button
            v-for="trope in tropeTags"
            :key="trope.tag"
            @click="toggleTag(trope.tag)"
            class="trope-pill"
            :class="{ 'trope-pill-active': selectedTags.includes(trope.tag) }"
          >
            <span>{{ trope.emoji }}</span>
            <span>{{ trope.tag }}</span>
          </button>
        </div>

        <div class="filter-row">
          <select v-model="sortBy" class="filter-select" @change="handleSortChange">
            <option value="popular">Popular</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="chapters">Most Chapters</option>
          </select>
          <select v-model="statusFilter" class="filter-select" @change="handleStatusChange">
            <option value="all">All Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          <div v-for="novel in filteredNovels.slice(0, visibleCount)" :key="novel.id" class="result-card">
            <NovelCard :novel="novel" />
            <div class="result-meta">
              <span>⭐ {{ novel.rating_avg.toFixed(1) }}</span>
              <span>{{ novel.total_chapters }} ch</span>
              <span v-if="novel.status === 2" class="result-finished">Finished</span>
            </div>
          </div>
        </div>

        <div v-if="filteredNovels.length > visibleCount" class="text-center mt-8">
          <button @click="loadMore" class="load-more-button">Load More</button>
        </div>

        <p v-if="!filteredNovels.length" class="empty-copy">
          No stories matched that filter. Try clearing a trope or switching categories.
        </p>
      </section>

      <section v-if="completedShelf.length" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
        <div class="section-head">
          <div>
            <p class="section-kicker">Complete arcs</p>
            <h2 class="section-title">Finished stories</h2>
          </div>
        </div>

        <div class="completed-grid">
          <router-link
            v-for="novel in completedShelf"
            :key="novel.id"
            :to="`/book/${novel.id}`"
            class="completed-item"
          >
            <div class="relative">
              <img :src="coverUrl(novel.cover_url)" :alt="novel.title" class="completed-cover" />
              <span class="completed-badge">Finished</span>
            </div>
            <p class="completed-title">{{ capitalize(novel.title) }}</p>
            <p class="completed-copy">{{ Number(novel.rating_avg || 0).toFixed(1) }} rating</p>
          </router-link>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
        <div class="ranking-tabs scrollbar-hide">
          <button
            v-for="tab in [
              { key: 'hot', label: 'Hot' },
              { key: 'weekly', label: 'Weekly' },
              { key: 'rated', label: 'Top Rated' },
              { key: 'rising', label: 'Rising' },
              { key: 'completed', label: 'Completed' },
            ]"
            :key="tab.key"
            @click="setRankTab(tab.key)"
            class="ranking-tab"
            :class="{ 'ranking-tab-active': activeRankTab === tab.key }"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="ranking-layout">
          <div class="space-y-3">
            <div
              v-for="(novel, index) in rankingData.slice(0, 3)"
              :key="novel.id"
              class="rank-lead-card"
            >
              <span class="rank-lead-index">0{{ index + 1 }}</span>
              <img :src="coverUrl(novel.cover_url)" :alt="novel.title" class="rank-lead-cover" />
              <div class="min-w-0">
                <p class="rank-lead-title">{{ capitalize(novel.title) }}</p>
                <p class="rank-lead-copy line-clamp-2">{{ novel.synopsis }}</p>
                <div class="rank-lead-meta">
                  <span>{{ formatCount(novel.view_count) }} reads</span>
                  <span>{{ Number(novel.rating_avg || 0).toFixed(1) }}★</span>
                  <span>{{ novel.total_chapters }} ch</span>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <NovelCard
              v-for="(novel, index) in rankingData.slice(3, 30)"
              :key="novel.id"
              :novel="novel"
              mode="horizontal"
              :rank="index + 4"
            />
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.explore-page {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.92));
}

.explore-hero,
.explore-feature-card,
.toggle-shell,
.ranking-preview,
.result-card,
.completed-item,
.rank-lead-card {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 42px -34px rgba(15, 23, 42, 0.28);
}

.explore-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 22px;
  padding: 24px;
  border-radius: 30px;
}

.explore-kicker,
.section-kicker,
.explore-feature-label {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: #2563eb;
}

.explore-title,
.section-title {
  margin: 0;
  font-family: var(--font-reading);
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.explore-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.02;
  max-width: 12ch;
}

.explore-summary {
  margin: 16px 0 0;
  max-width: 56ch;
  line-height: 1.8;
  color: var(--text-secondary);
}

.explore-search {
  margin-top: 22px;
}

.explore-stats,
.explore-feature-meta,
.rank-lead-meta,
.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.explore-stats {
  margin-top: 18px;
}

.explore-stats span,
.explore-feature-meta span,
.rank-lead-meta span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(239, 246, 255, 0.95);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.explore-feature-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 16px;
  padding: 18px;
  border-radius: 26px;
}

.explore-feature-copy h2,
.ranking-preview-title,
.rank-lead-title,
.completed-title {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
}

.explore-feature-copy h2 {
  font-size: 26px;
  line-height: 1.1;
}

.explore-feature-copy p {
  margin: 10px 0 0;
  line-height: 1.7;
  color: var(--text-secondary);
}

.explore-feature-cover,
.ranking-preview-cover,
.rank-lead-cover,
.completed-cover {
  width: 100%;
  object-fit: cover;
  border-radius: 20px;
}

.explore-feature-cover,
.completed-cover {
  aspect-ratio: 3 / 4;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: clamp(1.5rem, 3vw, 2.4rem);
}

.section-link,
.panel-link,
.results-count {
  font-size: 13px;
  font-weight: 700;
  color: #2563eb;
}

.genre-chip-row,
.ranking-tabs,
.curated-shelf {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.genre-chip,
.ranking-tab,
.trope-pill,
.toggle-button {
  flex-shrink: 0;
  border-radius: 999px;
  font-weight: 700;
}

.genre-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-secondary);
  box-shadow: inset 0 0 0 1px rgba(191, 219, 254, 0.6);
}

.genre-chip-active,
.ranking-tab-active,
.toggle-button-active {
  color: white;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
}

.genre-chip-count {
  color: #1d4ed8;
}

.curated-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 320px;
  gap: 18px;
}

.curated-shelf {
  gap: 16px;
}

.curated-item {
  width: 168px;
  flex-shrink: 0;
}

.curated-item-copy {
  margin: 10px 4px 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.ranking-preview {
  border-radius: 26px;
  padding: 16px;
}

.ranking-preview-card {
  display: grid;
  grid-template-columns: 40px 64px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.ranking-preview-card + .ranking-preview-card {
  margin-top: 14px;
}

.ranking-preview-index,
.rank-lead-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 30px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.08);
  color: #1d4ed8;
  font-size: 12px;
  letter-spacing: 0.14em;
  font-weight: 800;
}

.ranking-preview-cover {
  aspect-ratio: 3 / 4;
}

.ranking-preview-meta,
.rank-lead-copy,
.completed-copy,
.empty-copy {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.toggle-shell {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 22px;
}

.toggle-button {
  flex: 1;
  min-height: 46px;
  color: var(--text-secondary);
}

.trope-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.trope-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.84);
  color: var(--text-secondary);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.7);
}

.trope-pill-active {
  color: #1d4ed8;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
}

.filter-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.filter-select,
.load-more-button {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.7);
}

.load-more-button {
  padding: 0 22px;
  font-weight: 700;
}

.result-meta {
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.result-finished,
.completed-badge {
  color: #92400e;
  background: #fff3c4;
}

.empty-copy {
  padding: 48px 0;
  text-align: center;
}

.completed-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.completed-item {
  padding: 12px;
  border-radius: 22px;
}

.completed-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.completed-title {
  margin-top: 12px;
  font-size: 14px;
}

.ranking-layout {
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 18px;
}

.rank-lead-card {
  display: grid;
  grid-template-columns: 40px 96px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 24px;
}

.rank-lead-cover {
  aspect-ratio: 3 / 4;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@media (max-width: 1024px) {
  .explore-hero,
  .curated-grid,
  .ranking-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .explore-hero,
  .explore-feature-card,
  .ranking-preview,
  .toggle-shell,
  .completed-item,
  .rank-lead-card {
    padding: 16px;
    border-radius: 22px;
  }

  .explore-feature-card {
    grid-template-columns: 1fr 116px;
  }

  .section-head {
    align-items: start;
    flex-direction: column;
  }

  .filter-row {
    flex-direction: column;
  }
}
</style>
