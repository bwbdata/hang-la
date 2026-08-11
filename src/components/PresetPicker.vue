<script setup lang="ts">
import { ref } from 'vue'
import { TIER_PRESETS } from '../data/presets'

defineProps<{ selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const keyword = ref('')

const filtered = () => TIER_PRESETS.filter((preset) =>
  `${preset.tag} ${preset.tierNames.join(' ')}`.toLowerCase().includes(keyword.value.toLowerCase()),
)
</script>

<template>
  <section class="step-panel preset-panel">
    <div class="panel-heading">
      <span class="eyebrow">STEP 01</span>
      <h2>先选一个标签类型</h2>
      <p>每套都是五档固定排序，选中后也能按你的语气改名字。</p>
    </div>
    <label class="search-box"><span>⌕</span><input v-model="keyword" placeholder="搜索标签或等级名称" /></label>
    <div class="preset-list">
      <button
        v-for="preset in filtered()"
        :key="preset.id"
        class="preset-card"
        :class="{ selected: preset.id === selectedId }"
        type="button"
        @click="emit('select', preset.id)"
      >
        <strong># {{ preset.tag }}</strong>
        <div class="preset-tiers"><span v-for="name in preset.tierNames" :key="name">{{ name }}</span></div>
        <b class="preset-select">{{ preset.id === selectedId ? '已选' : '选择' }}</b>
      </button>
    </div>
  </section>
</template>
