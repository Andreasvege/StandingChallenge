import { describe, it, expect } from 'vitest'
import { firstName, isAdminEmail, isAllowedEmail, normalizeEmail, parseAdminEmails } from './access'

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  AV@TheBrave.no ')).toBe('av@thebrave.no')
  })
})

describe('isAllowedEmail', () => {
  it('accepts @thebrave.no in any casing', () => {
    expect(isAllowedEmail('av@thebrave.no')).toBe(true)
    expect(isAllowedEmail(' Emma@TheBrave.NO ')).toBe(true)
  })
  it('rejects other domains, subdomains and look-alikes', () => {
    expect(isAllowedEmail('a@gmail.com')).toBe(false)
    expect(isAllowedEmail('a@sub.thebrave.no')).toBe(false)
    expect(isAllowedEmail('a@thebrave.no.evil.com')).toBe(false)
    expect(isAllowedEmail('a@thebraveXno')).toBe(false)
  })
  it('rejects empty values', () => {
    expect(isAllowedEmail('')).toBe(false)
    expect(isAllowedEmail(null)).toBe(false)
    expect(isAllowedEmail(undefined)).toBe(false)
  })
})

describe('parseAdminEmails', () => {
  it('splits, normalises and drops blanks', () => {
    expect(parseAdminEmails(' a@thebrave.no, B@thebrave.no ,')).toEqual(['a@thebrave.no', 'b@thebrave.no'])
    expect(parseAdminEmails(undefined)).toEqual([])
  })
})

describe('isAdminEmail', () => {
  it('matches case-insensitively against the list', () => {
    expect(isAdminEmail('AV@thebrave.no', 'av@thebrave.no')).toBe(true)
    expect(isAdminEmail('emma@thebrave.no', 'av@thebrave.no')).toBe(false)
    expect(isAdminEmail('av@thebrave.no', '')).toBe(false)
  })
})

describe('firstName', () => {
  it('uses the first word of the Google name', () => {
    expect(firstName('Andreas Vege', 'av@thebrave.no')).toBe('Andreas')
  })
  it('falls back to the capitalised e-mail prefix', () => {
    expect(firstName('', 'emma@thebrave.no')).toBe('Emma')
    expect(firstName(null, 'av@thebrave.no')).toBe('Av')
  })
})
