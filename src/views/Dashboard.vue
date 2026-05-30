<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import {
  Plus, ClipboardList, TrendingUp, Package, Wallet,
  Smartphone, Laptop, Tablet, Monitor, Gamepad2, Tv, Wrench,
  Clock, CheckCircle2, ChevronRight
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import StatusBadge from '../components/StatusBadge.vue'
import EmptyState from '../components/EmptyState.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const store = useShopStore()

const todayLabel = new Date().toLocaleDateString('en-PH', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
})

function fmt(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const metrics = computed(() => {
  const j = store.jobs
  const revenue  = j.reduce((s, x) => s + (x.total     || 0), 0)
  const expenses = j.reduce((s, x) => s + (x.partsTotal || 0), 0)
  return { count: j.length, revenue, expenses, net: revenue - expenses }
})

const statusCounts = computed(() => ({
  pending:    store.jobs.filter(j => j.status === 'Pending').length,
  inProgress: store.jobs.filter(j => j.status === 'In Progress').length,
  done:       store.jobs.filter(j => j.status === 'Done').length,
}))

const last7 = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key  = d.toISOString().split('T')[0]
    const jobs = store.jobs.filter(j => store.jobDate(j) === key)
    return {
      label:   d.toLocaleDateString('en-PH', { weekday: 'short' }),
      revenue: jobs.reduce((s, j) => s + (j.total || 0), 0),
    }
  })
)

const weekChartData = computed(() => ({
  labels: last7.value.map(d => d.label),
  datasets: [{
    label: 'Revenue',
    data: last7.value.map(d => d.revenue),
    backgroundColor: 'rgba(99,102,241,0.85)',
    borderRadius: 8,
    borderSkipped: false,
  }],
}))

const weekChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ' ₱' + Number(ctx.raw).toLocaleString('en-PH') } },
  },
  scales: {
    y: {
      ticks: { callback: v => '₱' + Number(v).toLocaleString('en-PH'), font: { size: 11 }, color: '#94a3b8' },
      grid: { color: 'rgba(0,0,0,0.04)' },
      border: { dash: [4, 4] },
    },
    x: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { display: false } },
  },
}

const recentJobs = computed(() => store.jobs.slice(0, 6))

const DEVICE_ICONS = {
  Phone: Smartphone, Smartphone, Laptop, Tablet,
  'Desktop PC': Monitor, 'Game Console': Gamepad2, 'Smart TV': Tv,
}
const deviceIcon = d => DEVICE_ICONS[d] ?? Wrench
</script>

<template>
  <div class="space-y-5">

    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Overview</h2>
        <p class="text-sm text-slate-500 mt-0.5">{{ todayLabel }}</p>
      </div>
      <router-link
        to="/jobs/new"
        class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
      >
        <Plus :size="15" /> New Job
      </router-link>
    </div>

    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[11px] font-bold uppercase tracking-widest opacity-75">Total Jobs</p>
          <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <ClipboardList :size="15" />
          </div>
        </div>
        <p class="text-2xl font-extrabold leading-none">{{ metrics.count }}</p>
        <p class="text-xs opacity-60 mt-2">All time repairs</p>
      </div>

      <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[11px] font-bold uppercase tracking-widest opacity-75">Revenue</p>
          <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <TrendingUp :size="15" />
          </div>
        </div>
        <p class="text-2xl font-extrabold leading-none">{{ fmt(metrics.revenue) }}</p>
        <p class="text-xs opacity-60 mt-2">Total collected</p>
      </div>

      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[11px] font-bold uppercase tracking-widest opacity-75">Expenses</p>
          <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Package :size="15" />
          </div>
        </div>
        <p class="text-2xl font-extrabold leading-none">{{ fmt(metrics.expenses) }}</p>
        <p class="text-xs opacity-60 mt-2">Parts & materials</p>
      </div>

      <div class="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[11px] font-bold uppercase tracking-widest opacity-75">Net Income</p>
          <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Wallet :size="15" />
          </div>
        </div>
        <p class="text-2xl font-extrabold leading-none">{{ fmt(metrics.net) }}</p>
        <p class="text-xs opacity-60 mt-2">{{ metrics.net >= 0 ? '↑ Profitable' : '↓ Net loss' }}</p>
      </div>

    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <Clock :size="18" class="text-amber-600" />
        </div>
        <div>
          <p class="text-xs font-bold text-amber-600 uppercase tracking-wide">Pending</p>
          <p class="text-2xl font-extrabold text-slate-900 leading-tight">{{ statusCounts.pending }}</p>
        </div>
      </div>
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <Wrench :size="18" class="text-blue-600" />
        </div>
        <div>
          <p class="text-xs font-bold text-blue-600 uppercase tracking-wide">In Progress</p>
          <p class="text-2xl font-extrabold text-slate-900 leading-tight">{{ statusCounts.inProgress }}</p>
        </div>
      </div>
      <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 :size="18" class="text-emerald-600" />
        </div>
        <div>
          <p class="text-xs font-bold text-emerald-600 uppercase tracking-wide">Done</p>
          <p class="text-2xl font-extrabold text-slate-900 leading-tight">{{ statusCounts.done }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">

      <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Revenue — Last 7 Days</p>
        <EmptyState v-if="store.jobs.length === 0" :icon="TrendingUp" message="No data yet." />
        <div v-else class="h-56">
          <Bar :data="weekChartData" :options="weekChartOptions" />
        </div>
      </div>

      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Jobs</p>
          <router-link to="/jobs" class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            View all <ChevronRight :size="12" />
          </router-link>
        </div>
        <EmptyState v-if="recentJobs.length === 0" :icon="ClipboardList" message="No jobs yet." />
        <div v-else class="divide-y divide-slate-50">
          <div
            v-for="job in recentJobs" :key="job.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors"
          >
            <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              <component :is="deviceIcon(job.device)" :size="14" class="text-slate-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ job.customer }}</p>
              <p class="text-xs text-slate-400 truncate">{{ job.problem }}</p>
            </div>
            <div class="text-right shrink-0">
              <StatusBadge :status="job.status" />
              <p class="text-xs font-bold text-slate-600 tabular-nums mt-1">{{ fmt(job.total) }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>
