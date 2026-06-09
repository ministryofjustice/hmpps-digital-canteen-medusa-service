import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    // backend/src/api/store/canteen-products/route.ts ignored as only POC file
    extraIgnorePaths: [
      'backend/.medusa',
      'backend/src/migration-scripts/**',
      'backend/src/api/store/canteen-products/route.ts',
    ],
    extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs', 'backend/jest.config.js'],
  }),
  {
    files: ['backend/src/**/*.ts'],
    rules: {
      'import/prefer-default-export': 'off',
    },
  },
]
