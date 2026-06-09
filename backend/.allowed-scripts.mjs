import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
   allowlist: {
      // Medusa telemetry - FORBID to disable telemetry
      'node_modules/@medusajs/telemetry@2.15.5': 'FORBID',

      // Build tools
      'node_modules/@swc/core@1.15.32': ['postinstall'],

      // Native modules
      'node_modules/msgpackr-extract@3.0.4': ['install'],

      // Protocol buffers
      'node_modules/protobufjs@7.6.2': ['postinstall'],

      // ESBuild is written in GoLang - this is needed to download prebuilt binaries for the specific platform
      'node_modules/esbuild@0.21.5': 'ALLOW',
   },
})