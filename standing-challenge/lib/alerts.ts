// «Står du fortsatt?» sound + browser notification. Adapted from pomodorotimer/lib/alerts.ts:
// same shared AudioContext and silent fallbacks, but a square-wave 8-bit «pling» and Norwegian copy.

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  return audioCtx
}

function blip(ctx: AudioContext, freq: number, start: number, duration: number, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  // Square waves are loud: low peak, near-instant attack, short release to avoid clicks.
  const peak = 0.06 * volume
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.005)
  gain.gain.setValueAtTime(peak, start + duration - 0.02)
  gain.gain.linearRampToValueAtTime(0, start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration)
}

/** Call from a click (the Start button) so the pling can play later without a user gesture. */
export function warmUpAudio(): void {
  try {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  } catch {
    // No audio available — stay silent.
  }
}

export function playPling(volume = 1): void {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    blip(ctx, 988, t, 0.09, volume) // B5
    blip(ctx, 1319, t + 0.1, 0.16, volume) // E6
  } catch {
    // No audio available — stay silent.
  }
}

export function showStillStandingNotification(minutes: number): void {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const n = new Notification('Står du fortsatt?', {
      body: `Du har stått i ${minutes} min 🎉 Én runde til?`,
      tag: 'stapa-still-standing',
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    // Notifications unavailable — skip.
  }
}

export async function requestNotificationPermission(): Promise<void> {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') await Notification.requestPermission()
  } catch {
    // Permission API unavailable — ignore.
  }
}
