/**
 * MP4 conversion is intentionally lazy: the FFmpeg WASM core is fetched only
 * after the user explicitly requests an MP4 download.
 */
export async function convertWebmToMp4(webm: Blob, onProgress: (message: string) => void) {
  onProgress('首次 MP4 导出正在加载转换引擎（约 31MB）…')
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([import('@ffmpeg/ffmpeg'), import('@ffmpeg/util')])
  const ffmpeg = new FFmpeg()
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'
  ffmpeg.on('progress', ({ progress }) => onProgress(`正在转为 MP4：${Math.round(progress * 100)}%`))
  try {
    const load = ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    await Promise.race([load, new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('MP4 引擎加载超时，请检查网络后重试。')), 120_000))])
    onProgress('正在写入 MP4…')
    await ffmpeg.writeFile('ranking.webm', await fetchFile(webm))
    onProgress('正在编码 MP4…')
    await ffmpeg.exec(['-i', 'ranking.webm', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', 'ranking.mp4'])
    const output = await ffmpeg.readFile('ranking.mp4')
    return new Blob([output as Uint8Array], { type: 'video/mp4' })
  } finally {
    ffmpeg.terminate()
  }
}
