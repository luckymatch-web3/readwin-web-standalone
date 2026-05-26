import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Novel, Category, Banner, Chapter } from '@/types'
import { novels as mockNovels, categories as mockCategories, banners as mockBanners, generateChapters, sampleChapterContent } from '@/mock/novels'
import { novelApi, categoryApi, bannerApi, chapterApi } from '@/services/api'

const unknownCategory: Category = { id: 0, name: 'Novel', display_name: 'Novel' }

function normalized(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function categoryFromRaw(value: any): Category | null {
  if (!value || typeof value !== 'object') return null
  const name = value.name || value.display_name || value.title || value.slug
  if (!name && value.id == null) return null

  return {
    id: Number(value.id || 0),
    name: String(name || 'Novel'),
    display_name: String(value.display_name || name || 'Novel'),
    icon_url: value.icon_url,
    novel_count: value.novel_count,
  }
}

function findCategory(raw: any, cats: Category[]): Category {
  const rawCategory = categoryFromRaw(raw.category)
  const rawCategoryId = raw.category_id ?? raw.categoryId ?? raw.category?.id
  const rawCategoryName = raw.category_name ?? raw.categoryName ?? raw.category?.name ?? raw.category?.display_name
  const rawTags = Array.isArray(raw.tags) ? raw.tags.map(normalized) : []

  const byId = rawCategoryId != null
    ? cats.find(c => String(c.id) === String(rawCategoryId))
    : undefined
  const byName = rawCategoryName
    ? cats.find(c =>
        normalized(c.name) === normalized(rawCategoryName) ||
        normalized(c.display_name) === normalized(rawCategoryName),
      )
    : undefined
  const byTag = cats.find(c =>
    rawTags.includes(normalized(c.name)) || rawTags.includes(normalized(c.display_name)),
  )

  return byId || byName || rawCategory || byTag || unknownCategory
}

// Adapt backend novel data to frontend Novel type
function adaptNovel(raw: any, cats: Category[]): Novel {
  const cat = findCategory(raw, cats)
  return {
    id: raw.id,
    title: raw.title,
    author_name: raw.author_name,
    cover_url: raw.cover_url,
    synopsis: raw.synopsis || '',
    category: cat,
    tags: raw.tags || [],
    status: raw.status ?? 1,
    is_featured: raw.is_featured ?? raw.view_count > 100000,
    is_hot: raw.is_hot ?? raw.view_count > 50000,
    is_new: raw.is_new ?? false,
    total_chapters: raw.total_chapters ?? 0,
    free_chapters: raw.total_chapters ?? raw.free_chapters ?? 0,
    word_count: raw.word_count ?? 0,
    view_count: raw.view_count ?? 0,
    like_count: raw.like_count ?? Math.floor((raw.view_count || 0) * 0.1),
    bookmark_count: raw.bookmark_count ?? 0,
    rating_avg: raw.rating_avg ?? 0,
    rating_count: raw.rating_count ?? 0,
  }
}

export const useNovelStore = defineStore('novel', () => {
  const novels = ref<Novel[]>([])
  const categories = ref<Category[]>([])
  const banners = ref<Banner[]>(mockBanners)
  const loading = ref(false)
  const initialized = ref(false)

  const featuredNovels = computed(() => {
    const flagged = novels.value.filter(n => n.is_featured)
    const source = flagged.length >= 6 ? flagged : novels.value
    return [...source]
      .sort((a, b) => (b.rating_avg * Math.max(b.rating_count, 1)) - (a.rating_avg * Math.max(a.rating_count, 1)))
  })
  const hotNovels = computed(() => {
    const flagged = novels.value.filter(n => n.is_hot)
    const source = flagged.length >= 18 ? flagged : novels.value
    return [...source].sort((a, b) => b.view_count - a.view_count)
  })
  const newNovels = computed(() => {
    const flagged = novels.value.filter(n => n.is_new)
    const source = flagged.length >= 12 ? flagged : novels.value
    return [...source].sort((a, b) => b.id - a.id)
  })
  const freeNovels = computed(() => novels.value)

  async function init() {
    if (initialized.value) return
    loading.value = true
    try {
      // Fetch categories first
      const rawCats = await categoryApi.list()
      categories.value = rawCats.length ? rawCats : mockCategories

      // Fast first page load, then background load rest
      const pageSize = 100
      const first = await novelApi.listPaged(1, pageSize)
      novels.value = first.items.map((n: any) => adaptNovel(n, categories.value))
      
      // Background load remaining pages
      if (first.total > pageSize) {
        ;(async () => {
          let page = 2
          while (true) {
            try {
              const data = await novelApi.listPaged(page, pageSize)
              const more = data.items.map((n: any) => adaptNovel(n, categories.value))
              novels.value = [...novels.value, ...more]
              if (novels.value.length >= data.total || data.items.length < pageSize) break
              page++
            } catch { break }
          }
        })()
      }
      
      // Mark first few as featured/new if not set
      novels.value.forEach((n, i) => {
        if (i < 4) n.is_featured = true
        if (i >= novels.value.length - 3) n.is_new = true
      })

      // Generate banners from real novel data
      const gradients = [
        ['#1E3A8A', '#7C3AED'], ['#831843', '#DB2777'], ['#B45309', '#F59E0B'],
        ['#0F172A', '#1D4ED8'], ['#064E3B', '#10B981'],
      ]
      const subtitles = [
        'The #1 trending novel. Start reading now!',
        'Millions of readers can\'t stop. Will you?',
        'A story that will keep you up all night.',
        'New and already breaking records!',
      ]
      if (novels.value.length) {
        // Pick top novels by rating that have covers for banner
        const bannerNovels = [...novels.value]
          .filter(n => n.cover_url && !n.cover_url.includes('default'))
          .sort((a, b) => (b.rating_avg * b.rating_count) - (a.rating_avg * a.rating_count))
          .slice(0, 4)
        const picks = bannerNovels.length >= 4 ? bannerNovels : novels.value.slice(0, 4)
        banners.value = picks.map((n, i) => ({
          id: n.id,
          title: n.title,
          subtitle: subtitles[i % subtitles.length],
          image_url: n.cover_url,
          link_type: 'novel',
          link_value: String(n.id),
          gradient_from: gradients[i % gradients.length]?.[0] ?? '#1E3A8A',
          gradient_to: gradients[i % gradients.length]?.[1] ?? '#7C3AED',
        }))
      }

      initialized.value = true
    } catch (e) {
      console.warn('[Store] Failed to fetch from API, using mock data:', e)
      novels.value = mockNovels
      categories.value = mockCategories
    } finally {
      loading.value = false
    }
  }

  function getNovelById(id: number): Novel | undefined {
    return novels.value.find(n => n.id === id)
  }

  function getNovelsByCategory(slug: string): Novel[] {
    const key = normalized(slug)
    return novels.value.filter(n =>
      normalized(n.category?.name) === key ||
      normalized(n.category?.display_name) === key ||
      String(n.category?.id || '') === String(slug),
    )
  }

  function searchNovels(query: string): Novel[] {
    const q = query.toLowerCase()
    return novels.value.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.author_name.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q)) ||
      n.synopsis.toLowerCase().includes(q)
    )
  }

  function getChapters(novelId: number): Chapter[] {
    const novel = getNovelById(novelId)
    return generateChapters(novelId, novel?.total_chapters ?? 50)
  }

  function getChapterContent(_novelId: number, _chapterNo: number): string {
    return sampleChapterContent
  }

  function getRankings(type: string): Novel[] {
    const sorted = [...novels.value]
    switch (type) {
      case 'hot': return sorted.sort((a, b) => b.view_count - a.view_count)
      case 'trending': return sorted.sort((a, b) => b.like_count - a.like_count)
      case 'completed': return sorted.filter(n => n.status === 2).sort((a, b) => b.rating_avg - a.rating_avg)
      case 'rating': return sorted.sort((a, b) => b.rating_avg - a.rating_avg)
      default: return sorted
    }
  }

  return {
    novels, categories, banners, loading,
    featuredNovels, hotNovels, newNovels, freeNovels,
    init, getNovelById, getNovelsByCategory, searchNovels,
    getChapters, getChapterContent, getRankings,
  }
})
