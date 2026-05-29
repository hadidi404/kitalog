<script setup>
defineProps({
  label: String,
  value: String,
  sub:  { type: String, default: '' },
  icon: { default: null }
})
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
    <div class="flex items-start justify-between mb-3">
      <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none pt-0.5">{{ label }}</p>
      <div v-if="icon" class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 -mt-0.5">
        <component :is="icon" :size="15" class="text-slate-400" />
      </div>
    </div>
    <p class="text-2xl md:text-3xl font-bold text-slate-900 leading-none tracking-tight">{{ value }}</p>
    <p v-if="sub" class="text-xs text-slate-400 mt-2 leading-snug">{{ sub }}</p>
  </div>
</template>
