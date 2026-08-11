<script setup lang="ts">
import { contactEmail } from '../config/site'
</script>

<template>
  <section class="about-page">
    <span class="eyebrow">ABOUT</span>
    <h1>关于夯拉排名</h1>
    <p>给本地图片排个夯拉名次，并直接导出分享。</p>
    <div class="about-list">
      <article><h2>版权信息</h2><p>© {{ new Date().getFullYear() }} 夯拉排名。保留所有权利。</p></article>
      <article><h2>隐私协议</h2><p>图片、排名草稿与录音默认仅保存在你的浏览器本机，不会上传至服务器。</p></article>
      <article><h2>意见反馈</h2><p>使用问题、功能建议请发送至 <a :href="`mailto:${contactEmail}`">{{ contactEmail }}</a></p></article>
      <article><h2>商务合作</h2><p>程序开发、H5 定制与工具合作请联系 <a :href="`mailto:${contactEmail}?subject=夯拉排名程序开发合作`">{{ contactEmail }}</a></p></article>
    </div>
  </section>
</template>
