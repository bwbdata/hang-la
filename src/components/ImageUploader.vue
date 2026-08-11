<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ files: [files: File[]] }>()
const input = ref<HTMLInputElement>()
const dragging = ref(false)

function selectFiles(files: FileList | null) {
  if (files?.length) emit('files', [...files])
  if (input.value) input.value.value = ''
}
</script>

<template>
  <section class="step-panel upload-panel">
    <div class="panel-heading">
      <span class="eyebrow">STEP 02</span>
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
</template>
