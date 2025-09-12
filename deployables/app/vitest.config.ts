/// <reference types="vitest" />

import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'
import tsConfig from './tsconfig.json'

const alias = Object.entries(tsConfig.compilerOptions.paths).reduce(
  (result, [key, value]) => ({
    ...result,
    [key]: fileURLToPath(new URL(value[0], import.meta.url)),
  }),
  {},
)

export default defineConfig({
  test: {
    alias,
    environment: 'jsdom',
    setupFiles: [
      './vitest.setup.ts',
      '@zodiac/test-utils/setup-chrome-mock',
      '@zodiac/db/setup-tests',
      '@zodiac/web3/setup-tests',
    ],
    include: ['./app/**/*.{spec,test}.{ts,tsx}'],
    mockReset: true,
    clearMocks: true,

    retry: process.env.CI ? 3 : undefined,
  },
})
