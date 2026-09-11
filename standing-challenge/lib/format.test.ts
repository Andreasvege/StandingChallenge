import { describe, it, expect } from 'vitest'
import { formatDuration, formatClock } from './format'

describe('formatDuration', () => {
  it('shows minutes under an hour', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(59)).toBe('0 min')
    expect(formatDuration(1920)).toBe('32 min')
  })
  it('shows hours and minutes, dropping zero minutes', () => {
    expect(formatDuration(3600)).toBe('1 t')
    expect(formatDuration(3900)).toBe('1 t 5 min')
    expect(formatDuration(7250)).toBe('2 t')
  })
  it('clamps negatives to zero', () => {
    expect(formatDuration(-30)).toBe('0 min')
  })
})

describe('formatClock', () => {
  it('formats m:ss under an hour', () => {
    expect(formatClock(1930)).toBe('32:10')
    expect(formatClock(303)).toBe('5:03')
  })
  it('formats h:mm:ss from an hour', () => {
    expect(formatClock(3725)).toBe('1:02:05')
  })
  it('clamps negatives to zero', () => {
    expect(formatClock(-5)).toBe('0:00')
  })
})
