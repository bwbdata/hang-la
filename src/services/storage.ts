import { openDB } from 'idb'
import type { RankingDraft } from '../types/ranking'

const DB_NAME = 'hang-la-ranking'
const DRAFT_KEY = 'current-draft'

const dbPromise = openDB(DB_NAME, 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts')
    if (!db.objectStoreNames.contains('images')) db.createObjectStore('images')
    if (!db.objectStoreNames.contains('voices')) db.createObjectStore('voices')
  },
})

export async function loadDraft(): Promise<RankingDraft | undefined> {
  return (await dbPromise).get('drafts', DRAFT_KEY)
}

export async function saveDraft(draft: RankingDraft): Promise<void> {
  // `draft` is a Vue reactive Proxy. IndexedDB/structuredClone cannot persist
  // Proxies, so build a plain snapshot and deliberately leave out object URLs.
  const withoutPreview = <T extends { previewUrl?: string }>(value: T | undefined) => {
    if (!value) return undefined
    const { previewUrl: _previewUrl, ...persistable } = value
    return persistable
  }
  const persistable: RankingDraft = {
    ...draft,
    tiers: draft.tiers.map((tier) => ({ ...tier, imageIds: [...tier.imageIds] })),
    images: Object.fromEntries(Object.entries(draft.images).map(([id, image]) => [id, withoutPreview(image)!])),
    voiceClips: Object.fromEntries(Object.entries(draft.voiceClips).map(([id, clip]) => [id, withoutPreview(clip)!])),
    introVoice: withoutPreview(draft.introVoice),
    outroVoice: withoutPreview(draft.outroVoice),
    unassignedImageIds: [...draft.unassignedImageIds],
  }
  await (await dbPromise).put('drafts', persistable, DRAFT_KEY)
}

export async function saveImage(id: string, file: File): Promise<void> {
  await (await dbPromise).put('images', file, id)
}

export async function loadImage(id: string): Promise<Blob | undefined> {
  return (await dbPromise).get('images', id)
}

export async function deleteImage(id: string): Promise<void> {
  await (await dbPromise).delete('images', id)
}

export async function saveVoice(id: string, blob: Blob): Promise<void> {
  await (await dbPromise).put('voices', blob, id)
}

export async function loadVoice(id: string): Promise<Blob | undefined> {
  return (await dbPromise).get('voices', id)
}

export async function deleteVoice(id: string): Promise<void> {
  await (await dbPromise).delete('voices', id)
}

export async function clearStorage(): Promise<void> {
  const db = await dbPromise
  await db.clear('drafts')
  await db.clear('images')
  await db.clear('voices')
}
