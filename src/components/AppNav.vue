<script setup>
import { useRoute } from 'vue-router'
import {
  Zap, LayoutDashboard, PlusCircle, ClipboardList,
  Users, BarChart3, MapPin, LogOut
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const route    = useRoute()
const authStore = useAuthStore()

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs/new',  label: 'New Job',   icon: PlusCircle      },
  { path: '/jobs',      label: 'All Jobs',  icon: ClipboardList   },
  { path: '/customers', label: 'Customers', icon: Users           },
  { path: '/analytics', label: 'Analytics', icon: BarChart3       },
]
</script>

<template>
  <aside class="hidden md:flex flex-col w-72 fixed inset-y-0 left-0 z-30 border-r border-slate-200 bg-white">

    <div class="px-6 py-6 border-b border-slate-100 shrink-0">
      <div class="flex items-center gap-3">
        <Zap :size="28" class="text-blue-600 shrink-0" />
        <p class="font-extrabold text-slate-900 text-xl tracking-tight">KitaLog</p>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto px-3.5 py-5">
      <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3.5 mb-3">Menu</p>
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 mb-1"
        :class="route.path === item.path
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
      >
        <component :is="item.icon" :size="18" class="shrink-0" />
        {{ item.label }}
      </router-link>
    </nav>

    <div class="px-4 py-4 border-t border-slate-100 shrink-0 space-y-2">
      <span class="flex items-center gap-2 text-xs text-slate-400 px-2">
        <MapPin :size="13" /> Infanta, Quezon
      </span>
      <button
        @click="authStore.logout"
        class="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut :size="16" class="shrink-0" /> Sign out
      </button>
    </div>
  </aside>

  <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex h-16">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
      :class="route.path === item.path ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'"
    >
      <component :is="item.icon" :size="19" class="shrink-0" />
      <span class="text-[9px] font-bold leading-none">{{ item.label.split(' ')[0] }}</span>
    </router-link>
  </nav>
</template>
