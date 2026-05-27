<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '@/stores/novel'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useUserStore } from '@/stores/user'
import { coverUrl } from '@/utils/cover'
import { capitalize } from '@/utils/text'
import { APP_DOWNLOAD_URL } from '@/config'
import type { Novel } from '@/types'

const router = useRouter()
const novelStore = useNovelStore()
const bookshelfStore = useBookshelfStore()
const userStore = useUserStore()
const activeCategory = ref('all')

onMounted(async () => {
  await novelStore.init()
})

type ContinueNovel = Novel & { lastChapter: number; progress: number }

const heroStory = computed(() =>
  novelStore.featuredNovels[0] || novelStore.hotNovels[0] || novelStore.novels[0] || null,
)

const secondaryStory = computed(() =>
  novelStore.hotNovels.find(item => item.id !== heroStory.value?.id) ||
  novelStore.featuredNovels.find(item => item.id !== heroStory.value?.id) ||
  novelStore.novels.find(item => item.id !== heroStory.value?.id) ||
  null,
)

const continueReading = computed<ContinueNovel[]>(() => {
  const seen = new Set<number>()
  return (bookshelfStore.readHistory || [])
    .filter(item => {
      const novelId = item.novel?.id
      if (!novelId || seen.has(novelId)) return false
      seen.add(novelId)
      return true
    })
    .slice(0, 3)
    .map(item => {
      const novel = novelStore.getNovelById(item.novel.id) || item.novel
      const chapter = safeChapter(item.chapter_no, novel.total_chapters)
      const progress = novel.total_chapters > 0 ? Math.round((chapter / novel.total_chapters) * 100) : 0
      return { ...novel, lastChapter: chapter, progress } as ContinueNovel
    })
})

const categoryTabs = computed(() => {
  const categories = novelStore.categories
    .map(category => ({
      key: String(category.name || category.display_name).toLowerCase(),
      label: category.display_name || capitalize(category.name),
      count: novelStore.novels.filter(novel => novel.category?.id === category.id).length,
    }))
    .filter(category => category.key && category.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  return [{ key: 'all', label: 'Popular', count: novelStore.novels.length }, ...categories]
})

const activeStories = computed(() => {
  if (activeCategory.value === 'all') {
    const source = novelStore.hotNovels.length ? novelStore.hotNovels : novelStore.novels
    return source.slice(0, 10)
  }
  return novelStore.getNovelsByCategory(activeCategory.value).slice(0, 10)
})

const featuredRail = computed(() => {
  const seen = new Set<number>()
  return [...novelStore.featuredNovels, ...novelStore.hotNovels, ...novelStore.novels]
    .filter(story => {
      if (seen.has(story.id)) return false
      seen.add(story.id)
      return true
    })
    .slice(0, 6)
})

const rewardTasks = computed(() => [
  {
    title: 'Read chapters',
    value: '+200',
    note: 'Timed coins appear inside the reader while chapters stay free.',
    action: () => startReading(heroStory.value),
  },
  {
    title: 'Daily check-in',
    value: '+1,000',
    note: 'Claim a web streak and keep your wallet moving.',
    action: () => router.push('/reward'),
  },
  {
    title: 'Reward center',
    value: 'Tasks',
    note: 'Open chest, sprint, and app video lanes from one place.',
    action: () => router.push('/reward'),
  },
  {
    title: 'Cashout',
    value: 'App',
    note: 'PayPal payout opens from the Android app.',
    action: () => router.push('/withdraw'),
  },
])

const coinBalance = computed(() => Number(userStore.displayCoinBalance || 0))
const estimatedCash = computed(() => Math.max(0, coinBalance.value / 10000))

const appStats = computed(() => [
  { label: 'Downloads', value: '1K+' },
  { label: 'Genres', value: '12' },
  { label: 'Rating', value: '3+' },
])

function safeChapter(chapterNo: number, total = 0) {
  const fallbackTotal = Math.max(1, Number(total || 1))
  const next = Number.isFinite(chapterNo) ? Math.floor(chapterNo) : 1
  return Math.min(Math.max(next, 1), fallbackTotal)
}

function formatNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${Math.floor(value / 1000)}K`
  return String(value || 0)
}

function startReading(story?: Novel | null, chapter = 1) {
  const target = story || heroStory.value || novelStore.novels[0]
  if (!target) {
    router.push('/explore')
    return
  }
  bookshelfStore.addToBookshelf(target)
  router.push(`/book/${target.id}/chapter/${safeChapter(chapter, target.total_chapters)}`)
}

function openStory(story: Novel) {
  bookshelfStore.addToBookshelf(story)
  router.push(`/book/${story.id}`)
}
</script>

<template>
  <main class="web-app-home">
    <section class="home-hero">
      <div class="home-hero-copy">
        <p class="home-eyebrow">ReadWin web app</p>
        <h1>Read free novels. Earn coins as you go.</h1>
        <p class="home-lede">
          The web experience now follows the Android app flow: open free chapters, build a coin balance, then move to the app when it is time to cash out.
        </p>

        <div class="home-hero-actions">
          <button class="home-primary" type="button" @click="startReading(heroStory)">
            Start reading
          </button>
          <button class="home-secondary" type="button" @click="router.push('/reward')">
            Earn coins
          </button>
          <a class="home-secondary home-download" :href="APP_DOWNLOAD_URL" target="_blank" rel="noopener">
            Download app
          </a>
        </div>

        <div class="home-balance-strip">
          <div>
            <span>My coins</span>
            <strong>{{ coinBalance.toLocaleString() }}</strong>
          </div>
          <div>
            <span>Cash preview</span>
            <strong>${{ estimatedCash.toFixed(2) }}</strong>
          </div>
          <div>
            <span>Payout</span>
            <strong>App only</strong>
          </div>
        </div>
      </div>

      <div class="home-phone" aria-label="ReadWin app style preview">
        <header class="phone-topbar">
          <div class="phone-brand">
            <img src="/logo.png" alt="ReadWin" />
            <strong>ReadWin</strong>
          </div>
          <button type="button" @click="router.push('/withdraw')">Cashout</button>
        </header>

        <button class="phone-search" type="button" @click="router.push('/search')">
          Search free chapters
        </button>

        <article v-if="heroStory" class="phone-feature" @click="openStory(heroStory)">
          <img :src="coverUrl(heroStory.cover_url)" :alt="heroStory.title" />
          <div>
            <span>{{ heroStory.category?.display_name || 'Featured' }}</span>
            <strong>{{ capitalize(heroStory.title) }}</strong>
            <small>{{ formatNumber(heroStory.view_count) }} readers</small>
          </div>
        </article>

        <div class="phone-task-grid">
          <button v-for="task in rewardTasks.slice(0, 4)" :key="task.title" type="button" @click="task.action">
            <span>{{ task.title }}</span>
            <strong>{{ task.value }}</strong>
          </button>
        </div>
      </div>
    </section>

    <section class="home-band">
      <div v-for="item in appStats" :key="item.label" class="home-stat">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </div>
      <div class="home-band-copy">
        <strong>Free English web novels across romance, werewolf, fantasy, mafia, mystery, sci-fi, and more.</strong>
        <span>Updated from the same backend content used by the app.</span>
      </div>
    </section>

    <section v-if="continueReading.length" class="home-section">
      <div class="home-section-head">
        <div>
          <p class="home-eyebrow">Resume</p>
          <h2>Continue reading</h2>
        </div>
      </div>

      <div class="continue-grid">
        <button
          v-for="book in continueReading"
          :key="book.id"
          class="continue-item"
          type="button"
          @click="startReading(book, book.lastChapter)"
        >
          <img :src="coverUrl(book.cover_url)" :alt="book.title" />
          <span>{{ capitalize(book.title) }}</span>
          <small>Chapter {{ book.lastChapter }} · {{ book.progress }}%</small>
          <i><b :style="{ width: `${book.progress}%` }"></b></i>
        </button>
      </div>
    </section>

    <section class="home-section home-reward-section">
      <div class="home-section-head">
        <div>
          <p class="home-eyebrow">Coins and payout</p>
          <h2>Web earns. App cashes out.</h2>
        </div>
        <button class="home-section-action" type="button" @click="router.push('/reward')">Open rewards</button>
      </div>

      <div class="reward-grid">
        <button v-for="task in rewardTasks" :key="task.title" class="reward-tile" type="button" @click="task.action">
          <span>{{ task.title }}</span>
          <strong>{{ task.value }}</strong>
          <small>{{ task.note }}</small>
        </button>
      </div>
    </section>

    <section class="home-section">
      <div class="home-section-head">
        <div>
          <p class="home-eyebrow">Library</p>
          <h2>{{ activeCategory === 'all' ? 'Popular right now' : categoryTabs.find(item => item.key === activeCategory)?.label }}</h2>
        </div>
        <button class="home-section-action" type="button" @click="router.push('/explore')">Explore all</button>
      </div>

      <div class="category-row">
        <button
          v-for="category in categoryTabs"
          :key="category.key"
          type="button"
          :class="{ active: activeCategory === category.key }"
          @click="activeCategory = category.key"
        >
          <span>{{ category.label }}</span>
          <small>{{ category.count }}</small>
        </button>
      </div>

      <div class="story-grid">
        <button v-for="story in activeStories" :key="story.id" class="story-card" type="button" @click="openStory(story)">
          <img :src="coverUrl(story.cover_url)" :alt="story.title" />
          <span>{{ capitalize(story.title) }}</span>
          <small>{{ story.total_chapters }} chapters · {{ Number(story.rating_avg || 0).toFixed(1) }}</small>
        </button>
      </div>
    </section>

    <section class="home-section app-download-panel">
      <div>
        <p class="home-eyebrow">Android app</p>
        <h2>Cashout, video rewards, wheel, and PayPal records live in the app.</h2>
        <p>
          Web readers can keep reading and collecting coins. When they are ready to withdraw, the flow points them into the Google Play app.
        </p>
      </div>
      <a :href="APP_DOWNLOAD_URL" target="_blank" rel="noopener">Get ReadWin on Google Play</a>
    </section>

    <section v-if="featuredRail.length" class="home-section compact-rail">
      <div class="home-section-head">
        <div>
          <p class="home-eyebrow">Featured shelf</p>
          <h2>Start with these stories</h2>
        </div>
      </div>
      <div class="rail-row">
        <button v-for="story in featuredRail" :key="story.id" type="button" @click="openStory(story)">
          <img :src="coverUrl(story.cover_url)" :alt="story.title" />
          <span>{{ capitalize(story.title) }}</span>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.web-app-home {
  min-height: 100vh;
  padding: 20px 16px 92px;
  background:
    linear-gradient(180deg, #fff7ed 0, #f8fafc 280px, #ffffff 100%);
  color: #111827;
}

.home-hero,
.home-section,
.home-band {
  max-width: 1180px;
  margin: 0 auto;
}

.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 420px);
  gap: 20px;
  align-items: stretch;
}

.home-hero-copy,
.home-phone,
.home-band,
.home-section,
.app-download-panel {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  box-shadow: 0 22px 46px -38px rgba(15, 23, 42, 0.42);
}

.home-hero-copy {
  padding: clamp(24px, 4vw, 52px);
  background:
    linear-gradient(135deg, rgba(16, 24, 40, 0.96), rgba(54, 18, 42, 0.94)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent);
  color: #fff;
}

.home-eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #db2777;
}

.home-hero-copy .home-eyebrow {
  color: #fbbf24;
}

.home-hero h1 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(42px, 7vw, 82px);
  line-height: 0.92;
  font-weight: 900;
}

.home-lede {
  max-width: 650px;
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 17px;
  line-height: 1.7;
}

.home-hero-actions,
.home-balance-strip,
.home-section-head,
.category-row,
.rail-row {
  display: flex;
  gap: 10px;
}

.home-hero-actions {
  flex-wrap: wrap;
  margin-top: 28px;
}

.home-primary,
.home-secondary,
.home-section-action,
.app-download-panel a {
  min-height: 44px;
  border-radius: 8px;
  padding: 0 18px;
  font-weight: 800;
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.home-primary {
  border: 0;
  color: #111827;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
}

.home-secondary,
.home-section-action {
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.home-download,
.app-download-panel a {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.home-balance-strip {
  flex-wrap: wrap;
  margin-top: 28px;
}

.home-balance-strip div {
  min-width: 140px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}

.home-balance-strip span,
.home-band-copy span,
.story-card small,
.continue-item small,
.reward-tile small {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.home-balance-strip span {
  color: rgba(255, 255, 255, 0.62);
}

.home-balance-strip strong {
  display: block;
  margin-top: 4px;
  color: #fff;
  font-size: 22px;
}

.home-phone {
  padding: 14px;
  background: #0b0b0c;
  color: #fff;
}

.phone-topbar,
.phone-brand,
.phone-feature,
.phone-task-grid,
.home-band,
.home-section-head {
  display: flex;
  align-items: center;
}

.phone-topbar {
  justify-content: space-between;
}

.phone-brand {
  gap: 8px;
}

.phone-brand img {
  width: 30px;
  height: 30px;
  border-radius: 8px;
}

.phone-topbar button {
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  color: #111827;
  background: #fbbf24;
  font-weight: 800;
}

.phone-search {
  width: 100%;
  margin-top: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 13px 14px;
  text-align: left;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.08);
}

.phone-feature {
  gap: 12px;
  width: 100%;
  margin-top: 18px;
  border: 0;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  background: linear-gradient(135deg, rgba(219, 39, 119, 0.26), rgba(245, 158, 11, 0.12));
}

.phone-feature img {
  width: 82px;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  object-fit: cover;
}

.phone-feature span,
.phone-feature small {
  color: rgba(255, 255, 255, 0.68);
}

.phone-feature strong {
  display: block;
  margin: 6px 0;
  font-size: 18px;
  line-height: 1.1;
}

.phone-task-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.phone-task-grid button,
.reward-tile,
.story-card,
.continue-item,
.rail-row button {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  text-align: left;
  background: #fff;
}

.phone-task-grid button {
  min-height: 92px;
  padding: 12px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.08);
}

.phone-task-grid span,
.reward-tile span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.phone-task-grid span {
  color: rgba(255, 255, 255, 0.62);
}

.phone-task-grid strong,
.reward-tile strong {
  display: block;
  margin-top: 10px;
  font-size: 24px;
}

.home-band {
  gap: 12px;
  margin-top: 18px;
  padding: 14px;
  background: #fff;
}

.home-stat {
  min-width: 92px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.home-stat strong,
.home-stat span {
  display: block;
}

.home-stat strong {
  font-size: 22px;
}

.home-stat span {
  color: #64748b;
  font-size: 12px;
}

.home-band-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.home-section {
  margin-top: 18px;
  padding: 18px;
  background: #fff;
}

.home-section-head {
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.home-section h2,
.app-download-panel h2 {
  margin: 0;
  color: #111827;
  font-size: clamp(24px, 3vw, 36px);
  line-height: 1.05;
  font-weight: 900;
}

.home-section-action {
  border-color: rgba(15, 23, 42, 0.1);
  color: #111827;
  background: #f8fafc;
}

.reward-grid,
.story-grid,
.continue-grid {
  display: grid;
  gap: 12px;
}

.reward-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.reward-tile {
  min-height: 164px;
  padding: 16px;
  transition: transform 140ms ease, border-color 140ms ease;
}

.reward-tile:hover,
.story-card:hover,
.continue-item:hover,
.rail-row button:hover,
.home-primary:hover,
.home-secondary:hover,
.home-section-action:hover {
  transform: translateY(-2px);
}

.category-row,
.rail-row {
  overflow-x: auto;
  padding-bottom: 6px;
}

.category-row button {
  flex: 0 0 auto;
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 8px;
  padding: 9px 12px;
  background: #f8fafc;
}

.category-row button.active {
  color: #fff;
  background: #111827;
}

.category-row span,
.category-row small {
  display: block;
}

.category-row small {
  opacity: 0.62;
}

.story-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 14px;
}

.story-card,
.continue-item {
  padding: 10px;
}

.story-card img,
.rail-row img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  object-fit: cover;
}

.story-card span,
.continue-item span,
.rail-row span {
  display: block;
  margin-top: 9px;
  color: #111827;
  font-weight: 800;
  line-height: 1.2;
}

.continue-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.continue-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  column-gap: 12px;
}

.continue-item img {
  grid-row: span 3;
  width: 64px;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  object-fit: cover;
}

.continue-item i {
  height: 6px;
  margin-top: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.continue-item b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #db2777, #f59e0b);
}

.app-download-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  background: #111827;
  color: #fff;
}

.app-download-panel h2 {
  color: #fff;
}

.app-download-panel p {
  max-width: 620px;
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.7;
}

.app-download-panel a {
  color: #111827;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
}

.rail-row button {
  flex: 0 0 150px;
  padding: 10px;
}

@media (max-width: 980px) {
  .home-hero,
  .app-download-panel {
    grid-template-columns: 1fr;
  }

  .reward-grid,
  .story-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .continue-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .web-app-home {
    padding: 12px 10px 88px;
  }

  .home-hero-copy {
    padding: 24px 18px;
  }

  .home-hero h1 {
    font-size: 42px;
  }

  .home-band {
    align-items: stretch;
    flex-direction: column;
  }

  .home-section-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
