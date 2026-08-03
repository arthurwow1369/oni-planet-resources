import type { Locale } from './types'

const officialDlcLabels: Readonly<Record<string, string>> = {
  base: 'Oxygen Not Included',
  expansion1: 'Spaced Out!',
  dlc1: 'Spaced Out!',
  dlc2: 'The Frosty Planet Pack',
  dlc3: 'The Bionic Booster Pack',
  dlc4: 'The Prehistoric Planet Pack',
  dlc5: 'The Aquatic Planet Pack',
}

const traditionalChineseDlcLabels: Readonly<Record<string, string>> = {
  base: '缺氧',
  expansion1: '眼冒金星！',
  dlc1: '眼冒金星！',
  dlc2: '寒霜行星包',
  dlc3: '仿生增幅包',
  dlc4: '史前行星包',
  dlc5: '水生行星包',
}

export function dlcLabel(tag: string, compactBase = false, locale: Locale = 'en'): string {
  const normalizedTag = tag.toLowerCase()
  if (locale === 'zh') {
    if (normalizedTag === 'base' && compactBase) return '本體'
    if ((normalizedTag === 'expansion1' || normalizedTag === 'dlc1') && compactBase) return '太空拓荒'
    return traditionalChineseDlcLabels[normalizedTag] ?? tag
  }
  if (normalizedTag === 'base' && compactBase) return 'Base Game'
  return officialDlcLabels[normalizedTag] ?? tag
}