// Server-side clock settings. DEV_FAST_TIME=1 (never in production) makes a "minute" last one second.

import { graceMs, minuteMs } from './sessions'

export function isFastTime(): boolean {
  return process.env.DEV_FAST_TIME === '1' && process.env.NODE_ENV !== 'production'
}

export function currentMinuteMs(): number {
  return minuteMs(isFastTime())
}

export function currentGraceMs(): number {
  return graceMs(isFastTime())
}
