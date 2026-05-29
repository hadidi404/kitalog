<script setup>
defineProps({
  status: String
})
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
    :class="{
      'bg-amber-100 text-amber-800': status === 'Pending',
      'bg-blue-100 text-blue-800': status === 'In Progress',
      'bg-green-100 text-green-800': status === 'Done'
    }"
  >
    {{ status }}
  </span>
</template>
