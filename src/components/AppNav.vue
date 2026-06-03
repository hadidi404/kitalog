<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard, Briefcase,
  Users, Package, Receipt, BarChart3, FileText, Settings, LogOut
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useShopStore } from '../stores/shop'

const route     = useRoute()
const authStore = useAuthStore()
const store     = useShopStore()

const navItems = [
  { path: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/jobs',      label: 'Jobs',             icon: Briefcase       },
  { path: '/customers', label: 'Customers',        icon: Users           },
  { path: '/parts',     label: 'Parts & Inventory',icon: Package         },
  { path: '/expenses',  label: 'Expenses',         icon: Receipt         },
  { path: '/analytics', label: 'Analytics',        icon: BarChart3       },
  { path: '/reports',   label: 'Reports',          icon: FileText        },
  { path: '/settings',  label: 'Settings',         icon: Settings        },
]

const isActive = path => {
  if (path === '/jobs') return route.path.startsWith('/jobs')
  return route.path === path
}

const displayName = computed(() => {
  const u = authStore.user
  if (!u) return 'User'
  if (u.displayName) return u.displayName
  return u.email?.split('@')[0] || 'User'
})

const initials = computed(() => displayName.value.slice(0, 2).toUpperCase())

const thisMonth = computed(() => {
  const now  = new Date()
  const y    = now.getFullYear()
  const m    = now.getMonth()
  const jobs = store.jobs.filter(j => {
    const d = new Date(store.jobDate(j))
    return d.getFullYear() === y && d.getMonth() === m
  })
  const revenue  = jobs.reduce((s, j) => s + (j.total      || 0), 0)
  const expenses = jobs.reduce((s, j) => s + (j.partsTotal  || 0), 0)
  const done = jobs.filter(j => j.status === 'Done').length
  return { revenue, expenses, net: revenue - expenses, done, count: jobs.length }
})

function fmt(n) {
  if (n >= 1000) return '₱' + (n / 1000).toFixed(1) + 'k'
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })
}
</script>

<template>
  <aside class="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-slate-100 bg-white shadow-sm">

    <!-- Logo -->
    <div class="px-5 py-5 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <img src="/icon.png" class="w-5 h-5 object-contain brightness-0 invert" alt="" />
        </div>
        <p class="font-bold text-slate-900 text-lg tracking-tight">KitaLog</p>
      </div>
    </div>

    <!-- Profile -->
    <div class="px-4 pb-4 shrink-0">
      <div class="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-3">
        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
          <span class="text-xs font-bold text-white">{{ initials }}</span>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-800 truncate leading-snug">{{ displayName }}</p>
          <p class="text-xs text-slate-400 leading-snug">Tech Repair Specialist</p>
        </div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-3 space-y-0.5">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        :class="isActive(item.path)
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'"
      >
        <component :is="item.icon" :size="16" class="shrink-0" />
        {{ item.label }}
      </router-link>
    </nav>

    <!-- This month stats -->
    <div class="mx-3 my-3 bg-slate-50 rounded-xl p-3.5 shrink-0">
      <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">This Month</p>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">Revenue</span>
          <span class="text-xs font-semibold text-emerald-600 tabular-nums">{{ fmt(thisMonth.revenue) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">Expenses</span>
          <span class="text-xs font-semibold text-orange-500 tabular-nums">{{ fmt(thisMonth.expenses) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">Net Income</span>
          <span class="text-xs font-semibold tabular-nums" :class="thisMonth.net >= 0 ? 'text-blue-600' : 'text-red-500'">{{ fmt(thisMonth.net) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">Jobs Done</span>
          <span class="text-xs font-semibold text-slate-700">{{ thisMonth.done }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">Total Jobs</span>
          <span class="text-xs font-semibold text-slate-700">{{ thisMonth.count }}</span>
        </div>
      </div>
    </div>

    <!-- Sign out -->
    <div class="px-3 pb-4 shrink-0">
      <button
        @click="authStore.logout"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut :size="16" class="shrink-0" /> Sign out
      </button>
    </div>
  </aside>

  <!-- Mobile bottom nav -->
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-100 flex h-16 shadow-t">
    <router-link
      v-for="item in navItems.slice(0, 5)"
      :key="item.path"
      :to="item.path"
      class="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
      :class="isActive(item.path) ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'"
    >
      <component :is="item.icon" :size="18" class="shrink-0" />
      <span class="text-[9px] font-semibold leading-none">{{ item.label.split(' ')[0] }}</span>
    </router-link>
  </nav>
</template>
