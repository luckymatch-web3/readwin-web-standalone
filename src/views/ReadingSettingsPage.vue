<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import NativeSettingsScreen from '@/components/app/NativeSettingsScreen.vue'
import { isNativeApp } from '@/services/admob'

interface ReadingSettings {
  fontSize: number // 14-24
  lineHeight: number // 1.2-2.0
  fontFamily: string
  theme: 'light' | 'dark' | 'sepia'
  autoScroll: boolean
  scrollSpeed: number // 1-10
  tapToNext: boolean
  volumeButtonsScroll: boolean
}

const toastStore = useToastStore()
const nativeApp = isNativeApp()

const settings = ref<ReadingSettings>({
  fontSize: 16,
  lineHeight: 1.6,
  fontFamily: 'system-ui',
  theme: 'light',
  autoScroll: false,
  scrollSpeed: 5,
  tapToNext: true,
  volumeButtonsScroll: false,
})

const fontFamilies = [
  { id: 'system-ui', name: 'System Default', preview: 'Aa' },
  { id: 'Georgia', name: 'Georgia', preview: 'Aa', style: 'font-family: Georgia, serif' },
  { id: 'Times New Roman', name: 'Times New Roman', preview: 'Aa', style: 'font-family: "Times New Roman", serif' },
  { id: 'Arial', name: 'Arial', preview: 'Aa', style: 'font-family: Arial, sans-serif' },
  { id: 'Verdana', name: 'Verdana', preview: 'Aa', style: 'font-family: Verdana, sans-serif' },
  { id: 'Courier New', name: 'Courier New', preview: 'Aa', style: 'font-family: "Courier New", monospace' },
]

const themes = [
  { id: 'light', name: 'Light', bg: '#ffffff', text: '#1f2937', desc: 'White background, dark text' },
  { id: 'dark', name: 'Dark', bg: '#111827', text: '#f3f4f6', desc: 'Dark background, light text' },
  { id: 'sepia', name: 'Sepia', bg: '#f5e9d9', text: '#5c4b37', desc: 'Warm sepia tone, easy on eyes' },
]

function saveSettings() {
  localStorage.setItem('readwin-reading-settings', JSON.stringify(settings.value))
  toastStore.show('Settings saved!', 'success')
}

function resetToDefaults() {
  settings.value = {
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'system-ui',
    theme: 'light',
    autoScroll: false,
    scrollSpeed: 5,
    tapToNext: true,
    volumeButtonsScroll: false,
  }
}

function previewFontSize() {
  return `${settings.value.fontSize}px`
}

function previewLineHeight() {
  return `${settings.value.lineHeight}`
}

// Load saved settings
onMounted(() => {
  const saved = localStorage.getItem('readwin-reading-settings')
  if (saved) {
    try {
      settings.value = { ...settings.value, ...JSON.parse(saved) }
    } catch (e) {
      toastStore.show('Failed to load reading settings', 'error')
    }
  }
})
</script>

<template>
  <NativeSettingsScreen v-if="nativeApp" />
  <main v-else class="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary)">Reading Settings</h1>
        <p class="text-sm" style="color: var(--text-tertiary)">Customize your reading experience</p>
      </div>

      <!-- Preview section -->
      <div class="rounded-xl p-6 mb-8" :style="{
        backgroundColor: themes.find(t => t.id === settings.theme)?.bg || 'var(--bg-card)',
        color: themes.find(t => t.id === settings.theme)?.text || 'var(--text-primary)',
        border: '1px solid var(--border-default)',
        fontSize: previewFontSize(),
        lineHeight: previewLineHeight(),
        fontFamily: settings.fontFamily
      }">
        <h3 class="font-bold mb-3">Preview Text</h3>
        <p class="mb-3">
          This is how your text will appear. You can adjust the font size, line height, and theme to match your reading preferences.
        </p>
        <p>
          "The moon hung low over the ancient forest, casting silver light through the dense canopy. A lone wolf howled in the distance, its cry echoing through the silent night."
        </p>
      </div>

      <!-- Settings form -->
      <div class="space-y-6">
        <!-- Font Size -->
        <div class="rounded-xl p-5" style="background-color: var(--bg-card); border: 1px solid var(--border-default)">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-sm" style="color: var(--text-primary)">Font Size</h3>
              <p class="text-xs" style="color: var(--text-tertiary)">{{ settings.fontSize }}px</p>
            </div>
            <span class="text-lg">🔠</span>
          </div>
          <input
            v-model="settings.fontSize"
            type="range"
            min="14"
            max="24"
            step="1"
            class="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
            style="accent-color: var(--primary-600)"
          />
          <div class="flex justify-between text-xs mt-2" style="color: var(--text-tertiary)">
            <span>Small</span>
            <span>Medium</span>
            <span>Large</span>
          </div>
        </div>

        <!-- Line Height -->
        <div class="rounded-xl p-5" style="background-color: var(--bg-card); border: 1px solid var(--border-default)">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-sm" style="color: var(--text-primary)">Line Height</h3>
              <p class="text-xs" style="color: var(--text-tertiary)">{{ settings.lineHeight.toFixed(1) }}</p>
            </div>
            <span class="text-lg">📏</span>
          </div>
          <input
            v-model="settings.lineHeight"
            type="range"
            min="1.2"
            max="2.0"
            step="0.1"
            class="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
            style="accent-color: var(--primary-600)"
          />
          <div class="flex justify-between text-xs mt-2" style="color: var(--text-tertiary)">
            <span>Tight</span>
            <span>Comfortable</span>
            <span>Spacious</span>
          </div>
        </div>

        <!-- Font Family -->
        <div class="rounded-xl p-5" style="background-color: var(--bg-card); border: 1px solid var(--border-default)">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm" style="color: var(--text-primary)">Font Family</h3>
            <span class="text-lg">✍️</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="font in fontFamilies"
              :key="font.id"
              @click="settings.fontFamily = font.id"
              class="p-3 rounded-lg text-center transition-colors"
              :class="settings.fontFamily === font.id ? 'bg-primary-600 text-white' : 'hover:bg-[var(--bg-hover)]'"
              :style="settings.fontFamily !== font.id ? `color: var(--text-secondary); ${font.style || ''}` : font.style || ''"
            >
              <div class="text-xl mb-1" :style="font.style || ''">{{ font.preview }}</div>
              <div class="text-xs">{{ font.name }}</div>
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="rounded-xl p-5" style="background-color: var(--bg-card); border: 1px solid var(--border-default)">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm" style="color: var(--text-primary)">Theme</h3>
            <span class="text-lg">🎨</span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="theme in themes"
              :key="theme.id"
              @click="settings.theme = theme.id as 'light' | 'dark' | 'sepia'"
              class="p-4 rounded-lg text-left transition-transform hover:scale-[1.02]"
              :class="settings.theme === theme.id ? 'ring-2 ring-primary-500' : ''"
              :style="`background-color: ${theme.bg}; color: ${theme.text}`"
            >
              <div class="font-medium text-sm mb-1">{{ theme.name }}</div>
              <div class="text-xs opacity-80">{{ theme.desc }}</div>
            </button>
          </div>
        </div>

        <!-- Reading Controls -->
        <div class="rounded-xl p-5" style="background-color: var(--bg-card); border: 1px solid var(--border-default)">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm" style="color: var(--text-primary)">Reading Controls</h3>
            <span class="text-lg">🎮</span>
          </div>
          <div class="space-y-4">
            <!-- Auto-scroll -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium" style="color: var(--text-primary)">Auto-scroll</p>
                <p class="text-xs" style="color: var(--text-tertiary)">Automatically scroll through chapters</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="settings.autoScroll" type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-secondary-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <!-- Scroll speed (only if auto-scroll enabled) -->
            <div v-if="settings.autoScroll" class="pl-2">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm" style="color: var(--text-secondary)">Scroll Speed</p>
                <p class="text-xs" style="color: var(--text-tertiary)">{{ settings.scrollSpeed }}/10</p>
              </div>
              <input
                v-model="settings.scrollSpeed"
                type="range"
                min="1"
                max="10"
                step="1"
                class="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
                style="accent-color: var(--primary-600)"
              />
            </div>

            <!-- Tap to next -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium" style="color: var(--text-primary)">Tap to Next Chapter</p>
                <p class="text-xs" style="color: var(--text-tertiary)">Tap right side to go to next chapter</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="settings.tapToNext" type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-secondary-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <!-- Volume buttons scroll -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium" style="color: var(--text-primary)">Volume Buttons Scroll</p>
                <p class="text-xs" style="color: var(--text-tertiary)">Use volume buttons to scroll pages</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="settings.volumeButtonsScroll" type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-secondary-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 pt-4">
          <button
            @click="resetToDefaults"
            class="flex-1 py-3 text-sm font-semibold rounded-xl border transition-colors"
            style="border-color: var(--border-default); color: var(--text-secondary); background-color: var(--bg-card)"
          >
            Reset Defaults
          </button>
          <button
            @click="saveSettings"
            class="flex-1 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
