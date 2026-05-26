<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  autofocus?: boolean
  placeholder?: string
  large?: boolean
}>(), { placeholder: 'Search novels, authors, tags...', large: false })

const emit = defineEmits<{ 'update:modelValue': [value: string]; submit: [] }>()
const inputRef = ref<HTMLInputElement>()

onMounted(() => { if (props.autofocus) inputRef.value?.focus() })
</script>

<template>
  <form @submit.prevent="emit('submit')" class="relative w-full">
    <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style="color: var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
    <input
      ref="inputRef"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      :placeholder="placeholder"
      class="w-full pl-11 pr-4 border outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
      :class="large ? 'py-3.5 text-base rounded-2xl' : 'py-2.5 text-sm rounded-xl'"
      style="background-color: var(--bg-card); border-color: var(--border-default); color: var(--text-primary)"
    />
  </form>
</template>
