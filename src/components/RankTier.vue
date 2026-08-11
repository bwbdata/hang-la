<script setup lang="ts">
import draggable from 'vuedraggable'
import type { RankImage, RankTier as RankTierType } from '../types/ranking'
import RankCard from './RankCard.vue'

const props = defineProps<{ tier: RankTierType; images: Record<string, RankImage>; canMove: (toTierId: string, fromTierId?: string) => boolean }>()
const emit = defineEmits<{ rename: [name: string]; changed: []; remove: [id: string] }>()

function checkMove(event: { to: { dataset: DOMStringMap }; from: { dataset: DOMStringMap } }) {
  return props.canMove(event.to.dataset.tierId ?? '', event.from.dataset.tierId)
}
</script>

<template>
  <section class="rank-tier">
    <div class="tier-heading">
      <input :value="tier.name" maxlength="16" aria-label="等级名称" @change="emit('rename', ($event.target as HTMLInputElement).value)" />
      <span>{{ tier.imageIds.length }}/14</span>
    </div>
    <draggable
      :list="tier.imageIds"
      class="rank-grid"
      :data-tier-id="tier.id"
      item-key="id"
      :group="{ name: 'ranking-images', pull: true, put: true }"
      :animation="180"
      :move="checkMove"
      @change="emit('changed')"
    >
      <template #item="{ element, index }">
        <RankCard :url="images[element]?.previewUrl" :name="images[element]?.name ?? '未知图片'" :index="index + 1" removable @remove="emit('remove', element)" />
      </template>
      <template #footer><p v-if="!tier.imageIds.length" class="tier-empty">把图片拖到这里</p></template>
    </draggable>
  </section>
</template>
