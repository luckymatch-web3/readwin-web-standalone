import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { BookshelfItem, ReadHistoryItem, Novel } from '@/types'

const BOOKSHELF_KEY = 'readwin-bookshelf'
const HISTORY_KEY = 'readwin-read-history'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded etc */ }
}

export const useBookshelfStore = defineStore('bookshelf', () => {
  const bookshelf = ref<BookshelfItem[]>(loadFromStorage(BOOKSHELF_KEY, []))
  const readHistory = ref<ReadHistoryItem[]>(loadFromStorage(HISTORY_KEY, []))

  // Persist on change
  watch(bookshelf, (v) => saveToStorage(BOOKSHELF_KEY, v), { deep: true })
  watch(readHistory, (v) => saveToStorage(HISTORY_KEY, v), { deep: true })

  const bookshelfIds = computed(() => new Set(bookshelf.value.map(b => b.novel.id)))

  function isInBookshelf(novelId: number): boolean {
    return bookshelfIds.value.has(novelId)
  }

  function addToBookshelf(novel: Novel) {
    if (!isInBookshelf(novel.id)) {
      bookshelf.value.unshift({
        novel, last_read_chapter_no: 0,
        last_read_at: new Date().toISOString(), is_pinned: false,
      })
    }
  }

  function removeFromBookshelf(novelId: number) {
    bookshelf.value = bookshelf.value.filter(b => b.novel.id !== novelId)
  }

  // Returns the last read chapter number (not percentage).
  // Use item.novel.total_chapters to compute percentage at call site.
  function getProgress(novelId: number): number {
    const item = bookshelf.value.find(b => b.novel.id === novelId)
    return item?.last_read_chapter_no || 0
  }

  function updateReadProgress(novel: Novel, chapterNo: number) {
    // Update bookshelf item if exists
    const item = bookshelf.value.find(b => b.novel.id === novel.id)
    if (item) {
      item.last_read_chapter_no = Math.max(item.last_read_chapter_no, chapterNo)
      item.last_read_at = new Date().toISOString()
    }

    // Add to read history (avoid duplicates for same novel+chapter)
    const existing = readHistory.value.findIndex(
      h => h.novel.id === novel.id && h.chapter_no === chapterNo
    )
    if (existing >= 0) {
      readHistory.value.splice(existing, 1)
    }
    readHistory.value.unshift({
      novel, chapter_no: chapterNo, read_at: new Date().toISOString(),
    })
    // Keep history to 100 items max
    if (readHistory.value.length > 100) {
      readHistory.value = readHistory.value.slice(0, 100)
    }
  }

  return { bookshelf, readHistory, isInBookshelf, addToBookshelf, removeFromBookshelf, getProgress, updateReadProgress }
})
