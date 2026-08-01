const officialDlcLabels: Readonly<Record<string, string>> = {
  base: 'Oxygen Not Included',
  expansion1: 'Spaced Out!',
  dlc1: 'Spaced Out!',
  dlc2: 'The Frosty Planet Pack',
  dlc3: 'The Bionic Booster Pack',
  dlc4: 'The Prehistoric Planet Pack',
  dlc5: 'The Aquatic Planet Pack',
}

export function dlcLabel(tag: string, compactBase = false): string {
  const normalizedTag = tag.toLowerCase()
  if (normalizedTag === 'base' && compactBase) return 'Base Game'
  return officialDlcLabels[normalizedTag] ?? tag
}