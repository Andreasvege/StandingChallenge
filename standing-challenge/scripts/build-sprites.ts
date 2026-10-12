// `npm run sprites`: turns the hand-drawn PNGs in sprites/hode/ and sprites/pult/ into
// lib/sprite-art.generated.ts, and (re)writes the drawing templates and palettes in sprites/mal/.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import { BUILTIN_DESK_ITEMS, DEFAULT_FIGURE, HAIR_COLORS, SHIRT_COLORS, SKIN_COLORS } from '../lib/figure'
import { SKIES, WINDOW_GLASS, WINDOW_MULLION, windowRects } from '../lib/sky'
import { DESK_TOP, FACE, SCENE_COLORS, SPRITE_H, SPRITE_W, spriteRects, type Rect } from '../lib/sprite'
import { DESK_CANVAS, HEAD_CANVAS, artNameFromFile, pixelsToRects, rasterize, type ArtPiece } from '../lib/sprite-art'

const ROOT = process.cwd()
const SPRITES = join(ROOT, 'sprites')
const MAL = join(SPRITES, 'mal')
const OUT = join(ROOT, 'lib', 'sprite-art.generated.ts')

interface Kind {
  dir: 'hode' | 'pult'
  /** Where the canvas sits on the standing sprite. */
  box: { x: number; y: number; w: number; h: number }
}
const KINDS: Kind[] = [
  { dir: 'hode', box: { x: FACE.stand.x + HEAD_CANVAS.dx, y: FACE.stand.y + HEAD_CANVAS.dy, w: HEAD_CANVAS.w, h: HEAD_CANVAS.h } },
  { dir: 'pult', box: { x: DESK_CANVAS.x, y: DESK_TOP.stand + DESK_CANVAS.dy, w: DESK_CANVAS.w, h: DESK_CANVAS.h } },
]
const RESERVED = new Set<string>(['none', ...BUILTIN_DESK_ITEMS])

const PALETTE: [string, string][] = [
  ...Object.entries(SCENE_COLORS),
  ...HAIR_COLORS.map((c, i): [string, string] => [`Hår ${i + 1}`, c]),
  ...SKIN_COLORS.map((c, i): [string, string] => [`Hud ${i + 1}`, c]),
  ...SHIRT_COLORS.map((c, i): [string, string] => [`Genser ${i + 1}`, c]),
]
const PALETTE_SET = new Set(PALETTE.map(([, c]) => c.toLowerCase()))

/** The bare standing figure the templates are cut from. */
const TEMPLATE_FIGURE = spriteRects(DEFAULT_FIGURE, { pose: 'stand', hideDeskItem: true })

function writePng(path: string, width: number, height: number, data: Uint8Array) {
  const png = new PNG({ width, height })
  png.data = Buffer.from(data)
  writeFileSync(path, PNG.sync.write(png))
}

function writeTemplatesAndPalettes() {
  mkdirSync(MAL, { recursive: true })
  for (const k of KINDS) writePng(join(MAL, `${k.dir}-mal.png`), k.box.w, k.box.h, rasterize(TEMPLATE_FIGURE, k.box))
  // Templates for sprites/scene/ – a guide to draw over, not something the drawing is compared with.
  const glass = WINDOW_GLASS
  writePng(join(MAL, 'vindu-mal.png'), glass.w, glass.h, rasterize([...windowRects(SKIES.day), WINDOW_MULLION], glass))
  const floor = { x: 0, y: 0, w: SPRITE_W + 32, h: SPRITE_H }
  writePng(join(MAL, 'gulv-mal.png'), floor.w, floor.h, rasterize(spriteRects(DEFAULT_FIGURE, { pose: 'stand' }), floor))

  const seen = new Set<string>()
  const unique = PALETTE.filter(([, c]) => !seen.has(c) && seen.add(c))
  const rgb = (c: string) => [1, 3, 5].map(i => String(parseInt(c.slice(i, i + 2), 16)).padStart(3))
  const gpl = ['GIMP Palette', 'Name: Stå på!', 'Columns: 8', '#', ...unique.map(([name, c]) => `${rgb(c).join(' ')}\t${name}`)]
  writeFileSync(join(MAL, 'sta-pa.gpl'), gpl.join('\n') + '\n')
  writeFileSync(join(MAL, 'sta-pa.hex'), unique.map(([, c]) => c.slice(1)).join('\n') + '\n')
}

/** How many opaque template pixels the drawing still contains unchanged. */
function templateCoverage(data: ArrayLike<number>, template: Uint8Array): number {
  let opaque = 0
  let same = 0
  for (let o = 0; o < template.length; o += 4) {
    if (template[o + 3] === 0) continue
    opaque++
    if ([0, 1, 2, 3].every(c => template[o + c] === data[o + c])) same++
  }
  return opaque === 0 ? 0 : same / opaque
}

function convert(k: Kind, errors: string[], warnings: string[]): ArtPiece[] {
  const dir = join(SPRITES, k.dir)
  if (!existsSync(dir)) return []
  const template = rasterize(TEMPLATE_FIGURE, k.box)
  const pieces: ArtPiece[] = []
  for (const file of readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png')).sort()) {
    const where = `sprites/${k.dir}/${file}`
    const name = artNameFromFile(file)
    if (!name) {
      errors.push(`${where}: filnavnet kan bare ha bokstaver, tall, mellomrom og bindestrek`)
      continue
    }
    if (RESERVED.has(name.id) || pieces.some(p => p.id === name.id)) {
      errors.push(`${where}: navnet «${name.id}» er allerede i bruk – gi fila et annet navn`)
      continue
    }
    const png = PNG.sync.read(readFileSync(join(dir, file)))
    if (png.width !== k.box.w || png.height !== k.box.h) {
      errors.push(`${where} er ${png.width}×${png.height}, men må være ${k.box.w}×${k.box.h} – start fra sprites/mal/${k.dir}-mal.png`)
      continue
    }
    // Drawn straight on the template? Then drop the pixels that are still the template.
    const onTemplate = templateCoverage(png.data, template) > 0.5
    const rects = pixelsToRects(png.width, png.height, png.data, onTemplate ? template : undefined)
    if (rects.length === 0) {
      warnings.push(`${where}: tom tegning – hoppet over`)
      continue
    }
    const offPalette = [...new Set(rects.map(r => r.fill))].filter(c => !PALETTE_SET.has(c))
    if (offPalette.length > 0) {
      warnings.push(`${where}: ${offPalette.length} farge(r) utenfor paletten (${offPalette.join(', ')}) – helt lov, men sjekk at det passer inn`)
    }
    pieces.push({ ...name, rects })
  }
  return pieces
}

function formatPieces(pieces: ArtPiece[]): string {
  if (pieces.length === 0) return '[]'
  const rect = (r: Rect) => `{ x: ${r.x}, y: ${r.y}, w: ${r.w}, h: ${r.h}, fill: '${r.fill}' }`
  const piece = (p: ArtPiece) =>
    [`  {`, `    id: ${JSON.stringify(p.id)},`, `    label: ${JSON.stringify(p.label)},`, `    rects: [`, ...p.rects.map(r => `      ${rect(r)},`), `    ],`, `  },`].join('\n')
  return `[\n${pieces.map(piece).join('\n')}\n]`
}

writeTemplatesAndPalettes()
const errors: string[] = []
const warnings: string[] = []
const [head, desk] = KINDS.map(k => convert(k, errors, warnings))
for (const w of warnings) console.warn(`⚠︎ ${w}`)
if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`)
  console.error('\nIngenting er endret i koden – rett feilene over og kjør `npm run sprites` på nytt.')
  process.exit(1)
}
writeFileSync(
  OUT,
  [
    '// Generated by `npm run sprites` (scripts/build-sprites.ts) from sprites/hode/*.png and sprites/pult/*.png.',
    "// Don't edit by hand – draw in the PNGs and run the script again.",
    "import type { ArtPiece } from './sprite-art'",
    '',
    `export const HEAD_ART: ArtPiece[] = ${formatPieces(head)}`,
    '',
    `export const DESK_ART: ArtPiece[] = ${formatPieces(desk)}`,
    '',
  ].join('\n'),
)
const names = (list: ArtPiece[]) => (list.length ? ` (${list.map(p => p.label).join(', ')})` : '')
console.log(`✓ ${head.length} hodeplagg${names(head)} og ${desk.length} pultting${names(desk)} → lib/sprite-art.generated.ts`)
console.log('  Maler og palett er oppdatert i sprites/mal/. Se resultatet på /admin eller /dev/room.')
