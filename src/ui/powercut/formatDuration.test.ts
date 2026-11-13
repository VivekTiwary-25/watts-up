import { expect, test } from 'vitest'
import { backupComparison, formatDuration } from './formatDuration'

test('formats mixed hours and minutes', () => {
  expect(formatDuration(1.5)).toBe('1h 30m')
})

test('omits hours when the span is under an hour', () => {
  expect(formatDuration(0.25)).toBe('15m')
})

test('rounds 5.43 hours to the nearest minute', () => {
  expect(formatDuration(5.43)).toBe('5h 26m')
})

test('omits a zero minute remainder', () => {
  expect(formatDuration(2)).toBe('2h')
  expect(formatDuration(0)).toBe('0m')
})

test('rolls 60 rounded minutes into the next hour', () => {
  expect(formatDuration(59.5 / 60)).toBe('1h')
})

test('clamps negative spans to zero', () => {
  expect(formatDuration(-1.25)).toBe('0m')
})

test('does not print Infinity', () => {
  expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('—')
})

test('describes a shorter backup in hours and minutes', () => {
  expect(backupComparison(4, 4 + 70 / 60)).toBe('Yours lasts 1h 10m less')
})

test('describes a longer backup', () => {
  expect(backupComparison(3.25, 3)).toBe('Yours lasts 15m longer')
})

test('treats sub-minute gaps as the same backup', () => {
  expect(backupComparison(5.434, 5.43)).toBe('Same backup time as the best combo')
})
