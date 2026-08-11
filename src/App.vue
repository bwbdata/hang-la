<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import PresetPicker from './components/PresetPicker.vue'
import ImageUploader from './components/ImageUploader.vue'
import RankingBoard from './components/RankingBoard.vue'
import VideoExportPanel, { type VideoItem } from './components/VideoExportPanel.vue'
import AboutPage from './components/AboutPage.vue'
import DraftActions from './components/DraftActions.vue'
import { exportRanking } from './composables/useRankingExport'
import { exportRecapVideo } from './composables/useRecapVideo'
import { useRankingStore } from './stores/ranking'

const ranking = useRankingStore()
const videoGenerating = ref(false)
const videoProgress = ref('')
const pngGenerating = ref(false)
const toast = ref('')
let toastTimer: number | undefined
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
  if (!ranking.canExport || pngGenerating.value) return
  pngGenerating.value = true
  const initialStep = ranking.step
  try {
    if (initialStep !== 4) {
      ranking.setStep(4)
      await nextTick()
    }
    await exportRanking(ranking.draft.title)
    showToast('PNG 已开始下载')
  } catch (error) {
    ranking.error = error instanceof Error ? error.message : 'PNG 导出失败，请重试。'
  } finally {
    if (initialStep !== 4) ranking.setStep(initialStep)
    pngGenerating.value = false
  }
}

async function clearDraft() {
  if (window.confirm('确定清空当前标题、图片和排名吗？此操作无法撤销。')) await ranking.reset()
}

function nextStep() {
  if (ranking.step < 5) ranking.setStep((ranking.step + 1) as 2 | 3 | 4 | 5)
}

function previousStep() {
  if (ranking.step > 1) ranking.setStep((ranking.step - 1) as 1 | 2 | 3 | 4 | 5)
}

function updateTitle(title: string) {
  ranking.draft.title = title
  ranking.persist()
}

function download(blob: Blob, suffix: string) {
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${ranking.draft.title || '夯拉排名'}-回顾.${suffix}`; link.click(); window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

function showToast(message: string) {
  window.clearTimeout(toastTimer)
  toast.value = message
  toastTimer = window.setTimeout(() => { toast.value = '' }, 2600)
}

async function renderWebm() {
  return exportRecapVideo({ title: ranking.draft.title || '夯拉排名', ratio: ranking.draft.aspectRatio, tierNames: ranking.draft.tiers.map((tier) => tier.name), items: videoItems.value, voiceClips: ranking.draft.voiceClips, introVoice: ranking.draft.introVoice, outroVoice: ranking.draft.outroVoice, placementPauseMs: ranking.draft.placementPauseMs, onProgress: (message) => { videoProgress.value = message } })
}

async function exportVideo() {
  if (!videoItems.value.length) return
  videoGenerating.value = true
  try { download(await renderWebm(), 'webm'); showToast('WebM 视频已开始下载') } catch (error) { ranking.error = error instanceof Error ? error.message : 'WebM 导出失败，请重试。' } finally { videoGenerating.value = false; videoProgress.value = '' }
}

</script>

<template>
  <main v-if="ranking.isReady" class="app-shell">
    <div class="fixed-top-area">
      <header class="topbar">
        <a class="brand" href="#" @click.prevent="ranking.setStep(1)">夯拉排名</a>
        <button class="text-button about-link" type="button" @click="ranking.setStep(6)">关于</button>
      </header>
    </div>

    <p v-if="ranking.error" class="notice">{{ ranking.error }}</p>
    <Transition name="toast"><div v-if="toast" class="export-toast">{{ toast }}</div></Transition>

    <template v-if="ranking.step === 1">
      <PresetPicker :selected-id="ranking.draft.presetId" :title="ranking.draft.title" @select="ranking.applyPreset" @update-title="updateTitle" />
      <footer class="step-footer"><DraftActions :saving="ranking.isSaving" @clear="clearDraft" /><button class="primary-button" type="button" @click="nextStep">下一步：上传图片 <span>→</span></button></footer>
    </template>
    <template v-else-if="ranking.step === 2">
      <ImageUploader :images="ranking.draft.images" @files="ranking.uploadFiles" @remove="ranking.removeImage" />
      <footer class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><DraftActions :saving="ranking.isSaving" @clear="clearDraft" /><button class="primary-button" type="button" :disabled="!ranking.hasImages" @click="nextStep">下一步：录制口播 <span>→</span></button></footer>
    </template>
    <template v-else-if="ranking.step === 3">
      <VideoExportPanel mode="record" :items="Object.values(ranking.draft.images).map((image) => ({ imageId: image.id, name: image.name, url: image.previewUrl, tierName: '' }))" :voice-clips="ranking.draft.voiceClips" :intro-voice="ranking.draft.introVoice" :outro-voice="ranking.draft.outroVoice" :ratio="ranking.draft.aspectRatio" :placement-pause-ms="ranking.draft.placementPauseMs" :generating="false" progress="" @save-voice="ranking.saveVoiceClip" @remove-voice="ranking.removeVoiceClip" @save-narration="ranking.saveNarration" @remove-narration="ranking.removeNarration" @update-ratio="ranking.draft.aspectRatio = $event; ranking.persist()" @update-pause="ranking.draft.placementPauseMs = $event; ranking.persist()" @export-video="exportVideo" />
      <footer class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><DraftActions :saving="ranking.isSaving" @clear="clearDraft" /><button class="primary-button" type="button" @click="nextStep">{{ allImagesHaveVoice ? '下一步：开始排名' : '跳过口播，开始排名' }} <span>→</span></button></footer>
    </template>

    <template v-else-if="ranking.step === 4">
      <RankingBoard
        :title="ranking.draft.title || '夯拉排名'"
        :aspect-ratio="ranking.draft.aspectRatio"
        :tiers="ranking.draft.tiers"
        :images="ranking.draft.images"
        :unassigned="ranking.draft.unassignedImageIds"
        :can-move="ranking.canMove"
        @change="ranking.saveRanking"
        @rename="ranking.renameTier"
        @remove="ranking.unassignImage"
      />
      <footer class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="secondary-button" type="button" :disabled="!ranking.canExport || pngGenerating" @click="exportImage">{{ pngGenerating ? '正在生成 PNG…' : '导出 PNG' }}</button><DraftActions :saving="ranking.isSaving" @clear="clearDraft" /><button class="primary-button" type="button" :disabled="!ranking.canExport" @click="nextStep">下一步：导出视频 <span>→</span></button></footer>
    </template>
    <template v-else-if="ranking.step === 5">
      <VideoExportPanel mode="export" :items="videoItems" :voice-clips="ranking.draft.voiceClips" :intro-voice="ranking.draft.introVoice" :outro-voice="ranking.draft.outroVoice" :ratio="ranking.draft.aspectRatio" :placement-pause-ms="ranking.draft.placementPauseMs" :generating="videoGenerating" :progress="videoProgress" @save-voice="ranking.saveVoiceClip" @remove-voice="ranking.removeVoiceClip" @save-narration="ranking.saveNarration" @remove-narration="ranking.removeNarration" @update-ratio="ranking.draft.aspectRatio = $event; ranking.persist()" @update-pause="ranking.draft.placementPauseMs = $event; ranking.persist()" @export-video="exportVideo" />
      <footer class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 返回排名</button><DraftActions :saving="ranking.isSaving" @clear="clearDraft" /></footer>
    </template>
    <template v-else>
      <AboutPage />
      <footer class="step-footer"><button class="secondary-button" type="button" @click="ranking.setStep(1)">← 返回首页</button><DraftActions :saving="ranking.isSaving" @clear="clearDraft" /></footer>
    </template>
  </main>
  <div v-else class="loading">正在加载你的本机草稿…</div>
</template>
