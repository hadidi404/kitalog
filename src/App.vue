<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Plus, Bell, PlusCircle, FileText, Users, Receipt } from 'lucide-vue-next'
import AppNav from './components/AppNav.vue'
import ToastNotification from './components/ToastNotification.vue'
import { useAuthStore } from './stores/auth'
import { useShopStore } from './stores/shop'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const store     = useShopStore()

const isPublic = computed(() => route.meta.public)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const displayName = computed(() => {
  const u = authStore.user
  if (!u) return 'there'
  if (u.displayName) return u.displayName
  return u.email?.split('@')[0] || 'there'
})

const pendingCount = computed(() =>
  store.jobs.filter(j => j.status === 'Pending').length
)

const search = ref('')
function doSearch() {
  if (!search.value.trim()) return
  router.push({ path: '/jobs', query: { q: search.value.trim() } })
  search.value = ''
}

const fabOpen = ref(false)
const fabItems = [
  { label: 'New Repair',       icon: PlusCircle, action: () => router.push('/jobs/new')   },
  { label: 'New Customer',     icon: Users,      action: () => router.push('/customers')  },
  { label: 'Add Expense',      icon: Receipt,    action: () => router.push('/expenses')   },
  { label: 'Generate Receipt', icon: FileText,   action: () => {}                         },
]
function fabAction(fn) {
  fn()
  fabOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">

    <template v-if="authStore.loading">
      <div class="min-h-screen flex items-center justify-center">
        <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </template>

    <template v-else-if="isPublic">
      <router-view />
    </template>

    <template v-else>
      <AppNav />
      <div class="md:ml-64 flex flex-col min-h-screen">

        <header class="sticky top-0 z-20 bg-white border-b border-slate-100 flex items-center justify-between px-5 md:px-8 shrink-0 gap-4 h-[68px] shadow-sm">
          <div class="min-w-0">
            <p class="font-semibold text-slate-900 text-[15px] leading-snug truncate">{{ greeting }}, {{ displayName }}! 👋</p>
            <p class="hidden sm:block text-xs text-slate-400 leading-none mt-0.5">Here's what's happening with your repair business today.</p>
          </div>

          <div class="hidden md:flex flex-1 max-w-sm mx-6 relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              v-model="search"
              @keyup.enter="doSearch"
              type="text"
              placeholder="Search jobs, customers, devices..."
              class="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <button class="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
              <Bell :size="17" class="text-slate-500" />
              <span v-if="pendingCount > 0"
                class="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
                {{ pendingCount > 9 ? '9+' : pendingCount }}
              </span>
            </button>
            <router-link
              to="/jobs/new"
              class="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Plus :size="14" /> New Job
            </router-link>
          </div>
        </header>

        <main class="flex-1 px-5 py-6 sm:px-6 md:px-8 md:py-7 pb-24 md:pb-12">
          <router-view />
        </main>
      </div>

      <!-- FAB -->
      <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <div v-if="fabOpen" @click.self="fabOpen = false" class="fixed inset-0 -z-10" />
        <Transition
          enter-from-class="opacity-0 translate-y-2 scale-95"
          enter-active-class="transition duration-150 ease-out"
          leave-to-class="opacity-0 translate-y-2 scale-95"
          leave-active-class="transition duration-100 ease-in"
        >
          <div v-if="fabOpen" class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-1 origin-bottom-right">
            <button
              v-for="item in fabItems" :key="item.label"
              @click="fabAction(item.action)"
              class="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left whitespace-nowrap"
            >
              <div class="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <component :is="item.icon" :size="14" class="text-blue-600" />
              </div>
              {{ item.label }}
            </button>
          </div>
        </Transition>
        <button
          @click="fabOpen = !fabOpen"
          class="w-13 h-13 w-[52px] h-[52px] bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200"
          :class="fabOpen ? 'rotate-45' : ''"
        >
          <Plus :size="22" />
        </button>
      </div>
    </template>

    <ToastNotification />
  </div>
</template>
