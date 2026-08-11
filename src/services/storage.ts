import { openDB } from 'idb'
import type { RankingDraft } from '../types/ranking'

const DB_NAME = 'hang-la-ranking'
const DRAFT_KEY = 'current-draft'

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore('drafts')
    db.createObjectStore('images')
  },
})

export async function loadDraft(): Promise<RankingDraft | undefined> {
  return (await dbPromise).get('drafts', DRAFT_KEY)
}

export async function saveDraft(draft: RankingDraft): Promise<void> {
  const persistable = structuredClone(draft)
  Object.values(persistable.images).forEach((image) => delete image.previewUrl)
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

export async function clearStorage(): Promise<void> {
  const db = await dbPromise
  await db.clear('drafts')
  await db.clear('images')
}
