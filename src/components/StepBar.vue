<script setup lang="ts">
import type { WorkflowStep } from '../types/ranking'

defineProps<{ current: WorkflowStep; hasImages: boolean }>()
const emit = defineEmits<{ choose: [step: WorkflowStep] }>()
const steps: { id: WorkflowStep; label: string; hint: string }[] = [
  { id: 1, label: '选择标签类型', hint: '挑一套等级' },
  { id: 2, label: '上传图片', hint: '添加本地图片' },
  { id: 3, label: '拖动排名', hint: '排出你的顺序' },
  { id: 4, label: '导出图片', hint: '保存排名长图' },
]

</script>

<template>
  <nav class="step-bar" aria-label="制作步骤">
    <button
      v-for="item in steps"
      :key="item.id"
      class="step-item"
      :class="{ active: current === item.id, complete: current > item.id }"
      type="button"
      @click="emit('choose', item.id)"
    >
      <span class="step-number">{{ item.id }}</span>
      <span><b>{{ item.label }}</b><small>{{ item.hint }}</small></span>
    </button>
  </nav>
</template>
