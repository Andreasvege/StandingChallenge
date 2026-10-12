// The hand-drawn scene PNGs in sprites/scene/, one import per drawing. Importing them (rather than
// putting them in public/) lets Next read the size and give each file a cache-busting name.
// Adding a drawing: save the PNG in sprites/scene/, import it here and add it to a list.

import type { StaticImageData } from 'next/image'
import type { Seasonal } from '@/lib/scene'

/** What is seen through both windows, drawn over the sky and city: 60×32 with a transparent background. */
export interface WindowView extends Seasonal {
  art: StaticImageData
}

export const WINDOW_VIEWS: WindowView[] = [
  // { art: hostTrær, months: [9, 10, 11] },  ← with `import hostTrær from '@/sprites/scene/høst-trær.png'` above
]
