<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelStore } from '@/stores/novel'
import { hotSearchTerms } from '@/mock/novels'
import SearchInput from '@/components/SearchInput.vue'
import NovelCard from '@/components/NovelCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import AdDisplay from '@/components/AdDisplay.vue'
import NativeSearchScreen from '@/components/app/NativeSearchScreen.vue'
import { Analytics } from '@/services/analytics'
import { isNativeApp } from '@/services/admob'
import { coverUrl } from '@/utils/cover'
import { capitalize } from '@/utils/text'

const route = useRoute()
const router = useRouter()
const store = useNovelStore()
const nativeApp = isNativeApp()

onMounted(() => store.init())

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const normalizedQuery = computed(() => query.value.trim())
const results = computed(() => (normalizedQuery.value ? store.searchNovels(normalizedQuery.value) : []))

const HISTORY_KEY = 'readwin-search-history'

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const searchHistory = ref<string[]>(loadHistory())

const heroStats = computed(() => [
  { label: 'Stories indexed', value: formatCount(store.novels.length) },
  { label: 'Hot searches', value: String(hotSearchTerms.length) },
  { label: 'Top title reads', value: formatCount(store.hotNovels[0]?.view_count || 0) },
])

const discoveryLead = computed(() =>
  results.value[0] || store.featuredNovels[0] || store.hotNovels[0] || store.novels[0] || null,
)

const trendingNovels = computed(() => {
  const source = store.hotNovels.length ? store.hotNovels : store.novels
  return source.slice(0, 5)
})

const editorialShelf = computed(() => {
  if (normalizedQuery.value) return results.value.slice(1, 5)

  return [...store.featuredNovels, ...store.hotNovels]
    .filter((novel, index, list) =>
      novel.id !== discoveryLead.value?.id && list.findIndex(item => item.id === novel.id) === index,
    )
    .slice(0, 4)
})

const discoveryTags = computed(() => {
  const liveTags = store.hotNovels.flatMap(novel => novel.tags).filter(Boolean)
  return [...new Set([...searchHistory.value.slice(0, 4), ...hotSearchTerms, ...liveTags])]
    .filter(Boolean)
    .slice(0, 14)
})

const refineTags = computed(() => {
  const resultTags = results.value.flatMap(novel => [novel.author_name, ...novel.tags.slice(0, 2)])
  return [...new Set([...resultTags, ...hotSearchTerms])]
    .filter(tag => tag && tag.toLowerCase() !== normalizedQuery.value.toLowerCase())
    .slice(0, 10)
})

const moodCollections = [
  {
    tag: 'alpha mate',
    title: 'Alpha bonds',
    description: 'Pack politics, fated mates, and raw protective obsession.',
    accent: 'linear-gradient(135deg, rgba(15,63,109,0.96), rgba(33,114,208,0.92))',
  },
  {
    tag: 'billionaire CEO',
    title: 'Power games',
    description: 'Boardroom heat, impossible contracts, and dangerous luxury.',
    accent: 'linear-gradient(135deg, rgba(88,56,10,0.96), rgba(208,152,38,0.92))',
  },
  {
    tag: 'secret baby',
    title: 'Second secrets',
    description: 'Lost years, hidden heirs, and the sweetest payback arcs.',
    accent: 'linear-gradient(135deg, rgba(115,34,64,0.96), rgba(213,72,128,0.92))',
  },
  {
    tag: 'fantasy magic',
    title: 'Spellbound',
    description: 'Ancient kingdoms, academy trials, and power awakening fast.',
    accent: 'linear-gradient(135deg, rgba(37,39,93,0.96), rgba(107,127,255,0.9))',
  },
]

function saveToHistory(term: string) {
  const trimmed = term.trim()
  if (!trimmed) return
  searchHistory.value = [trimmed, ...searchHistory.value.filter(item => item !== trimmed)].slice(0, 10)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
}

function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
  Analytics.searchPerformed('', {
    source: 'clear_history',
    result_count: 0,
    screen_name: 'search',
  })
}

watch(
  () => route.query.q,
  nextValue => {
    const next = typeof nextValue === 'string' ? nextValue : ''
    if (next !== query.value) query.value = next
  },
)

watch(normalizedQuery, nextValue => {
  const current = typeof route.query.q === 'string' ? route.query.q : ''
  if (nextValue === current) return

  const nextQuery = { ...route.query }
  if (nextValue) nextQuery.q = nextValue
  else delete nextQuery.q
  router.replace({ query: nextQuery })
})

function searchTag(tag: string) {
  query.value = tag
  saveToHistory(tag)
  Analytics.searchPerformed(tag, {
    source: 'tag',
    result_count: store.searchNovels(tag).length,
    screen_name: 'search',
  })
}

function handleSubmit() {
  if (normalizedQuery.value) saveToHistory(normalizedQuery.value)
  Analytics.searchPerformed(normalizedQuery.value, {
    source: 'submit',
    result_count: results.value.length,
    screen_name: 'search',
  })
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
</script>

<template>
  <NativeSearchScreen v-if="nativeApp" />
  <main v-else class="search-page pb-20">
    <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
      <div class="search-hero">
        <div class="search-hero-copy">
          <p class="search-kicker">{{ normalizedQuery ? 'Search results' : 'Find your next binge' }}</p>
          <h1 class="search-title">
            {{ normalizedQuery ? `Results for "${normalizedQuery}"` : 'Search by trope, title, author, or mood.' }}
          </h1>
          <p class="search-summary">
            {{
              normalizedQuery
                ? `We searched across ${formatCount(store.novels.length)} stories to surface the strongest matches and related rabbit holes.`
                : 'Start with the tags readers are already binging, then jump from trending obsessions into deeper shelves.'
            }}
          </p>

          <div class="search-bar-shell">
            <SearchInput
              v-model="query"
              autofocus
              large
              placeholder="Search novels, tags, authors, twists..."
              @submit="handleSubmit"
            />
          </div>

          <div class="search-stat-row">
            <div v-for="stat in heroStats" :key="stat.label" class="search-stat-pill">
              <span class="search-stat-value">{{ stat.value }}</span>
              <span class="search-stat-label">{{ stat.label }}</span>
            </div>
          </div>

          <div v-if="discoveryTags.length" class="search-chip-row">
            <button
              v-for="tag in discoveryTags"
              :key="tag"
              class="search-chip"
              @click="searchTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <router-link
          v-if="discoveryLead"
          :to="`/book/${discoveryLead.id}`"
          class="search-hero-feature"
        >
          <div class="search-hero-feature-copy">
            <p class="search-feature-label">{{ normalizedQuery ? 'Top match' : 'Editor’s pick' }}</p>
            <h2>{{ capitalize(discoveryLead.title) }}</h2>
            <p class="line-clamp-3">{{ discoveryLead.synopsis }}</p>

            <div class="search-feature-meta">
              <span>{{ capitalize(discoveryLead.author_name) }}</span>
              <span>{{ formatCount(discoveryLead.view_count) }} readers</span>
              <span>{{ discoveryLead.total_chapters }} chapters</span>
            </div>
          </div>

          <img
            :src="coverUrl(discoveryLead.cover_url)"
            :alt="discoveryLead.title"
            class="search-hero-cover"
          />
        </router-link>
      </div>
    </section>

    <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
      <div class="discover-ad-shell">
        <AdDisplay />
      </div>
    </section>

    <section v-if="!normalizedQuery" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
      <div class="search-panel-grid">
        <div class="search-panel">
          <div class="section-head">
            <div>
              <p class="section-kicker">Jump back in</p>
              <h2 class="section-title">Recent searches</h2>
            </div>
            <button
              v-if="searchHistory.length"
              class="panel-action"
              @click="clearHistory"
            >
              Clear
            </button>
          </div>

          <div v-if="searchHistory.length" class="search-history-list">
            <button
              v-for="term in searchHistory"
              :key="term"
              class="history-chip"
              @click="searchTag(term)"
            >
              <span class="history-chip-dot"></span>
              <span>{{ term }}</span>
            </button>
          </div>

          <div v-else class="panel-empty-copy">
            <p class="panel-empty-title">Your last hunts will land here.</p>
            <p class="panel-empty-text">Try a few trope searches and we will keep the best shortcuts ready for you.</p>
          </div>
        </div>

        <div class="search-panel">
          <div class="section-head">
            <div>
              <p class="section-kicker">Readers are circling these now</p>
              <h2 class="section-title">Trending this hour</h2>
            </div>
          </div>

          <div class="trend-list">
            <router-link
              v-for="(novel, index) in trendingNovels"
              :key="novel.id"
              :to="`/book/${novel.id}`"
              class="trend-item"
            >
              <span class="trend-rank">0{{ index + 1 }}</span>
              <div class="min-w-0 flex-1">
                <p class="trend-title">{{ capitalize(novel.title) }}</p>
                <p class="trend-meta">{{ formatCount(novel.view_count) }} reads · {{ Number(novel.rating_avg || 0).toFixed(1) }}★</p>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section v-if="!normalizedQuery" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
      <div class="section-head">
        <div>
          <p class="section-kicker">Search by vibe</p>
          <h2 class="section-title">Mood-led shortcuts</h2>
        </div>
      </div>

      <div class="mood-grid">
        <button
          v-for="collection in moodCollections"
          :key="collection.tag"
          class="mood-card"
          :style="{ background: collection.accent }"
          @click="searchTag(collection.tag)"
        >
          <p class="mood-label">{{ collection.tag }}</p>
          <h3>{{ collection.title }}</h3>
          <p>{{ collection.description }}</p>
        </button>
      </div>
    </section>

    <section
      v-if="editorialShelf.length"
      class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8"
    >
      <div class="section-head">
        <div>
          <p class="section-kicker">{{ normalizedQuery ? 'More paths from this search' : 'Curated for tonight' }}</p>
          <h2 class="section-title">{{ normalizedQuery ? 'Keep exploring nearby matches' : 'Editorial shelf' }}</h2>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="novel in editorialShelf"
          :key="novel.id"
          class="shelf-card"
        >
          <NovelCard :novel="novel" />
          <p class="shelf-copy line-clamp-2">{{ novel.synopsis }}</p>
        </div>
      </div>
    </section>

    <section v-if="normalizedQuery" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
      <div class="query-shell">
        <div>
          <p class="section-kicker">Search snapshot</p>
          <h2 class="section-title">
            {{ results.length ? `${results.length} stories found` : 'No direct match yet' }}
          </h2>
          <p class="query-note">
            {{
              results.length
                ? 'Best matches are ranked below. Tap into a nearby tag if you want to widen the net.'
                : 'Try a broader trope or one of the live recommendations on the right to uncover adjacent stories.'
            }}
          </p>
        </div>

        <div class="query-layout">
          <div class="query-results">
            <div v-if="results.length" class="space-y-3">
              <NovelCard
                v-for="novel in results"
                :key="novel.id"
                :novel="novel"
                mode="horizontal"
              />
            </div>

            <div v-else class="empty-shell">
              <EmptyState
                icon="🔍"
                title="No results found"
                description="Try a broader search like werewolf romance, billionaire CEO, or secret baby."
                action-to="/explore"
                action-text="Browse Books"
              />
            </div>
          </div>

          <aside class="query-aside">
            <div class="search-panel">
              <div class="section-head">
                <div>
                  <p class="section-kicker">Refine the trail</p>
                  <h2 class="section-title">Related tags</h2>
                </div>
              </div>

              <div class="search-chip-row compact">
                <button
                  v-for="tag in refineTags"
                  :key="tag"
                  class="search-chip"
                  @click="searchTag(tag)"
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.search-page {
  background:
    radial-gradient(circle at top left, rgba(56, 110, 194, 0.18), transparent 26%),
    radial-gradient(circle at top right, rgba(202, 158, 48, 0.16), transparent 22%),
    linear-gradient(180deg, #f7f5ef 0%, #f5f7fb 32%, #fbfcff 100%);
}

.search-hero {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 2rem;
  background:
    linear-gradient(135deg, rgba(13, 40, 82, 0.96), rgba(26, 79, 152, 0.9)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent);
  box-shadow: 0 28px 70px -40px rgba(15, 31, 61, 0.45);
  overflow: hidden;
}

.search-hero-copy {
  position: relative;
  z-index: 1;
}

.search-kicker,
.section-kicker,
.search-feature-label,
.mood-label,
.search-stat-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.search-kicker,
.search-feature-label,
.mood-label {
  color: rgba(245, 207, 112, 0.92);
}

.search-title {
  margin-top: 0.75rem;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
  font-weight: 800;
  color: #f8fbff;
}

.search-summary {
  max-width: 40rem;
  margin-top: 0.85rem;
  color: rgba(228, 236, 248, 0.88);
  font-size: 1rem;
  line-height: 1.75;
}

.search-bar-shell {
  margin-top: 1.5rem;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
}

.search-stat-row,
.search-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.search-stat-row {
  margin-top: 1rem;
}

.search-chip-row {
  margin-top: 1.1rem;
}

.search-stat-pill,
.search-chip,
.history-chip {
  border-radius: 999px;
}

.search-stat-pill {
  display: inline-flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.8rem 1rem;
  min-width: 8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.search-stat-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
}

.search-stat-label {
  color: rgba(223, 232, 246, 0.78);
  letter-spacing: 0.14em;
}

.search-chip,
.history-chip,
.panel-action {
  transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease;
}

.search-chip,
.history-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.72rem 1rem;
  min-height: 2.75rem;
  border: 1px solid rgba(14, 48, 94, 0.08);
  background: rgba(255, 255, 255, 0.9);
  color: #173765;
  font-size: 0.92rem;
  font-weight: 600;
}

.search-chip:hover,
.history-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(20, 81, 165, 0.24);
  background: rgba(255, 255, 255, 1);
}

.search-chip-row.compact {
  margin-top: 0;
}

.search-hero-feature {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  text-decoration: none;
}

.search-hero-feature-copy h2 {
  margin-top: 0.55rem;
  font-size: 1.65rem;
  font-weight: 800;
  color: #ffffff;
}

.search-hero-feature-copy p {
  margin-top: 0.75rem;
  color: rgba(231, 237, 246, 0.84);
  line-height: 1.7;
}

.search-feature-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1rem;
  color: rgba(245, 248, 253, 0.82);
  font-size: 0.85rem;
}

.search-hero-cover {
  width: 100%;
  max-width: 15rem;
  justify-self: center;
  aspect-ratio: 3 / 4.4;
  object-fit: cover;
  border-radius: 1.35rem;
  box-shadow: 0 18px 45px -30px rgba(0, 0, 0, 0.42);
}

.search-panel-grid,
.query-layout,
.mood-grid {
  display: grid;
  gap: 1rem;
}

.search-panel,
.query-shell,
.shelf-card,
.empty-shell {
  border-radius: 1.6rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(16, 45, 84, 0.07);
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.search-panel,
.query-shell,
.empty-shell {
  padding: 1.25rem;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-kicker {
  color: rgba(21, 69, 136, 0.82);
}

.section-title {
  margin-top: 0.35rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: #11284d;
}

.panel-action {
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(16, 45, 84, 0.08);
  background: rgba(247, 250, 255, 0.94);
  color: #1b4e93;
  font-size: 0.85rem;
  font-weight: 700;
}

.panel-action:hover {
  background: #ffffff;
}

.search-history-list,
.trend-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-chip {
  justify-content: flex-start;
  text-align: left;
}

.history-chip-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #b88615, #f0cf73);
  flex-shrink: 0;
}

.panel-empty-copy {
  padding: 0.5rem 0;
}

.panel-empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #11284d;
}

.panel-empty-text {
  margin-top: 0.45rem;
  color: #5c6d86;
  line-height: 1.7;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 0.95rem;
  padding: 0.9rem 1rem;
  border-radius: 1.25rem;
  text-decoration: none;
  background: linear-gradient(135deg, rgba(246, 249, 255, 0.96), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(15, 55, 107, 0.06);
}

.trend-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f3f6d, #2d71c7);
  color: #ffffff;
  font-weight: 800;
}

.trend-title {
  font-weight: 700;
  color: #122b50;
}

.trend-meta {
  margin-top: 0.3rem;
  font-size: 0.88rem;
  color: #66768d;
}

.mood-card {
  padding: 1.25rem;
  border: 0;
  border-radius: 1.6rem;
  text-align: left;
  color: #ffffff;
  box-shadow: 0 24px 45px -38px rgba(13, 26, 50, 0.28);
}

.mood-card h3 {
  margin-top: 0.5rem;
  font-size: 1.3rem;
  font-weight: 800;
}

.mood-card p:last-child {
  margin-top: 0.7rem;
  color: rgba(241, 245, 252, 0.9);
  line-height: 1.65;
}

.shelf-card {
  padding: 1rem;
}

.shelf-copy {
  margin-top: 0.95rem;
  color: #5e6f88;
  line-height: 1.7;
}

.query-note {
  margin-top: 0.55rem;
  color: #5e6f88;
  line-height: 1.7;
}

.query-results {
  min-width: 0;
}

.query-aside {
  min-width: 0;
}

@media (min-width: 768px) {
  .search-hero {
    grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.9fr);
    align-items: stretch;
    padding: 2rem;
  }

  .search-panel-grid,
  .query-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .mood-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .query-layout {
    grid-template-columns: minmax(0, 1.5fr) minmax(18rem, 0.7fr);
    align-items: flex-start;
  }

  .mood-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
