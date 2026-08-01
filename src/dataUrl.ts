/** Build a public-data URL that respects Vite's configured deployment base. */
export function dataUrl(fileName: string, baseUrl = import.meta.env.BASE_URL): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${base}data/${fileName.replace(/^\/+/, '')}`
}