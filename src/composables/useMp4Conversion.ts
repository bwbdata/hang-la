import classWorkerURL from '@ffmpeg/ffmpeg/worker?worker&url'

function readableError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string' && error.trim()) return error
  try { return JSON.stringify(error) || String(error) } catch { return String(error) }
}

/**
 * MP4 conversion is intentionally lazy: the FFmpeg WASM core is fetched only
 * after the user explicitly requests an MP4 download.
 */
export async function convertWebmToMp4(webm: Blob, onProgress: (message: string) => void) {
  onProgress('首次 MP4 导出正在加载转换引擎（约 31MB）…')
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([import('@ffmpeg/ffmpeg'), import('@ffmpeg/util')])
  const ffmpeg = new FFmpeg()
  const sources = [
    // The Vite-generated class worker is a module worker, therefore it must
    // import the ESM core (the UMD core only works through importScripts).
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm',
    'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm',
  ]
  const logs: string[] = []
  ffmpeg.on('progress', ({ progress }) => onProgress(`正在转为 MP4：${Math.round(progress * 100)}%`))
  ffmpeg.on('log', ({ message }) => {
    logs.push(message)
    if (logs.length > 16) logs.shift()
  })
  try {
    let assets: { coreURL: string; wasmURL: string } | undefined
    let loadError: unknown
    for (const [index, source] of sources.entries()) {
      try {
        if (index) onProgress('主镜像不可用，正在切换备用转换引擎…')
        assets = {
          coreURL: await toBlobURL(`${source}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${source}/ffmpeg-core.wasm`, 'application/wasm'),
        }
        break
      } catch (error) { loadError = error }
    }
    if (!assets) throw new Error(`MP4 引擎下载失败：${loadError instanceof Error ? loadError.message : '请检查网络连接。'}`)
    const load = ffmpeg.load({
      ...assets,
      classWorkerURL,
    })
    await Promise.race([load, new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('MP4 引擎加载超时，请检查网络后重试。')), 120_000))])
    onProgress('正在写入 MP4…')
    const input = new Uint8Array(await webm.arrayBuffer())
    const hasWebmHeader = input.length >= 4 && input[0] === 0x1a && input[1] === 0x45 && input[2] === 0xdf && input[3] === 0xa3
    if (!hasWebmHeader) throw new Error('回顾 WebM 文件不完整，无法转换为 MP4。请刷新页面后重新导出。')
    await ffmpeg.writeFile('ranking.webm', input)
    onProgress('正在编码 MP4…')
    let exitCode = await ffmpeg.exec(['-i', 'ranking.webm', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', 'ranking.mp4'])
    if (exitCode !== 0) {
      // Some browsers cannot keep x264's memory footprint alive in WASM. MPEG-4
      // is built into the same core and remains broadly playable in MP4 files.
      onProgress('正在切换兼容 MP4 编码…')
      exitCode = await ffmpeg.exec(['-i', 'ranking.webm', '-c:v', 'mpeg4', '-q:v', '3', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'ranking.mp4'])
    }
    if (exitCode !== 0) throw new Error(`转码进程异常结束（退出码 ${exitCode}）`)
    const output = await ffmpeg.readFile('ranking.mp4')
    return new Blob([output as Uint8Array], { type: 'video/mp4' })
  } catch (error) {
    const reason = readableError(error)
    throw new Error(`MP4 导出失败：${reason}${logs.length ? `（引擎末尾日志：${logs.join(' / ')}）` : ''}`)
  } finally {
    ffmpeg.terminate()
  }
}
