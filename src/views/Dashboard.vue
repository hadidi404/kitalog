<script setup>
import { computed } from 'vue'
import {
  Plus, ClipboardList, TrendingUp, Package, Wallet,
  Smartphone, Laptop, Tablet, Monitor, Gamepad2, Tv, Wrench,
  ChevronRight
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import StatusBadge from '../components/StatusBadge.vue'
import MetricCard from '../components/MetricCard.vue'
import EmptyState from '../components/EmptyState.vue'

const store = useShopStore()

function formatPeso(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const currentMonthLabel = new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

const monthJobs = computed(() => {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return store.jobs.filter(j => new Date(store.jobDate(j)) >= start)
})

const metrics = computed(() => {
  const j = monthJobs.value
  const revenue  = j.reduce((s, x) => s + (x.total      || 0), 0)
  const expenses = j.reduce((s, x) => s + (x.partsTotal  || 0), 0)
  return { count: j.length, revenue, expenses, net: revenue - expenses }
})

const recentJobs = computed(() => store.jobs.slice(0, 8))

const DEVICE_ICONS = {
  Smartphone:    Smartphone,
  Laptop:        Laptop,
  Tablet:        Tablet,
  'Desktop PC':  Monitor,
  'Game Console': Gamepad2,
  'Smart TV':    Tv,
}
const deviceIcon = d => DEVICE_ICONS[d] ?? Wrench
</script>

<template>
  <div class="space-y-6">

    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900">{{ currentMonthLabel }}</h2>
        <p class="text-sm text-slate-500 mt-0.5">{{ store.jobs.length }} total jobs recorded</p>
      </div>
      <router-link
        to="/jobs/new"
        class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
      >
        <Plus :size="15" /> New Job
      </router-link>
    </div>

    <div>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">This Month</p>
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Jobs"
          :value="String(metrics.count)"
          :sub="metrics.count === 0 ? 'None yet this month' : metrics.count + ' repair job' + (metrics.count !== 1 ? 's' : '')"
          :icon="ClipboardList"
        />
        <MetricCard
          label="Revenue"
          :value="formatPeso(metrics.revenue)"
          :icon="TrendingUp"
        />
        <MetricCard
          label="Parts Expenses"
          :value="formatPeso(metrics.expenses)"
          :icon="Package"
        />
        <MetricCard
          label="Net Income"
          :value="formatPeso(metrics.net)"
          :sub="metrics.net >= 0 ? '↑ Profitable month' : '↓ Net loss'"
          :icon="Wallet"
        />
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-800">Recent Jobs</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ store.jobs.length }} job{{ store.jobs.length !== 1 ? 's' : '' }} total
          </p>
        </div>
        <router-link
          to="/jobs"
          class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          View all <ChevronRight :size="13" />
        </router-link>
      </div>

      <EmptyState
        v-if="recentJobs.length === 0"
        :icon="ClipboardList"
        message="No jobs yet. Add your first repair job!"
      />

      <div v-else>
        <div
          v-for="job in recentJobs"
          :key="job.id"
          class="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
        >
          <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <component :is="deviceIcon(job.device)" :size="18" class="text-slate-500" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ job.customer }}</p>
            <p class="text-xs text-slate-400 truncate mt-0.5">
              {{ store.jobDate(job) }} · {{ job.device }}{{ job.model ? ' · ' + job.model : '' }}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <StatusBadge :status="job.status" />
            <span class="text-sm font-bold text-slate-700 tabular-nums">{{ formatPeso(job.total) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
