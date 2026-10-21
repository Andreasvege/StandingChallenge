// A hand-drawn PNG from sprites/scene/, scaled 3× with hard pixel edges. A strip of frames side by
// side (`frames` > 1) plays as an animation, stepping from frame to frame like a flip book.

import type { CSSProperties } from 'react'
import type { StaticImageData } from 'next/image'
import { frameSize } from '@/lib/scene'
import styles from './SceneSprite.module.css'

interface Props {
  art: StaticImageData
  frames?: number
  /** Frames per second for an animated strip. */
  fps?: number
  /** Screen pixels per drawn pixel; keep it a whole number so every pixel stays the same size. */
  scale?: number
  /** A two-frame strip that mostly holds the first frame and dips to the second at uneven moments, like a candle. */
  flicker?: boolean
  className?: string
  style?: CSSProperties
}

export function SceneSprite({ art, frames = 1, fps = 4, scale, flicker = false, className, style }: Props) {
  const { w, h } = frameSize(art.width, art.height, frames, scale)
  if (frames === 1) {
    // eslint-disable-next-line @next/next/no-img-element -- next/image would resample the pixels
    return <img src={art.src} width={w} height={h} alt="" aria-hidden="true" className={`${styles.sprite} ${className ?? ''}`} style={style} />
  }
  return (
    <div
      aria-hidden="true"
      className={`${styles.sprite} ${styles.strip} ${flicker ? styles.flicker : ''} ${className ?? ''}`}
      style={
        {
          ...style,
          width: w,
          height: h,
          backgroundImage: `url(${art.src})`,
          '--strip-w': `${w * frames}px`,
          ...(flicker ? {} : { animationTimingFunction: `steps(${frames})`, animationDuration: `${frames / fps}s` }),
        } as CSSProperties
      }
    />
  )
}
