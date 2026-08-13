<script setup lang="ts">
import { ref } from 'vue'
import type { RankImage } from '../types/ranking'
import RankCard from './RankCard.vue'

defineProps<{ images: Record<string, RankImage> }>()
const emit = defineEmits<{ files: [files: File[]]; remove: [id: string] }>()
const input = ref<HTMLInputElement>()
const dragging = ref(false)

function selectFiles(files: FileList | null) {
  if (files?.length) emit('files', [...files])
  if (input.value) input.value.value = ''
}
</script>

<template>
  <div class="upload-step">
    <section class="step-panel upload-panel">
      <div class="panel-heading">
        <span class="eyebrow">上传图片</span>
        <h2>上传要排名的图片</h2>
        <p>支持批量添加 JPG、PNG、WebP，单张不超过 10MB。</p>
      </div>
      <label
        class="upload-dropzone"
        :class="{ dragging }"
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="dragging = false; selectFiles($event.dataTransfer?.files ?? null)"
      >
        <input ref="input" type="file" accept="image/png,image/jpeg,image/webp" multiple @change="selectFiles(($event.target as HTMLInputElement).files)" />
        <span class="upload-symbol">＋</span>
        <b>拖入图片，或点击选择文件</b>
        <small>图片只保存在这台设备的浏览器中</small>
      </label>
    </section>

    <section class="step-panel uploaded-preview">
      <div class="preview-heading"><div><span class="eyebrow">已上传图片</span><h2>图片预览</h2></div><b>{{ Object.keys(images).length }} 张</b></div>
      <div v-if="Object.keys(images).length" class="uploaded-grid">
        <RankCard v-for="image in Object.values(images)" :key="image.id" :url="image.previewUrl" :name="image.name.replace(/\.[^/.]+$/, '')" removable @remove="emit('remove', image.id)" />
      </div>
      <div v-else class="uploaded-grid uploaded-placeholder-grid">
        <div v-for="index in 7" :key="index" class="uploaded-placeholder"><span>＋</span><small>待上传</small></div>
      </div>
    </section>
  </div>
</template>
