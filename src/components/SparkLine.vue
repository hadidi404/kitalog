<script setup>
import { computed } from 'vue'

const props = defineProps({
  data:  { type: Array,  default: () => [] },
  color: { type: String, default: '#22c55e' },
})

const W = 72
const H = 28

const gradId = computed(() => `sg-${props.color.replace(/[^a-z0-9]/gi, '')}`)

const pts = computed(() => {
  const d = props.data
  if (d.length < 2) return []
  const min = Math.min(...d)
  const max = Math.max(...d)
  const range = (max - min) || 1
  return d.map((v, i) => ({
    x: (i / (d.length - 1)) * W,
    y: H - 4 - ((v - min) / range) * (H - 10),
  }))
})

const linePath = computed(() => {
  if (!pts.value.length) return ''
  return 'M ' + pts.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
})

const areaPath = computed(() => {
  if (!pts.value.length) return ''
  const first = pts.value[0].x
  const last  = pts.value[pts.value.length - 1].x
  return `M ${first},${H} L ` +
    pts.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ') +
    ` L ${last},${H} Z`
})
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-full" preserveAspectRatio="none">
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   :stop-color="color" stop-opacity="0.18" />
        <stop offset="100%" :stop-color="color" stop-opacity="0"    />
      </linearGradient>
    </defs>
    <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradId})`" />
    <path v-if="linePath" :d="linePath" fill="none" :stroke="color"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
