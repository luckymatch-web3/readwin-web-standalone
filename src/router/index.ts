import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomePage.vue') },
    { path: '/book/:id', name: 'book', component: () => import('@/views/BookDetailPage.vue') },
    { path: '/book/:id/chapter/:num', name: 'chapter', component: () => import('@/views/ChapterReadPage.vue') },
    { path: '/search', name: 'search', component: () => import('@/views/SearchPage.vue') },
    { path: '/category/:slug', name: 'category', component: () => import('@/views/CategoryPage.vue') },
    { path: '/rankings', name: 'rankings', component: () => import('@/views/RankingsPage.vue') },
    { path: '/bookshelf', name: 'bookshelf', component: () => import('@/views/BookshelfPage.vue') },
    { path: '/login', name: 'login', component: () => import('@/views/LoginPage.vue') },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordPage.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfilePage.vue') },
    { path: '/invite', name: 'invite', component: () => import('@/views/InvitePage.vue') },
    { path: '/wallet', name: 'wallet', component: () => import('@/views/WalletPage.vue') },
    { path: '/withdraw', name: 'withdraw', component: () => import('@/views/WithdrawPage.vue') },
    { path: '/earn', alias: '/reward', name: 'earn', component: () => import('@/views/EarnPage.vue') },
    { path: '/about', name: 'about', component: () => import('@/views/AboutPage.vue') },
    { path: '/privacy', name: 'privacy', component: () => import('@/views/PrivacyPage.vue') },
    { path: '/account-deletion', name: 'account-deletion', component: () => import('@/views/AccountDeletionPage.vue') },
    { path: '/terms', name: 'terms', component: () => import('@/views/TermsPage.vue') },
    { path: '/contact', name: 'contact', component: () => import('@/views/ContactPage.vue') },
    { path: '/explore', name: 'explore', component: () => import('@/views/ExplorePage.vue') },
    { path: '/vip', redirect: '/reward' },
    { path: '/topup', redirect: '/reward' },
    { path: '/coin-details', name: 'coin-details', component: () => import('@/views/CoinDetailsPage.vue') },
    { path: '/achievements', name: 'achievements', component: () => import('@/views/AchievementsPage.vue') },
    { path: '/language', name: 'language', component: () => import('@/views/LanguagePage.vue') },
    { path: '/notifications', name: 'notifications', component: () => import('@/views/NotificationsPage.vue') },
    { path: '/reading-settings', name: 'reading-settings', component: () => import('@/views/ReadingSettingsPage.vue') },
    { path: '/dmca', name: 'dmca', component: () => import('@/views/DmcaPage.vue') },
  ],
})

export default router
