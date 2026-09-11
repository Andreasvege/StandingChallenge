// Generates app/icon.svg (the static favicon) from a crowned pixel head. Usage: npx tsx scripts/make-icon.ts

import { writeFileSync } from 'node:fs'
import { DEFAULT_FIGURE, type Figure } from '../lib/figure'
import { HEAD_BOX, spriteRects } from '../lib/sprite'

const figure: Figure = { ...DEFAULT_FIGURE, hairStyle: 'bun', hair: '#e7b04a' }
const { x, y, w, h } = HEAD_BOX
const rects = spriteRects(figure, { pose: 'stand', crown: true })
  .filter(r => r.x < x + w && r.x + r.w > x && r.y < y + h && r.y + r.h > y) // only what's inside the crop
  .map(r =>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}"/>`)
  .join('')

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" shape-rendering="crispEdges">` +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a2e68"/>${rects}</svg>\n`

writeFileSync('app/icon.svg', svg)
console.log('Skrev app/icon.svg')
