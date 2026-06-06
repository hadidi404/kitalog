<script setup>
import { ref, computed } from 'vue'
import {
  Boxes, Plus, Search, PackagePlus, Pencil, Trash2,
  Wallet, AlertTriangle, X, Save,
} from 'lucide-vue-next'
import { useShopStore } from '../stores/shop'
import { showToast } from '../utils/toast'
import EmptyState from '../components/EmptyState.vue'

const store  = useShopStore()
const search = ref('')

const items = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = q
    ? store.inventory.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.supplier?.toLowerCase().includes(q))
    : store.inventory
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
})

function threshold(item) { return item.threshold ?? 3 }
function isOut(item)     { return (item.qty || 0) <= 0 }
function isLow(item)     { return !isOut(item) && (item.qty || 0) <= threshold(item) }

const summary = computed(() => {
  const value = store.inventory.reduce((s, i) => s + (i.qty || 0) * (i.unitCost || 0), 0)
  const low   = store.inventory.filter(i => isLow(i) || isOut(i)).length
  return { count: store.inventory.length, value, low }
})

function fmt(n) {
  return '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const today = () => new Date().toISOString().split('T')[0]
const modal = ref(null)
const saving = ref(false)
const showNameSuggestions = ref(false)

const nameSuggestions = computed(() => {
  if (!modal.value || modal.value.mode === 'restock') return []
  const q = modal.value.name?.trim().toLowerCase() || ''
  if (!q) return []
  return [...new Set(
    store.purchases.map(p => p.name?.trim()).filter(Boolean)
  )].filter(n => n.toLowerCase().includes(q)).slice(0, 6)
})

function selectName(name) {
  modal.value.name = name
  showNameSuggestions.value = false
}

function openAdd() {
  modal.value = { mode: 'add', name: '', qty: '', unitCost: '', supplier: '', threshold: '3', date: today() }
}
function openRestock(item) {
  modal.value = { mode: 'restock', id: item.id, name: item.name, qty: '', unitCost: String(item.unitCost ?? ''), date: today() }
}
function openEdit(item) {
  modal.value = {
    mode: 'edit', id: item.id, name: item.name,
    qty: String(item.qty ?? 0), unitCost: String(item.unitCost ?? ''),
    supplier: item.supplier || '', threshold: String(threshold(item)),
  }
}
function closeModal() { modal.value = null }

const modalTitle = computed(() => ({
  add: 'Add Stock Item', restock: 'Restock', edit: 'Edit Item',
}[modal.value?.mode]))

async function saveModal() {
  const m = modal.value
  if (saving.value) return
  if (m.mode !== 'restock' && !m.name.trim()) { showToast('Name is required.', 'error'); return }
  if (m.mode === 'restock' && (Number(m.qty) || 0) <= 0) { showToast('Enter a quantity to add.', 'error'); return }
  saving.value = true
  try {
    if (m.mode === 'add') {
      await store.addInventory({
        name:      m.name.trim(),
        qty:       Number(m.qty) || 0,
        unitCost:  Number(m.unitCost) || 0,
        supplier:  m.supplier.trim(),
        threshold: Number(m.threshold) || 0,
        date:      m.date,
      })
      showToast('Stock item added.')
    } else if (m.mode === 'restock') {
      await store.restockInventory(m.id, {
        qty:      Number(m.qty) || 0,
        unitCost: Number(m.unitCost) || 0,
        date:     m.date,
      })
      showToast('Stock updated.')
    } else {
      await store.updateInventory(m.id, {
        name:      m.name.trim(),
        qty:       Number(m.qty) || 0,
        unitCost:  Number(m.unitCost) || 0,
        supplier:  m.supplier.trim(),
        threshold: Number(m.threshold) || 0,
      })
      showToast('Item updated.')
    }
    closeModal()
  } catch {
    showToast('Something went wrong. Check your connection.', 'error')
  } finally {
    saving.value = false
  }
}

function confirmDelete(item) {
  if (confirm(`Delete "${item.name}" from inventory? This cannot be undone.`)) {
    store.deleteInventory(item.id)
  }
}
</script>

<template>
  <div class="space-y-5">

    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Inventory</h2>
        <p class="text-sm text-slate-500 mt-0.5">Track parts in stock and what you spend restocking.</p>
      </div>
      <button
        @click="openAdd"
        class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
      >
        <Plus :size="15" /> Add Stock
      </button>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
          <Boxes :size="18" class="text-blue-600" />
        </div>
        <p class="text-xs font-medium text-slate-400 mb-1.5">Items in Stock</p>
        <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ summary.count }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
          <Wallet :size="18" class="text-emerald-600" />
        </div>
        <p class="text-xs font-medium text-slate-400 mb-1.5">Stock Value</p>
        <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ fmt(summary.value) }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
          <AlertTriangle :size="18" class="text-orange-500" />
        </div>
        <p class="text-xs font-medium text-slate-400 mb-1.5">Low / Out of Stock</p>
        <p class="text-2xl font-bold text-slate-900 tracking-tight leading-none">{{ summary.low }}</p>
      </div>
    </div>

    <div class="relative max-w-xs">
      <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        v-model="search" type="text" placeholder="Search parts or suppliers..."
        class="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      <EmptyState
        v-if="!items.length"
        :icon="Boxes"
        :message="search ? 'No parts match your search.' : 'No stock yet. Add the parts you keep on hand.'"
      />

      <div v-else class="md:hidden divide-y divide-slate-100">
        <div v-for="item in items" :key="item.id" class="p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="min-w-0">
              <p class="font-semibold text-slate-800 truncate">{{ item.name }}</p>
              <p v-if="item.supplier" class="text-xs text-slate-400 mt-0.5 truncate">{{ item.supplier }}</p>
            </div>
            <span
              class="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              :class="isOut(item) ? 'bg-red-100 text-red-700' : isLow(item) ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ item.qty || 0 }} {{ isOut(item) ? 'out' : isLow(item) ? 'low' : 'in stock' }}
            </span>
          </div>
          <div class="flex items-center justify-between gap-2 mt-3">
            <div class="text-xs text-slate-500">
              <span class="tabular-nums">{{ fmt(item.unitCost) }}</span> / unit ·
              <span class="font-semibold text-slate-700 tabular-nums">{{ fmt((item.qty || 0) * (item.unitCost || 0)) }}</span> value
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <button @click="openRestock(item)" class="text-xs font-semibold text-blue-500 hover:text-blue-700">Restock</button>
              <button @click="openEdit(item)" class="text-xs font-semibold text-slate-500 hover:text-slate-700">Edit</button>
              <button @click="confirmDelete(item)" class="text-xs font-semibold text-red-400 hover:text-red-600">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="items.length" class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Part</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Supplier</th>
              <th class="text-center px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">On Hand</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Unit Cost</th>
              <th class="text-right px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Stock Value</th>
              <th class="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50/60 transition-colors">
              <td class="px-5 py-3.5">
                <p class="font-semibold text-slate-800">{{ item.name }}</p>
              </td>
              <td class="px-5 py-3.5 text-slate-500">{{ item.supplier || '—' }}</td>
              <td class="px-5 py-3.5 text-center">
                <span
                  class="inline-flex items-center justify-center min-w-[2.5rem] text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
                  :class="isOut(item) ? 'bg-red-100 text-red-700' : isLow(item) ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
                >
                  {{ item.qty || 0 }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-right text-slate-600 tabular-nums whitespace-nowrap">{{ fmt(item.unitCost) }}</td>
              <td class="px-5 py-3.5 text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">{{ fmt((item.qty || 0) * (item.unitCost || 0)) }}</td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openRestock(item)" title="Restock"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                    <PackagePlus :size="15" />
                  </button>
                  <button @click="openEdit(item)" title="Edit"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                    <Pencil :size="14" />
                  </button>
                  <button @click="confirmDelete(item)" title="Delete"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Transition
      enter-from-class="opacity-0" enter-active-class="transition duration-150"
      leave-to-class="opacity-0" leave-active-class="transition duration-100"
    >
      <div v-if="modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/40" @click="closeModal" />
        <div class="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-900">{{ modalTitle }}</h3>
            <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
              <X :size="16" />
            </button>
          </div>

          <form @submit.prevent="saveModal" class="p-5 space-y-3">

            <div v-if="modal.mode === 'restock'" class="bg-slate-50 rounded-xl px-3 py-2.5 text-sm">
              <span class="text-slate-500">Restocking</span>
              <span class="font-semibold text-slate-800"> {{ modal.name }}</span>
            </div>

            <div v-if="modal.mode !== 'restock'">
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Part Name</label>
              <div class="relative">
                <input
                  v-model="modal.name" type="text" placeholder="e.g. Samsung A54 LCD" autocomplete="off"
                  @focus="showNameSuggestions = true"
                  @blur="showNameSuggestions = false"
                  class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ul v-if="showNameSuggestions && nameSuggestions.length"
                    class="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
                  <li
                    v-for="name in nameSuggestions" :key="name"
                    @mousedown.prevent="selectName(name)"
                    class="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >{{ name }}</li>
                </ul>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-600 mb-1 block">
                  {{ modal.mode === 'restock' ? 'Quantity to Add' : modal.mode === 'edit' ? 'On Hand' : 'Quantity' }}
                </label>
                <input
                  v-model="modal.qty" type="number" min="0" step="1" placeholder="0"
                  class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Unit Cost</label>
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">₱</span>
                  <input
                    v-model="modal.unitCost" type="number" min="0" step="1" placeholder="0"
                    class="w-full border border-slate-200 rounded-lg pl-7 pr-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div v-if="modal.mode !== 'restock'" class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Supplier</label>
                <input
                  v-model="modal.supplier" type="text" placeholder="Optional"
                  class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Low-stock Alert At</label>
                <input
                  v-model="modal.threshold" type="number" min="0" step="1" placeholder="3"
                  class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div v-if="modal.mode !== 'edit'">
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Purchase Date</label>
              <input
                v-model="modal.date" type="date"
                class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="closeModal"
                class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" :disabled="saving"
                class="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-sm">
                <Save :size="15" /> Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>
