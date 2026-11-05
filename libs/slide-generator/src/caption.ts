/** Inserts one caption line before the slide footer. `caption` must already be escaped. */
export function injectCaption(html: string, caption: string | undefined): string {
  if (caption === undefined) return html
  return html.replace(
    '</div><footer class="brand">',
    `<p class="match player">${caption}</p></div><footer class="brand">`,
  )
}
