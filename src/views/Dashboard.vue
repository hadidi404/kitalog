<script setup>
import { computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import {
  ClipboardList, TrendingUp, Package, Wallet, Wrench,
  Clock, CheckCircle2, ChevronRight, ArrowUpRight, ArrowDownRight,
  Calendar, Users, BadgeDollarSign
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import StatusBadge from '../components/StatusBadge.vue'
import SparkLine from '../components/SparkLine.vue'
import EmptyState from '../components/EmptyState.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const store = useShopStore()

function fmt(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function relativeDate(dateStr) {
  if (!dateStr) return ''
  const today = new Date(); today.setHours(0,0,0,0)
  const d     = new Date(dateStr + 'T00:00:00'); d.setHours(0,0,0,0)
  const days  = Math.round((today - d) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  return dateStr
}

const AVATAR_COLORS = [
  ['bg-blue-100',   'text-blue-700'  ],
  ['bg-emerald-100','text-emerald-700'],
  ['bg-amber-100',  'text-amber-700' ],
  ['bg-violet-100', 'text-violet-700'],
  ['bg-pink-100',   'text-pink-700'  ],
  ['bg-teal-100',   'text-teal-700'  ],
]
function avatarColor(name) {
  let h = 0
  for (const c of (name || '')) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}
function initials(name) {
  return (name || '??').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}

function dayData(reducer) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key  = d.toISOString().split('T')[0]
    const jobs = store.jobs.filter(j => store.jobDate(j) === key)
    return reducer(jobs)
  })
}

const last7Labels = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-PH', { weekday: 'short' })
  })
)

const spark = computed(() => ({
  jobs:     dayData(j => j.length),
  revenue:  dayData(j => j.reduce((s, x) => s + (x.total      || 0), 0)),
  expenses: dayData(j => j.reduce((s, x) => s + (x.partsTotal || 0), 0)),
  net:      dayData(j => j.reduce((s, x) => s + ((x.total || 0) - (x.partsTotal || 0)), 0)),
}))

function monthJobs(offset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() - offset)
  return store.jobs.filter(j => {
    const jd = new Date(store.jobDate(j) + 'T00:00:00')
    return jd.getFullYear() === d.getFullYear() && jd.getMonth() === d.getMonth()
  })
}

const metrics = computed(() => {
  const all = store.jobs
  const cur = monthJobs(0)
  const prv = monthJobs(1)

  const total    = n => n.reduce((s, x) => s + (x.total      || 0), 0)
  const expense  = n => n.reduce((s, x) => s + (x.partsTotal || 0), 0)
  const pct = (c, p) => p === 0 ? null : Math.round((c - p) / p * 100)

  const curRev = total(cur);   const prvRev = total(prv)
  const curExp = expense(cur); const prvExp = expense(prv)

  return {
    count:    all.length,
    revenue:  all.reduce((s, x) => s + (x.total      || 0), 0),
    expenses: all.reduce((s, x) => s + (x.partsTotal || 0), 0),
    net:      all.reduce((s, x) => s + ((x.total || 0) - (x.partsTotal || 0)), 0),
    mCount:   cur.length,
    revPct:   pct(curRev, prvRev),
    expPct:   pct(curExp, prvExp),
    cntPct:   pct(cur.length, prv.length),
    mRev:     curRev,
    mExp:     curExp,
    mNet:     curRev - curExp,
  }
})

const statusCounts = computed(() => ({
  pending:    store.jobs.filter(j => j.status === 'Pending').length,
  inProgress: store.jobs.filter(j => j.status === 'In Progress').length,
  done:       store.jobs.filter(j => j.status === 'Done').length,
}))

const todayKey = new Date().toISOString().split('T')[0]
const todayStats = computed(() => {
  const today = store.jobs.filter(j => store.jobDate(j) === todayKey)
  return {
    due:       today.filter(j => j.status !== 'Done').length,
    waiting:   store.jobs.filter(j => j.status === 'In Progress').length,
    completed: today.filter(j => j.status === 'Done').length,
    earned:    today.reduce((s, j) => s + (j.total || 0), 0),
  }
})

const weekRevData = computed(() => spark.value.revenue)
const weekTotal   = computed(() => weekRevData.value.reduce((s, v) => s + v, 0))

const weekChartData = computed(() => ({
  labels: last7Labels.value,
  datasets: [{
    data: weekRevData.value,
    backgroundColor: weekRevData.value.map((_, i) =>
      i === 6 ? 'rgba(37,99,235,1)' : 'rgba(37,99,235,0.12)'
    ),
    borderRadius: 6,
    borderSkipped: false,
  }],
}))

const weekChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false },
    tooltip: { callbacks: { label: ctx => ' ₱' + Number(ctx.raw).toLocaleString('en-PH') } },
  },
  scales: {
    y: {
      ticks: { callback: v => '₱' + (Number(v) >= 1000 ? (Number(v)/1000).toFixed(0)+'k' : Number(v)), font: { size: 10, family: 'Inter' }, color: '#cbd5e1' },
      grid: { color: 'rgba(0,0,0,0.04)' }, border: { dash: [3,3], display: false },
    },
    x: { ticks: { font: { size: 10, family: 'Inter' }, color: '#cbd5e1' }, grid: { display: false }, border: { display: false } },
  },
}

const recentJobs = computed(() => store.jobs.slice(0, 7))

const REPAIR_TAGS = [
  'Charging Port', 'Back Cover', 'Back Housing', 'Water Damage',
  'Logic Board', 'Motherboard',
  'Screen', 'Battery', 'Camera', 'Speaker',
  'Microphone', 'Earpiece', 'Keyboard',
  'Passcode', 'Password', 'Software', 'Virus',
  'Charging', 'Housing', 'Button',
]

const DEVICE_COLORS = ['#3b82f6','#10b981','#f97316','#8b5cf6','#ec4899','#f59e0b','#64748b']

const deviceStats = computed(() => {
  const freq = {}
  store.jobs.forEach(j => { if (j.device) freq[j.device] = (freq[j.device] || 0) + 1 })
  const total = store.jobs.length || 1
  return Object.entries(freq).sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({
      name, count,
      pct: Math.round(count / total * 100),
      color: DEVICE_COLORS[i % DEVICE_COLORS.length],
    }))
})

const doughnutData = computed(() => ({
  labels: deviceStats.value.map(d => d.name),
  datasets: [{
    data: deviceStats.value.map(d => d.count),
    backgroundColor: deviceStats.value.map(d => d.color),
    borderWidth: 2, borderColor: '#fff',
  }],
}))

const doughnutOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  cutout: '68%',
}

const topRepairs = computed(() => {
  const freq = {}
  store.jobs.forEach(j => {
    if (!j.problem) return
    const p = j.problem.toLowerCase()
    const tag = REPAIR_TAGS.find(t => p.includes(t.toLowerCase()))
    const key = tag ?? j.problem
    freq[key] = (freq[key] || 0) + 1
  })
  const total = store.jobs.length || 1
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
})

</script>

<template>
  <div class="space-y-5">

    <div>
      <h2 class="text-lg font-bold text-slate-900">Dashboard</h2>
      <p class="text-sm text-slate-500 mt-0.5">Welcome back — here's your repair business at a glance.</p>
    </div>

    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList :size="18" class="text-blue-600" />
          </div>
          <div class="w-16 h-8">
            <SparkLine :data="spark.jobs" color="#3b82f6" />
          </div>
        </div>
        <p class="text-xs font-medium text-slate-400 mb-1.5">Total Repairs</p>
        <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ metrics.count }}</p>
        <div class="mt-3">
          <span v-if="metrics.cntPct !== null"
            class="inline-flex items-center gap-1 bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
            <component :is="metrics.cntPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
            {{ metrics.cntPct >= 0 ? '+' : '' }}{{ metrics.cntPct }}% from last month
          </span>
          <span v-else class="inline-flex items-center gap-1 bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
            <ArrowUpRight :size="11" />
            +{{ metrics.mCount }} this month
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp :size="18" class="text-emerald-600" />
          </div>
          <div class="w-16 h-8">
            <SparkLine :data="spark.revenue" color="#10b981" />
          </div>
        </div>
        <p class="text-xs font-medium text-slate-400 mb-1.5">Revenue</p>
        <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ fmt(metrics.revenue) }}</p>
        <div class="mt-3">
          <span v-if="metrics.revPct !== null"
            class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-xs font-semibold">
            <component :is="metrics.revPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
            {{ metrics.revPct >= 0 ? '+' : '' }}{{ metrics.revPct }}% from last month
          </span>
          <span v-else class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-xs font-semibold">
            <ArrowUpRight :size="11" />
            {{ fmt(metrics.mRev) }} this month
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Package :size="18" class="text-orange-500" />
          </div>
          <div class="w-16 h-8">
            <SparkLine :data="spark.expenses" color="#f97316" />
          </div>
        </div>
        <p class="text-xs font-medium text-slate-400 mb-1.5">Expenses</p>
        <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ fmt(metrics.expenses) }}</p>
        <div class="mt-3">
          <span v-if="metrics.expPct !== null"
            class="inline-flex items-center gap-1 bg-orange-50 text-orange-500 rounded-full px-2 py-0.5 text-xs font-semibold">
            <component :is="metrics.expPct >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
            {{ metrics.expPct >= 0 ? '+' : '' }}{{ metrics.expPct }}% from last month
          </span>
          <span v-else class="inline-flex items-center gap-1 bg-orange-50 text-orange-500 rounded-full px-2 py-0.5 text-xs font-semibold">
            <ArrowUpRight :size="11" />
            {{ fmt(metrics.mExp) }} this month
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
            <Wallet :size="18" class="text-violet-600" />
          </div>
          <div class="w-16 h-8">
            <SparkLine :data="spark.net" color="#8b5cf6" />
          </div>
        </div>
        <p class="text-xs font-medium text-slate-400 mb-1.5">Net Profit</p>
        <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ fmt(metrics.net) }}</p>
        <div class="mt-3">
          <span class="inline-flex items-center gap-1 bg-violet-50 text-violet-600 rounded-full px-2 py-0.5 text-xs font-semibold">
            <component :is="metrics.mNet >= 0 ? ArrowUpRight : ArrowDownRight" :size="11" />
            {{ fmt(metrics.mNet) }} this month
          </span>
        </div>
      </div>

    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">

      <div class="lg:col-span-3 flex flex-col gap-4">

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex items-start justify-between mb-1">
            <p class="font-semibold text-slate-800">Revenue Overview</p>
          </div>
          <div class="flex items-baseline gap-3 mb-5">
            <p class="text-2xl font-bold text-slate-900 tracking-tight">{{ fmt(weekTotal) }}</p>
            <span class="text-xs font-medium text-slate-400">last 7 days</span>
          </div>
          <EmptyState v-if="!store.jobs.length" :icon="TrendingUp" message="No data yet." />
          <div v-else class="h-48">
            <Bar :data="weekChartData" :options="weekChartOptions" />
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p class="font-semibold text-slate-800 mb-4">Today at a Glance</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div class="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Calendar :size="15" class="text-blue-600" />
              </div>
              <div>
                <p class="text-lg font-bold text-slate-900 leading-none">{{ todayStats.due }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">Repairs due</p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div class="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Users :size="15" class="text-amber-600" />
              </div>
              <div>
                <p class="text-lg font-bold text-slate-900 leading-none">{{ todayStats.waiting }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">Customers waiting</p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div class="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 :size="15" class="text-emerald-600" />
              </div>
              <div>
                <p class="text-lg font-bold text-slate-900 leading-none">{{ todayStats.completed }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">Completed today</p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div class="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                <BadgeDollarSign :size="15" class="text-violet-600" />
              </div>
              <div>
                <p class="text-lg font-bold text-slate-900 leading-none truncate">{{ fmt(todayStats.earned) }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">Earned today</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col lg:flex-row gap-4">

          <div class="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p class="font-semibold text-slate-800 mb-5">Top Repair Types</p>
            <EmptyState v-if="!topRepairs.length" :icon="Wrench" message="No repair data yet." />
            <div v-else class="space-y-4">
              <div v-for="r in topRepairs" :key="r.name" class="flex items-center gap-3">
                <p class="text-sm text-slate-700 w-32 truncate shrink-0">{{ r.name }}</p>
                <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div class="h-2 bg-blue-500 rounded-full transition-all duration-500" :style="`width:${r.pct}%`" />
                </div>
                <p class="text-xs font-semibold text-slate-500 w-8 text-right shrink-0 tabular-nums">{{ r.pct }}%</p>
              </div>
            </div>
          </div>

          <div class="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <p class="font-semibold text-slate-800 mb-4 shrink-0">Jobs By Device Type</p>
            <EmptyState v-if="!deviceStats.length" :icon="Wrench" message="No data yet." />
            <div v-else class="flex-1 min-h-0 flex items-center justify-center gap-4">
              <div class="w-28 h-28 shrink-0">
                <Doughnut :data="doughnutData" :options="doughnutOptions" />
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="d in deviceStats" :key="d.name" class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full shrink-0" :style="`background:${d.color}`" />
                  <span class="text-xs text-slate-600 truncate">{{ d.name }}</span>
                  <span class="text-xs font-semibold text-slate-700 tabular-nums ml-auto pl-2">{{ d.pct }}%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <div class="lg:col-span-2 flex flex-col gap-4">

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <p class="font-semibold text-slate-800">Jobs Status</p>
            <router-link to="/jobs" class="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:text-blue-700">
              View all <ChevronRight :size="13" />
            </router-link>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-center">
              <div class="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2.5">
                <Clock :size="15" class="text-amber-500" />
              </div>
              <p class="text-2xl font-bold text-slate-900 leading-none">{{ statusCounts.pending }}</p>
              <p class="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mt-2">Pending</p>
              <p class="text-[10px] text-slate-400">jobs</p>
            </div>
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-center">
              <div class="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2.5">
                <Wrench :size="15" class="text-blue-500" />
              </div>
              <p class="text-2xl font-bold text-slate-900 leading-none">{{ statusCounts.inProgress }}</p>
              <p class="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mt-2">In Progress</p>
              <p class="text-[10px] text-slate-400">jobs</p>
            </div>
            <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center">
              <div class="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2.5">
                <CheckCircle2 :size="15" class="text-emerald-500" />
              </div>
              <p class="text-2xl font-bold text-slate-900 leading-none">{{ statusCounts.done }}</p>
              <p class="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mt-2">Done</p>
              <p class="text-[10px] text-slate-400">jobs</p>
            </div>
          </div>
        </div>

        <div class="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between shrink-0">
            <p class="font-semibold text-slate-800 text-sm">Recent Activity</p>
            <router-link to="/jobs" class="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:text-blue-700">
              View all <ChevronRight :size="13" />
            </router-link>
          </div>
          <EmptyState v-if="!recentJobs.length" :icon="ClipboardList" message="No jobs yet." />
          <div v-else class="divide-y divide-slate-50 overflow-y-auto flex-1">
            <div
              v-for="job in recentJobs" :key="job.id"
              class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                :class="[avatarColor(job.customer)[0], avatarColor(job.customer)[1]]"
              >
                {{ initials(job.customer) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate leading-tight">{{ job.customer }}</p>
                <p class="text-xs text-slate-400 truncate">{{ job.problem }}</p>
              </div>
              <div class="text-right shrink-0">
                <StatusBadge :status="job.status" />
                <div class="flex items-center justify-end gap-2 mt-1">
                  <span class="text-[10px] text-slate-400">{{ relativeDate(store.jobDate(job)) }}</span>
                  <span class="text-xs font-semibold text-slate-700 tabular-nums">{{ fmt(job.total) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
