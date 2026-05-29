<script setup>
import { useRoute } from 'vue-router'
import { MapPin } from 'lucide-vue-next'
import AppNav from './components/AppNav.vue'
import ToastNotification from './components/ToastNotification.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <AppNav />

    <div class="md:ml-72 flex flex-col min-h-screen">

      <header class="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 md:px-8 shrink-0 gap-4">
        <div class="flex items-center gap-2 min-w-0 text-sm">
          <span class="md:hidden font-bold text-slate-800 truncate">KitaLog</span>
          <div class="hidden md:flex items-center gap-2">
            <span class="text-slate-300 select-none">/</span>
            <span class="font-semibold text-slate-700">{{ route.meta.title }}</span>
          </div>
        </div>
        <span class="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <MapPin :size="12" /> Infanta, Quezon
        </span>
      </header>

      <main class="flex-1 px-5 py-6 sm:px-8 md:px-10 md:py-8 pb-24 md:pb-12">
        <router-view />
      </main>
    </div>

    <ToastNotification />
  </div>
</template>
