<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { VoiceClip } from '../types/ranking'

defineProps<{ clip?: VoiceClip }>()
const emit = defineEmits<{ save: [payload: { blob: Blob; durationMs: number }]; remove: [] }>()
const recording = ref(false)
const elapsed = ref(0)
const error = ref('')
let recorder: MediaRecorder | undefined
let stream: MediaStream | undefined
let startedAt = 0
let timer = 0

function stopTracks() { stream?.getTracks().forEach((track) => track.stop()); stream = undefined }

async function start() {
  error.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const chunks: BlobPart[] = []
    recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' })
    startedAt = Date.now(); elapsed.value = 0; recording.value = true
    timer = window.setInterval(() => { elapsed.value = Date.now() - startedAt }, 100)
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onstop = () => {
      window.clearInterval(timer); recording.value = false
      emit('save', { blob: new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }), durationMs: Date.now() - startedAt })
      stopTracks()
    }
    recorder.start()
  } catch {
    error.value = '无法使用麦克风，请在浏览器中允许录音权限。'
    stopTracks()
  }
}

function stop() { recorder?.state === 'recording' && recorder.stop() }
function formatDuration(durationMs: number) { return `${(durationMs / 1000).toFixed(1)} 秒` }
onBeforeUnmount(() => { window.clearInterval(timer); if (recorder?.state === 'recording') recorder.stop(); else stopTracks() })
</script>

<template>
  <div class="voice-recorder">
    <button v-if="!recording" type="button" class="secondary-button" @click="start">{{ clip ? '重新录制' : '录制口播' }}</button>
    <button v-else type="button" class="recording-button" @click="stop">■ 停止 {{ (elapsed / 1000).toFixed(1) }}s</button>
    <audio v-if="clip?.previewUrl" :src="clip.previewUrl" controls />
    <span v-if="clip" class="voice-duration">{{ formatDuration(clip.durationMs) }}</span>
    <button v-if="clip" type="button" class="remove-voice" @click="emit('remove')">删除</button>
    <small v-if="error" class="voice-error">{{ error }}</small>
  </div>
</template>
