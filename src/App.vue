<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import PresetPicker from './components/PresetPicker.vue'
import ImageUploader from './components/ImageUploader.vue'
import RankingBoard from './components/RankingBoard.vue'
import { exportRanking } from './composables/useRankingExport'
import { useRankingStore } from './stores/ranking'

const ranking = useRankingStore()

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
  if (ranking.step < 4) ranking.setStep((ranking.step + 1) as 2 | 3 | 4)
}

function previousStep() {
  if (ranking.step > 1) ranking.setStep((ranking.step - 1) as 1 | 2 | 3)
}

function updateTitle(title: string) {
  ranking.draft.title = title
  ranking.persist()
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
      <footer class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="primary-button" type="button" :disabled="!ranking.hasImages" @click="nextStep">下一步 <span>→</span></button></footer>
    </template>

    <template v-else>
      <section class="rank-toolbar">
        <div><span class="eyebrow">{{ ranking.step === 3 ? '拖动图片调整顺序' : '检查后导出图片' }}</span><h2>{{ ranking.selectedPreset.tag }} 排名</h2></div>
        <label class="ratio-picker">画布比例<select v-model="ranking.draft.aspectRatio" @change="ranking.persist"><option value="16:9">16 : 9</option><option value="3:4">3 : 4</option></select></label>
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
      <footer v-if="ranking.step === 3" class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="primary-button" type="button" :disabled="!ranking.canExport" @click="nextStep">下一步 <span>→</span></button></footer>
      <footer v-else class="step-footer"><button class="secondary-button" type="button" @click="previousStep">← 上一步</button><button class="primary-button" type="button" :disabled="!ranking.canExport" @click="exportImage">导出 PNG <span>↓</span></button></footer>
    </template>
  </main>
  <div v-else class="loading">正在加载你的本机草稿…</div>
</template>
