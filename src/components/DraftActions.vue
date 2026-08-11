<script setup lang="ts">
defineProps<{ saving: boolean }>()
defineEmits<{ clear: [] }>()
</script>

<template><div class="footer-draft-actions"><span><i :class="{ saving }"></i>{{ saving ? '保存中' : '已保存' }}</span><button type="button" @click="$emit('clear')">清空</button></div></template>
