<script setup lang="ts">
import CoinIcon from '@/components/CoinIcon.vue'

const features = [
  { icon: '📖', title: 'Free Reading', desc: 'Access thousands of novels completely free. No hidden fees, no paywalls for basic content.' },
  { icon: 'coin', title: 'Earn Coins', desc: 'Read stories, complete tasks, and invite friends to earn coins and rewards.' },
  { icon: '📚', title: 'Massive Library', desc: 'Over 10,000 novels across 20+ genres, updated daily with fresh content.' },
  { icon: '🌍', title: 'Multi-Genre', desc: 'From Romance to Sci-Fi, Fantasy to Thriller — find your perfect story.' },
]

const team = [
  { name: 'David Chen', role: 'CEO & Co-Founder', bio: 'Former VP of Product at a leading Southeast Asian tech company. Passionate about democratizing access to literature.' },
  { name: 'Sarah Lim', role: 'CTO & Co-Founder', bio: '10+ years in software engineering. Previously led engineering teams at major e-commerce platforms.' },
  { name: 'Arjun Patel', role: 'Head of Content', bio: 'Published author and literary agent with deep connections in the English-language fiction world.' },
  { name: 'Maya Tanaka', role: 'Head of Design', bio: 'Award-winning UX designer focused on creating delightful reading experiences across all devices.' },
]
</script>

<template>
  <main class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <!-- Hero -->
    <section class="text-center py-12 lg:py-20">
      <div class="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-6">
        <span class="text-white font-bold text-2xl">R</span>
      </div>
      <h1 class="text-3xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">About ReadWin</h1>
      <p class="text-lg lg:text-xl max-w-2xl mx-auto" style="color: var(--text-secondary)">
        Southeast Asia's largest free English novel reading platform. We believe everyone deserves access to great stories.
      </p>
    </section>

    <!-- Mission -->
    <section class="py-12 text-center">
      <h2 class="text-2xl font-bold mb-4" style="color: var(--text-primary)">Our Mission</h2>
      <p class="text-base max-w-3xl mx-auto leading-relaxed" style="color: var(--text-secondary)">
        At ReadWin, we're on a mission to make quality storytelling accessible to everyone. We connect readers with thousands of talented authors, providing a platform where stories come alive — completely free. Whether you're commuting, relaxing, or looking for your next adventure, ReadWin is your gateway to endless worlds.
      </p>
    </section>

    <!-- Features -->
    <section class="py-12">
      <h2 class="text-2xl font-bold text-center mb-10" style="color: var(--text-primary)">Why ReadWin?</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="f in features" :key="f.title" class="p-6 rounded-xl border text-center" style="background-color: var(--bg-card); border-color: var(--border-default)">
          <div class="text-4xl mb-4"><CoinIcon v-if="f.icon === 'coin'" size="2.5rem" /><template v-else>{{ f.icon }}</template></div>
          <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary)">{{ f.title }}</h3>
          <p class="text-sm" style="color: var(--text-secondary)">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="py-12">
      <h2 class="text-2xl font-bold text-center mb-10" style="color: var(--text-primary)">Our Team</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="m in team" :key="m.name" class="p-6 rounded-xl border" style="background-color: var(--bg-card); border-color: var(--border-default)">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold mb-4">
            {{ m.name[0] }}
          </div>
          <h3 class="font-semibold" style="color: var(--text-primary)">{{ m.name }}</h3>
          <p class="text-sm text-primary-600 font-medium mb-2">{{ m.role }}</p>
          <p class="text-sm" style="color: var(--text-secondary)">{{ m.bio }}</p>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-12 text-center">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="stat in [{ label: 'Novels', value: '10,000+' }, { label: 'Readers', value: '2M+' }, { label: 'Authors', value: '5,000+' }, { label: 'Countries', value: '50+' }]" :key="stat.label">
          <div class="text-3xl font-bold text-primary-600">{{ stat.value }}</div>
          <div class="text-sm mt-1" style="color: var(--text-secondary)">{{ stat.label }}</div>
        </div>
      </div>
    </section>
  </main>
</template>
