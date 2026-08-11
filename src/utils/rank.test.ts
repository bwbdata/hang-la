import { describe, expect, it } from 'vitest'
import { MAX_IMAGES_PER_TIER } from '../types/ranking'
import { canPlaceInTier } from './rank'

describe('canPlaceInTier', () => {
  it('allows items until a tier reaches 14 images', () => {
    expect(canPlaceInTier(MAX_IMAGES_PER_TIER - 1, false)).toBe(true)
    expect(canPlaceInTier(MAX_IMAGES_PER_TIER, false)).toBe(false)
  })

  it('allows reordering within an already full tier', () => {
    expect(canPlaceInTier(MAX_IMAGES_PER_TIER, true)).toBe(true)
  })
})
