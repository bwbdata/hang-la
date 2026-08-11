<script setup lang="ts">
import { computed, ref } from 'vue'
import type { VoiceClip } from '../types/ranking'
import VoiceRecorder from './VoiceRecorder.vue'

export interface VideoItem { imageId: string; name: string; url?: string; tierName: string; tierIndex?: number; rankIndex?: number }

const props = defineProps<{ mode: 'record' | 'export'; items: VideoItem[]; voiceClips: Record<string, VoiceClip>; generating: boolean; progress: string }>()
const emit = defineEmits<{ saveVoice: [imageId: string, blob: Blob, durationMs: number]; removeVoice: [imageId: string]; exportVideo: [] }>()
const selectedImageId = ref('')
const previewOpen = ref(false)
const selectedItem = computed(() => props.items.find((item) => item.imageId === selectedImageId.value) ?? props.items[0])
function openPreview(imageId: string) { selectedImageId.value = imageId; previewOpen.value = true }
</script>

<template>
  <section class="video-panel">
    <div class="video-panel-heading"><div><span class="eyebrow">{{ mode === 'record' ? '录制口播' : '回顾视频' }}</span><h2>{{ mode === 'record' ? '逐张添加口播解说' : '导出排名回顾视频' }}</h2><p>{{ mode === 'record' ? '录音会和对应图片绑定，后续排名时也会一直保留。' : '按最终排名顺序依次展示图片和口播，最后播放完整排名。' }}</p></div><button v-if="mode === 'export'" type="button" class="primary-button" :disabled="generating || !items.length" @click="emit('exportVideo')">{{ generating ? progress : '导出 WebM 视频' }}</button></div>
    <div v-if="items.length" class="video-record-layout" :class="{ exporting: mode === 'export' }">
      <div class="video-item-list">
        <article v-for="(item, index) in items" :key="item.imageId" class="video-item" :class="{ selected: item.imageId === selectedItem?.imageId }" @click="openPreview(item.imageId)"><span class="video-order">{{ index + 1 }}</span><img v-if="item.url" :src="item.url" :alt="item.name" /><div class="video-item-meta"><b>{{ item.name }}</b><small>{{ mode === 'record' ? '点击预览并录制口播' : item.tierName }}</small></div><VoiceRecorder v-if="mode === 'record'" :clip="voiceClips[item.imageId]" @click.stop @save="emit('saveVoice', item.imageId, $event.blob, $event.durationMs)" @remove="emit('removeVoice', item.imageId)" /><span v-else class="voice-status" :class="{ ready: voiceClips[item.imageId] }">{{ voiceClips[item.imageId] ? '已配口播' : '无口播' }}</span></article>
      </div>
    </div>
    <p v-else class="video-empty">请先把至少一张图片拖入等级，再制作视频。</p>
    <Teleport to="body"><div v-if="previewOpen && selectedItem" class="image-preview-modal" @click.self="previewOpen = false"><div class="image-preview-dialog"><button type="button" aria-label="关闭预览" @click="previewOpen = false">×</button><span>图片预览</span><b>{{ selectedItem.name }}</b><img v-if="selectedItem.url" :src="selectedItem.url" :alt="selectedItem.name" /></div></div></Teleport>
  </section>
</template>
