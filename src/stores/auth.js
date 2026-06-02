import { defineStore } from 'pinia'
import { ref } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const loading = ref(true)

  let _resolve
  const ready = new Promise(resolve => { _resolve = resolve })

  onAuthStateChanged(auth, u => {
    user.value    = u
    loading.value = false
    _resolve()
  })

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, loading, ready, login, logout }
})
