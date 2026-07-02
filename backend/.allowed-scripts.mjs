import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // Medusa telemetry - FORBID to disable telemetry
    'node_modules/@medusajs/telemetry@2.17.1': 'FORBID',

    // Build tools
    'node_modules/@swc/core@1.15.43': ['postinstall'],

    // Native modules
    'node_modules/msgpackr-extract@3.0.4': ['install'],

    // Protocol buffers
    'node_modules/protobufjs@7.6.4': ['postinstall'],

    // ESBuild is written in GoLang - this is needed to download prebuilt binaries for the specific platform
    'node_modules/esbuild@0.21.5': 'ALLOW',
    'node_modules/fsevents@2.3.3': 'ALLOW',
  },
})
