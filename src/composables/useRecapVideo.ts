import { loadVoice } from '../services/storage'
import type { OutputRatio, VoiceClip } from '../types/ranking'
import type { VideoItem } from '../components/VideoExportPanel.vue'

type LoadedScene = VideoItem & { image?: HTMLImageElement }
const tierColors = ['#d4001a', '#d8ba20', '#f2e71b', '#fbf8a6', '#f4f4f4']
const tierTextColors = ['#080808', '#080808', '#080808', '#080808', '#080808']

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src })
}

function roundedClip(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 14) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.clip()
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement | undefined, x: number, y: number, width: number, height: number) {
  if (!image) { ctx.fillStyle = '#dce3ec'; ctx.fillRect(x, y, width, height); return }
  const scale = Math.max(width / image.width, height / image.height); const drawWidth = image.width * scale; const drawHeight = image.height * scale
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement | undefined, x: number, y: number, width: number, height: number) {
  if (!image) return
  const scale = Math.min(width / image.width, height / image.height); const drawWidth = image.width * scale; const drawHeight = image.height * scale
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function dimensions(width: number, height: number) {
  const margin = 0; const titleY = height * .075; const top = height * .14; const bottom = height * .045
  const rowHeight = (height - top - bottom) / 5; const labelWidth = width * .2; const gridLeft = labelWidth + width * .012
  const cardSize = Math.min((width - gridLeft - width * .012 - 6 * 8) / 7, rowHeight - 16)
  return { margin, titleY, top, rowHeight, labelWidth, gridLeft, cardSize }
}

function targetFor(item: VideoItem, width: number, height: number) {
  const d = dimensions(width, height); const tier = item.tierIndex ?? 0; const rank = item.rankIndex ?? 0
  return { x: d.gridLeft + rank * (d.cardSize + 8), y: d.top + tier * d.rowHeight + (d.rowHeight - d.cardSize) / 2, width: d.cardSize, height: d.cardSize }
}

function drawBoard(ctx: CanvasRenderingContext2D, width: number, height: number, title: string, tierNames: string[], placed: LoadedScene[]) {
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, width, height)
  const d = dimensions(width, height)
  ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(width * .035)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(title || '夯拉排名', width / 2, d.titleY)
  tierNames.forEach((tierName, index) => {
    const y = d.top + index * d.rowHeight
    ctx.fillStyle = '#909090'; ctx.fillRect(d.margin, y, width - d.margin * 2, d.rowHeight)
    ctx.fillStyle = tierColors[index] ?? '#f4f4f4'; ctx.fillRect(d.margin, y, d.labelWidth, d.rowHeight)
    const labelFontSize = Math.round(Math.min(width * .065, d.rowHeight * .42))
    ctx.fillStyle = tierTextColors[index] ?? '#344257'; ctx.font = `800 ${labelFontSize}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(tierName, d.margin + d.labelWidth / 2, y + d.rowHeight / 2 + labelFontSize * .34)
    ctx.fillStyle = '#050505'; ctx.fillRect(d.margin, y + d.rowHeight - 3, width - d.margin * 2, 3)
  })
  placed.forEach((item) => { const target = targetFor(item, width, height); ctx.save(); roundedClip(ctx, target.x, target.y, target.width, target.height, 10); drawCover(ctx, item.image, target.x, target.y, target.width, target.height); ctx.restore() })
}

function drawFloatingImage(ctx: CanvasRenderingContext2D, item: LoadedScene, x: number, y: number, width: number, height: number, nameSize: number, contain = false) {
  ctx.save(); roundedClip(ctx, x, y, width, height, 18); if (contain) drawContain(ctx, item.image, x, y, width, height); else drawCover(ctx, item.image, x, y, width, height); ctx.restore()
  ctx.fillStyle = '#2e3a50'; ctx.font = `700 ${nameSize}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(item.name, x + width / 2, y + height + nameSize * 1.6)
}

function animate(duration: number, frame: (progress: number) => void) {
  return new Promise<void>((resolve) => { const began = performance.now(); const loop = (now: number) => { const progress = Math.min(1, (now - began) / duration); frame(progress); progress < 1 ? requestAnimationFrame(loop) : resolve() }; requestAnimationFrame(loop) })
}

export async function exportRecapVideo(args: { title: string; ratio: OutputRatio; tierNames: string[]; items: VideoItem[]; voiceClips: Record<string, VoiceClip>; introVoice?: VoiceClip; outroVoice?: VoiceClip; placementPauseMs: number; onProgress: (message: string) => void }) {
  const portrait = args.ratio === '3:4'; const width = portrait ? 1080 : 1920; const height = portrait ? 1440 : 1080
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('无法创建视频画布')
  // A silent audio track makes MediaRecorder emit a header-only WebM in some
  // browsers. Keep no audio track at all when there is nothing to narrate.
  const hasNarration = Boolean(args.introVoice || args.outroVoice || Object.keys(args.voiceClips).length)
  const audioContext = hasNarration ? new AudioContext() : undefined
  const destination = audioContext?.createMediaStreamDestination()
  let canvasStream = canvas.captureStream(0)
  let videoTrack = canvasStream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }
  if (!videoTrack) throw new Error('浏览器不支持视频画布导出。')
  const manualFrameCapture = typeof videoTrack.requestFrame === 'function'
  // Older implementations lack requestFrame(). Let their normal 30fps canvas
  // capture path provide the video frames instead.
  if (!manualFrameCapture) {
    canvasStream = canvas.captureStream(30)
    videoTrack = canvasStream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }
  }
  const stream = new MediaStream([...canvasStream.getVideoTracks(), ...(destination?.stream.getAudioTracks() ?? [])]); const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 }); const chunks: BlobPart[] = []; recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
  const done = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mime })) })
  const scenes: LoadedScene[] = await Promise.all(args.items.map(async (item) => ({ ...item, image: item.url ? await loadImage(item.url).catch(() => undefined) : undefined })))
  // Do not request periodic chunks. Some browsers return media fragments for
  // those chunks; a single final chunk always carries the WebM EBML header.
  recorder.start()
  await audioContext?.resume()
  const placed: LoadedScene[] = []

  function captureFrame(draw: () => void) {
    draw()
    if (manualFrameCapture) videoTrack.requestFrame?.()
  }

  async function playVoice(clip?: VoiceClip) {
    if (!clip || !audioContext || !destination) return
    const blob = await loadVoice(clip.blobKey)
    if (!blob) return
    const audio = new Audio(URL.createObjectURL(blob)); audio.onended = () => URL.revokeObjectURL(audio.src)
    audioContext.createMediaElementSource(audio).connect(destination); void audio.play().catch(() => undefined)
  }

  args.onProgress('正在添加开头解说…'); await playVoice(args.introVoice)
  await animate(Math.max(1500, (args.introVoice?.durationMs ?? 0) + 250), () => captureFrame(() => drawBoard(ctx, width, height, args.title, args.tierNames, [])))

  for (let index = 0; index < scenes.length; index += 1) {
    const item = scenes[index]; const clip = args.voiceClips[item.imageId]; const narrationDuration = Math.max(2400, (clip?.durationMs ?? 0) + 250)
    await playVoice(clip)
    args.onProgress(`正在放置 ${index + 1}/${scenes.length}`)
    await animate(narrationDuration, (progress) => captureFrame(() => { drawBoard(ctx, width, height, args.title, args.tierNames, placed); const zoomProgress = Math.min(1, (progress * narrationDuration) / 500); const boxW = width * (portrait ? .68 : .38) * (.86 + zoomProgress * .14); const boxH = height * (portrait ? .38 : .56) * (.86 + zoomProgress * .14); drawFloatingImage(ctx, item, (width - boxW) / 2, (height - boxH) / 2 - height * .025, boxW, boxH, Math.round(width * .02), true) }))
    const startW = width * (portrait ? .68 : .38); const startH = height * (portrait ? .38 : .56); const startX = (width - startW) / 2; const startY = (height - startH) / 2 - height * .025; const target = targetFor(item, width, height)
    await animate(650, (progress) => captureFrame(() => { drawBoard(ctx, width, height, args.title, args.tierNames, placed); const x = startX + (target.x - startX) * progress; const y = startY + (target.y - startY) * progress; const boxW = startW + (target.width - startW) * progress; const boxH = startH + (target.height - startH) * progress; drawFloatingImage(ctx, item, x, y, boxW, boxH, Math.max(1, Math.round(width * .02 * (1 - progress))) ) }))
    placed.push(item)
    await animate(args.placementPauseMs, () => captureFrame(() => drawBoard(ctx, width, height, args.title, args.tierNames, placed)))
  }
  args.onProgress('正在添加结尾解说…'); await playVoice(args.outroVoice); await animate(Math.max(1800, (args.outroVoice?.durationMs ?? 0) + 250), () => captureFrame(() => drawBoard(ctx, width, height, args.title, args.tierNames, placed)))
  recorder.stop(); const blob = await done; await audioContext?.close()
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
  const validWebm = header.length === 4 && header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3
  if (!validWebm || blob.size < 1024) throw new Error('浏览器没有生成有效的 WebM 回顾文件，请刷新页面后重试。')
  return blob
}
