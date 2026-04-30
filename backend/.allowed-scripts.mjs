import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
   allowlist: {
      // Medusa telemetry - both versions
      'node_modules/@medusajs/telemetry@2.14.1': 'FORBID',

      // Build tools
      'node_modules/@swc/core@1.15.32': ['postinstall'],

      // Native modules
      'node_modules/msgpackr-extract@3.0.3': ['install'],

      // Protocol buffers
      'node_modules/protobufjs@7.5.6': ['postinstall'],

      // ESBuild is written in GoLang - this is needed to download prebuilt binaries for the specific platform
      'node_modules/esbuild@0.21.5': 'ALLOW',
      // Needed by jest for running tests in watch mode
      'node_modules/fsevents@2.3.3': 'ALLOW',
   },
})