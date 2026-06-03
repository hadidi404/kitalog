<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Wrench, ChevronDown, X } from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import EmptyState from '../components/EmptyState.vue'

const store  = useShopStore()
const route  = useRoute()
const router = useRouter()

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Done']
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done']
const filterStatus   = ref('All')

const searchQuery = computed(() => route.query.q || '')

watch(searchQuery, q => { if (!q) filterStatus.value = 'All' })

function clearSearch() {
  router.replace({ path: '/jobs' })
}

const filteredJobs = computed(() => {
  let jobs = filterStatus.value === 'All'
    ? store.jobs
    : store.jobs.filter(j => j.status === filterStatus.value)
  const q = searchQuery.value.toLowerCase()
  if (q) {
    jobs = jobs.filter(j =>
      j.customer?.toLowerCase().includes(q) ||
      j.model?.toLowerCase().includes(q) ||
      j.device?.toLowerCase().includes(q) ||
      j.problem?.toLowerCase().includes(q)
    )
  }
  return jobs
})

const statusCount = s => store.jobs.filter(j => j.status === s).length

const STATUS_STYLE = {
  'Pending':     'bg-amber-100 text-amber-800',
  'In Progress': 'bg-blue-100  text-blue-800',
  'Done':        'bg-green-100 text-green-800',
}

function setStatus(id, value) {
  store.updateJob(id, { status: value })
}

function formatPeso(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function confirmDelete(id) {
  if (confirm('Delete this job? This cannot be undone.')) store.deleteJob(id)
}
</script>

<template>
  <div class="space-y-5">

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">All Jobs</h2>
        <p class="text-sm text-slate-500 mt-0.5">
          {{ store.jobs.length }} job{{ store.jobs.length !== 1 ? 's' : '' }} recorded
        </p>
      </div>
      <router-link
        to="/jobs/new"
        class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
      >
        <Plus :size="15" /> New Job
      </router-link>
    </div>

    <div v-if="searchQuery" class="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-2 rounded-lg">
      <span class="flex-1">Showing results for "{{ searchQuery }}"</span>
      <button @click="clearSearch" class="hover:text-blue-900 transition-colors"><X :size="13" /></button>
    </div>

    <div class="flex gap-2 flex-wrap">
      <button
        v-for="s in STATUS_FILTERS" :key="s"
        @click="filterStatus = s"
        class="text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors"
        :class="filterStatus === s
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'"
      >
        {{ s }}<span v-if="s !== 'All'" class="ml-1 opacity-60">({{ statusCount(s) }})</span>
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      <EmptyState
        v-if="filteredJobs.length === 0"
        :icon="Wrench"
        :message="filterStatus === 'All' ? 'No jobs recorded yet.' : 'No jobs with status \'' + filterStatus + '\''"
      />

      <!-- Mobile: cards -->
      <div v-else class="md:hidden divide-y divide-slate-100">
        <div v-for="job in filteredJobs" :key="job.id" class="p-5">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="min-w-0">
              <p class="font-semibold text-slate-800 truncate">{{ job.customer }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ job.device }} · {{ job.model }}</p>
            </div>
            <div class="relative shrink-0">
              <select
                :value="job.status"
                @change="setStatus(job.id, $event.target.value)"
                class="appearance-none text-xs font-semibold pl-2.5 pr-6 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                :class="STATUS_STYLE[job.status]"
              >
                <option v-for="o in STATUS_OPTIONS" :key="o">{{ o }}</option>
              </select>
              <ChevronDown :size="10" class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </div>
          <p class="text-xs text-slate-500 line-clamp-2 mb-3">{{ job.problem }}</p>
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-500 flex-1 min-w-0">{{ store.jobDate(job) }}</p>
            <div class="flex items-center gap-3 shrink-0">
              <span class="text-sm font-bold text-slate-800 tabular-nums">{{ formatPeso(job.total) }}</span>
              <router-link :to="`/jobs/${job.id}/edit`" class="text-xs font-semibold text-blue-500 hover:text-blue-700">Edit</router-link>
              <button @click="confirmDelete(job.id)" class="text-xs font-semibold text-red-400 hover:text-red-600">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop: table -->
      <div v-if="filteredJobs.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">Date</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Customer</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Device</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Labor</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Parts</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Total</th>
              <th class="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="job in filteredJobs" :key="job.id" class="hover:bg-slate-50/60 transition-colors">
              <td class="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{{ store.jobDate(job) }}</td>
              <td class="px-5 py-3.5">
                <p class="font-semibold text-slate-800">{{ job.customer }}</p>
                <p v-if="job.contact" class="text-xs text-slate-400 mt-0.5">{{ job.contact }}</p>
              </td>
              <td class="px-5 py-3.5">
                <p class="text-slate-700">{{ job.device }}</p>
                <p class="text-xs text-slate-400 mt-0.5 max-w-[160px] truncate">{{ job.model }}</p>
              </td>
              <td class="px-5 py-3.5">
                <div class="relative inline-block">
                  <select
                    :value="job.status"
                    @change="setStatus(job.id, $event.target.value)"
                    class="appearance-none text-xs font-semibold pl-2.5 pr-6 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-colors"
                    :class="STATUS_STYLE[job.status]"
                  >
                    <option v-for="o in STATUS_OPTIONS" :key="o">{{ o }}</option>
                  </select>
                  <ChevronDown :size="10" class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>
              </td>
              <td class="px-5 py-3.5 text-right text-slate-600 tabular-nums whitespace-nowrap">{{ formatPeso(job.labor) }}</td>
              <td class="px-5 py-3.5 text-right text-slate-600 tabular-nums whitespace-nowrap">{{ formatPeso(job.partsTotal) }}</td>
              <td class="px-5 py-3.5 text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">{{ formatPeso(job.total) }}</td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-3">
                  <router-link :to="`/jobs/${job.id}/edit`" class="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">Edit</router-link>
                  <button @click="confirmDelete(job.id)" class="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
