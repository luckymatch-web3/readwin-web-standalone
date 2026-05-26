export interface Novel {
  id: number
  title: string
  author_name: string
  cover_url: string
  synopsis: string
  category: Category
  tags: string[]
  status: number // 1=ongoing, 2=completed, 0=removed
  is_featured: boolean
  is_hot: boolean
  is_new: boolean
  total_chapters: number
  free_chapters: number
  word_count: number
  view_count: number
  like_count: number
  bookmark_count: number
  rating_avg: number
  rating_count: number
}

export interface Category {
  id: number
  name: string
  display_name: string
  icon_url?: string
  novel_count?: number
}

export interface Chapter {
  id: number
  novel_id: number
  chapter_no: number
  title: string
  content?: string
  word_count: number
  is_free: boolean
  coin_price: number
  is_unlocked?: boolean
  prev_chapter_id?: number | null
  next_chapter_id?: number | null
}

export interface User {
  id: number
  uid: string
  email: string
  nickname: string
  avatar_url?: string
  coin_balance: number
  reward_diamond: number
  paid_diamond: number
  commission_diamond: number
  vip_expire_at?: string | null
  invite_code: string
}

export interface DiamondBalance {
  reward_diamond: number
  paid_diamond: number
  commission_diamond: number
  total_diamond: number
}

export interface DiamondLog {
  id: number
  type: string
  action: string
  amount: number
  balance_after: number
  source: string | null
  note: string | null
  created_at: string
}

export interface InviteInfo {
  invite_code: string
  invite_link: string
  level1_count: number
  level2_count: number
  total_commission: number
  month_commission: number
}

export interface TeamMember {
  id: number
  nickname: string
  avatar_url: string | null
  level: number
  total_commission: number
  joined_at: string
}

export interface WithdrawRecord {
  id: number
  amount: number
  cash_amount: number
  method: string
  account: string
  status: string
  reject_reason: string | null
  created_at: string
  processed_at: string | null
}

export interface Banner {
  id: number
  title: string
  subtitle?: string
  image_url: string
  link_type: string
  link_value: string
  gradient_from?: string
  gradient_to?: string
}

export interface BookshelfItem {
  novel: Novel
  last_read_chapter_no: number
  last_read_at: string
  is_pinned: boolean
}

export interface ReadHistoryItem {
  novel: Novel
  chapter_no: number
  read_at: string
}

export type RankingType = 'hot' | 'trending' | 'completed'
export type NovelStatus = 'ongoing' | 'completed' | 'all'
export type SortBy = 'popular' | 'newest' | 'rating' | 'updated'
export interface TipGift { type: string; label: string; icon: string; amount: number }
