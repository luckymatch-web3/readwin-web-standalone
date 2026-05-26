<script setup lang="ts">
import { ref } from 'vue'
import NativeContactScreen from '@/components/app/NativeContactScreen.vue'
import { isNativeApp } from '@/services/admob'

const form = ref({ email: '', subject: '', message: '' })
const submitted = ref(false)
const nativeApp = isNativeApp()

function handleSubmit() {
  if (!form.value.email || !form.value.subject || !form.value.message) return
  submitted.value = true
  form.value = { email: '', subject: '', message: '' }
}

const socials = [
  { name: 'Twitter', icon: '𝕏', url: 'https://twitter.com/readwin' },
  { name: 'Facebook', icon: 'f', url: 'https://facebook.com/readwin' },
  { name: 'Instagram', icon: '📷', url: 'https://instagram.com/readwin' },
]
</script>

<template>
  <NativeContactScreen v-if="nativeApp" />
  <main v-else class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <h1 class="text-3xl font-bold mb-2 text-center" style="color: var(--text-primary)">Contact Us</h1>
    <p class="text-center mb-10" style="color: var(--text-secondary)">We'd love to hear from you. Get in touch with our team.</p>

    <div class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
      <!-- Form -->
      <div class="p-6 rounded-xl border" style="background-color: var(--bg-card); border-color: var(--border-default)">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary)">Send a Message</h2>

        <div v-if="submitted" class="p-4 rounded-lg bg-green-50 text-green-700 text-sm mb-4">
          ✅ Thank you! Your message has been sent. We'll get back to you within 24-48 hours.
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary)">Email</label>
            <input v-model="form.email" type="email" required placeholder="your@email.com"
              class="w-full px-4 py-2.5 text-sm rounded-lg border outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
              style="background-color: var(--bg-primary); border-color: var(--border-default); color: var(--text-primary)" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary)">Subject</label>
            <input v-model="form.subject" type="text" required placeholder="What's this about?"
              class="w-full px-4 py-2.5 text-sm rounded-lg border outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
              style="background-color: var(--bg-primary); border-color: var(--border-default); color: var(--text-primary)" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--text-secondary)">Message</label>
            <textarea v-model="form.message" required rows="5" placeholder="Tell us what's on your mind..."
              class="w-full px-4 py-2.5 text-sm rounded-lg border outline-none resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
              style="background-color: var(--bg-primary); border-color: var(--border-default); color: var(--text-primary)"></textarea>
          </div>
          <button type="submit" class="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            Send Message
          </button>
        </form>
      </div>

      <!-- Info -->
      <div class="space-y-6">
        <div class="p-6 rounded-xl border" style="background-color: var(--bg-card); border-color: var(--border-default)">
          <h3 class="font-semibold mb-3" style="color: var(--text-primary)">📧 Email Us</h3>
          <p class="text-sm" style="color: var(--text-secondary)">For general inquiries and support:</p>
          <a href="mailto:support@readwin.me" class="text-sm text-primary-600 font-medium">support@readwin.me</a>
        </div>

        <div class="p-6 rounded-xl border" style="background-color: var(--bg-card); border-color: var(--border-default)">
          <h3 class="font-semibold mb-3" style="color: var(--text-primary)">📍 Our Office</h3>
          <p class="text-sm" style="color: var(--text-secondary)">
            ReadWin Pte. Ltd.<br>
            1 Raffles Place, #20-61<br>
            Tower 2, One Raffles Place<br>
            Singapore 048616
          </p>
        </div>

        <div class="p-6 rounded-xl border" style="background-color: var(--bg-card); border-color: var(--border-default)">
          <h3 class="font-semibold mb-3" style="color: var(--text-primary)">🌐 Follow Us</h3>
          <div class="flex gap-3">
            <a v-for="s in socials" :key="s.name" :href="s.url" target="_blank" rel="noopener"
              class="w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-bold transition-colors hover:border-primary-500 hover:text-primary-600"
              style="border-color: var(--border-default); color: var(--text-secondary)">
              {{ s.icon }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
