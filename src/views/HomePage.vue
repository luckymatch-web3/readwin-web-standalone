<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useNovelStore } from '@/stores/novel'
import { useBookshelfStore } from '@/stores/bookshelf'
import { showIAP } from '@/composables/useIAP'
import { coverUrl } from '@/utils/cover'
import { capitalize } from '@/utils/text'
import type { Novel } from '@/types'
import BannerCarousel from '@/components/BannerCarousel.vue'
import NovelCard from '@/components/NovelCard.vue'
import AdMultiplex from '@/components/AdMultiplex.vue'
import AdSidebar from '@/components/AdSidebar.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import NativeHomeScreen from '@/components/app/NativeHomeScreen.vue'
import { isNativeApp } from '@/services/admob'

const store = useNovelStore()
const bookshelfStore = useBookshelfStore()
const nativeApp = isNativeApp()

onMounted(() => store.init())

type ContinueNovel = Novel & { lastChapter: number; progress: number }

const continueReading = computed<ContinueNovel[]>(() => {
  const history = bookshelfStore.readHistory || []
  const seen = new Set<number>()
  const items: ContinueNovel[] = []

  for (const entry of history) {
    const novelId = entry.novel?.id
    if (!novelId || seen.has(novelId)) continue
    seen.add(novelId)
    const novel = store.getNovelById(novelId)
    if (!novel) continue
    const chapter = safeChapter(entry.chapter_no, novel.total_chapters)
    const progress = novel.total_chapters > 0 ? Math.round((chapter / novel.total_chapters) * 100) : 0
    items.push({ ...novel, lastChapter: chapter, progress })
    if (items.length >= 3) break
  }

  return items
})

const heroNovel = computed(() => store.featuredNovels[0] || store.hotNovels[0] || store.novels[0] || null)

const spotlightNovel = computed(() =>
  store.featuredNovels.find(n => n.id !== heroNovel.value?.id) ||
  store.hotNovels.find(n => n.id !== heroNovel.value?.id) ||
  store.novels.find(n => n.id !== heroNovel.value?.id) ||
  null,
)

const trendingNovels = computed(() => store.hotNovels.slice(0, 9))
const trendingLead = computed(() => trendingNovels.value.slice(0, 3))
const trendingList = computed(() => trendingNovels.value.slice(3, 9))

const editorialPicks = computed(() =>
  store.featuredNovels
    .filter(n => n.id !== heroNovel.value?.id && n.id !== spotlightNovel.value?.id)
    .slice(0, 6),
)

const completedNovels = computed(() =>
  store.novels
    .filter(n => n.status === 2)
    .sort((a, b) => b.rating_avg - a.rating_avg)
    .slice(0, 10),
)

const freshNovels = computed(() => {
  const source = store.newNovels.length ? store.newNovels : store.novels
  return source.slice(0, 18)
})

const categoryHighlights = computed(() =>
  store.categories
    .map(category => ({
      ...category,
      count: store.novels.filter(n => n.category?.id === category.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6),
)

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function formatWords(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M words`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K words`
  return `${n} words`
}

function safeChapter(chapterNo: number, total = 0) {
  const fallbackTotal = Math.max(1, Number(total || 1))
  const next = Number.isFinite(chapterNo) ? Math.floor(chapterNo) : 1
  return Math.min(Math.max(next, 1), fallbackTotal)
}
</script>

<template>
  <NativeHomeScreen v-if="nativeApp" />
  <div v-else class="flex justify-center gap-6">
    <AdSidebar side="left" />

    <main class="home-page pb-20 flex-1 min-w-0">
      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        <div class="hero-shell">
          <div class="hero-grid">
            <div class="hero-copy">
              <p class="hero-kicker">Curated for your next binge</p>
              <h1 class="hero-title">
                {{ heroNovel ? capitalize(heroNovel.title) : 'Find your next can’t-put-down story.' }}
              </h1>
              <p class="hero-summary">
                {{
                  heroNovel
                    ? heroNovel.synopsis
                    : 'ReadWin brings together trending web novels, immersive serialized fiction, and reward-driven reading in one polished reading space.'
                }}
              </p>

              <div v-if="heroNovel" class="hero-meta">
                <span>{{ capitalize(heroNovel.author_name) }}</span>
                <span>{{ formatCount(heroNovel.view_count) }} readers</span>
                <span>{{ heroNovel.total_chapters }} chapters</span>
                <span>{{ formatWords(heroNovel.word_count) }}</span>
              </div>

              <div class="hero-actions">
                <router-link
                  :to="heroNovel ? `/book/${heroNovel.id}` : '/explore'"
                  class="hero-primary-cta"
                >
                  Start Reading
                </router-link>
                <router-link
                  :to="continueReading.length ? `/book/${continueReading[0]!.id}/chapter/${continueReading[0]!.lastChapter}` : '/explore'"
                  class="hero-secondary-cta"
                >
                  {{ continueReading.length ? 'Resume Your Latest Story' : 'Browse the Library' }}
                </router-link>
              </div>

              <div v-if="categoryHighlights.length" class="hero-categories">
                <router-link
                  v-for="category in categoryHighlights"
                  :key="category.id"
                  :to="`/category/${category.name}`"
                  class="category-pill"
                >
                  <span>{{ category.display_name }}</span>
                  <span>{{ category.count }}</span>
                </router-link>
              </div>
            </div>

            <div v-if="heroNovel" class="hero-visual">
              <div class="hero-cover-wrap">
                <div
                  class="hero-cover-glow"
                  :style="{ backgroundImage: `url(${coverUrl(heroNovel.cover_url)})` }"
                ></div>
                <img
                  :src="coverUrl(heroNovel.cover_url)"
                  :alt="heroNovel.title"
                  class="hero-cover"
                />
                <div class="hero-badge-card">
                  <p class="hero-badge-label">Featured Today</p>
                  <p class="hero-badge-title">{{ capitalize(heroNovel.category?.display_name || heroNovel.category?.name || 'Story') }}</p>
                  <p class="hero-badge-note">Top rated and ready to hook mobile readers fast.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-carousel">
            <BannerCarousel :banners="store.banners" />
          </div>
        </div>
      </section>

      <section v-if="continueReading.length" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="section-intro">
          <div>
            <p class="section-kicker">Pick up where you left off</p>
            <h2 class="section-title">Continue Reading</h2>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <router-link
            v-for="book in continueReading"
            :key="book.id"
            :to="`/book/${book.id}/chapter/${book.lastChapter}`"
            class="continue-card"
          >
            <img :src="coverUrl(book.cover_url)" :alt="book.title" class="continue-cover" />
            <div class="min-w-0 flex-1">
              <p class="continue-title">{{ capitalize(book.title) }}</p>
              <p class="continue-meta">Chapter {{ book.lastChapter }} of {{ book.total_chapters }}</p>
              <div class="continue-progress-track">
                <div class="continue-progress-fill" :style="{ width: `${book.progress}%` }"></div>
              </div>
              <div class="continue-footer">
                <span>{{ book.progress }}% complete</span>
                <span>Resume</span>
              </div>
            </div>
          </router-link>
        </div>
      </section>

      <section v-if="spotlightNovel" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div class="spotlight-shell">
          <div class="spotlight-copy">
            <p class="section-kicker">Editorial spotlight</p>
            <h2 class="spotlight-title">{{ capitalize(spotlightNovel.title) }}</h2>
            <p class="spotlight-summary">{{ spotlightNovel.synopsis }}</p>

            <div class="spotlight-stats">
              <span>{{ formatCount(spotlightNovel.view_count) }} reads</span>
              <span>{{ Number(spotlightNovel.rating_avg || 0).toFixed(1) }} rating</span>
              <span>{{ spotlightNovel.total_chapters }} chapters</span>
            </div>

            <div class="hero-actions">
              <router-link :to="`/book/${spotlightNovel.id}`" class="hero-primary-cta">
                View Story
              </router-link>
              <router-link :to="`/category/${spotlightNovel.category.name}`" class="hero-secondary-cta">
                Explore {{ spotlightNovel.category.display_name }}
              </router-link>
            </div>
          </div>

          <div class="spotlight-art">
            <img
              :src="coverUrl(spotlightNovel.cover_url)"
              :alt="spotlightNovel.title"
              class="spotlight-cover"
            />
          </div>
        </div>
      </section>

      <section v-if="trendingLead.length" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
        <div class="section-intro">
          <div>
            <p class="section-kicker">What readers are racing through</p>
            <h2 class="section-title">Trending Now</h2>
          </div>
          <router-link to="/rankings" class="section-link">See rankings</router-link>
        </div>

        <div class="trending-grid">
          <router-link
            v-for="(novel, index) in trendingLead"
            :key="novel.id"
            :to="`/book/${novel.id}`"
            class="trending-card"
          >
            <div class="trending-rank">0{{ index + 1 }}</div>
            <img :src="coverUrl(novel.cover_url)" :alt="novel.title" class="trending-cover" />
            <div>
              <p class="trending-title">{{ capitalize(novel.title) }}</p>
              <p class="trending-subtitle">{{ capitalize(novel.author_name) }}</p>
              <p class="trending-description line-clamp-3">{{ novel.synopsis }}</p>
              <div class="trending-meta">
                <span>{{ formatCount(novel.view_count) }} readers</span>
                <span>{{ Number(novel.rating_avg || 0).toFixed(1) }} stars</span>
              </div>
            </div>
          </router-link>
        </div>

        <div v-if="trendingList.length" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <NovelCard
            v-for="(novel, index) in trendingList"
            :key="novel.id"
            :novel="novel"
            mode="horizontal"
            :rank="index + 4"
          />
        </div>
      </section>

      <section v-if="editorialPicks.length" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
        <div class="section-intro">
          <div>
            <p class="section-kicker">Polished picks from the front shelf</p>
            <h2 class="section-title">Editor&apos;s Picks</h2>
          </div>
          <router-link to="/explore" class="section-link">Browse all</router-link>
        </div>

        <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-fade-right">
          <div
            v-for="novel in editorialPicks"
            :key="novel.id"
            class="w-[160px] lg:w-[180px] shrink-0"
          >
            <NovelCard :novel="novel" />
          </div>
        </div>
      </section>

      <section v-if="completedNovels.length" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
        <div class="section-intro">
          <div>
            <p class="section-kicker">For readers who want the full arc now</p>
            <h2 class="section-title">Completed Stories</h2>
          </div>
          <router-link to="/explore?status=completed" class="section-link">View finished books</router-link>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <router-link
            v-for="novel in completedNovels"
            :key="novel.id"
            :to="`/book/${novel.id}`"
            class="completed-card"
          >
            <div class="relative">
              <img :src="coverUrl(novel.cover_url)" :alt="novel.title" class="completed-cover" />
              <span class="completed-badge">Finished</span>
            </div>
            <p class="completed-title">{{ capitalize(novel.title) }}</p>
            <p class="completed-meta">{{ Number(novel.rating_avg || 0).toFixed(1) }} rating</p>
          </router-link>
        </div>
      </section>

      <section v-if="showIAP" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
        <div class="rewards-shell">
          <div>
            <p class="section-kicker rewards-kicker">Daily quest</p>
            <h2 class="rewards-title">Your reading time is literally golden.</h2>
            <p class="rewards-summary">
              All chapters are free. Check in, invite friends, and watch rewarded videos to grow your cashout path.
            </p>
          </div>

          <div class="rewards-grid">
            <router-link to="/profile" class="reward-card">
              <span class="reward-label">Check-in</span>
              <strong>+10 to +100</strong>
              <span>Stay consistent and stack coins daily.</span>
            </router-link>
            <router-link to="/invite" class="reward-card">
              <span class="reward-label">Invite</span>
              <strong>+200</strong>
              <span>Bring in friends and turn readers into referrals.</span>
            </router-link>
            <router-link to="/earn" class="reward-card">
              <span class="reward-label">Watch ads</span>
              <strong>+10 each</strong>
              <span>Short rewarded boosts built for quick sessions.</span>
            </router-link>
          </div>

          <router-link to="/earn" class="rewards-cta">
            <CoinIcon size="1.05em" />
            Earn Coins Now
          </router-link>
        </div>
      </section>

      <section v-if="freshNovels.length" class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
        <div class="section-intro">
          <div>
            <p class="section-kicker">Fresh arrivals</p>
            <h2 class="section-title">New Releases</h2>
          </div>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          <NovelCard v-for="novel in freshNovels" :key="novel.id" :novel="novel" />
        </div>
      </section>

      <section class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
        <div class="download-shell">
          <div>
            <p class="section-kicker">ReadWin on the go</p>
            <h2 class="download-title">Read anytime, anywhere.</h2>
            <p class="download-summary">
              Keep your latest stories synced, earn faster through daily tasks, and get the smoother chapter-reading experience inside the app.
            </p>
          </div>

          <div class="download-actions">
            <a
              href="https://play.google.com/store/apps/details?id=me.readwin.app"
              target="_blank"
              rel="noopener"
              class="download-primary"
            >
              Get it on Google Play
            </a>
            <router-link to="/explore" class="download-secondary">
              Browse Online
            </router-link>
          </div>
        </div>
      </section>

      <section class="mt-8 mb-8">
        <AdMultiplex />
      </section>
    </main>

    <AdSidebar side="right" />
  </div>
</template>

<style scoped>
.home-page {
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(30, 64, 175, 0.1), transparent 24%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(248, 250, 252, 1) 18%, rgba(241, 245, 249, 0.7) 100%);
}

.hero-shell {
  padding: 24px;
  border-radius: 32px;
  background:
    linear-gradient(140deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.92)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow: 0 24px 60px -36px rgba(15, 23, 42, 0.28);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  gap: 28px;
  align-items: center;
}

.hero-copy {
  min-width: 0;
}

.hero-kicker,
.section-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: #2563eb;
}

.hero-title,
.section-title,
.spotlight-title,
.rewards-title,
.download-title {
  margin: 0;
  font-family: var(--font-reading);
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.hero-title {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.02;
  max-width: 12ch;
}

.hero-summary,
.spotlight-summary,
.rewards-summary,
.download-summary {
  margin: 18px 0 0;
  max-width: 60ch;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-secondary);
}

.hero-meta,
.spotlight-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.hero-meta span,
.spotlight-stats span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 12px 24px -22px rgba(15, 23, 42, 0.35);
}

.hero-actions,
.download-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.hero-primary-cta,
.download-primary,
.rewards-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  box-shadow: 0 24px 36px -24px rgba(37, 99, 235, 0.7);
}

.hero-secondary-cta,
.download-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  color: #1d4ed8;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.5);
  backdrop-filter: blur(12px);
}

.hero-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 12px 24px -22px rgba(15, 23, 42, 0.24);
}

.hero-visual {
  position: relative;
}

.hero-cover-wrap {
  position: relative;
  padding: 12px 12px 0;
}

.hero-cover-glow {
  position: absolute;
  inset: 36px 48px auto;
  height: 72%;
  border-radius: 28px;
  background-size: cover;
  background-position: center;
  filter: blur(46px);
  opacity: 0.34;
  transform: scale(1.02);
}

.hero-cover {
  position: relative;
  z-index: 1;
  display: block;
  width: min(100%, 360px);
  margin: 0 auto;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 28px;
  box-shadow: 0 36px 50px -28px rgba(15, 23, 42, 0.45);
}

.hero-badge-card {
  position: relative;
  z-index: 2;
  width: min(88%, 290px);
  margin: -46px auto 0;
  padding: 16px 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 34px -28px rgba(15, 23, 42, 0.4);
}

.hero-badge-label,
.reward-label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #2563eb;
}

.hero-badge-title {
  margin: 8px 0 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.hero-badge-note {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.hero-carousel {
  margin-top: 28px;
}

.section-intro {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title {
  font-size: clamp(1.6rem, 3vw, 2.4rem);
}

.section-link {
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
}

.continue-card,
.trending-card,
.completed-card {
  display: block;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 36px -32px rgba(15, 23, 42, 0.32);
}

.continue-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.continue-cover {
  width: 76px;
  aspect-ratio: 3 / 4;
  border-radius: 18px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 18px 28px -24px rgba(15, 23, 42, 0.4);
}

.continue-title,
.completed-title,
.trending-title {
  margin: 0;
  color: var(--text-primary);
  font-weight: 700;
}

.continue-title {
  font-size: 15px;
}

.continue-meta,
.completed-meta,
.trending-subtitle,
.trending-description {
  margin: 6px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.continue-progress-track {
  height: 8px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(191, 219, 254, 0.45);
}

.continue-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #1d4ed8, #60a5fa);
}

.continue-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.spotlight-shell,
.rewards-shell,
.download-shell {
  display: grid;
  gap: 24px;
  border-radius: 28px;
  overflow: hidden;
}

.spotlight-shell {
  grid-template-columns: minmax(0, 1.1fr) minmax(220px, 0.7fr);
  padding: 26px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(239, 246, 255, 0.94));
  box-shadow: 0 28px 54px -42px rgba(15, 23, 42, 0.34);
}

.spotlight-title {
  font-size: clamp(1.9rem, 4vw, 3rem);
  line-height: 1.05;
}

.spotlight-art {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spotlight-cover {
  width: min(100%, 320px);
  aspect-ratio: 3 / 4;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: 0 28px 46px -30px rgba(15, 23, 42, 0.45);
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.trending-card {
  padding: 18px;
}

.trending-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.08);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.trending-cover {
  width: 100%;
  aspect-ratio: 4 / 5;
  margin-top: 14px;
  border-radius: 20px;
  object-fit: cover;
}

.trending-title {
  margin-top: 14px;
  font-size: 18px;
  line-height: 1.2;
}

.trending-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.completed-card {
  padding: 12px;
}

.completed-cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 18px;
  object-fit: cover;
}

.completed-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.88);
  color: white;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.completed-title {
  margin-top: 12px;
  font-size: 14px;
}

.rewards-shell {
  padding: 28px;
  background: linear-gradient(135deg, #fff6de, #ffe9a8 52%, #ffd66e);
  box-shadow: 0 28px 50px -38px rgba(180, 83, 9, 0.38);
}

.rewards-kicker,
.reward-label {
  color: #92400e;
}

.rewards-title {
  font-size: clamp(1.9rem, 4vw, 3rem);
  max-width: 14ch;
  color: #5b3302;
}

.rewards-summary {
  max-width: 56ch;
  color: rgba(91, 51, 2, 0.82);
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.reward-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.56);
  color: #5b3302;
  backdrop-filter: blur(10px);
}

.reward-card strong {
  font-size: 20px;
}

.reward-card span:last-child {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(91, 51, 2, 0.8);
}

.rewards-cta {
  width: fit-content;
  background: linear-gradient(135deg, #b45309, #f59e0b);
  box-shadow: 0 24px 36px -28px rgba(180, 83, 9, 0.6);
}

.download-shell {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 26px;
  background: linear-gradient(145deg, rgba(30, 64, 175, 0.08), rgba(96, 165, 250, 0.08), rgba(255, 255, 255, 0.95));
  box-shadow: 0 24px 44px -34px rgba(15, 23, 42, 0.28);
}

.download-title {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@media (max-width: 1024px) {
  .hero-grid,
  .spotlight-shell,
  .download-shell {
    grid-template-columns: 1fr;
  }

  .trending-grid,
  .rewards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-shell,
  .spotlight-shell,
  .rewards-shell,
  .download-shell {
    padding: 18px;
    border-radius: 24px;
  }

  .hero-title,
  .section-title,
  .spotlight-title,
  .rewards-title,
  .download-title {
    max-width: none;
  }

  .section-intro {
    align-items: start;
    flex-direction: column;
  }

  .continue-card {
    align-items: start;
  }
}
</style>
