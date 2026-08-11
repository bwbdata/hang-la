/**
 * MP4 conversion is intentionally lazy: the FFmpeg WASM core is fetched only
 * after the user explicitly requests an MP4 download.
 */
export async function convertWebmToMp4(webm: Blob, onProgress: (message: string) => void) {
  onProgress('首次 MP4 导出正在加载转换引擎（约 31MB）…')
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([import('@ffmpeg/ffmpeg'), import('@ffmpeg/util')])
  const ffmpeg = new FFmpeg()
  const sources = [
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd',
    'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd',
  ]
  let latestLog = ''
  ffmpeg.on('progress', ({ progress }) => onProgress(`正在转为 MP4：${Math.round(progress * 100)}%`))
  ffmpeg.on('log', ({ message }) => { latestLog = message })
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
    })
    await Promise.race([load, new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('MP4 引擎加载超时，请检查网络后重试。')), 120_000))])
    onProgress('正在写入 MP4…')
    await ffmpeg.writeFile('ranking.webm', await fetchFile(webm))
    onProgress('正在编码 MP4…')
    await ffmpeg.exec(['-i', 'ranking.webm', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', 'ranking.mp4'])
    const output = await ffmpeg.readFile('ranking.mp4')
    return new Blob([output as Uint8Array], { type: 'video/mp4' })
  } catch (error) {
    const reason = error instanceof Error ? error.message : '未知错误'
    throw new Error(`MP4 导出失败：${reason}${latestLog ? `（引擎：${latestLog}）` : ''}`)
  } finally {
    ffmpeg.terminate()
  }
}
