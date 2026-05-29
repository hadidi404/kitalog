import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, onSnapshot, addDoc, deleteDoc,
  updateDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

export const useShopStore = defineStore('shop', () => {
  const jobs    = ref([])
  const loading = ref(true)

  const q = query(collection(db, 'jobs'), orderBy('date', 'desc'))
  onSnapshot(
    q,
    snapshot => {
      jobs.value    = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    },
    err => {
      console.error('Firestore error:', err)
      loading.value = false
    },
  )

  async function addJob(jobData) {
    await addDoc(collection(db, 'jobs'), {
      ...jobData,
      createdAt: new Date().toISOString(),
    })
  }

  async function deleteJob(id) {
    await deleteDoc(doc(db, 'jobs', id))
  }

  async function updateJob(id, patch) {
    await updateDoc(doc(db, 'jobs', id), patch)
  }

  function jobDate(job) {
    return job.date || job.createdAt?.split('T')[0] || ''
  }

  return { jobs, loading, addJob, deleteJob, updateJob, jobDate }
})
