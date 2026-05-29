<script setup>
import { computed } from 'vue'
import { Users } from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import EmptyState from '../components/EmptyState.vue'

const store = useShopStore()

function formatPeso(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const customers = computed(() => {
  const map = {}
  store.jobs.forEach(job => {
    const key = job.customer.trim().toLowerCase()
    if (!map[key]) {
      map[key] = { name: job.customer.trim(), contact: '', jobs: 0, devices: new Set(), totalSpent: 0 }
    }
    const c = map[key]
    c.jobs++
    c.devices.add(job.model || job.device)
    c.totalSpent += job.total || 0
    if (!c.contact && job.contact) c.contact = job.contact
  })
  return Object.values(map)
    .map(c => ({ ...c, devices: [...c.devices] }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
})
</script>

<template>
  <div class="space-y-5">

    <div>
      <h2 class="text-lg font-bold text-slate-900">Customers</h2>
      <p class="text-sm text-slate-500 mt-0.5">
        {{ customers.length }} unique customer{{ customers.length !== 1 ? 's' : '' }} — auto-aggregated from job records
      </p>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      <EmptyState
        v-if="customers.length === 0"
        :icon="Users"
        message="No customers yet. Add repair jobs to see them here."
      />

      <!-- Mobile: cards -->
      <div v-else class="md:hidden divide-y divide-slate-100">
        <div v-for="(c, i) in customers" :key="c.name" class="p-5">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                :class="i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ i + 1 }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-slate-800 truncate">{{ c.name }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ c.contact || 'No contact saved' }}</p>
              </div>
            </div>
            <span class="text-sm font-bold text-slate-800 shrink-0 tabular-nums">{{ formatPeso(c.totalSpent) }}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2 pl-11">
            <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
              {{ c.jobs }} job{{ c.jobs !== 1 ? 's' : '' }}
            </span>
            <span
              v-for="device in c.devices.slice(0, 3)"
              :key="device"
              class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full truncate max-w-[130px]"
            >
              {{ device }}
            </span>
            <span v-if="c.devices.length > 3" class="text-xs text-slate-400">+{{ c.devices.length - 3 }}</span>
          </div>
        </div>
      </div>

      <!-- Desktop: table -->
      <div v-if="customers.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide w-10">#</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Customer</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Contact</th>
              <th class="text-center px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Jobs</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Devices Repaired</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Total Spent</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(c, i) in customers"
              :key="c.name"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold"
                  :class="i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'"
                >
                  {{ i + 1 }}
                </span>
              </td>
              <td class="px-5 py-4 font-semibold text-slate-800">{{ c.name }}</td>
              <td class="px-5 py-4 text-slate-500">{{ c.contact || '—' }}</td>
              <td class="px-5 py-4 text-center">
                <span class="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                  {{ c.jobs }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="device in c.devices.slice(0, 3)"
                    :key="device"
                    class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full max-w-[160px] truncate"
                  >
                    {{ device }}
                  </span>
                  <span v-if="c.devices.length > 3" class="text-xs text-slate-400 self-center">
                    +{{ c.devices.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-4 text-right font-bold text-slate-900 tabular-nums">{{ formatPeso(c.totalSpent) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
