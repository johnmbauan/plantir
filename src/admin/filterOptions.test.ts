import { describe, it, expect } from 'vitest'
import {
  buildOwnerOptions,
  buildPlantOptions,
  buildSerialOptions,
} from '@/admin/filterOptions'
import {
  UNASSIGNED_OWNER_FILTER,
  UNASSIGNED_PLANT_FILTER,
} from '@/admin/constants'
import type { AdminFilterOptions } from '@/admin/adminService'

const baseOptions: AdminFilterOptions = {
  serials: ['SN-B', 'SN-A'],
  owners: ['bob@example.com', 'alice@example.com'],
  plants: ['Fern', 'Monstera'],
  hasUnassignedOwner: false,
  hasUnassignedPlant: false,
}

describe('buildSerialOptions', () => {
  it('includes an all-devices option and serials from filter options', () => {
    expect(buildSerialOptions(baseOptions)).toEqual([
      { value: '', label: 'All devices' },
      { value: 'SN-B', label: 'SN-B' },
      { value: 'SN-A', label: 'SN-A' },
    ])
  })
})

describe('buildOwnerOptions', () => {
  it('includes owners and an unassigned option when needed', () => {
    expect(buildOwnerOptions({
      ...baseOptions,
      hasUnassignedOwner: true,
    })).toEqual([
      { value: '', label: 'All owners' },
      { value: 'bob@example.com', label: 'bob@example.com' },
      { value: 'alice@example.com', label: 'alice@example.com' },
      { value: UNASSIGNED_OWNER_FILTER, label: 'Unassigned' },
    ])
  })
})

describe('buildPlantOptions', () => {
  it('includes plants and an unassigned option when needed', () => {
    expect(buildPlantOptions({
      ...baseOptions,
      hasUnassignedPlant: true,
    })).toEqual([
      { value: '', label: 'All plants' },
      { value: 'Fern', label: 'Fern' },
      { value: 'Monstera', label: 'Monstera' },
      { value: UNASSIGNED_PLANT_FILTER, label: 'Unassigned' },
    ])
  })
})
