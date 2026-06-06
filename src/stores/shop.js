import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, onSnapshot, addDoc, deleteDoc,
  updateDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

export const useShopStore = defineStore('shop', () => {
  const jobs      = ref([])
  const inventory = ref([])
  const purchases = ref([])
  const loading   = ref(true)

  const jobsQuery = query(collection(db, 'jobs'), orderBy('date', 'desc'))
  onSnapshot(
    jobsQuery,
    snapshot => {
      jobs.value    = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    },
    err => {
      console.error('Firestore error:', err)
      loading.value = false
    },
  )

  onSnapshot(
    query(collection(db, 'inventory'), orderBy('name')),
    snapshot => { inventory.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) },
    err => console.error('Inventory error:', err),
  )

  onSnapshot(
    query(collection(db, 'purchases'), orderBy('date', 'desc')),
    snapshot => { purchases.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) },
    err => console.error('Purchases error:', err),
  )

  function stockMap(parts) {
    const m = {}
    for (const p of parts || []) {
      if (p.stockId) m[p.stockId] = (m[p.stockId] || 0) + (Number(p.qty) || 1)
    }
    return m
  }

  async function reconcileStock(oldParts, newParts) {
    const before = stockMap(oldParts)
    const after  = stockMap(newParts)
    const ids    = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const id of ids) {
      const diff = (after[id] || 0) - (before[id] || 0)
      if (diff !== 0) await consumeStock(id, diff)
    }
  }

  async function consumeStock(id, qty) {
    const item = inventory.value.find(i => i.id === id)
    if (!item) return
    await updateDoc(doc(db, 'inventory', id), {
      qty:       Math.max(0, (item.qty || 0) - qty),
      updatedAt: new Date().toISOString(),
    })
  }

  async function addJob(jobData) {
    await addDoc(collection(db, 'jobs'), {
      ...jobData,
      createdAt: new Date().toISOString(),
    })
    await reconcileStock([], jobData.parts)
  }

  async function deleteJob(id) {
    const old = jobs.value.find(j => j.id === id)
    await deleteDoc(doc(db, 'jobs', id))
    if (old?.parts) await reconcileStock(old.parts, [])
  }

  async function updateJob(id, patch) {
    const old = jobs.value.find(j => j.id === id)
    await updateDoc(doc(db, 'jobs', id), patch)
    if (patch.parts !== undefined) await reconcileStock(old?.parts, patch.parts)
  }

  function jobDate(job) {
    return job.date || job.createdAt?.split('T')[0] || ''
  }

  function jobExpense(job) {
    return job.partsCost != null ? job.partsCost : (job.partsTotal || 0)
  }

  async function logPurchase({ itemId, name, qty, unitCost, date }) {
    await addDoc(collection(db, 'purchases'), {
      itemId:    itemId || null,
      name,
      qty,
      unitCost,
      total:     qty * unitCost,
      date:      date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    })
  }

  async function addInventory({ name, qty, unitCost, supplier, threshold, date }) {
    const ref = await addDoc(collection(db, 'inventory'), {
      name,
      qty,
      unitCost,
      supplier:  supplier || '',
      threshold: threshold ?? 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    if (qty > 0) await logPurchase({ itemId: ref.id, name, qty, unitCost, date })
    return ref.id
  }

  async function restockInventory(id, { qty, unitCost, date }) {
    const item = inventory.value.find(i => i.id === id)
    if (!item) return
    const cost = unitCost ?? item.unitCost
    await updateDoc(doc(db, 'inventory', id), {
      qty:       (item.qty || 0) + qty,
      unitCost:  cost,
      updatedAt: new Date().toISOString(),
    })
    await logPurchase({ itemId: id, name: item.name, qty, unitCost: cost, date })
  }

  async function updateInventory(id, patch) {
    await updateDoc(doc(db, 'inventory', id), {
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  async function deleteInventory(id) {
    await deleteDoc(doc(db, 'inventory', id))
  }

  return {
    jobs, inventory, purchases, loading,
    addJob, deleteJob, updateJob, jobDate, jobExpense,
    addInventory, restockInventory, updateInventory, deleteInventory,
  }
})
