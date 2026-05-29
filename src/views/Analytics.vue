<script setup>
import { ref, computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import {
  BarChart3, ClipboardList, TrendingUp, Wallet,
  Users, Inbox
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import MetricCard from '../components/MetricCard.vue'
import EmptyState from '../components/EmptyState.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const store = useShopStore()

const PRESETS = [
  { key: 'all',    label: 'All Time'      },
  { key: 'month',  label: 'This Month'    },
  { key: '3m',     label: 'Last 3 Months' },
  { key: '6m',     label: 'Last 6 Months' },
  { key: 'year',   label: 'This Year'     },
  { key: 'custom', label: 'Custom Range'  },
]

const activePreset = ref('all')
const customFrom   = ref('')
const customTo     = ref('')

const filteredJobs = computed(() => {
  if (activePreset.value === 'all') return store.jobs

  if (activePreset.value === 'custom') {
    const from = customFrom.value ? new Date(customFrom.value) : null
    const to   = customTo.value   ? new Date(customTo.value + 'T23:59:59') : new Date()
    return store.jobs.filter(j => {
      const d = new Date(store.jobDate(j))
      return (!from || d >= from) && d <= to
    })
  }

  const now = new Date()
  const cutoff = {
    month: new Date(now.getFullYear(), now.getMonth(), 1),
    '3m':  new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
    '6m':  new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
    year:  new Date(now.getFullYear(), 0, 1),
  }[activePreset.value]

  return cutoff ? store.jobs.filter(j => new Date(store.jobDate(j)) >= cutoff) : store.jobs
})

const rangeLabel = computed(() => {
  if (activePreset.value === 'custom') {
    if (customFrom.value && customTo.value) return `${customFrom.value}  →  ${customTo.value}`
    if (customFrom.value) return `From ${customFrom.value}`
    if (customTo.value)   return `Up to ${customTo.value}`
    return 'Custom range'
  }
  return PRESETS.find(p => p.key === activePreset.value)?.label ?? ''
})

const summary = computed(() => {
  const j = filteredJobs.value
  const revenue  = j.reduce((s, x) => s + (x.total      || 0), 0)
  const expenses = j.reduce((s, x) => s + (x.partsTotal  || 0), 0)
  return { count: j.length, revenue, expenses, net: revenue - expenses }
})

const monthlyBreakdown = computed(() => {
  const groups = {}
  filteredJobs.value.forEach(job => {
    const key = store.jobDate(job).substring(0, 7)
    if (key.length < 7) return
    if (!groups[key]) groups[key] = { revenue: 0, expenses: 0, jobs: 0 }
    groups[key].revenue  += job.total      || 0
    groups[key].expenses += job.partsTotal || 0
    groups[key].jobs++
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      key,
      label: new Date(key + '-02').toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
      ...data,
      net: data.revenue - data.expenses
    }))
})

const revenueChartData = computed(() => ({
  labels: monthlyBreakdown.value.map(m => m.label),
  datasets: [{
    label: 'Revenue',
    data: monthlyBreakdown.value.map(m => m.revenue),
    backgroundColor: 'rgba(59,130,246,0.80)',
    borderRadius: 6, borderSkipped: false
  }]
}))

const revExpChartData = computed(() => ({
  labels: monthlyBreakdown.value.map(m => m.label),
  datasets: [
    {
      label: 'Revenue',
      data: monthlyBreakdown.value.map(m => m.revenue),
      backgroundColor: 'rgba(59,130,246,0.80)',
      borderRadius: 6, borderSkipped: false
    },
    {
      label: 'Expenses',
      data: monthlyBreakdown.value.map(m => m.expenses),
      backgroundColor: 'rgba(249,115,22,0.75)',
      borderRadius: 6, borderSkipped: false
    }
  ]
}))

const deviceCounts = computed(() => {
  const c = {}
  filteredJobs.value.forEach(j => { c[j.device] = (c[j.device] || 0) + 1 })
  return c
})

const doughnutData = computed(() => ({
  labels: Object.keys(deviceCounts.value),
  datasets: [{
    data: Object.values(deviceCounts.value),
    backgroundColor: [
      'rgba(59,130,246,.85)', 'rgba(16,185,129,.85)', 'rgba(249,115,22,.85)',
      'rgba(139,92,246,.85)', 'rgba(236,72,153,.85)', 'rgba(245,158,11,.85)',
      'rgba(107,114,128,.85)'
    ],
    borderWidth: 2, borderColor: '#fff'
  }]
}))

const topCustomers = computed(() => {
  const map = {}
  filteredJobs.value.forEach(j => {
    const k = j.customer.trim().toLowerCase()
    if (!map[k]) map[k] = { name: j.customer.trim(), total: 0, jobs: 0 }
    map[k].total += j.total || 0
    map[k].jobs++
  })
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
})

function formatPeso(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const pesoTick = v => '₱' + Number(v).toLocaleString('en-PH')

const baseScales = {
  y: {
    ticks: { callback: pesoTick, font: { size: 11 }, color: '#94a3b8' },
    grid:  { color: 'rgba(0,0,0,0.05)' },
    border: { dash: [4, 4] }
  },
  x: { ticks: { font: { size: 11 }, color: '#94a3b8' }, grid: { display: false } }
}

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: baseScales
}

const groupedBarOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 11 }, color: '#64748b', padding: 14 } }
  },
  scales: baseScales
}

const doughnutOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: '#64748b', padding: 10 } }
  }
}
</script>

<template>
  <div class="space-y-6">

    <div>
      <h2 class="text-lg font-bold text-slate-900">Analytics</h2>
      <p class="text-sm text-slate-500 mt-0.5">Filter by date range to explore your repair history.</p>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="p in PRESETS" :key="p.key"
          @click="activePreset = p.key"
          class="text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors"
          :class="activePreset === p.key
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'"
        >
          {{ p.label }}
        </button>
      </div>

      <div v-if="activePreset === 'custom'" class="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500 shrink-0">From</label>
          <input
            v-model="customFrom" type="date"
            class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500 shrink-0">To</label>
          <input
            v-model="customTo" type="date"
            class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <EmptyState
      v-if="store.jobs.length === 0"
      :icon="BarChart3"
      message="No jobs recorded yet. Add some repair jobs to see analytics."
    />

    <template v-else>

      <div>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{{ rangeLabel }}</p>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard label="Jobs"           :value="String(summary.count)"         :icon="ClipboardList" />
          <MetricCard label="Revenue"        :value="formatPeso(summary.revenue)"   :icon="TrendingUp" />
          <MetricCard label="Parts Expenses" :value="formatPeso(summary.expenses)"  :icon="ClipboardList" />
          <MetricCard
            label="Net Income"
            :value="formatPeso(summary.net)"
            :sub="summary.net >= 0 ? '↑ Profitable' : '↓ Net loss'"
            :icon="Wallet"
          />
        </div>
      </div>

      <div
        v-if="filteredJobs.length === 0"
        class="bg-white border border-slate-200 rounded-xl py-14 flex flex-col items-center gap-2 text-slate-400"
      >
        <Inbox :size="36" class="text-slate-300" />
        <p class="text-sm">No jobs in this date range.</p>
      </div>

      <template v-else>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Revenue by Month</p>
            <div class="h-52"><Bar :data="revenueChartData" :options="barOptions" /></div>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Revenue vs Expenses</p>
            <div class="h-52"><Bar :data="revExpChartData" :options="groupedBarOptions" /></div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Jobs by Device Type</p>
            <div class="h-52"><Doughnut :data="doughnutData" :options="doughnutOptions" /></div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Top Customers</p>
            <EmptyState v-if="!topCustomers.length" :icon="Users" message="No customers in this range." />
            <div v-else class="space-y-4">
              <div v-for="(c, i) in topCustomers" :key="c.name" class="flex items-center gap-3">
                <span
                  class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  :class="i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'"
                >{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-sm font-semibold text-slate-800 truncate pr-2">{{ c.name }}</p>
                    <p class="text-sm font-bold text-slate-700 tabular-nums shrink-0">{{ formatPeso(c.total) }}</p>
                  </div>
                  <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500 rounded-full transition-all duration-500"
                      :style="{ width: (c.total / topCustomers[0].total * 100) + '%' }"
                    />
                  </div>
                  <p class="text-xs text-slate-400 mt-1">{{ c.jobs }} job{{ c.jobs !== 1 ? 's' : '' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Breakdown</p>
          </div>

          <!-- Mobile -->
          <div class="md:hidden divide-y divide-slate-100">
            <div v-for="m in [...monthlyBreakdown].reverse()" :key="m.key" class="p-5">
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm font-bold text-slate-800">{{ m.label }}</p>
                <span class="text-sm font-bold tabular-nums" :class="m.net >= 0 ? 'text-emerald-700' : 'text-red-600'">
                  {{ formatPeso(m.net) }}
                </span>
              </div>
              <p class="text-xs text-slate-400">
                {{ m.jobs }} jobs · Revenue {{ formatPeso(m.revenue) }} · Expenses {{ formatPeso(m.expenses) }}
              </p>
            </div>
          </div>

          <!-- Desktop -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Month</th>
                  <th class="text-center px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Jobs</th>
                  <th class="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Revenue</th>
                  <th class="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Expenses</th>
                  <th class="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Net Income</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="m in [...monthlyBreakdown].reverse()"
                  :key="m.key"
                  class="hover:bg-slate-50/60 transition-colors"
                >
                  <td class="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{{ m.label }}</td>
                  <td class="px-6 py-4 text-center text-slate-600">{{ m.jobs }}</td>
                  <td class="px-6 py-4 text-right text-slate-700 tabular-nums whitespace-nowrap">{{ formatPeso(m.revenue) }}</td>
                  <td class="px-6 py-4 text-right text-slate-500 tabular-nums whitespace-nowrap">{{ formatPeso(m.expenses) }}</td>
                  <td class="px-6 py-4 text-right font-bold tabular-nums whitespace-nowrap"
                      :class="m.net >= 0 ? 'text-emerald-700' : 'text-red-600'">
                    {{ formatPeso(m.net) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>
    </template>

  </div>
</template>
