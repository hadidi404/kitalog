<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft, Calendar, User, Phone, Cpu, Tag,
  FileText, CircleDot, Banknote, Package, Plus, X, Save, Boxes
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import { showToast } from '../utils/toast'

const router = useRouter()
const route  = useRoute()
const store  = useShopStore()
const jobId  = route.params.id

const DEVICE_TYPES   = ['Phone', 'Laptop', 'Tablet', 'Desktop PC', 'Game Console', 'Smart TV', 'Other']
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done']

const form = ref({
  date:     '',
  customer: '',
  contact:  '',
  device:   'Phone',
  model:    '',
  problem:  '',
  status:   'Pending',
  labor:    '',
  parts:    [],
})

const errors       = ref({})
const submitting   = ref(false)
const loaded       = ref(false)
const dateInputRef = ref(null)

watch(
  () => store.jobs,
  (jobs) => {
    if (loaded.value) return
    const job = jobs.find(j => j.id === jobId)
    if (!job) {
      if (!store.loading) {
        showToast('Job not found.', 'error')
        router.push('/jobs')
      }
      return
    }
    form.value = {
      date:     store.jobDate(job),
      customer: job.customer,
      contact:  job.contact || '',
      device:   job.device,
      model:    job.model,
      problem:  job.problem,
      status:   job.status,
      labor:    job.labor != null ? String(job.labor) : '',
      parts:    (job.parts || []).map(p => ({
        name:    p.name,
        cost:    String(p.cost),
        stockId: p.stockId || null,
        qty:     p.qty != null ? String(p.qty) : '1',
      })),
    }
    loaded.value = true
  },
  { immediate: true },
)

const showProblemSuggestions = ref(false)

const problemSuggestions = computed(() => {
  const q = form.value.problem.trim().toLowerCase()
  if (!q) return []
  return [...new Set(store.jobs.map(j => j.problem?.trim()).filter(Boolean))]
    .filter(p => p.toLowerCase().includes(q))
    .slice(0, 6)
})

function selectProblem(problem) {
  form.value.problem = problem
  showProblemSuggestions.value = false
}

const activePart = ref(-1)

const partSuggestions = computed(() => {
  const q = form.value.parts[activePart.value]?.name?.trim().toLowerCase() || ''
  if (!q) return []
  const stock = store.inventory
    .filter(i => i.name.toLowerCase().includes(q))
    .map(i => ({ name: i.name, stockId: i.id, qty: i.qty, unitCost: i.unitCost }))
  const stockNames = new Set(stock.map(s => s.name.toLowerCase()))
  const history = [...new Set(
    store.jobs.flatMap(j => j.parts || []).map(p => p.name?.trim()).filter(Boolean)
  )].filter(n => n.toLowerCase().includes(q) && !stockNames.has(n.toLowerCase()))
    .map(n => ({ name: n, stockId: null }))
  return [...stock, ...history].slice(0, 7)
})

function selectPart(s) {
  const p = form.value.parts[activePart.value]
  p.name = s.name
  if (s.stockId) {
    p.stockId = s.stockId
    p.qty = '1'
    if (!p.cost) p.cost = String(s.unitCost ?? '')
  }
  activePart.value = -1
}

function stockLeft(part) {
  return store.inventory.find(i => i.id === part.stockId)?.qty ?? 0
}

function unlinkStock(part) {
  part.stockId = null
  part.qty = '1'
}

const addPart    = () => form.value.parts.push({ name: '', cost: '', stockId: null, qty: '1' })
const removePart = i  => form.value.parts.splice(i, 1)

const partsTotal  = computed(() => form.value.parts.reduce((s, p) => s + (parseFloat(p.cost) || 0), 0))
const partsCost   = computed(() => form.value.parts.reduce((s, p) => s + (p.stockId ? 0 : (parseFloat(p.cost) || 0)), 0))
const totalCharge = computed(() => (parseFloat(form.value.labor) || 0) + partsTotal.value)

function formatPeso(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function validate() {
  const e = {}
  if (!form.value.date)            e.date     = 'Required'
  if (!form.value.customer.trim()) e.customer = 'Required'
  if (!form.value.model.trim())    e.model    = 'Required'
  if (!form.value.problem.trim())  e.problem  = 'Required'
  if (form.value.labor === '')     e.labor    = 'Required'
  errors.value = e
  return !Object.keys(e).length
}

async function submit() {
  if (!validate() || submitting.value) return
  submitting.value = true
  try {
    await store.updateJob(jobId, {
      date:       form.value.date,
      customer:   form.value.customer.trim(),
      contact:    form.value.contact.trim(),
      device:     form.value.device,
      model:      form.value.model.trim(),
      problem:    form.value.problem.trim(),
      status:     form.value.status,
      labor:      parseFloat(form.value.labor) || 0,
      parts:      form.value.parts.map(p => ({
        name:    p.name.trim(),
        cost:    parseFloat(p.cost) || 0,
        stockId: p.stockId || null,
        qty:     p.stockId ? (parseInt(p.qty) || 1) : null,
      })),
      partsTotal: partsTotal.value,
      partsCost:  partsCost.value,
      total:      totalCharge.value,
    })
    showToast('Job updated successfully!')
    router.push('/jobs')
  } catch {
    showToast('Failed to update. Check your connection.', 'error')
    submitting.value = false
  }
}
</script>

<template>
  <div class="w-full">

    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Edit Repair Job</h2>
        <p class="text-sm text-slate-500 mt-0.5">Update the details for this repair.</p>
      </div>
      <router-link
        to="/jobs"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        <ArrowLeft :size="13" /> All Jobs
      </router-link>
    </div>

    <form @submit.prevent="submit" novalidate>

      <div class="flex flex-col lg:flex-row gap-5 mb-5">

        <div class="flex-1 flex flex-col gap-4">

          <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <User :size="13" class="text-slate-400" />
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Job & Customer</h3>
            </div>
            <div class="p-4 space-y-3">

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="flex just items-center gap-1 text-sm font-semibold text-slate-600 mb-1">
                    <Calendar :size="11" class="text-slate-400" /> Date <span v-if="!form.date" class="text-red-400">*</span>
                  </label>
                  <div class="relative cursor-pointer" @click="dateInputRef?.showPicker()">
                    <input
                      ref="dateInputRef"
                      v-model="form.date" type="date"
                      class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <input
                      :value="form.date" type="text" readonly
                      class="w-full border rounded-lg px-2.5 py-2 text-sm text-left pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      :class="errors.date ? 'border-red-400 bg-red-50' : 'border-slate-200'"
                    />
                  </div>
                  <p v-if="errors.date" class="text-xs text-red-500 mt-0.5">{{ errors.date }}</p>
                </div>
                <div>
                  <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                    <CircleDot :size="11" class="text-slate-400" /> Status
                  </label>
                  <select
                    v-model="form.status"
                    class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option v-for="s in STATUS_OPTIONS" :key="s">{{ s }}</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                  <User :size="11" class="text-slate-400" /> Customer Name <span v-if="!form.customer.trim()" class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.customer" type="text" placeholder="Juan dela Cruz"
                  class="w-full border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  :class="errors.customer ? 'border-red-400 bg-red-50' : 'border-slate-200'"
                />
                <p v-if="errors.customer" class="text-xs text-red-500 mt-0.5">{{ errors.customer }}</p>
              </div>

              <div>
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                  <Phone :size="11" class="text-slate-400" /> Contact Number
                </label>
                <input
                  v-model="form.contact" type="tel" placeholder="09XX XXX XXXX"
                  class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section class="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Cpu :size="13" class="text-slate-400" />
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Device Info</h3>
            </div>
            <div class="p-4 space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                    <Cpu :size="11" class="text-slate-400" /> Device Type
                  </label>
                  <select
                    v-model="form.device"
                    class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option v-for="d in DEVICE_TYPES" :key="d">{{ d }}</option>
                  </select>
                </div>
                <div>
                  <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                    <Tag :size="11" class="text-slate-400" /> Brand / Model <span v-if="!form.model.trim()" class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="form.model" type="text" placeholder="Samsung A54"
                    class="w-full border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    :class="errors.model ? 'border-red-400 bg-red-50' : 'border-slate-200'"
                  />
                  <p v-if="errors.model" class="text-xs text-red-500 mt-0.5">{{ errors.model }}</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        <div class="flex-1 flex flex-col gap-4">

          <section class="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 rounded-t-xl">
              <FileText :size="13" class="text-slate-400" />
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Problem / Service</h3>
            </div>
            <div class="p-4">
              <div class="relative">
                <input
                  v-model="form.problem" type="text" placeholder="e.g. Battery Replacement" autocomplete="off"
                  @focus="showProblemSuggestions = true"
                  @blur="showProblemSuggestions = false"
                  class="w-full border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  :class="errors.problem ? 'border-red-400 bg-red-50' : 'border-slate-200'"
                />
                <ul v-if="showProblemSuggestions && problemSuggestions.length"
                    class="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  <li
                    v-for="p in problemSuggestions" :key="p"
                    @mousedown.prevent="selectProblem(p)"
                    class="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >{{ p }}</li>
                </ul>
              </div>
              <p v-if="errors.problem" class="text-xs text-red-500 mt-0.5">{{ errors.problem }}</p>
            </div>
          </section>

          <section class="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 rounded-t-xl">
              <Banknote :size="13" class="text-slate-400" />
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Pricing</h3>
            </div>
            <div class="p-4 space-y-3">

              <div>
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                  <Banknote :size="11" class="text-slate-400" /> Labor Fee <span v-if="form.labor === ''" class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">₱</span>
                  <input
                    v-model="form.labor" type="number" min="0" step="1" placeholder="0"
                    class="w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    :class="errors.labor ? 'border-red-400 bg-red-50' : 'border-slate-200'"
                  />
                </div>
                <p v-if="errors.labor" class="text-xs text-red-500 mt-0.5">{{ errors.labor }}</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <Package :size="11" class="text-slate-400" /> Parts / Materials
                  </label>
                  <button
                    type="button" @click="addPart"
                    class="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    <Plus :size="11" /> Add
                  </button>
                </div>

                <p v-if="!form.parts.length" class="text-xs text-slate-400">No parts — labor only.</p>

                <div class="space-y-2 pr-0.5">
                  <div v-for="(part, i) in form.parts" :key="i" class="space-y-1">
                    <div class="flex gap-1.5">
                      <div class="relative flex-1">
                        <input
                          v-model="part.name" type="text" placeholder="Part name" autocomplete="off"
                          @focus="activePart = i"
                          @blur="activePart = -1"
                          class="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ul v-if="activePart === i && partSuggestions.length"
                            class="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
                          <li
                            v-for="(s, si) in partSuggestions" :key="si"
                            @mousedown.prevent="selectPart(s)"
                            class="flex items-center justify-between gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <span class="truncate">{{ s.name }}</span>
                            <span v-if="s.stockId" class="inline-flex items-center gap-1 text-[10px] font-semibold shrink-0"
                              :class="s.qty > 0 ? 'text-emerald-600' : 'text-red-500'">
                              <Boxes :size="10" /> {{ s.qty }} in stock
                            </span>
                          </li>
                        </ul>
                      </div>
                      <div class="relative w-24 shrink-0">
                        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs select-none">₱</span>
                        <input
                          v-model="part.cost" type="number" min="0" step="1" placeholder="0"
                          class="w-full border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button" @click="removePart(i)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      >
                        <X :size="12" />
                      </button>
                    </div>

                    <div v-if="part.stockId" class="flex items-center gap-2 pl-0.5">
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                        <Boxes :size="10" /> From stock
                      </span>
                      <div class="flex items-center gap-1">
                        <span class="text-[10px] text-slate-400">Qty</span>
                        <input
                          v-model="part.qty" type="number" min="1" step="1"
                          class="w-12 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <span class="text-[10px]"
                        :class="(parseInt(part.qty) || 1) > stockLeft(part) ? 'text-red-500 font-semibold' : 'text-slate-400'">
                        {{ stockLeft(part) }} left
                      </span>
                      <button type="button" @click="unlinkStock(part)"
                        class="text-[10px] font-semibold text-slate-400 hover:text-slate-600 ml-auto shrink-0">
                        Unlink
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-100 space-y-1.5">
                <div class="flex justify-between text-xs text-slate-500">
                  <span>Labor fee</span>
                  <span class="tabular-nums">{{ formatPeso(parseFloat(form.labor) || 0) }}</span>
                </div>
                <div class="flex justify-between text-xs text-slate-500">
                  <span>Parts total</span>
                  <span class="tabular-nums">{{ formatPeso(partsTotal) }}</span>
                </div>
                <div class="flex justify-between font-bold text-slate-900 text-sm pt-1.5 border-t border-slate-100">
                  <span>Total Charge</span>
                  <span class="text-blue-600 tabular-nums">{{ formatPeso(totalCharge) }}</span>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>

      <div class="flex gap-3">
        <router-link
          to="/jobs"
          class="flex-1 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
        >
          Cancel
        </router-link>
        <button
          type="submit" :disabled="submitting"
          class="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-sm"
        >
          <Save :size="15" /> Save Changes
        </button>
      </div>

    </form>
  </div>
</template>
