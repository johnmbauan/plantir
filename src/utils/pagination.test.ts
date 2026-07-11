import { describe, it, expect } from 'vitest'
import { paginationMeta } from './pagination'

describe('paginationMeta', () => {
  it('derives range metadata from a total count', () => {
    expect(paginationMeta(30, 1, 25)).toEqual({
      totalPages: 2,
      rangeStart: 1,
      rangeEnd: 25,
    })
    expect(paginationMeta(30, 2, 25)).toEqual({
      totalPages: 2,
      rangeStart: 26,
      rangeEnd: 30,
    })
  })

  it('handles empty totals', () => {
    expect(paginationMeta(0, 1, 25)).toEqual({
      totalPages: 1,
      rangeStart: 0,
      rangeEnd: 0,
    })
  })
})
