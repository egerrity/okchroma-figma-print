// Prints the Plugin API script that puts the roster into a Figma file whose variables
// okchroma's extended plugin has already written. It reproduces the owner's Figma model:
//
//   1. The `color family` collection: the scale and the stamp group as they read under the
//      neutral, one mode per color family, each row aliasing the plugin's variable for that
//      family; the two poles alias the neutral's in every mode. The pole families have no
//      scale and get no mode; a black or white control binds `pen-100` or `paper-0` itself.
//   2. Three state-layer component sets, `state-layer/solid|subtle|hint`: solid is the stamp
//      by state, subtle and hint are the family's highlighter-26 with the layer's opacity
//      bound to the plugin's opacity ladder at the register's rung. A host places one
//      instance stretched over its ground; the family is the `color family` mode on the host.
//   3. The roster on a page of its own: Button (Kind x State), Chip (Selected x State),
//      IndicatorChip (Level x Size), DayCell (Place x State), Input (State) and Dialog, every
//      fill, edge and text bound to `color family` rows, light and dark on the file's mode toggle.
//
//   node scripts/figma/print.ts          plugin form: logs the summary and closes with one line of it
//   node scripts/figma/print.ts --mcp    MCP form: ends with `return summary`
//
// Nothing is destroyed: a set or collection that already exists is updated or left alone and
// reported. Run through the Figma MCP server, or save the plugin form as
// scripts/figma/plugin/code.js and load that folder as a development plugin.
import { INTERACTION_FAMILIES, INTERACTION_LADDER, INTERACTION_POLE_FAMILY, resolveTheme, themeTokens, interactionTokens } from 'okchroma'
import { readFileSync } from 'node:fs'
import { figmaPath } from './lib.ts'

// Every path the print binds is held against the extended plugin's own output, dumped for
// one brand into plugin-paths.json; a path the plugin does not write stops the generation.
const KNOWN = new Set<string>(JSON.parse(readFileSync(new URL('./plugin-paths.json', import.meta.url), 'utf8')))
const plugin = (engineName: string): string => {
  const p = figmaPath(engineName)
  if (!p || !KNOWN.has(p)) throw new Error(`the extended plugin writes no variable for ${engineName}${p ? ` (${p})` : ''}`)
  return p
}
import { BRANDS, DEFAULT_BRAND, PROFILE } from '../../packages/theme/src/brands.ts'

const mcp = process.argv.includes('--mcp')

// The print binds by name, so any brand's emission gives the same script; the default's is read.
const e = BRANDS[DEFAULT_BRAND]
const theme = resolveTheme({ primaryHex: e.primaryHex, name: DEFAULT_BRAND, secondaryHex: e.secondaryHex ?? null, secondaryStyle: e.secondaryStyle, deriveSecondary: !e.secondaryHex, contrastProfile: PROFILE })
const tokens = interactionTokens(
  themeTokens({
    slug: DEFAULT_BRAND,
    displayName: DEFAULT_BRAND,
    brand: theme.themed,
    secondary: theme.secondary?.scale ?? null,
    secondaryStyle: theme.secondary?.style ?? e.secondaryStyle,
    neutralLevel: e.neutralLevel,
    ctaEscape: e.ctaEscape,
    linkHex: e.linkHex ?? null,
    ctaBorder: e.ctaBorder,
    contrastProfile: PROFILE,
  }),
)

// The seven color families: the pole families are not families with a scale, so the collection
// has no mode for them; a black or white control binds `pen-100` or `paper-0` on its host.
const FAMILIES = [...INTERACTION_FAMILIES].filter(f => f !== INTERACTION_POLE_FAMILY.strong && f !== INTERACTION_POLE_FAMILY.inverse)
const NEUTRAL = FAMILIES[0]

// The `color family` collection: the owner's 18 rows, the scale and the stamp group as they
// read under the neutral, one mode per family, each row aliasing the plugin's variable for
// that family. The two poles alias the neutral's in every mode.
const FILL = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']
const INK = ['TEXT_FILL', 'FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']
const LEAF_ROWS: Array<{ name: string; engine: string; scopes: string[]; pole?: boolean }> = [
  { name: 'paper-0', engine: 'paper-0', scopes: FILL, pole: true },
  { name: 'paper-1', engine: 'paper-1', scopes: FILL },
  { name: 'paper-3', engine: 'paper-3', scopes: FILL },
  { name: 'paper-5', engine: 'paper-5', scopes: FILL },
  { name: 'chalk-8', engine: 'chalk-8', scopes: FILL },
  { name: 'chalk-11', engine: 'chalk-11', scopes: FILL },
  { name: 'chalk-15', engine: 'chalk-15', scopes: FILL },
  { name: 'chalk-20', engine: 'chalk-20', scopes: FILL },
  { name: 'highlighter-26', engine: 'highlighter-26', scopes: INK },
  { name: 'pencil-47', engine: 'pencil-47', scopes: INK },
  { name: 'pen-58', engine: 'pen-58', scopes: INK },
  { name: 'pen-70', engine: 'pen-70', scopes: INK },
  { name: 'pen-100', engine: 'pen-100', scopes: INK, pole: true },
  { name: 'stamp/fill', engine: 'stamp-fill', scopes: FILL },
  { name: 'stamp/fill-hover', engine: 'stamp-fill-hover', scopes: FILL },
  { name: 'stamp/fill-pressed', engine: 'stamp-fill-pressed', scopes: FILL },
  { name: 'stamp/edge', engine: 'stamp-edge', scopes: ['STROKE_COLOR'] },
  { name: 'stamp/on', engine: 'stamp-on', scopes: ['TEXT_FILL'] },
]
const rows = LEAF_ROWS.map(r => ({
  name: r.name,
  scopes: r.scopes,
  aliases: FAMILIES.map(f => plugin(r.pole ? r.engine : `${f}-${r.engine}`)),
  description: r.pole ? `The neutral's pole, the same in every family.` : `The family's ${r.name}; the mode picks the family.`,
}))

// The state layers: the owner's three components. Solid is the stamp by state; subtle and
// hint are the family's highlighter-26 with the layer's opacity bound to the plugin's
// opacity ladder at the register's rung. Disabled rests at the resting rung; the host carries
// the disabled opacity.
const rungPath = (rung: number | null) => (rung === null ? null : plugin(`opacity-${String(rung).padStart(3, '0')}`))
const LAYER_STATES = ['resting', 'hover', 'pressed', 'disabled'] as const
const registerState = (s: string) => (s === 'resting' || s === 'disabled' ? 'enabled' : s) as 'enabled' | 'hover' | 'pressed' | 'selected'
const solidLayer = LAYER_STATES.map(state => ({ state, fill: state === 'hover' ? 'stamp/fill-hover' : state === 'pressed' ? 'stamp/fill-pressed' : 'stamp/fill' }))
const tintLayer = (tier: 'subtle' | 'hint') =>
  ([false, true] as const).flatMap(selectable =>
    [...LAYER_STATES, ...(selectable ? (['selected'] as const) : [])].map(state => ({
      selectable,
      state,
      rung: rungPath(INTERACTION_LADDER[tier][registerState(state)]),
    })),
  )
const LAYERS = { solid: solidLayer, subtle: tintLayer('subtle'), hint: tintLayer('hint') }

// The hosts. A host frame draws its edge and text from `color family` rows and places one
// state-layer instance stretched over its ground; the family is the mode on the host.
const STATES = ['enabled', 'hover', 'pressed', 'disabled'] as const
const layerState = (s: string) => (s === 'enabled' ? 'resting' : s)
// Kind x State: primary on the solid layer; outline and ghost on the hint layer; the toggle,
// shown on, on the subtle layer (decision 26); the edge and text from the rows the map names.
const KINDS = {
  primary: { layer: 'solid', stroke: 'stamp/edge', text: 'stamp/on' },
  outline: { layer: 'hint', stroke: 'highlighter-26', text: 'pencil-47' },
  ghost: { layer: 'hint', stroke: null, text: 'pencil-47' },
  toggle: { layer: 'subtle', stroke: 'highlighter-26', text: 'pencil-47' },
} as const
const buttonVariants = (Object.keys(KINDS) as (keyof typeof KINDS)[]).flatMap(kind =>
  STATES.map(state => ({ kind, state, ...KINDS[kind], layerState: layerState(state), opacity: state === 'disabled' ? Number(tokens.light['disabled-opacity']) : 1 })),
)
// the button chip: off is the neutral stamp (the variant's mode is neutral), on is the family's stamp
const chipVariants = [false, true].flatMap(on =>
  STATES.map(state => ({ on, state, layerState: layerState(state), opacity: state === 'disabled' ? Number(tokens.light['disabled-opacity']) : 1 })),
)
// the tag chip: Level x Size on the scale rows the display group names
const LEVELS = {
  stamp: { fill: 'stamp/fill', text: 'stamp/on', stroke: 'stamp/edge' },
  strong: { fill: 'chalk-11', text: 'pen-58', stroke: 'chalk-20' },
  default: { fill: 'paper-3', text: 'pencil-47', stroke: 'chalk-15' },
} as const
const indicatorVariants = (Object.keys(LEVELS) as (keyof typeof LEVELS)[]).flatMap(level =>
  [{ size: 'md', height: 32 }, { size: 'sm', height: 24 }].map(s => ({ level, ...s, ...LEVELS[level] })),
)
// the day cell (docs/date-picker.md): Place x State. A day and today are neutral on the cell
// itself; the ends of the range are the family's stamp; inside is the subtle layer, whose
// resting rung is the selected ground; the preview is the hint layer at its hover rung.
const PLACES = {
  day: { layer: 'hint', stroke: null, text: 'pencil-47', neutral: true, corners: 'all' },
  today: { layer: 'hint', stroke: 'highlighter-26', text: 'pencil-47', neutral: true, corners: 'all' },
  start: { layer: 'solid', stroke: 'stamp/edge', text: 'stamp/on', neutral: false, corners: 'left' },
  inside: { layer: 'subtle', stroke: null, text: 'pencil-47', neutral: false, corners: 'none' },
  end: { layer: 'solid', stroke: 'stamp/edge', text: 'stamp/on', neutral: false, corners: 'right' },
  single: { layer: 'solid', stroke: 'stamp/edge', text: 'stamp/on', neutral: false, corners: 'all' },
  preview: { layer: 'hint', stroke: null, text: 'pencil-47', neutral: false, corners: 'none', fixedLayerState: 'hover' },
} as const
const dayCellVariants = (Object.keys(PLACES) as (keyof typeof PLACES)[]).flatMap(place =>
  STATES.map(state => {
    const p = PLACES[place]
    return { place, state, layer: p.layer, stroke: p.stroke, text: p.text, neutral: p.neutral, corners: p.corners, layerState: 'fixedLayerState' in p ? p.fixedLayerState : layerState(state), opacity: state === 'disabled' ? Number(tokens.light['disabled-opacity']) : 1 }
  }),
)
// the input: the edge is the family's highlighter-26, the family by the variant's mode
const inputVariants = [
  { state: 'enabled', family: NEUTRAL },
  { state: 'focus', family: 'brand' },
  { state: 'invalid', family: 'critical' },
]
const paths = {
  surfaceHigh: plugin('surface-high'),
  // the scrim is composed: the absolute black under the ladder's top rung, bound to the layer's opacity
  black: plugin('abs-black'),
  scrim: plugin('opacity-064'),
}

const body = `
const PAGE = 'okchroma-tamagui print'
const FAMILIES = ${JSON.stringify(FAMILIES)}
const NEUTRAL = ${JSON.stringify(NEUTRAL)}
const ROWS = ${JSON.stringify(rows)}
const LAYERS = ${JSON.stringify(LAYERS)}
const BUTTON = ${JSON.stringify(buttonVariants)}
const CHIP = ${JSON.stringify(chipVariants)}
const INDICATOR = ${JSON.stringify(indicatorVariants)}
const DAYCELL = ${JSON.stringify(dayCellVariants)}
const INPUT = ${JSON.stringify(inputVariants)}
const PATHS = ${JSON.stringify(paths)}

const collections = await figma.variables.getLocalVariableCollectionsAsync()
const vars = await figma.variables.getLocalVariablesAsync()
const collById = new Map(collections.map(c => [c.id, c]))
const byName = new Map()
for (const v of vars) { const prev = byName.get(v.name); if (!prev || collById.get(v.variableCollectionId).name === 'theme') byName.set(v.name, v) }
const isExpression = val => !!(val && typeof val === 'object' && val.type === 'VARIABLE_EXPRESSION')
const themeVar = path => { const v = byName.get(path); if (!v) summary.missing.push(path); return v }

// ── 1. the \`color family\` collection, one mode per family ──────────────────
let cf = collections.find(c => c.name === 'color family')
if (!cf) { cf = figma.variables.createVariableCollection('color family'); cf.renameMode(cf.modes[0].modeId, FAMILIES[0]); summary.created.push('collection color family') }
const modeId = {}
for (const f of FAMILIES) { const m = cf.modes.find(x => x.name === f); modeId[f] = m ? m.modeId : cf.addMode(f) }
const mine = new Map((await figma.variables.getLocalVariablesAsync()).filter(v => v.variableCollectionId === cf.id).map(v => [v.name, v]))
const cfVar = {}
for (const r of ROWS) {
  let v = mine.get(r.name)
  if (v) summary.updated.push('color family/' + r.name); else { v = figma.variables.createVariable(r.name, cf, 'COLOR'); summary.created.push('color family/' + r.name) }
  cfVar[r.name] = v
  FAMILIES.forEach((f, i) => {
    const target = themeVar(r.aliases[i]); if (!target) return
    if (isExpression(v.valuesByMode[modeId[f]])) { summary.skipped.push('color family/' + r.name + ' @ ' + f + ' (hand-authored)'); return }
    v.setValueForMode(modeId[f], figma.variables.createVariableAlias(target))
  })
  v.scopes = r.scopes
  v.description = r.description
}

// ── 2. the page, the fonts, the helpers ─────────────────────────────────────
let page = figma.root.children.find(p => p.name === PAGE)
if (!page) { page = figma.createPage(); page.name = PAGE; summary.created.push('page ' + PAGE) }
await figma.setCurrentPageAsync(page)
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' })

// A plain paint with the binding written in. A missing variable is reported by whoever
// looked it up; the paint stays an unbound black so the print finishes and the summary reads.
const solid = variable => variable
  ? { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: variable.id } } }
  : { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }
const bindOpacity = (node, path) => { const v = themeVar(path); if (v) node.setBoundVariable('opacity', v) }
const setMode = (node, family) => node.setExplicitVariableModeForCollection(cf, modeId[family])
const text = (chars, style, variable) => {
  const t = figma.createText(); t.fontName = { family: 'Inter', style }; t.characters = chars; t.fontSize = 15
  if (variable) t.fills = [solid(variable)]
  return t
}
const paragraph = (parent, chars, style, variable) => {
  const t = text(chars, style, variable); parent.appendChild(t)
  t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'
  return t
}
const frame = (name, w, h, padding) => {
  const f = figma.createFrame(); f.name = name; f.resize(w, h)
  f.layoutMode = 'HORIZONTAL'; f.primaryAxisAlignItems = 'CENTER'; f.counterAxisAlignItems = 'CENTER'
  f.paddingLeft = f.paddingRight = padding; f.paddingTop = f.paddingBottom = padding * 0.6
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.cornerRadius = 8; f.itemSpacing = 8
  f.strokeWeight = 1; f.strokes = []; f.fills = []
  return f
}
const finishSet = (comps, name, description) => {
  const set = figma.combineAsVariants(comps, page); set.name = name
  set.layoutMode = 'VERTICAL'; set.itemSpacing = 12; set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 16
  set.description = description
  place(set)
  summary.created.push(name + ' set (' + comps.length + ' variants)')
  return set
}
const component = (child, opacity) => {
  const c = figma.createComponent(); c.appendChild(child)
  c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.fills = []
  if (opacity !== undefined) c.opacity = opacity
  return c
}
const existingSet = name => page.children.find(n => n.type === 'COMPONENT_SET' && n.name === name)
// the sets stack down the page in the order they are printed, below whatever is there; a
// set is placed after its layout is set, since its height is only known then
let nextY = page.children.reduce((y, n) => Math.max(y, n.y + n.height), 0) + (page.children.length ? 80 : 0)
const place = node => { node.x = 0; node.y = nextY; nextY += node.height + 80 }

// ── 3. the state layers ─────────────────────────────────────────────────────
const layerSets = {}
for (const tier of ['solid', 'subtle', 'hint']) {
  const name = 'state-layer/' + tier
  const existing = existingSet(name)
  if (existing) { layerSets[tier] = existing; summary.skipped.push(name + ' exists; left as is'); continue }
  const comps = []
  for (const v of LAYERS[tier]) {
    const c = figma.createComponent()
    c.name = (tier === 'solid' ? '' : 'selectable=' + v.selectable + ', ') + 'state=' + v.state
    c.resize(40, 40); c.cornerRadius = 8
    if (tier === 'solid') c.fills = [solid(cfVar[v.fill])]
    else if (v.rung) { c.fills = [solid(cfVar['highlighter-26'])]; bindOpacity(c, v.rung) }
    else c.fills = []
    comps.push(c)
  }
  layerSets[tier] = finishSet(comps, name, tier === 'solid'
    ? 'The solid state layer: the stamp by state under a filled control; the host draws the stamp\\'s edge. A control places one instance stretched over its ground; the family is the mode on the host; the radius is overridden per host. Disabled rests; the host carries the disabled opacity.'
    : 'The ' + tier + ' state layer: the family\\'s highlighter-26 with the layer\\'s opacity bound to the opacity ladder at the ' + tier + ' rung for the state. A control places one instance stretched over its ground; the family is the mode on the host; the radius is overridden per host. Disabled rests; the host carries the disabled opacity.')
}
const layerVariant = (tier, props) => {
  const want = (tier === 'solid' ? '' : 'selectable=' + (props.selectable ?? false) + ', ') + 'state=' + props.state
  return layerSets[tier].children.find(n => n.name === want)
}
// one state-layer instance stretched over the host's ground, under its content
const layerInto = (host, tier, props) => {
  const variant = layerVariant(tier, props)
  if (!variant) { summary.missing.push('state-layer/' + tier + ' ' + JSON.stringify(props)); return }
  const inst = variant.createInstance(); host.insertChild(0, inst)
  inst.layoutPositioning = 'ABSOLUTE'; inst.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }
  inst.x = 0; inst.y = 0; inst.resize(host.width, host.height)
  inst.topLeftRadius = host.topLeftRadius; inst.topRightRadius = host.topRightRadius; inst.bottomLeftRadius = host.bottomLeftRadius; inst.bottomRightRadius = host.bottomRightRadius
  return inst
}

// ── 4. the roster ───────────────────────────────────────────────────────────
if (existingSet('Button')) summary.skipped.push('Button set exists; left as is')
else {
  const comps = []
  for (const v of BUTTON) {
    const f = frame('button', 100, 40, 16); f.cornerRadius = 10000
    if (v.stroke) f.strokes = [solid(cfVar[v.stroke])]
    f.appendChild(text('Label', 'Medium', cfVar[v.text]))
    layerInto(f, v.layer, { state: v.layerState })
    const c = component(f, v.opacity); c.name = 'Kind=' + v.kind + ', State=' + v.state
    comps.push(c)
  }
  finishSet(comps, 'Button', 'Family is the color family mode on the instance. In code: primary theme="<family>_solid", outline "<family>_outline", ghost "<family>_hint", toggle "<family>_outline" with selected while on.')
}

if (existingSet('Input')) summary.skipped.push('Input set exists; left as is')
else {
  const comps = []
  for (const v of INPUT) {
    const f = frame('input', 240, 40, 12); f.primaryAxisSizingMode = 'FIXED'; f.resize(240, 40); f.primaryAxisAlignItems = 'MIN'
    const bg = themeVar(PATHS.surfaceHigh); if (bg) f.fills = [solid(bg)]
    f.strokes = [solid(cfVar['highlighter-26'])]; f.strokeWeight = v.state === 'enabled' ? 1 : 1.5
    setMode(f, v.family)
    const t = text(v.state === 'invalid' ? 'not an address' : 'Placeholder', 'Regular', cfVar[v.state === 'invalid' ? 'pen-70' : 'pencil-47'])
    f.appendChild(t); setMode(t, NEUTRAL)
    const c = component(f); c.name = 'State=' + v.state
    comps.push(c)
  }
  finishSet(comps, 'Input', 'The edge is the family\\'s highlighter-26 by the variant\\'s mode: neutral at rest, brand in focus, critical when invalid. In code: <Input> and <Input theme="critical">.')
}

if (existingSet('Chip')) summary.skipped.push('Chip set exists; left as is')
else {
  const comps = []
  for (const v of CHIP) {
    const f = frame('chip', 80, 32, 12); f.cornerRadius = 6; f.paddingTop = f.paddingBottom = 4
    f.strokes = [solid(cfVar['stamp/edge'])]
    f.appendChild(text(v.on ? '✓ Label' : 'Label', 'Medium', cfVar['stamp/on'])); f.children[f.children.length - 1].fontSize = 14
    layerInto(f, 'solid', { state: v.layerState })
    if (!v.on) setMode(f, NEUTRAL)
    const c = component(f, v.opacity); c.name = 'Selected=' + (v.on ? 'on' : 'off') + ', State=' + v.state
    comps.push(c)
  }
  finishSet(comps, 'Chip', 'The button chip: off is the neutral stamp (the variant\\'s mode is neutral), on is the family\\'s stamp by the color family mode on the instance. In code: <Chip family="<family>" selected>.')
}

if (existingSet('IndicatorChip')) summary.skipped.push('IndicatorChip set exists; left as is')
else {
  const comps = []
  for (const v of INDICATOR) {
    const f = frame('indicator', 80, v.height, v.size === 'sm' ? 8 : 12); f.cornerRadius = 6; f.paddingTop = f.paddingBottom = 4
    f.fills = [solid(cfVar[v.fill])]; f.strokes = [solid(cfVar[v.stroke])]
    f.appendChild(text('Label', 'Medium', cfVar[v.text])); f.children[f.children.length - 1].fontSize = 14
    const c = component(f); c.name = 'Level=' + v.level + ', Size=' + v.size
    comps.push(c)
  }
  finishSet(comps, 'IndicatorChip', 'The tag chip, a label that takes no press, on the scale rows of its level. Family is the color family mode on the instance. In code: <IndicatorChip theme="<family>_indicator-<level>">.')
}

if (existingSet('DayCell')) summary.skipped.push('DayCell set exists; left as is')
else {
  const comps = []
  for (const v of DAYCELL) {
    const f = frame('day', 40, 40, 0); f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(40, 40); f.paddingTop = f.paddingBottom = 0
    const r = v.corners === 'all' ? [10000, 10000, 10000, 10000] : v.corners === 'left' ? [10000, 0, 0, 10000] : v.corners === 'right' ? [0, 10000, 10000, 0] : [0, 0, 0, 0]
    f.topLeftRadius = r[0]; f.topRightRadius = r[1]; f.bottomRightRadius = r[2]; f.bottomLeftRadius = r[3]
    if (v.stroke) f.strokes = [solid(cfVar[v.stroke])]
    f.appendChild(text('15', 'Medium', cfVar[v.text])); f.children[f.children.length - 1].fontSize = 14
    layerInto(f, v.layer, { state: v.layerState })
    if (v.neutral) setMode(f, NEUTRAL)
    const c = component(f, v.opacity); c.name = 'Place=' + v.place + ', State=' + v.state
    comps.push(c)
  }
  finishSet(comps, 'DayCell', 'A day in the date range picker\\'s calendar (docs/date-picker.md). A day and today are neutral on the cell; the ends of the range are the family\\'s stamp by the color family mode on the instance; inside is the subtle layer at rest, the selected ground; the preview is the hint layer at its hover rung; the band is the corners. In code: <DayCell family="<family>" place="<place>">.')
}

if (page.children.some(n => n.type === 'COMPONENT' && n.name === 'Dialog')) summary.skipped.push('Dialog exists; left as is')
else {
  const c = figma.createComponent(); c.name = 'Dialog'; c.resize(600, 400); c.fills = []
  const overlay = figma.createRectangle(); overlay.name = 'overlay'; overlay.resize(600, 400)
  const black = themeVar(PATHS.black); if (black) overlay.fills = [solid(black)]
  bindOpacity(overlay, PATHS.scrim)
  c.appendChild(overlay)
  const panel = frame('panel', 360, 160, 24); panel.layoutMode = 'VERTICAL'; panel.primaryAxisAlignItems = 'MIN'; panel.counterAxisAlignItems = 'MIN'
  panel.primaryAxisSizingMode = 'AUTO'; panel.counterAxisSizingMode = 'FIXED'; panel.resize(360, 160); panel.cornerRadius = 12; panel.itemSpacing = 12
  const bg = themeVar(PATHS.surfaceHigh); if (bg) panel.fills = [solid(bg)]
  panel.strokes = [solid(cfVar['chalk-11'])]; setMode(panel, NEUTRAL)
  c.appendChild(panel); panel.x = 120; panel.y = 120
  paragraph(panel, 'Delete this account?', 'Semi Bold', cfVar['pen-70'])
  paragraph(panel, 'The account and its mail are removed. This cannot be undone.', 'Regular', cfVar['pen-70'])
  const buttonSet = existingSet('Button')
  const primary = buttonSet && buttonSet.children.find(n => n.name === 'Kind=primary, State=enabled')
  if (primary) {
    const actions = figma.createFrame(); actions.name = 'actions'; actions.layoutMode = 'HORIZONTAL'; actions.itemSpacing = 12
    actions.primaryAxisAlignItems = 'MAX'; actions.counterAxisAlignItems = 'CENTER'; actions.fills = []
    actions.primaryAxisSizingMode = 'FIXED'; actions.counterAxisSizingMode = 'AUTO'
    panel.appendChild(actions); actions.layoutSizingHorizontal = 'FILL'
    for (const [family, label] of [[NEUTRAL, 'Keep it'], ['critical', 'Delete']]) {
      const inst = primary.createInstance(); actions.appendChild(inst)
      setMode(inst, family)
      const t = inst.findOne(n => n.type === 'TEXT'); if (t) t.characters = label
    }
  } else summary.missing.push('Button set for the dialog\\'s actions')
  c.description = 'Overlay on the absolute black at the ladder\\'s top rung, panel on surface-high with the neutral chalk-11 edge, the actions instances of the primary Button on the neutral and critical modes; in code, Tamagui\\'s Dialog under the DialogOverlay and DialogContent themes.'
  summary.created.push('Dialog component')
  place(c)
}
summary.missing = [...new Set(summary.missing)]
`

// Both forms declare the summary outside the printed body and run the body under try, so an
// error ends the run with the summary still reported instead of a plugin that never closes.
const summaryDecl = `const summary = { created: [], updated: [], skipped: [], missing: [], error: null }`
const summaryLine = `'print: created ' + summary.created.length + ', updated ' + summary.updated.length + ', skipped ' + summary.skipped.length + ', missing ' + summary.missing.length + (summary.error ? ', stopped on an error' : '') + '; details in the console'`
const out = mcp
  ? `// GENERATED by scripts/figma/print.ts (MCP form). Paste into the Figma MCP server's script runner.\n${summaryDecl}\ntry {${body}\n} catch (e) { summary.error = String((e && e.stack) || e) }\nreturn summary\n`
  : `// GENERATED by scripts/figma/print.ts (plugin form). Save as scripts/figma/plugin/code.js and load that folder as a development plugin.\n(async () => {\n${summaryDecl}\ntry {${body}\n} catch (e) { summary.error = String((e && e.stack) || e) }\nconsole.log('okchroma-tamagui print', JSON.stringify(summary, null, 1))\nfigma.closePlugin(${summaryLine})\n})()\n`
process.stdout.write(out)
process.stderr.write(`print: ${rows.length} color family rows, ${LAYERS.solid.length + LAYERS.subtle.length + LAYERS.hint.length} state-layer variants, ${buttonVariants.length} Button, ${chipVariants.length} Chip, ${indicatorVariants.length} IndicatorChip, ${dayCellVariants.length} DayCell, ${inputVariants.length} Input variants, ${mcp ? 'MCP' : 'plugin'} form\n`)
