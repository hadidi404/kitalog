<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Plus } from 'lucide-vue-next'
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

const initials = computed(() => displayName.value.slice(0, 2).toUpperCase())

const search        = ref('')
const searchFocused = ref(false)

const suggestions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q.length < 2) return []
  return store.jobs.filter(j =>
    j.customer?.toLowerCase().includes(q) ||
    j.model?.toLowerCase().includes(q) ||
    j.device?.toLowerCase().includes(q) ||
    j.problem?.toLowerCase().includes(q)
  ).slice(0, 7)
})

const showSuggestions = computed(() =>
  searchFocused.value && suggestions.value.length > 0
)

function doSearch() {
  if (!search.value.trim()) return
  router.push({ path: '/jobs', query: { q: search.value.trim() } })
  search.value = ''
  searchFocused.value = false
}

function selectSuggestion(job) {
  router.push(`/jobs/${job.id}/edit`)
  search.value = ''
  searchFocused.value = false
}

const STATUS_STYLE = {
  'Pending':     'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done':        'bg-emerald-100 text-emerald-700',
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
            <p class="font-semibold text-slate-900 text-lg leading-snug truncate">{{ greeting }}, {{ displayName }}!</p>
            <p class="hidden sm:block text-xs text-slate-400 leading-none mt-0.5">Here's what's happening with your repair business today.</p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="hidden md:flex relative">
              <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <input
                v-model="search"
                @keyup.enter="doSearch"
                @keyup.escape="search = ''; searchFocused = false"
                @focus="searchFocused = true"
                @blur="searchFocused = false"
                type="text"
                placeholder="Search jobs, customers..."
                class="w-56 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white focus:w-72 transition-all duration-200"
              />

              <Transition
                enter-from-class="opacity-0 translate-y-1"
                enter-active-class="transition duration-150 ease-out"
                leave-to-class="opacity-0 translate-y-1"
                leave-active-class="transition duration-100 ease-in"
              >
                <div v-if="showSuggestions"
                  class="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50"
                >
                  <p class="px-4 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Results</p>
                  <button
                    v-for="job in suggestions" :key="job.id"
                    @mousedown.prevent="selectSuggestion(job)"
                    class="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-slate-800 truncate">{{ job.customer }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ job.device }} · {{ job.model }}</p>
                    </div>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      :class="STATUS_STYLE[job.status]">
                      {{ job.status }}
                    </span>
                  </button>
                  <div class="border-t border-slate-100 px-4 py-2.5">
                    <button @mousedown.prevent="doSearch"
                      class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
                      <Search :size="11" /> See all results for "{{ search }}"
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm cursor-pointer select-none">
              <span class="text-xs font-bold text-white leading-none">{{ initials }}</span>
            </div>
          </div>
        </header>

        <main class="flex-1 px-5 py-6 sm:px-6 md:px-8 md:py-7 pb-24 md:pb-12">
          <router-view />
        </main>
      </div>

      <button
        @click="router.push('/jobs/new')"
        class="fixed bottom-20 md:bottom-6 right-5 md:right-6 z-50 w-[52px] h-[52px] bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200"
      >
        <Plus :size="22" />
      </button>
    </template>

    <ToastNotification />
  </div>
</template>
