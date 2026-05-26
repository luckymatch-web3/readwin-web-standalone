<script setup lang="ts">
const currentYear = new Date().getFullYear()

const footerLinks = [
  { label: 'About', path: '/about' },
  { label: 'Privacy', path: '/privacy' },
  { label: 'Account Deletion', path: '/account-deletion' },
  { label: 'Terms', path: '/terms' },
  { label: 'Contact', path: '/contact' },
  { label: 'DMCA', path: '/dmca' },
]
</script>

<template>
  <footer class="mt-16 py-12 border-t" style="background-color: var(--bg-card); border-color: var(--border-default)">
    <div class="max-w-[1280px] mx-auto px-4 lg:px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="ReadWin" class="w-8 h-8 rounded-lg" />
          <span class="font-bold text-lg" style="color: var(--text-primary)">ReadWin</span>
        </div>

        <!-- Links -->
        <nav class="flex items-center gap-6">
          <router-link v-for="link in footerLinks" :key="link.path" :to="link.path"
            class="text-sm transition-colors hover:text-primary-600"
            style="color: var(--text-secondary)">
            {{ link.label }}
          </router-link>
        </nav>

        <!-- Copyright -->
        <p class="text-xs" style="color: var(--text-tertiary)">
          © {{ currentYear }} ReadWin. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>
