import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    extraIgnorePaths: ['backend/.medusa'],
    extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs', 'backend/jest.config.js'],
  }),
  {
    files: ['backend/src/**/*.ts'],
    rules: {
      'import/prefer-default-export': 'off',
    },
  },
  {
    files: ['backend/src/migration-scripts/**/*.ts'],
    rules: {
      camelcase: 'off',
    },
  },
]
