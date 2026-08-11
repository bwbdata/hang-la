<script setup lang="ts">
import draggable from 'vuedraggable'
import type { OutputRatio, RankImage, RankTier } from '../types/ranking'
import RankCard from './RankCard.vue'
import RankTierCard from './RankTier.vue'

defineProps<{
  title: string
  aspectRatio: OutputRatio
  tiers: RankTier[]
  images: Record<string, RankImage>
  unassigned: string[]
  canMove: (toTierId: string, fromTierId?: string) => boolean
}>()
const emit = defineEmits<{ change: []; rename: [tier: RankTier, name: string]; remove: [id: string] }>()
</script>

<template>
  <section class="board-wrap">
    <div id="rank-export" class="rank-video-frame rank-editor-frame" :class="`ratio-${aspectRatio.replace(':', '-')}`">
      <div class="rank-board">
        <header class="export-heading"><h2>{{ title || '夯拉排名' }}</h2></header>
        <div class="tier-stack">
        <RankTierCard
          v-for="tier in tiers"
          :key="tier.id"
          :index="tiers.indexOf(tier)"
          :tier="tier"
          :images="images"
          :can-move="canMove"
          @changed="emit('change')"
          @rename="emit('rename', tier, $event)"
          @remove="emit('remove', $event)"
          />
        </div>
      </div>
      <div class="unassigned-row">
        <div><span class="eyebrow">待放入</span><b>拖进任意等级</b></div>
        <draggable :list="unassigned" class="unassigned-list" data-tier-id="unassigned" item-key="id" :group="{ name: 'ranking-images', pull: true, put: true }" :animation="180" @change="emit('change')">
          <template #item="{ element }"><RankCard :url="images[element]?.previewUrl" :name="images[element]?.name ?? '未知图片'" removable @remove="emit('remove', element)" /></template>
          <template #footer><small v-if="!unassigned.length">上传的图片会出现在这里</small></template>
        </draggable>
      </div>
    </div>
  </section>
</template>
