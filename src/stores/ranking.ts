import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { TIER_PRESETS } from '../data/presets'
import { clearStorage, deleteImage, deleteVoice, loadDraft, loadImage, loadVoice, saveDraft, saveImage, saveVoice } from '../services/storage'
import { type RankTier, type RankingDraft, type WorkflowStep } from '../types/ranking'

const uid = () => crypto.randomUUID()

function makeDraft(): RankingDraft {
  const preset = TIER_PRESETS[0]
  return {
    id: uid(),
    title: '',
    presetId: preset.id,
    aspectRatio: '16:9',
    placementPauseMs: 1500,
    tiers: preset.tierNames.map((name) => ({ id: uid(), name, imageIds: [] })),
    images: {},
    voiceClips: {},
    unassignedImageIds: [],
    updatedAt: Date.now(),
  }
}

export const useRankingStore = defineStore('ranking', () => {
  const draft = reactive<RankingDraft>(makeDraft())
  const step = ref<WorkflowStep>(1)
  const isReady = ref(false)
  const isSaving = ref(false)
  const error = ref('')
  let saveTimer: number | undefined

  const selectedPreset = computed(() => TIER_PRESETS.find((item) => item.id === draft.presetId) ?? TIER_PRESETS[0])
  const hasImages = computed(() => Object.keys(draft.images).length > 0)
  const canExport = computed(() => draft.tiers.some((tier) => tier.imageIds.length > 0))

  function replaceDraft(value: RankingDraft) {
    Object.keys(draft).forEach((key) => {
      if (!(key in value)) delete (draft as Record<string, unknown>)[key]
    })
    Object.assign(draft, value)
  }

  async function hydratePreviews() {
    await Promise.all(Object.values(draft.images).map(async (image) => {
      const blob = await loadImage(image.blobKey)
      if (blob) image.previewUrl = URL.createObjectURL(blob)
    }))
    await Promise.all(Object.values(draft.voiceClips).map(async (clip) => {
      const blob = await loadVoice(clip.blobKey)
      if (blob) clip.previewUrl = URL.createObjectURL(blob)
    }))
    for (const clip of [draft.introVoice, draft.outroVoice]) {
      if (!clip) continue
      const blob = await loadVoice(clip.blobKey)
      if (blob) clip.previewUrl = URL.createObjectURL(blob)
    }
  }

  async function init() {
    const stored = await loadDraft()
    if (stored) replaceDraft({ ...stored, aspectRatio: stored.aspectRatio ?? '16:9', placementPauseMs: stored.placementPauseMs ?? 1500, voiceClips: stored.voiceClips ?? {} })
    await hydratePreviews()
    isReady.value = true
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => void persist(), 350)
  }

  async function persist() {
    isSaving.value = true
    draft.updatedAt = Date.now()
    try {
      await saveDraft(draft)
    } finally {
      isSaving.value = false
    }
  }

  function setStep(next: WorkflowStep) {
    if (next === 2 && !draft.presetId) return
    if (next >= 3 && !hasImages.value) return
    step.value = next
  }

  function applyPreset(presetId: string) {
    const preset = TIER_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    draft.presetId = preset.id
    draft.tiers.forEach((tier, index) => { tier.name = preset.tierNames[index] })
    scheduleSave()
  }

  async function uploadFiles(files: File[]) {
    error.value = ''
    const valid = files.filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024)
    if (valid.length !== files.length) error.value = '已跳过非图片或超过 10MB 的文件。'
    for (const file of valid) {
      const id = uid()
      await saveImage(id, file)
      draft.images[id] = { id, name: file.name, blobKey: id, previewUrl: URL.createObjectURL(file), createdAt: Date.now() }
      draft.unassignedImageIds.push(id)
    }
    if (valid.length) {
      scheduleSave()
    }
  }

  function tierById(id: string) { return draft.tiers.find((tier) => tier.id === id) }

  function canMove(toTierId: string, fromTierId?: string) {
    void fromTierId
    return Boolean(tierById(toTierId))
  }

  function saveRanking() { scheduleSave() }

  function unassignImage(id: string) {
    if (!draft.images[id]) return
    draft.tiers.forEach((tier) => { tier.imageIds = tier.imageIds.filter((imageId) => imageId !== id) })
    if (!draft.unassignedImageIds.includes(id)) draft.unassignedImageIds.push(id)
    scheduleSave()
  }

  function renameTier(tier: RankTier, name: string) {
    tier.name = name.trim() || '未命名等级'
    scheduleSave()
  }

  async function removeImage(id: string) {
    Object.values(draft.images).forEach((image) => { if (image.id === id && image.previewUrl) URL.revokeObjectURL(image.previewUrl) })
    draft.tiers.forEach((tier) => { tier.imageIds = tier.imageIds.filter((imageId) => imageId !== id) })
    draft.unassignedImageIds = draft.unassignedImageIds.filter((imageId) => imageId !== id)
    delete draft.images[id]
    await deleteImage(id)
    if (draft.voiceClips[id]) {
      URL.revokeObjectURL(draft.voiceClips[id].previewUrl ?? '')
      delete draft.voiceClips[id]
      await deleteVoice(id)
    }
    scheduleSave()
  }

  async function saveVoiceClip(imageId: string, blob: Blob, durationMs: number) {
    const previous = draft.voiceClips[imageId]
    if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl)
    await saveVoice(imageId, blob)
    draft.voiceClips[imageId] = { imageId, blobKey: imageId, durationMs, previewUrl: URL.createObjectURL(blob) }
    scheduleSave()
  }

  async function removeVoiceClip(imageId: string) {
    const clip = draft.voiceClips[imageId]
    if (!clip) return
    if (clip.previewUrl) URL.revokeObjectURL(clip.previewUrl)
    delete draft.voiceClips[imageId]
    await deleteVoice(imageId)
    scheduleSave()
  }

  async function saveNarration(kind: 'intro' | 'outro', blob: Blob, durationMs: number) {
    const key = `__${kind}__`
    const current = kind === 'intro' ? draft.introVoice : draft.outroVoice
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
    await saveVoice(key, blob)
    const clip = { imageId: key, blobKey: key, durationMs, previewUrl: URL.createObjectURL(blob) }
    if (kind === 'intro') draft.introVoice = clip; else draft.outroVoice = clip
    scheduleSave()
  }

  async function removeNarration(kind: 'intro' | 'outro') {
    const clip = kind === 'intro' ? draft.introVoice : draft.outroVoice
    if (!clip) return
    if (clip.previewUrl) URL.revokeObjectURL(clip.previewUrl)
    if (kind === 'intro') delete draft.introVoice; else delete draft.outroVoice
    await deleteVoice(`__${kind}__`)
    scheduleSave()
  }

  async function reset() {
    Object.values(draft.images).forEach((image) => image.previewUrl && URL.revokeObjectURL(image.previewUrl))
    Object.values(draft.voiceClips).forEach((clip) => clip.previewUrl && URL.revokeObjectURL(clip.previewUrl))
    for (const clip of [draft.introVoice, draft.outroVoice]) if (clip?.previewUrl) URL.revokeObjectURL(clip.previewUrl)
    await clearStorage()
    replaceDraft(makeDraft())
    step.value = 1
  }

  return { draft, step, isReady, isSaving, error, selectedPreset, hasImages, canExport, init, setStep, applyPreset, uploadFiles, canMove, saveRanking, unassignImage, renameTier, removeImage, saveVoiceClip, removeVoiceClip, saveNarration, removeNarration, reset, persist }
})
