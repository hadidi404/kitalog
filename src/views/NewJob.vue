<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Calendar, User, Phone, Cpu, Tag,
  FileText, CircleDot, Banknote, Package, Plus, X, Save
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import { showToast } from '../utils/toast'

const router = useRouter()
const store  = useShopStore()

const DEVICE_TYPES   = ['Smartphone', 'Laptop', 'Tablet', 'Desktop PC', 'Game Console', 'Smart TV', 'Other']
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done']

const form = ref({
  date:     new Date().toISOString().split('T')[0],
  customer: '',
  contact:  '',
  device:   'Smartphone',
  model:    '',
  problem:  '',
  status:   'Pending',
  labor:    '',
  parts:    []
})

const errors     = ref({})
const submitting = ref(false)

const addPart    = () => form.value.parts.push({ name: '', cost: '' })
const removePart = i  => form.value.parts.splice(i, 1)

const partsTotal  = computed(() => form.value.parts.reduce((s, p) => s + (parseFloat(p.cost) || 0), 0))
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
    await store.addJob({
      date:       form.value.date,
      customer:   form.value.customer.trim(),
      contact:    form.value.contact.trim(),
      device:     form.value.device,
      model:      form.value.model.trim(),
      problem:    form.value.problem.trim(),
      status:     form.value.status,
      labor:      parseFloat(form.value.labor) || 0,
      parts:      form.value.parts.map(p => ({ name: p.name.trim(), cost: parseFloat(p.cost) || 0 })),
      partsTotal: partsTotal.value,
      total:      totalCharge.value,
    })
    showToast('Job saved successfully!')
    router.push('/jobs')
  } catch {
    showToast('Failed to save. Check your connection.', 'error')
    submitting.value = false
  }
}
</script>

<template>
  <div class="w-full">

    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-lg font-bold text-slate-900">New Repair Job</h2>
        <p class="text-sm text-slate-500 mt-0.5">Fill in the details to record a repair.</p>
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
                  <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                    <Calendar :size="11" class="text-slate-400" /> Date <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="form.date" type="date"
                    class="w-full border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    :class="errors.date ? 'border-red-400 bg-red-50' : 'border-slate-200'"
                  />
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
                  <User :size="11" class="text-slate-400" /> Customer Name <span class="text-red-400">*</span>
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
                    <Cpu :size="11" class="text-slate-400" /> Device Type <span class="text-red-400">*</span>
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
                    <Tag :size="11" class="text-slate-400" /> Brand / Model <span class="text-red-400">*</span>
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

          <section class="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
              <FileText :size="13" class="text-slate-400" />
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Problem Description</h3>
            </div>
            <div class="flex-1 flex flex-col min-h-0 p-4">
              <textarea
                v-model="form.problem"
                placeholder="Describe the issue in detail…"
                class="flex-1 min-h-0 w-full border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition overflow-y-auto"
                :class="errors.problem ? 'border-red-400 bg-red-50' : 'border-slate-200'"
              />
              <p v-if="errors.problem" class="text-xs text-red-500 mt-0.5 shrink-0">{{ errors.problem }}</p>
            </div>
          </section>

          <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Banknote :size="13" class="text-slate-400" />
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Pricing</h3>
            </div>
            <div class="p-4 space-y-3">

              <div>
                <label class="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1">
                  <Banknote :size="11" class="text-slate-400" /> Labor Fee <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">₱</span>
                  <input
                    v-model="form.labor" type="number" min="0" step="0.01" placeholder="0.00"
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

                <div class="space-y-1.5 max-h-28 overflow-y-auto pr-0.5">
                  <div v-for="(part, i) in form.parts" :key="i" class="flex gap-1.5">
                    <input
                      v-model="part.name" type="text" placeholder="Part name"
                      class="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div class="relative w-24 shrink-0">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs select-none">₱</span>
                      <input
                        v-model="part.cost" type="number" min="0" step="0.01" placeholder="0.00"
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

      <button
        type="submit" :disabled="submitting"
        class="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-sm"
      >
        <Save :size="15" /> Save Job
      </button>

    </form>
  </div>
</template>
