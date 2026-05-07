import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
   allowlist: {
      // Medusa telemetry - FORBID to disable telemetry
      'node_modules/@medusajs/telemetry@2.14.1': 'FORBID',

      // Build tools
      'node_modules/@swc/core@1.15.32': ['postinstall'],

      // Native modules
      'node_modules/msgpackr-extract@3.0.3': ['install'],

      // Protocol buffers
      'node_modules/protobufjs@7.5.6': ['postinstall'],

      // ESBuild is written in GoLang - this is needed to download prebuilt binaries for the specific platform
      'node_modules/@medusajs/admin-bundler/node_modules/esbuild@0.21.5': 'ALLOW',
      'node_modules/esbuild@0.28.0': 'ALLOW',
   },
})