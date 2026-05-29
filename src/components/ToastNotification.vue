<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const toasts = ref([])

function addToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

function handleToast(e) {
  addToast(e.detail.message, e.detail.type)
}

onMounted(() => window.addEventListener('show-toast', handleToast))
onUnmounted(() => window.removeEventListener('show-toast', handleToast))
</script>

<template>
  <div class="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    <TransitionGroup
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium pointer-events-auto"
        :class="toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'"
      >
        <span class="text-base leading-none">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
