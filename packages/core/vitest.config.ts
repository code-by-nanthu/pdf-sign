import { mergeConfig } from 'vitest/config'
import base from '../../tooling/vitest.base'

export default mergeConfig(base, {
  test: {
    name: '@pdf-sign/core',
  },
})
