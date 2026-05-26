// @ts-nocheck
import type { Novel, Category, Banner, Chapter } from '@/types'

export const categories: Category[] = [
  { id: 1, name: 'Romance', display_name: 'Romance', novel_count: 245 },
  { id: 2, name: 'Fantasy', display_name: 'Fantasy', novel_count: 189 },
  { id: 3, name: 'Werewolf', display_name: 'Werewolf', novel_count: 156 },
  { id: 4, name: 'Billionaire', display_name: 'Billionaire', novel_count: 134 },
  { id: 5, name: 'Mystery', display_name: 'Mystery', novel_count: 98 },
  { id: 6, name: 'Sci-Fi', display_name: 'Sci-Fi', novel_count: 76 },
  { id: 7, name: 'Horror', display_name: 'Horror', novel_count: 65 },
  { id: 8, name: 'Adventure', display_name: 'Adventure', novel_count: 112 },
  { id: 9, name: 'Historical', display_name: 'Historical', novel_count: 54 },
  { id: 10, name: 'Teen', display_name: 'Teen Fiction', novel_count: 87 },
]

const covers = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=400&fit=crop',
]

export const novels: Novel[] = [
  {
    id: 1, title: 'The Alpha\'s Forbidden Mate', author_name: 'Luna Evergreen',
    cover_url: covers[0], synopsis: 'When Aria discovers she\'s mated to the ruthless Alpha of the Blackwood Pack, she must choose between her heart and her duty to her own pack. A forbidden love that could unite — or destroy — two ancient bloodlines.',
    category: categories[2], tags: ['Werewolf', 'Romance', 'Forbidden Love'], status: 1,
    is_featured: true, is_hot: true, is_new: false, total_chapters: 156, free_chapters: 15,
    word_count: 312000, view_count: 2450000, like_count: 89000, bookmark_count: 45000,
    rating_avg: 4.7, rating_count: 12300,
  },
  {
    id: 2, title: 'Billionaire\'s Secret Wife', author_name: 'Victoria Chase',
    cover_url: covers[1], synopsis: 'After a drunken night in Vegas, Emma wakes up married to Alexander Sterling — the coldest billionaire in Manhattan. Their contract marriage was supposed to be simple, but nothing about Alexander is simple.',
    category: categories[3], tags: ['Billionaire', 'Contract Marriage', 'CEO'], status: 1,
    is_featured: true, is_hot: true, is_new: false, total_chapters: 203, free_chapters: 20,
    word_count: 405000, view_count: 3100000, like_count: 112000, bookmark_count: 67000,
    rating_avg: 4.5, rating_count: 18500,
  },
  {
    id: 3, title: 'Throne of Shadows', author_name: 'R.K. Blackwell',
    cover_url: covers[2], synopsis: 'In a world where magic is forbidden, seventeen-year-old Kael discovers he carries the blood of the ancient Shadow Kings. Now hunted by the Empire, he must master his powers before darkness consumes everything.',
    category: categories[1], tags: ['Fantasy', 'Magic', 'Dark Fantasy'], status: 1,
    is_featured: true, is_hot: false, is_new: false, total_chapters: 312, free_chapters: 25,
    word_count: 624000, view_count: 1890000, like_count: 76000, bookmark_count: 41000,
    rating_avg: 4.8, rating_count: 9800,
  },
  {
    id: 4, title: 'The CEO\'s Runaway Bride', author_name: 'Sophie Bennett',
    cover_url: covers[3], synopsis: 'Mia fled her wedding to escape an arranged marriage to a man she\'d never met. Three years later, fate brings her face to face with Ethan Cole — her would-be husband and now her new boss.',
    category: categories[0], tags: ['Romance', 'CEO', 'Second Chance'], status: 2,
    is_featured: false, is_hot: true, is_new: false, total_chapters: 178, free_chapters: 18,
    word_count: 356000, view_count: 1560000, like_count: 58000, bookmark_count: 32000,
    rating_avg: 4.3, rating_count: 8700,
  },
  {
    id: 5, title: 'Whispers in the Dark', author_name: 'M.J. Holloway',
    cover_url: covers[4], synopsis: 'Detective Sarah Chen thought the Midnight Killer case was closed. But when identical murders begin again in a new city, she realizes the real killer was never caught — and now he\'s watching her.',
    category: categories[4], tags: ['Mystery', 'Thriller', 'Serial Killer'], status: 1,
    is_featured: false, is_hot: false, is_new: true, total_chapters: 89, free_chapters: 10,
    word_count: 178000, view_count: 780000, like_count: 34000, bookmark_count: 19000,
    rating_avg: 4.6, rating_count: 5400,
  },
  {
    id: 6, title: 'Rejected by My Fated Mate', author_name: 'Aurora Nightshade',
    cover_url: covers[5], synopsis: 'Lena was rejected by her fated mate on the night of the mating ceremony. Broken and humiliated, she flees to the rival pack — only to discover she\'s the long-lost daughter of their Alpha.',
    category: categories[2], tags: ['Werewolf', 'Rejection', 'Strong Female Lead'], status: 1,
    is_featured: true, is_hot: true, is_new: false, total_chapters: 245, free_chapters: 20,
    word_count: 490000, view_count: 2890000, like_count: 98000, bookmark_count: 56000,
    rating_avg: 4.4, rating_count: 15200,
  },
  {
    id: 7, title: 'Starfall Academy', author_name: 'Zara Nightingale',
    cover_url: covers[6], synopsis: 'At the galaxy\'s most prestigious academy, cadets train to become Starfall Knights. Nova is the first human ever admitted — and everyone wants her to fail. But she has a secret that could change everything.',
    category: categories[5], tags: ['Sci-Fi', 'Academy', 'Space Opera'], status: 1,
    is_featured: false, is_hot: false, is_new: true, total_chapters: 67, free_chapters: 12,
    word_count: 134000, view_count: 420000, like_count: 21000, bookmark_count: 13000,
    rating_avg: 4.5, rating_count: 3200,
  },
  {
    id: 8, title: 'His Possessive Love', author_name: 'Ella Montgomery',
    cover_url: covers[7], synopsis: 'When struggling artist Lily becomes the personal assistant to the possessive billionaire Damien Black, she enters a world of luxury, danger, and an all-consuming love that threatens to destroy them both.',
    category: categories[3], tags: ['Billionaire', 'Possessive', 'Dark Romance'], status: 2,
    is_featured: false, is_hot: false, is_new: false, total_chapters: 198, free_chapters: 15,
    word_count: 396000, view_count: 1230000, like_count: 45000, bookmark_count: 28000,
    rating_avg: 4.1, rating_count: 7600,
  },
  {
    id: 9, title: 'The Witch\'s Grimoire', author_name: 'Ivy Thornwood',
    cover_url: covers[8], synopsis: 'Elara inherits her grandmother\'s bookshop — and a grimoire filled with real spells. As she unlocks its secrets, she discovers a hidden world of witches, ancient curses, and a prophecy about her bloodline.',
    category: categories[1], tags: ['Fantasy', 'Witchcraft', 'Urban Fantasy'], status: 1,
    is_featured: false, is_hot: false, is_new: true, total_chapters: 45, free_chapters: 8,
    word_count: 90000, view_count: 340000, like_count: 18000, bookmark_count: 11000,
    rating_avg: 4.7, rating_count: 2800,
  },
  {
    id: 10, title: 'Married to the Mafia King', author_name: 'Carmen Rosetti',
    cover_url: covers[9], synopsis: 'To save her father\'s life, innocent school teacher Grace agrees to marry Luca Moretti — the most feared mafia boss in the country. She expected cruelty. She didn\'t expect to fall in love.',
    category: categories[0], tags: ['Romance', 'Mafia', 'Arranged Marriage'], status: 1,
    is_featured: true, is_hot: true, is_new: false, total_chapters: 267, free_chapters: 22,
    word_count: 534000, view_count: 2670000, like_count: 95000, bookmark_count: 52000,
    rating_avg: 4.6, rating_count: 14100,
  },
  {
    id: 11, title: 'The Last Dragonborn', author_name: 'Edmund Ashford',
    cover_url: covers[10], synopsis: 'Dragons have been extinct for a thousand years — until one hatches in Finn\'s bedroom. Now the Empire\'s last Dragonborn must protect his dragon and uncover why the ancient creatures are returning.',
    category: categories[1], tags: ['Fantasy', 'Dragons', 'Epic'], status: 1,
    is_featured: false, is_hot: false, is_new: false, total_chapters: 189, free_chapters: 18,
    word_count: 378000, view_count: 1450000, like_count: 62000, bookmark_count: 35000,
    rating_avg: 4.8, rating_count: 8900,
  },
  {
    id: 12, title: 'Room 313', author_name: 'Harper Graves',
    cover_url: covers[11], synopsis: 'The old Thornhill Hotel has been closed for decades after a string of disappearances. When a group of urban explorers breaks in for a viral video, they discover that Room 313 never lets its guests leave.',
    category: categories[6], tags: ['Horror', 'Supernatural', 'Haunted'], status: 2,
    is_featured: false, is_hot: false, is_new: false, total_chapters: 134, free_chapters: 12,
    word_count: 268000, view_count: 890000, like_count: 38000, bookmark_count: 22000,
    rating_avg: 4.4, rating_count: 5100,
  },
  {
    id: 13, title: 'Lost Kingdom of Eldara', author_name: 'Sebastian Drake',
    cover_url: covers[12], synopsis: 'Archaeologist Maya Torres discovers a map leading to Eldara — a kingdom that shouldn\'t exist. Racing against a shadowy organization, she journeys through uncharted jungles to find a treasure beyond imagination.',
    category: categories[7], tags: ['Adventure', 'Treasure Hunt', 'Action'], status: 1,
    is_featured: false, is_hot: false, is_new: true, total_chapters: 78, free_chapters: 10,
    word_count: 156000, view_count: 560000, like_count: 27000, bookmark_count: 16000,
    rating_avg: 4.5, rating_count: 4200,
  },
  {
    id: 14, title: 'The Duke\'s Scandalous Governess', author_name: 'Charlotte Fairfax',
    cover_url: covers[13], synopsis: 'In Regency England, disgraced lady Penelope accepts a position as governess to the brooding Duke of Ashworth\'s children. Behind closed doors, passion ignites between the duke and his spirited new employee.',
    category: categories[8], tags: ['Historical', 'Regency', 'Forbidden Love'], status: 2,
    is_featured: false, is_hot: false, is_new: false, total_chapters: 167, free_chapters: 15,
    word_count: 334000, view_count: 1120000, like_count: 48000, bookmark_count: 29000,
    rating_avg: 4.3, rating_count: 6700,
  },
  {
    id: 15, title: 'Campus Heartbreak', author_name: 'Tiffany Liu',
    cover_url: covers[14], synopsis: 'Freshman Chloe promised herself: no boys, no drama, just straight A\'s. That plan lasted exactly one week — until she met bad-boy quarterback Jake and her annoyingly charming lab partner, Noah.',
    category: categories[9], tags: ['Teen', 'College', 'Love Triangle'], status: 1,
    is_featured: false, is_hot: false, is_new: true, total_chapters: 56, free_chapters: 10,
    word_count: 112000, view_count: 310000, like_count: 15000, bookmark_count: 9000,
    rating_avg: 4.2, rating_count: 2100,
  },
]

novels.forEach(novel => {
  novel.free_chapters = novel.total_chapters
})

export const banners: Banner[] = [
  {
    id: 1, title: 'The Alpha\'s Forbidden Mate', subtitle: '2.4M+ readers can\'t be wrong. Dive into the #1 Werewolf romance now!',
    image_url: covers[0], link_type: 'novel', link_value: '1',
    gradient_from: '#1E3A8A', gradient_to: '#7C3AED',
  },
  {
    id: 2, title: 'New: Starfall Academy', subtitle: 'The galaxy\'s most elite academy just admitted its first human. Will she survive?',
    image_url: covers[6], link_type: 'novel', link_value: '7',
    gradient_from: '#0F172A', gradient_to: '#1D4ED8',
  },
  {
    id: 3, title: 'Read & Earn Coins!', subtitle: 'Read free chapters, earn coins, and grow your rewards every day!',
    image_url: covers[2], link_type: 'url', link_value: '/profile',
    gradient_from: '#B45309', gradient_to: '#F59E0B',
  },
  {
    id: 4, title: 'Billionaire\'s Secret Wife', subtitle: 'A drunken Vegas wedding. A cold billionaire husband. 3M+ readers hooked!',
    image_url: covers[1], link_type: 'novel', link_value: '2',
    gradient_from: '#831843', gradient_to: '#DB2777',
  },
]

export function generateChapters(novelId: number, count: number): Chapter[] {
  const chapterTitles = [
    'The Beginning', 'A Chance Encounter', 'Secrets Unveiled', 'The Choice',
    'Into the Unknown', 'Betrayal', 'A New Alliance', 'The Truth Revealed',
    'Desperate Measures', 'The Confrontation', 'Broken Promises', 'Rising Tensions',
    'Point of No Return', 'The Battle Within', 'A Glimmer of Hope',
    'Dark Revelations', 'The Turning Point', 'Hearts Collide', 'The Sacrifice',
    'Dawn of a New Day', 'Shadows and Light', 'The Final Stand', 'Redemption',
    'A Love Reclaimed', 'Epilogue: New Beginnings',
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: novelId * 1000 + i + 1,
    novel_id: novelId,
    chapter_no: i + 1,
    title: chapterTitles[i % chapterTitles.length],
    word_count: 1800 + Math.floor(Math.random() * 1200),
    is_free: true,
    coin_price: 0,
    is_unlocked: true,
  }))
}

export const sampleChapterContent = `The morning sun cast long shadows across the cobblestone courtyard as she stepped through the ancient gates. The air was thick with the scent of jasmine and old parchment — a peculiar combination that seemed to define this place.

"You're late," a voice called from somewhere above.

She looked up to find him leaning against the balcony railing, his dark eyes fixed on her with an intensity that made her breath catch. Even from this distance, she could feel the pull — that inexplicable connection that had haunted her dreams for weeks.

"I wasn't aware punctuality was required for an ambush," she replied, keeping her voice steady despite the hammering of her heart.

He smiled — not the cold, calculating smile she'd seen at the gala, but something warmer, almost vulnerable. It was gone in an instant, replaced by the mask he wore so well.

"Come inside. We have much to discuss."

She hesitated at the threshold. Every instinct screamed at her to turn around, to walk away from whatever dangerous game he was playing. But curiosity — and something far more dangerous — propelled her forward.

The interior was nothing like she'd expected. Where she'd imagined cold marble and clinical precision, she found warmth: shelves overflowing with leather-bound books, thick carpets in jewel tones, and windows that flooded the rooms with golden light.

"You seem surprised," he observed, watching her take in the surroundings.

"I expected something more... austere."

"People often mistake control for coldness." He moved closer, and she caught the subtle scent of sandalwood and cedar. "I assure you, I feel things quite deeply."

The words hung between them, loaded with meaning. She forced herself to focus on why she was here — the letter, the cryptic message, the secrets that needed unraveling.

"The documents," she said firmly. "You promised answers."

He studied her for a long moment, then nodded. "Follow me."

He led her through a series of corridors, each one revealing more about the man behind the legend. Family portraits lined the walls — generations of proud faces with the same striking features. At the end of the hallway, a heavy oak door stood slightly ajar.

"Everything you need is in here," he said, pushing the door open. "But I should warn you — once you know the truth, there's no going back."

She met his gaze steadily. "I stopped going back a long time ago."

The room beyond was a study, every surface covered with files, photographs, and maps. As she began to piece together the puzzle, the weight of what she was uncovering pressed down on her shoulders. This was bigger than she'd imagined — bigger than either of them.

"Now you understand," he said quietly from the doorway. "Now you see why I needed you."

She turned to face him, the evidence clutched in her trembling hands. "This changes everything."

"Yes," he agreed. "It does."

And in that moment, standing in a room full of dangerous secrets, with a man who was perhaps the most dangerous of all, she made her choice. There was no going back — but then again, she'd never been one for retreat.`

export const hotSearchTerms = [
  'werewolf romance', 'billionaire CEO', 'forbidden love', 'alpha mate',
  'mafia romance', 'fantasy magic', 'rejected mate', 'secret baby',
  'campus love', 'dragon rider', 'vampire', 'academy',
]
