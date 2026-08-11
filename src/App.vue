<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PresetPicker from './components/PresetPicker.vue'
import ImageUploader from './components/ImageUploader.vue'
import RankingBoard from './components/RankingBoard.vue'
import VideoExportPanel, { type VideoItem } from './components/VideoExportPanel.vue'
import { exportRanking } from './composables/useRankingExport'
import { exportRecapVideo } from './composables/useRecapVideo'
import { useRankingStore } from './stores/ranking'

const ranking = useRankingStore()
const videoGenerating = ref(false)
const videoProgress = ref('')
const videoItems = computed<VideoItem[]>(() => ranking.draft.tiers.flatMap((tier, tierIndex) => tier.imageIds.map((imageId, rankIndex) => ({ imageId, name: ranking.draft.images[imageId]?.name ?? '未知图片', url: ranking.draft.images[imageId]?.previewUrl, tierName: tier.name, tierIndex, rankIndex }))))
const allImagesHaveVoice = computed(() => {
  const imageIds = Object.keys(ranking.draft.images)
  return imageIds.length > 0 && imageIds.every((imageId) => Boolean(ranking.draft.voiceClips[imageId]))
})

onMounted(() => {
  void ranking.init()
  window.addEventListener('beforeunload', ranking.persist)
})

onUnmounted(() => window.removeEventListener('beforeunload', ranking.persist))

async function exportImage() {
  if (!ranking.canExport) return
  ranking.setStep(4)
  await exportRanking(ranking.draft.title)
}

async function clearDraft() {
  if (window.confirm('确定清空当前标题、图片和排名吗？此操作无法撤销。')) await ranking.reset()
}

function nextStep() {
  if (ranking.step < 5) ranking.setStep((ranking.step + 1) as 2 | 3 | 4 | 5)
}

function previousStep() {
  if (ranking.step > 1) ranking.setStep((ranking.step - 1) as 1 | 2 | 3 | 4)
}

function updateTitle(title: string) {
  ranking.draft.title = title
  ranking.persist()
}

async function exportVideo() {
  if (!videoItems.value.length) return
  videoGenerating.value = true
  try {
    const blob = await exportRecapVideo({ title: ranking.draft.title || '夯拉排名', ratio: ranking.draft.aspectRatio, tierNames: ranking.draft.tiers.map((tier) => tier.name), items: videoItems.value, voiceClips: ranking.draft.voiceClips, introVoice: ranking.draft.introVoice, outroVoice: ranking.draft.outroVoice, placementPauseMs: ranking.draft.placementPauseMs, onProgress: (message) => { videoProgress.value = message } })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${ranking.draft.title || '夯拉排名'}-回顾.webm`; link.click(); URL.revokeObjectURL(link.href)
  } finally {
    videoGenerating.value = false; videoProgress.value = ''
  }
}
</script>

<template>
  <main v-if="ranking.isReady" class="app-shell">
    <div class="fixed-top-area">
      <header class="topbar">
        <a class="brand" href="#" @click.prevent="ranking.setStep(1)">夯拉排名</a>
        <div class="save-state"><i :class="{ saving: ranking.isSaving }"></i>{{ ranking.isSaving ? '保存中' : '已保存' }}</div>
        <button class="text-button danger" type="button" @click="clearDraft">清空</button>
      </header>
    </div>

    <p v-if="ranking.error" class="notice">{{ ranking.error }}</p>

    <template v-if="ranking.step === 1">
      <PresetPicker :selected-id="ranking.draft.presetId" :title="ranking.draft.title" @select="ranking.applyPreset" @update-title="updateTitle" />
      <footer class="step-footer"><button class="primary-button" type="button" @click="nextStep">下一步：上传图片 <span>→</span></button></footer>
    </template>
    <template v-else-if="ranking.step === 2">
      <ImageUploader :images="ranking.draft.images" @files="ranking.uploadFiles" @remove="ranking.removeImage" />
      <footer class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="primary-button" type="button" :disabled="!ranking.hasImages" @click="nextStep">下一步：录制口播 <span>→</span></button></footer>
    </template>
    <template v-else-if="ranking.step === 3">
      <VideoExportPanel mode="record" :items="Object.values(ranking.draft.images).map((image) => ({ imageId: image.id, name: image.name, url: image.previewUrl, tierName: '' }))" :voice-clips="ranking.draft.voiceClips" :intro-voice="ranking.draft.introVoice" :outro-voice="ranking.draft.outroVoice" :ratio="ranking.draft.aspectRatio" :placement-pause-ms="ranking.draft.placementPauseMs" :generating="false" progress="" @save-voice="ranking.saveVoiceClip" @remove-voice="ranking.removeVoiceClip" @save-narration="ranking.saveNarration" @remove-narration="ranking.removeNarration" @update-ratio="ranking.draft.aspectRatio = $event; ranking.persist()" @update-pause="ranking.draft.placementPauseMs = $event; ranking.persist()" @export-video="exportVideo" />
      <footer class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="primary-button" type="button" @click="nextStep">{{ allImagesHaveVoice ? '下一步：开始排名' : '跳过口播，开始排名' }} <span>→</span></button></footer>
    </template>

    <template v-else>
      <section class="rank-toolbar">
        <div><span class="eyebrow">{{ ranking.step === 4 ? '拖动图片调整顺序' : '检查后导出图片' }}</span><h2>{{ ranking.selectedPreset.tag }} 排名</h2></div>
      </section>
      <RankingBoard
        :title="ranking.draft.title || '夯拉排名'"
        :preset-tag="ranking.selectedPreset.tag"
        :aspect-ratio="ranking.draft.aspectRatio"
        :tiers="ranking.draft.tiers"
        :images="ranking.draft.images"
        :unassigned="ranking.draft.unassignedImageIds"
        :can-move="ranking.canMove"
        @change="ranking.saveRanking"
        @rename="ranking.renameTier"
        @remove="ranking.removeImage"
      />
      <VideoExportPanel v-if="ranking.step === 5" mode="export" :items="videoItems" :voice-clips="ranking.draft.voiceClips" :intro-voice="ranking.draft.introVoice" :outro-voice="ranking.draft.outroVoice" :ratio="ranking.draft.aspectRatio" :placement-pause-ms="ranking.draft.placementPauseMs" :generating="videoGenerating" :progress="videoProgress" @save-voice="ranking.saveVoiceClip" @remove-voice="ranking.removeVoiceClip" @save-narration="ranking.saveNarration" @remove-narration="ranking.removeNarration" @update-ratio="ranking.draft.aspectRatio = $event; ranking.persist()" @update-pause="ranking.draft.placementPauseMs = $event; ranking.persist()" @export-video="exportVideo" />
      <footer v-if="ranking.step === 4" class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="primary-button" type="button" :disabled="!ranking.canExport" @click="nextStep">下一步：导出视频 <span>→</span></button></footer>
      <footer v-else class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="secondary-button" type="button" :disabled="!ranking.canExport" @click="exportImage">导出 PNG</button><button class="primary-button" type="button" :disabled="videoGenerating || !ranking.canExport" @click="exportVideo">{{ videoGenerating ? videoProgress : '导出 WebM 视频' }} <span>↓</span></button></footer>
    </template>
  </main>
  <div v-else class="loading">正在加载你的本机草稿…</div>
</template>
