<script setup lang="ts">
defineProps<{ url?: string; name: string; index?: number; removable?: boolean }>()
const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <article class="rank-card">
    <img v-if="url" :src="url" :alt="name" draggable="false" />
    <div v-else class="missing-image">图片丢失</div>
    <span v-if="index" class="rank-index">{{ String(index).padStart(2, '0') }}</span>
    <button v-if="removable" type="button" class="remove-image" :aria-label="`删除 ${name}`" @click.stop="emit('remove')">×</button>
    <small>{{ name }}</small>
  </article>
</template>
