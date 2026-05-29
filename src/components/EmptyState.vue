<script setup>
import { Inbox } from 'lucide-vue-next'

defineProps({
  message: { type: String, default: 'Nothing here yet.' },
  icon: { default: Inbox }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-slate-300 select-none">
    <component :is="icon" :size="40" class="mb-3" />
    <p class="text-sm text-slate-400">{{ message }}</p>
  </div>
</template>
