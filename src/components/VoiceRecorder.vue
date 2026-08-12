<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { VoiceClip } from '../types/ranking'

defineProps<{ clip?: VoiceClip }>()
const emit = defineEmits<{ save: [payload: { blob: Blob; durationMs: number }]; remove: [] }>()
const recording = ref(false)
const stopping = ref(false)
const elapsed = ref(0)
const error = ref('')
let recorder: MediaRecorder | undefined
let stream: MediaStream | undefined
let startedAt = 0
let timer = 0

function stopTracks() { stream?.getTracks().forEach((track) => track.stop()); stream = undefined }

function supportedAudioMimeType() {
  const candidates = [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

async function start() {
  error.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const chunks: BlobPart[] = []
    const mimeType = supportedAudioMimeType()
    // Safari supports MP4 audio, whereas Chromium commonly supports WebM. Do
    // not pass an unsupported mimeType: Safari throws for that configuration.
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    startedAt = Date.now(); elapsed.value = 0; stopping.value = false
    timer = window.setInterval(() => { elapsed.value = Date.now() - startedAt }, 100)
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onstop = () => {
      window.clearInterval(timer); recording.value = false; stopping.value = false
      const type = recorder?.mimeType || mimeType || 'audio/webm'
      emit('save', { blob: new Blob(chunks, { type }), durationMs: Date.now() - startedAt })
      stopTracks()
    }
    recorder.onerror = () => {
      error.value = '录音保存失败，请重新录制。'
      window.clearInterval(timer); recording.value = false; stopping.value = false
      stopTracks()
    }
    recorder.start()
    recording.value = true
  } catch {
    error.value = '无法使用麦克风，请在浏览器中允许录音权限。'
    stopTracks()
  }
}

function stop() {
  if (!recorder || recorder.state === 'inactive' || stopping.value) return
  stopping.value = true
  try { recorder.stop() } catch {
    stopping.value = false
    error.value = '无法停止录音，请重新录制。'
  }
}
function formatDuration(durationMs: number) { return `${(durationMs / 1000).toFixed(1)} 秒` }
onBeforeUnmount(() => { window.clearInterval(timer); if (recorder?.state === 'recording') recorder.stop(); else stopTracks() })
</script>

<template>
  <div class="voice-recorder" @click.stop @pointerup.stop>
    <button v-if="!recording" type="button" class="secondary-button" @click.stop="start">{{ clip ? '重新录制' : '录制口播' }}</button>
    <button v-else type="button" class="recording-button" :disabled="stopping" @click.stop="stop" @pointerup.stop="stop">{{ stopping ? '正在保存…' : `■ 停止 ${(elapsed / 1000).toFixed(1)}s` }}</button>
    <audio v-if="clip?.previewUrl" :src="clip.previewUrl" controls />
    <span v-if="clip" class="voice-duration">{{ formatDuration(clip.durationMs) }}</span>
    <button v-if="clip" type="button" class="remove-voice" @click.stop="emit('remove')">删除</button>
    <small v-if="error" class="voice-error">{{ error }}</small>
  </div>
</template>
