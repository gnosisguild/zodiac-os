import { Role, encodeKey as encodeRoleKey } from 'zodiac-roles-sdk'

export const createMockRole = (role: Partial<Role> = {}): Role => ({
  key: encodeRoleKey('test_role_key'),
  annotations: [],
  members: [],
  targets: [],
  lastUpdate: 0,

  ...role,
})
