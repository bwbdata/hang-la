export type WorkflowStep = 1 | 2 | 3 | 4 | 5
export type OutputRatio = '16:9' | '3:4'

export interface RankImage {
  id: string
  name: string
  blobKey: string
  previewUrl?: string
  createdAt: number
}

export interface RankTier {
  id: string
  name: string
  imageIds: string[]
}

export interface VoiceClip {
  imageId: string
  blobKey: string
  durationMs: number
  previewUrl?: string
}

export interface TierPreset {
  id: string
  tag: string
  tierNames: [string, string, string, string, string]
}

export interface RankingDraft {
  id: string
  title: string
  presetId: string
  aspectRatio: OutputRatio
  placementPauseMs: number
  tiers: RankTier[]
  images: Record<string, RankImage>
  voiceClips: Record<string, VoiceClip>
  introVoice?: VoiceClip
  outroVoice?: VoiceClip
  unassignedImageIds: string[]
  updatedAt: number
}

export const IMAGES_PER_ROW = 7
export const MAX_IMAGES_PER_TIER = 14
