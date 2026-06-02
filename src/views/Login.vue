<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router  = useRouter()
const auth    = useAuthStore()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch {
    error.value = 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

      <div class="flex items-center mb-8">
        <img src="/icon.png" alt="KitaLog" class="w-15 h-10 shrink-0" />
        <div>
          <p class="text-lg font-extrabold text-slate-900 tracking-tight leading-none">KitaLog</p>
          <p class="text-xs text-slate-400 mt-0.5">Repair Shop Manager</p>
        </div>
      </div>

      <h1 class="text-base font-bold text-slate-900 mb-1">Sign in</h1>
      <p class="text-sm text-slate-500 mb-6">Enter your credentials to continue.</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-slate-600 mb-1.5 block">Email</label>
          <input
            v-model="email" type="email" placeholder="you@example.com" required autocomplete="email"
            class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <div>
          <label class="text-xs font-semibold text-slate-600 mb-1.5 block">Password</label>
          <input
            v-model="password" type="password" placeholder="••••••••" required autocomplete="current-password"
            class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

        <button
          type="submit" :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

    </div>
  </div>
</template>
