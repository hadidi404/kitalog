<script setup>
import { ref, computed } from 'vue'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Filler,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import {
  TrendingUp, Package, ClipboardList, Wallet,
  Trophy, Wrench, Users, ChevronRight, ArrowUpRight, ArrowDownRight, Download
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import SparkLine from '../components/SparkLine.vue'
import EmptyState from '../components/EmptyState.vue'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Filler,
  ArcElement, Tooltip, Legend
)

const store = useShopStore()

const PRESETS = [
  { key: '1y',    label: '1Y'     },
  { key: '6m',    label: '6M'     },
  { key: '3m',    label: '3M'     },
  { key: '30d',   label: '30D'    },
  { key: '7d',    label: '7D'     },
  { key: 'custom',label: 'Custom' },
]

const activePreset = ref('1y')
const customFrom   = ref('')
const customTo     = ref('')

function getRangeStart(preset) {
  const now = new Date()
  const map = {
    '7d':  () => { const d = new Date(now); d.setDate(d.getDate() - 6);    return d },
    '30d': () => { const d = new Date(now); d.setDate(d.getDate() - 29);   return d },
    '3m':  () => { const d = new Date(now); d.setMonth(d.getMonth() - 3);  return d },
    '6m':  () => { const d = new Date(now); d.setMonth(d.getMonth() - 6);  return d },
    '1y':  () => { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d },
  }
  return map[preset]?.() ?? null
}

function getPrevRangeStart(preset) {
  const s = getRangeStart(preset)
  if (!s) return null
  const now = new Date()
  const span = now - s
  return new Date(s - span)
}

const filteredJobs = computed(() => {
  if (activePreset.value === 'custom') {
    const from = customFrom.value ? new Date(customFrom.value) : null
    const to   = customTo.value   ? new Date(customTo.value + 'T23:59:59') : new Date()
    return store.jobs.filter(j => {
      const d = new Date(store.jobDate(j))
      return (!from || d >= from) && d <= to
    })
  }
  const start = getRangeStart(activePreset.value)
  if (!start) return store.jobs
  return store.jobs.filter(j => new Date(store.jobDate(j)) >= start)
})

const prevJobs = computed(() => {
  const start = getPrevRangeStart(activePreset.value)
  const end   = getRangeStart(activePreset.value)
  if (!start || !end) return []
  return store.jobs.filter(j => {
    const d = new Date(store.jobDate(j))
    return d >= start && d < end
  })
})

function sumRevenue(jobs) { return jobs.reduce((s, j) => s + (j.total || 0), 0) }
function sumExpenses(jobs) { return jobs.reduce((s, j) => s + (j.partsTotal || 0), 0) }
function pctChange(curr, prev) { return prev === 0 ? null : Math.round((curr - prev) / prev * 100) }

const summary = computed(() => {
  const rev  = sumRevenue(filteredJobs.value)
  const exp  = sumExpenses(filteredJobs.value)
  const pRev = sumRevenue(prevJobs.value)
  const pExp = sumExpenses(prevJobs.value)
  return {
    count:   filteredJobs.value.length,
    revenue: rev,
    expenses: exp,
    net:     rev - exp,
    revPct:  pctChange(rev, pRev),
    expPct:  pctChange(exp, pExp),
    cntPct:  pctChange(filteredJobs.value.length, prevJobs.value.length),
    netPct:  pctChange(rev - exp, pRev - pExp),
  }
})

const profitMargin = computed(() =>
  summary.value.revenue ? Math.round(summary.value.net / summary.value.revenue * 100) : 0
)

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const dateRangeLabel = computed(() => {
  if (activePreset.value === 'custom') {
    if (customFrom.value && customTo.value) return `${customFrom.value} — ${customTo.value}`
    return 'Custom Range'
  }
  const start = getRangeStart(activePreset.value)
  if (!start) return 'All Time'
  return `${fmtDate(start)} — ${fmtDate(new Date())}`
})

function dailySpark(reducer) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    return reducer(store.jobs.filter(j => store.jobDate(j) === key))
  })
}
const spark = computed(() => ({
  count:    dailySpark(j => j.length),
  revenue:  dailySpark(j => sumRevenue(j)),
  expenses: dailySpark(j => sumExpenses(j)),
  net:      dailySpark(j => sumRevenue(j) - sumExpenses(j)),
}))

const trendChartData = computed(() => {
  const p = activePreset.value
  let points = []

  if (p === '7d' || p === '30d') {
    const days = p === '7d' ? 7 : 30
    points = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toISOString().split('T')[0]
      const dayJobs = filteredJobs.value.filter(j => store.jobDate(j) === key)
      return {
        label:   d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        revenue: sumRevenue(dayJobs),
      }
    })
  } else {
    const groups = {}
    filteredJobs.value.forEach(j => {
      const key = store.jobDate(j).slice(0, 7)
      groups[key] = (groups[key] || 0) + (j.total || 0)
    })
    points = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => ({
        label: new Date(key + '-02').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
        revenue,
      }))
  }

  return {
    labels: points.map(pt => pt.label),
    datasets: [{
      data: points.map(pt => pt.revenue),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: points.length <= 30 ? 3 : 0,
      pointHoverRadius: 5,
      pointBackgroundColor: '#2563eb',
      borderWidth: 2,
    }],
  }
})

const revExpChartData = computed(() => {
  const groups = {}
  filteredJobs.value.forEach(j => {
    const key = store.jobDate(j).slice(0, 7)
    if (!groups[key]) groups[key] = { rev: 0, exp: 0 }
    groups[key].rev += j.total      || 0
    groups[key].exp += j.partsTotal || 0
  })
  const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  return {
    labels: sorted.map(([k]) => new Date(k + '-02').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })),
    datasets: [
      {
        label: 'Revenue',
        data: sorted.map(([, v]) => v.rev),
        backgroundColor: 'rgba(37,99,235,0.80)',
        borderRadius: 5, borderSkipped: false,
      },
      {
        label: 'Expenses',
        data: sorted.map(([, v]) => v.exp),
        backgroundColor: 'rgba(249,115,22,0.75)',
        borderRadius: 5, borderSkipped: false,
      },
    ],
  }
})

const DEVICE_COLORS = [
  '#3b82f6','#10b981','#f97316','#8b5cf6','#ec4899','#f59e0b','#64748b',
]
const deviceStats = computed(() => {
  const freq = {}
  filteredJobs.value.forEach(j => { if (j.device) freq[j.device] = (freq[j.device] || 0) + 1 })
  const total  = filteredJobs.value.length || 1
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  return sorted.map(([name, count], i) => ({
    name,
    count,
    pct: Math.round(count / total * 100),
    color: DEVICE_COLORS[i % DEVICE_COLORS.length],
  }))
})

const doughnutData = computed(() => ({
  labels: deviceStats.value.map(d => d.name),
  datasets: [{
    data: deviceStats.value.map(d => d.count),
    backgroundColor: deviceStats.value.map(d => d.color),
    borderWidth: 2,
    borderColor: '#fff',
  }],
}))

const topCustomers = computed(() => {
  const map = {}
  filteredJobs.value.forEach(j => {
    const k = j.customer?.trim().toLowerCase()
    if (!k) return
    if (!map[k]) map[k] = { name: j.customer.trim(), total: 0, jobs: 0 }
    map[k].total += j.total || 0
    map[k].jobs++
  })
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
})

const REPAIR_TAGS = [
  'Charging Port','Back Cover','Back Housing','Water Damage','Logic Board','Motherboard',
  'Screen','Battery','Camera','Speaker','Microphone','Earpiece',
  'Keyboard','Passcode','Password','Software','Virus','Charging','Housing','Button',
]
const topRepairs = computed(() => {
  const freq = {}
  filteredJobs.value.forEach(j => {
    if (!j.problem) return
    const p   = j.problem.toLowerCase()
    const tag = REPAIR_TAGS.find(t => p.includes(t.toLowerCase()))
    const key = tag ?? j.problem
    freq[key] = (freq[key] || 0) + 1
  })
  const total = filteredJobs.value.length || 1
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
})

const mostCommon = computed(() => topRepairs.value[0] ?? null)

const monthlyBreakdown = computed(() => {
  const groups = {}
  filteredJobs.value.forEach(j => {
    const key = store.jobDate(j).slice(0, 7)
    if (key.length < 7) return
    if (!groups[key]) groups[key] = { revenue: 0, expenses: 0, jobs: 0 }
    groups[key].revenue  += j.total      || 0
    groups[key].expenses += j.partsTotal || 0
    groups[key].jobs++
  })
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([key, d]) => ({
      label: new Date(key + '-02').toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
      jobs: d.jobs,
      revenue: d.revenue,
      net: d.revenue - d.expenses,
    }))
})

const bestCustomer = computed(() => topCustomers.value[0] ?? null)

const repeatCustomers = computed(() => {
  const freq = {}
  filteredJobs.value.forEach(j => {
    const k = j.customer?.trim().toLowerCase()
    if (k) freq[k] = (freq[k] || 0) + 1
  })
  return Object.values(freq).filter(n => n > 1).length
})

function fmt(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtShort(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const AVATAR_COLORS = [
  ['bg-blue-100','text-blue-700'],['bg-emerald-100','text-emerald-700'],
  ['bg-amber-100','text-amber-700'],['bg-violet-100','text-violet-700'],
  ['bg-pink-100','text-pink-700'],
]
function avatarColor(name) {
  let h = 0
  for (const c of (name || '')) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}
function initials(name) {
  return (name || '??').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const chartFont = { family: 'Inter', size: 11 }
const pesoTick  = v => '₱' + (Number(v) >= 1000 ? (Number(v) / 1000).toFixed(0) + 'k' : Number(v))

const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ' ₱' + Number(ctx.raw).toLocaleString('en-PH') } },
  },
  scales: {
    y: {
      ticks: { callback: pesoTick, font: chartFont, color: '#cbd5e1' },
      grid: { color: 'rgba(0,0,0,0.04)' }, border: { dash: [3, 3], display: false },
    },
    x: { ticks: { font: chartFont, color: '#cbd5e1', maxTicksLimit: 8 }, grid: { display: false }, border: { display: false } },
  },
}

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true, position: 'top',
      labels: { boxWidth: 10, font: chartFont, color: '#64748b', padding: 12 },
    },
    tooltip: { callbacks: { label: ctx => ' ₱' + Number(ctx.raw).toLocaleString('en-PH') } },
  },
  scales: {
    y: {
      ticks: { callback: pesoTick, font: chartFont, color: '#cbd5e1' },
      grid: { color: 'rgba(0,0,0,0.04)' }, border: { dash: [3, 3], display: false },
    },
    x: { ticks: { font: chartFont, color: '#cbd5e1' }, grid: { display: false }, border: { display: false } },
  },
}

const doughnutOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  cutout: '68%',
}
</script>

<template>
  <div class="space-y-5">

    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Analytics Overview</h2>
        <p class="text-sm text-slate-500 mt-0.5">Track your performance and grow your repair business.</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="p in PRESETS" :key="p.key"
            @click="activePreset = p.key"
            class="text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors"
            :class="activePreset === p.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'"
          >
            {{ p.label }}
          </button>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shrink-0">
          <span class="text-xs font-medium">{{ dateRangeLabel }}</span>
        </div>
      </div>

      <div v-if="activePreset === 'custom'" class="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500 shrink-0">From</label>
          <input v-model="customFrom" type="date"
            class="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500 shrink-0">To</label>
          <input v-model="customTo" type="date"
            class="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
    </div>

    <EmptyState v-if="!store.jobs.length" :icon="TrendingUp" message="No jobs recorded yet. Add some repair jobs to see analytics." />

    <template v-else>

      <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList :size="18" class="text-blue-600" />
            </div>
            <div class="w-16 h-8"><SparkLine :data="spark.count" color="#3b82f6" /></div>
          </div>
          <p class="text-xs font-medium text-slate-400 mb-1.5">Total Repairs</p>
          <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ summary.count }}</p>
          <div class="mt-3">
            <span v-if="summary.cntPct !== null"
              class="inline-flex items-center gap-1 bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
              <component :is="summary.cntPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
              {{ Math.abs(summary.cntPct) }}% from last period
            </span>
            <span v-else class="text-xs font-medium text-slate-400">{{ summary.count }} in range</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp :size="18" class="text-emerald-600" />
            </div>
            <div class="w-16 h-8"><SparkLine :data="spark.revenue" color="#10b981" /></div>
          </div>
          <p class="text-xs font-medium text-slate-400 mb-1.5">Revenue</p>
          <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ fmtShort(summary.revenue) }}</p>
          <div class="mt-3">
            <span v-if="summary.revPct !== null"
              class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-xs font-semibold">
              <component :is="summary.revPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
              {{ summary.revPct >= 0 ? '+' : '' }}{{ summary.revPct }}% from last period
            </span>
            <span v-else class="text-xs font-medium text-slate-400">{{ fmt(summary.revenue) }}</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <Package :size="18" class="text-orange-500" />
            </div>
            <div class="w-16 h-8"><SparkLine :data="spark.expenses" color="#f97316" /></div>
          </div>
          <p class="text-xs font-medium text-slate-400 mb-1.5">Expenses (Parts)</p>
          <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ fmtShort(summary.expenses) }}</p>
          <div class="mt-3">
            <span v-if="summary.expPct !== null"
              class="inline-flex items-center gap-1 bg-orange-50 text-orange-500 rounded-full px-2 py-0.5 text-xs font-semibold">
              <component :is="summary.expPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
              {{ summary.expPct >= 0 ? '+' : '' }}{{ summary.expPct }}% from last period
            </span>
            <span v-else class="text-xs font-medium text-slate-400">{{ fmt(summary.expenses) }}</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
              <Wallet :size="18" class="text-violet-600" />
            </div>
            <div class="w-16 h-8"><SparkLine :data="spark.net" color="#8b5cf6" /></div>
          </div>
          <p class="text-xs font-medium text-slate-400 mb-1.5">Net Income</p>
          <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ fmtShort(summary.net) }}</p>
          <div class="mt-3">
            <span v-if="summary.netPct !== null"
              class="inline-flex items-center gap-1 bg-violet-50 text-violet-600 rounded-full px-2 py-0.5 text-xs font-semibold">
              <component :is="summary.netPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
              {{ summary.netPct >= 0 ? '+' : '' }}{{ summary.netPct }}% from last period
            </span>
            <span v-else class="text-xs font-medium text-slate-400">{{ fmt(summary.net) }}</span>
          </div>
        </div>

      </div>

      <div v-if="!filteredJobs.length"
        class="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center gap-2 text-slate-400">
        <ClipboardList :size="32" class="text-slate-300" />
        <p class="text-sm font-medium">No jobs in this date range.</p>
      </div>

      <template v-else>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="font-semibold text-slate-800 mb-1">Revenue Trend</p>
            <div class="flex items-baseline gap-3 mb-5">
              <p class="text-xl font-bold text-slate-900 tracking-tight">{{ fmt(summary.revenue) }}</p>
              <span v-if="summary.revPct !== null"
                class="inline-flex items-center gap-0.5 text-xs font-semibold"
                :class="summary.revPct >= 0 ? 'text-emerald-600' : 'text-red-500'">
                <component :is="summary.revPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="12" />
                {{ Math.abs(summary.revPct) }}%
              </span>
            </div>
            <div class="h-48">
              <Line :data="trendChartData" :options="lineOptions" />
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="font-semibold text-slate-800 mb-5">Revenue vs Expenses</p>
            <div class="h-48">
              <Bar :data="revExpChartData" :options="barOptions" />
            </div>
          </div>

        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Wrench :size="16" class="text-blue-600" />
              </div>
              <p class="text-xs font-medium text-slate-400 leading-tight">Most Common Repair</p>
            </div>
            <p v-if="mostCommon" class="text-base font-bold text-slate-800 leading-snug">{{ mostCommon.name }}</p>
            <p v-else class="text-sm text-slate-400">—</p>
            <p v-if="mostCommon" class="text-xs font-semibold text-blue-600 mt-1">{{ mostCommon.pct }}% of total repairs</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp :size="16" class="text-emerald-600" />
              </div>
              <p class="text-xs font-medium text-slate-400 leading-tight">Profit Margin</p>
            </div>
            <p class="text-3xl font-bold text-slate-800 leading-none">{{ profitMargin }}%</p>
            <p class="text-xs text-slate-400 mt-1">Net / Revenue ratio</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Trophy :size="16" class="text-amber-500" />
              </div>
              <p class="text-xs font-medium text-slate-400 leading-tight">Best Customer</p>
            </div>
            <p v-if="bestCustomer" class="text-base font-bold text-slate-800 leading-snug">{{ bestCustomer.name }}</p>
            <p v-else class="text-sm text-slate-400">—</p>
            <p v-if="bestCustomer" class="text-xs font-semibold text-amber-600 mt-1">{{ fmt(bestCustomer.total) }} lifetime value</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <Users :size="16" class="text-teal-600" />
              </div>
              <p class="text-xs font-medium text-slate-400 leading-tight">Repeat Customers</p>
            </div>
            <p class="text-3xl font-bold text-slate-800 leading-none">{{ repeatCustomers }}</p>
            <p class="text-xs text-slate-400 mt-1">Customers with 2+ repairs</p>
          </div>

        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <div class="flex items-center justify-between mb-5 shrink-0">
              <p class="font-semibold text-slate-800">Top Customers</p>
              <router-link to="/customers" class="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:text-blue-700">
                View all <ChevronRight :size="13" />
              </router-link>
            </div>
            <EmptyState v-if="!topCustomers.length" :icon="ClipboardList" message="No data." />
            <div v-else class="flex-1 min-h-0 flex flex-col justify-evenly">
              <div v-for="(c, i) in topCustomers.slice(0, 5)" :key="c.name" class="flex items-center gap-3 py-1">
                <span class="text-xs font-bold text-slate-400 w-4 shrink-0">{{ i + 1 }}</span>
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  :class="[avatarColor(c.name)[0], avatarColor(c.name)[1]]"
                >{{ initials(c.name) }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <p class="text-sm font-semibold text-slate-800 truncate">{{ c.name }}</p>
                    <p class="text-sm font-bold text-slate-700 tabular-nums shrink-0">{{ fmtShort(c.total) }}</p>
                  </div>
                  <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full transition-all duration-500"
                      :style="`width:${c.total / topCustomers[0].total * 100}%`" />
                  </div>
                  <p class="text-[10px] text-slate-400 mt-0.5">{{ c.jobs }} repair{{ c.jobs !== 1 ? 's' : '' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <p class="font-semibold text-slate-800 mb-5 shrink-0">Top Repair Types</p>
            <EmptyState v-if="!topRepairs.length" :icon="Wrench" message="No data." />
            <div v-else class="flex-1 min-h-0 flex flex-col justify-evenly">
              <div v-for="r in topRepairs.slice(0, 5)" :key="r.name" class="flex items-center gap-3 py-0.5">
                <div class="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Wrench :size="12" class="text-slate-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-sm font-medium text-slate-700 truncate">{{ r.name }}</p>
                    <p class="text-xs font-semibold text-slate-500 tabular-nums shrink-0 ml-2">{{ r.pct }}%</p>
                  </div>
                  <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full transition-all duration-500" :style="`width:${r.pct}%`" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <p class="font-semibold text-slate-800 mb-5 shrink-0">Monthly Breakdown</p>
            <EmptyState v-if="!monthlyBreakdown.length" :icon="TrendingUp" message="No data." />
            <div v-else class="flex-1 min-h-0 flex flex-col justify-evenly divide-y divide-slate-50">
              <div v-for="m in monthlyBreakdown" :key="m.label" class="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <div>
                  <p class="text-sm font-semibold text-slate-700">{{ m.label }}</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ m.jobs }} job{{ m.jobs !== 1 ? 's' : '' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-800 tabular-nums">{{ fmtShort(m.revenue) }}</p>
                  <p class="text-[11px] font-semibold tabular-nums mt-0.5"
                    :class="m.net >= 0 ? 'text-emerald-600' : 'text-red-500'">
                    {{ m.net >= 0 ? '+' : '' }}{{ fmtShort(m.net) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </template>
    </template>

  </div>
</template>
