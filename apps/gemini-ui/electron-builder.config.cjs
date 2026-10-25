'use strict';

/**
 * Minimal, unsigned Windows packaging for the Gemini renderer. This is a
 * platform proof build, not a release-signed installer. The root legacy
 * Electron application and its builder configuration are untouched.
 */
module.exports = {
  appId: 'com.knoux.smartorganizer.gemini',
  productName: 'KNOuX Gemini Preview',
  copyright: 'Copyright © 2026 Knoux Technologies',
  asar: true,
  electronVersion: '43.4.1',
  npmRebuild: false,
  directories: {
    output: 'release',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'shared/**/*',
    'package.json',
    '!node_modules/**/*',
  ],
  extraResources: [
    {
      from: '../../electron/windows-providers.cjs',
      to: 'native/windows-providers.cjs',
    },
  ],
  extraMetadata: {
    main: 'electron/main.cjs',
  },
  win: {
    target: ['dir'],
    signAndEditExecutable: false,
  },
};
