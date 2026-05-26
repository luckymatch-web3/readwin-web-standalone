<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useNovelStore } from '@/stores/novel'
import { coverUrl } from '@/utils/cover'
import NovelCard from '@/components/NovelCard.vue'
import LoginGate from '@/components/LoginGate.vue'
import EmptyState from '@/components/EmptyState.vue'
import NativeShelfScreen from '@/components/app/NativeShelfScreen.vue'
import { isNativeApp } from '@/services/admob'
import { Analytics } from '@/services/analytics'

const store = useBookshelfStore()
const novelStore = useNovelStore()
const nativeApp = isNativeApp()
const activeTab = ref<'reading' | 'finished' | 'favorites'>('reading')
const sortBy = ref<'recent' | 'added' | 'update'>('recent')
const editMode = ref(false)
const selected = ref<Set<number>>(new Set())

// Split bookshelf into reading/finished (getProgress returns chapter number)
const readingBooks = computed(() =>
  store.bookshelf.filter(b => {
    const p = store.getProgress(b.novel.id)
    return !p || p < b.novel.total_chapters
  }).sort((a, b) => {
    const ha = store.readHistory.find(h => h.novel.id === a.novel.id)
    const hb = store.readHistory.find(h => h.novel.id === b.novel.id)
    return new Date(hb?.read_at || 0).getTime() - new Date(ha?.read_at || 0).getTime()
  })
)
const finishedBooks = computed(() =>
  store.bookshelf.filter(b => {
    const p = store.getProgress(b.novel.id)
    return p >= b.novel.total_chapters && b.novel.total_chapters > 0
  })
)

// Continue reading: top 3 most recent
const continueReading = computed(() => {
  return readingBooks.value.slice(0, 3).map(b => {
    const progress = store.getProgress(b.novel.id) || 0
    const lastChapter = safeChapter(progress, b.novel.total_chapters)
    const pct = b.novel.total_chapters > 0 ? Math.round((lastChapter / b.novel.total_chapters) * 100) : 0
    const historyItem = store.readHistory.find(h => h.novel.id === b.novel.id)
    const lastRead = historyItem ? timeSince(new Date(historyItem.read_at).getTime()) : ''
    return { ...b.novel, lastChapter, pct, lastRead }
  })
})

// Streak
const STREAK_KEY = 'readwin-read-streak'
const streak = computed(() => {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}')
    return data.days || 0
  } catch { return 0 }
})

// Reading stats
const totalChaptersRead = computed(() => store.readHistory.length)
const totalBooksRead = computed(() => finishedBooks.value.length)

function timeSince(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function safeChapter(chapterNo: number, total = 0) {
  const fallbackTotal = Math.max(1, Number(total || 1))
  const next = Number.isFinite(chapterNo) ? Math.floor(chapterNo) : 1
  return Math.min(Math.max(next, 1), fallbackTotal)
}

function toggleSelect(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
  Analytics.uiClick({
    click_id: 'bookshelf_select_book',
    screen_name: 'bookshelf',
    novel_id: id,
    selected: selected.value.has(id),
  })
}

function batchRemove() {
  Analytics.uiClick({
    click_id: 'bookshelf_batch_remove',
    screen_name: 'bookshelf',
    selected_count: selected.value.size,
  })
  selected.value.forEach(id => store.removeFromBookshelf(id))
  selected.value.clear()
  editMode.value = false
}

function setShelfTab(tab: 'reading' | 'finished' | 'favorites') {
  activeTab.value = tab
  Analytics.filterChanged('bookshelf_tab', tab, {
    screen_name: 'bookshelf',
    reading_count: readingBooks.value.length,
    finished_count: finishedBooks.value.length,
    saved_count: store.bookshelf.length,
  })
}

function setShelfSort(sort: 'recent' | 'added' | 'update') {
  sortBy.value = sort
  Analytics.filterChanged('bookshelf_sort', sort, {
    screen_name: 'bookshelf',
    tab: activeTab.value,
  })
}

function trackShelfResume(book: any) {
  Analytics.novelReadStarted(book.id, {
    source: 'bookshelf_continue',
    chapter_no: book.lastChapter || 1,
    progress_pct: book.pct || 0,
    screen_name: 'bookshelf',
    is_resume: true,
  })
}

// Recommended for empty state
const recommended = computed(() =>
  novelStore.novels.sort((a, b) => b.view_count - a.view_count).slice(0, 6)
)

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}
</script>

<template>
  <NativeShelfScreen v-if="nativeApp" />
  <main v-else class="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 pb-20">
    <LoginGate message="Log in to save your favorite novels and track reading progress">

    <!-- Reading Stats Bar -->
    <div class="flex items-center gap-4 mb-5 p-3 rounded-xl border" style="border-color: var(--border-default); background: var(--bg-card)">
      <div class="flex items-center gap-1.5">
        <span class="text-lg">🔥</span>
        <div>
          <p class="text-xs font-bold" style="color: var(--text-primary)">{{ streak }} day streak</p>
          <p class="text-xs" style="color: var(--text-tertiary)">Keep reading!</p>
        </div>
      </div>
      <div class="w-px h-8" style="background: var(--border-default)"></div>
      <div class="text-center flex-1">
        <p class="text-sm font-bold" style="color: var(--text-primary)">{{ totalChaptersRead }}</p>
        <p class="text-xs" style="color: var(--text-tertiary)">Chapters</p>
      </div>
      <div class="text-center flex-1">
        <p class="text-sm font-bold" style="color: var(--text-primary)">{{ totalBooksRead }}</p>
        <p class="text-xs" style="color: var(--text-tertiary)">Finished</p>
      </div>
      <div class="text-center flex-1">
        <p class="text-sm font-bold" style="color: var(--text-primary)">{{ store.bookshelf.length }}</p>
        <p class="text-xs" style="color: var(--text-tertiary)">In Shelf</p>
      </div>
    </div>

    <!-- Continue Reading -->
    <div v-if="continueReading.length" class="mb-6">
      <h2 class="text-base font-bold mb-3" style="color: var(--text-primary)">Continue Reading</h2>
      <div class="space-y-2">
        <router-link
          v-for="book in continueReading" :key="book.id"
          :to="`/book/${book.id}/chapter/${book.lastChapter || 1}`"
          class="flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md"
          style="border-color: var(--border-default); background: var(--bg-card)"
          @click="trackShelfResume(book)"
        >
          <img :src="coverUrl(book.cover_url)" :alt="book.title" class="w-14 h-[72px] rounded-lg object-cover shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate" style="color: var(--text-primary)">{{ book.title }}</p>
            <p class="text-xs mt-0.5" style="color: var(--text-tertiary)">Chapter {{ book.lastChapter }} · {{ book.lastRead }}</p>
            <div class="mt-2 flex items-center gap-2">
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: var(--bg-elevated)">
                <div class="h-full rounded-full bg-primary-500" :style="{ width: book.pct + '%' }"></div>
              </div>
              <span class="text-xs font-semibold" style="color: var(--text-tertiary)">{{ book.pct }}%</span>
            </div>
          </div>
          <span class="text-primary-600 font-semibold text-xs shrink-0">Read →</span>
        </router-link>
      </div>
    </div>

    <!-- Tabs: Reading / Finished / Favorites -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-1 p-1 rounded-xl flex-1" style="background: var(--bg-elevated)">
        <button v-for="tab in [{key:'reading',label:'Reading'},{key:'finished',label:'Finished'},{key:'favorites',label:'Favorites'}] as const" :key="tab.key"
          @click="setShelfTab(tab.key)" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
          :class="activeTab === tab.key ? 'bg-primary-600 text-white shadow-sm' : ''" :style="activeTab !== tab.key ? 'color: var(--text-secondary)' : ''">
          {{ tab.label }}
          <span v-if="tab.key === 'reading'" class="ml-1 opacity-60">({{ readingBooks.length }})</span>
          <span v-if="tab.key === 'finished'" class="ml-1 opacity-60">({{ finishedBooks.length }})</span>
          <span v-if="tab.key === 'favorites'" class="ml-1 opacity-60">({{ store.bookshelf.length }})</span>
        </button>
      </div>
      <button v-if="store.bookshelf.length" @click="editMode = !editMode" class="ml-3 text-xs font-medium text-primary-600">
        {{ editMode ? 'Done' : 'Edit' }}
      </button>
    </div>

    <!-- Sort -->
    <div class="flex gap-2 mb-4">
      <button v-for="s in [{key:'recent',label:'Recent'},{key:'added',label:'Added'},{key:'update',label:'Updated'}] as const" :key="s.key"
        @click="setShelfSort(s.key)" class="px-3 py-1 rounded-full text-xs font-semibold transition-all"
        :class="sortBy === s.key ? 'bg-primary-600 text-white' : 'border'" :style="sortBy !== s.key ? 'border-color: var(--border-default); color: var(--text-tertiary)' : ''">
        {{ s.label }}
      </button>
    </div>

    <!-- Reading tab -->
    <div v-if="activeTab === 'reading'">
      <div v-if="readingBooks.length" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        <div v-for="item in readingBooks" :key="item.novel.id" class="relative">
          <div v-if="editMode" @click="toggleSelect(item.novel.id)" class="absolute top-1 left-1 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer"
            :class="selected.has(item.novel.id) ? 'bg-red-500 border-red-500' : 'border-secondary-300 dark:border-secondary-600'">
            <span v-if="selected.has(item.novel.id)" class="text-white text-xs">✓</span>
          </div>
          <NovelCard :novel="item.novel" show-progress :progress="item.novel.total_chapters > 0 ? Math.round(store.getProgress(item.novel.id) / item.novel.total_chapters * 100) : 0" />
        </div>
      </div>
      <div v-else>
        <EmptyState icon="📚" title="No books yet" description="Start reading to fill your bookshelf" action-to="/" action-text="Browse Books" />
        <div v-if="recommended.length" class="mt-8">
          <p class="text-sm font-semibold mb-3" style="color: var(--text-secondary)">Popular right now</p>
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
            <div v-for="n in recommended" :key="n.id" class="w-[120px] shrink-0"><NovelCard :novel="n" /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Finished tab -->
    <div v-if="activeTab === 'finished'">
      <div v-if="finishedBooks.length" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        <NovelCard v-for="item in finishedBooks" :key="item.novel.id" :novel="item.novel" />
      </div>
      <EmptyState v-else icon="📖" title="No finished books" description="Keep reading to complete your first book!" />
    </div>

    <!-- Favorites tab (all bookshelf) -->
    <div v-if="activeTab === 'favorites'">
      <div v-if="store.bookshelf.length" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        <NovelCard v-for="item in store.bookshelf" :key="item.novel.id" :novel="item.novel" show-progress :progress="item.novel.total_chapters > 0 ? Math.round(store.getProgress(item.novel.id) / item.novel.total_chapters * 100) : 0" />
      </div>
      <EmptyState v-else icon="❤️" title="No favorites yet" description="Add books to your favorites to see them here" action-to="/" action-text="Browse Books" />
    </div>

    <!-- Batch remove -->
    <div v-if="editMode && selected.size > 0" class="fixed bottom-16 left-0 right-0 z-40 px-4 py-3 border-t" style="background: var(--bg-card); border-color: var(--border-default)">
      <button @click="batchRemove" class="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm">Remove {{ selected.size }} books</button>
    </div>

    </LoginGate>
  </main>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
