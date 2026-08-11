import { toPng } from 'html-to-image'

export async function exportRanking(title: string) {
  const target = document.querySelector<HTMLElement>('#rank-export')
  if (!target) return
  const dataUrl = await toPng(target, { pixelRatio: 2, backgroundColor: '#10162a' })
  const link = document.createElement('a')
  link.download = `${title.trim() || '夯拉排名'}.png`
  link.href = dataUrl
  link.click()
}
