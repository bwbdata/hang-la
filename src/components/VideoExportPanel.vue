<script setup lang="ts">
import { computed, ref } from 'vue'
import type { OutputRatio, VoiceClip } from '../types/ranking'
import VoiceRecorder from './VoiceRecorder.vue'

export interface VideoItem { imageId: string; name: string; url?: string; tierName: string; tierIndex?: number; rankIndex?: number }

const props = defineProps<{ mode: 'record' | 'export'; items: VideoItem[]; voiceClips: Record<string, VoiceClip>; introVoice?: VoiceClip; outroVoice?: VoiceClip; ratio: OutputRatio; format: 'webm' | 'mp4'; placementPauseMs: number; generating: boolean; progress: string }>()
const emit = defineEmits<{ saveVoice: [imageId: string, blob: Blob, durationMs: number]; removeVoice: [imageId: string]; saveNarration: [kind: 'intro' | 'outro', blob: Blob, durationMs: number]; removeNarration: [kind: 'intro' | 'outro']; updateRatio: [value: OutputRatio]; updateFormat: [value: 'webm' | 'mp4']; updatePause: [value: number]; exportVideo: []; exportMp4: [] }>()
const selectedImageId = ref('')
const previewOpen = ref(false)
const selectedItem = computed(() => props.items.find((item) => item.imageId === selectedImageId.value) ?? props.items[0])
function openPreview(imageId: string) { selectedImageId.value = imageId; previewOpen.value = true }
</script>

<template>
  <section class="video-panel">
    <div class="video-panel-heading"><div><span class="eyebrow">{{ mode === 'record' ? '录制口播' : '回顾视频' }}</span><h2>{{ mode === 'record' ? '逐张添加口播解说' : '导出排名回顾视频' }}</h2><p>{{ mode === 'record' ? '录音会和对应图片绑定，后续排名时也会一直保留。' : '可在此页补录或修改片头、片尾及每张图片的口播，再直接导出。' }}</p></div></div>
    <div class="narration-recorders"><article><div><b>片头口播</b><small>背景为尚未放入图片的空榜单</small></div><VoiceRecorder :clip="introVoice" @save="emit('saveNarration', 'intro', $event.blob, $event.durationMs)" @remove="emit('removeNarration', 'intro')" /></article><article><div><b>片尾口播</b><small>背景为全部图片放入后的最终榜单</small></div><VoiceRecorder :clip="outroVoice" @save="emit('saveNarration', 'outro', $event.blob, $event.durationMs)" @remove="emit('removeNarration', 'outro')" /></article></div>
    <div v-if="items.length" class="video-record-layout" :class="{ exporting: mode === 'export' }">
      <div class="video-item-list">
        <article v-for="(item, index) in items" :key="item.imageId" class="video-item" :class="{ selected: item.imageId === selectedItem?.imageId }" @click="openPreview(item.imageId)"><span class="video-order">{{ index + 1 }}</span><img v-if="item.url" :src="item.url" :alt="item.name" /><div class="video-item-meta"><b>{{ item.name }}</b><small>{{ mode === 'record' ? '点击预览并录制口播' : `${item.tierName} · 可补录或重录口播` }}</small></div><VoiceRecorder :clip="voiceClips[item.imageId]" @click.stop @save="emit('saveVoice', item.imageId, $event.blob, $event.durationMs)" @remove="emit('removeVoice', item.imageId)" /></article>
      </div>
    </div>
    <p v-else class="video-empty">请先把至少一张图片拖入等级，再制作视频。</p>
    <div v-if="mode === 'export'" class="export-video-footer"><div class="export-video-controls"><label>画布比例<select :value="ratio" @change="emit('updateRatio', ($event.target as HTMLSelectElement).value as OutputRatio)"><option value="16:9">16 : 9</option><option value="3:4">3 : 4</option></select></label><label>放入后停留<select :value="placementPauseMs / 1000" @change="emit('updatePause', Number(($event.target as HTMLSelectElement).value) * 1000)"><option :value="0">不停止</option><option :value="1">1 秒</option><option :value="1.5">1.5 秒</option><option :value="2">2 秒</option><option :value="3">3 秒</option></select></label><label>视频格式<select :value="format" @change="emit('updateFormat', ($event.target as HTMLSelectElement).value as 'webm' | 'mp4')"><option value="webm">WebM（推荐）</option><option value="mp4">MP4（首次约加载 30MB）</option></select></label></div><div><small>WebM 直接由浏览器生成；MP4 需额外加载约 30MB 本地转换引擎。</small><button type="button" class="primary-button" :disabled="generating || !items.length" @click="format === 'mp4' ? emit('exportMp4') : emit('exportVideo')">{{ generating ? progress : `导出 ${format.toUpperCase()} 视频` }}</button></div></div>
    <Teleport to="body"><div v-if="previewOpen && selectedItem" class="image-preview-modal" @click.self="previewOpen = false"><div class="image-preview-dialog"><button type="button" aria-label="关闭预览" @click="previewOpen = false">×</button><span>图片预览</span><b>{{ selectedItem.name }}</b><img v-if="selectedItem.url" :src="selectedItem.url" :alt="selectedItem.name" /></div></div></Teleport>
  </section>
</template>
