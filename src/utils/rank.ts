import { MAX_IMAGES_PER_TIER } from '../types/ranking'

/** 是否允许将图片放入目标等级；同一等级内部重排不受容量限制。 */
export function canPlaceInTier(targetCount: number, isSameTier: boolean): boolean {
  return isSameTier || targetCount < MAX_IMAGES_PER_TIER
}
