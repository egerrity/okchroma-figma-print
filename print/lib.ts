// What the print binds to: the path okchroma's extended plugin writes each engine name
// under. The plugin zones every path: `base/` for the engine-owned rows (the families, the
// poles, the absolutes, the alpha rows) and `utility/` for the planes, the shadows and the
// opacity ladder. The scrim has no row of its own; a kit composes it from the absolute
// black at the ladder's top rung, and so does the print. print.ts holds every path it uses
// against plugin-paths.json, a dump of the plugin's own output for one brand.
const STAMP: Record<string, string> = {
  'stamp-fill': 'stamp/fill',
  'stamp-fill-hover': 'stamp/fill-hover',
  'stamp-fill-pressed': 'stamp/fill-pressed',
  'stamp-edge': 'stamp/edge',
  'stamp-on': 'stamp/on',
}
const leaf = (l: string) => STAMP[l] ?? l

/** the plugin's variable path for an engine name, or undefined when the plugin writes none */
export function figmaPath(engineName: string): string | undefined {
  const n = engineName.replace(/^--/, '')
  let m: RegExpExecArray | null
  if ((m = /^surface-(dim|low|mid|high)$/.exec(n))) return `utility/surface/${m[1]}`
  if ((m = /^shadow-(04|08|12)$/.exec(n))) return `utility/shadow-${m[1]}`
  if ((m = /^opacity-(\d{3})$/.exec(n))) return `utility/opacity/${m[1]}`
  if (n === 'alpha-transparent') return 'base/alpha/transparent'
  if (n === 'abs-black') return 'base/absolute/black'
  if (n === 'abs-white') return 'base/absolute/white'
  if (n === 'pen-100' || n === 'paper-0') return `base/neutral/${n}`
  if ((m = /^brand-alt-(.+)$/.exec(n))) return `base/brand-alt/${leaf(m[1])}`
  if ((m = /^brand-(.+)$/.exec(n))) return `base/brand/${leaf(m[1])}`
  if ((m = /^(neutral|critical|warning|positive|info)-(.+)$/.exec(n))) return `base/${m[1]}/${leaf(m[2])}`
  return undefined
}
