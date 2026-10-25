'use strict';

/**
 * Launches the Gemini Electron shell with the project-local Electron binary.
 * ELECTRON_RUN_AS_NODE is removed because some terminals export it globally,
 * which would make Electron behave as plain Node and prevent a real window.
 */
const path = require('node:path');
const { spawn } = require('node:child_process');

const electronPath = require('electron');
const mainPath = path.join(__dirname, '..', 'electron', 'main.cjs');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [mainPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});

child.on('error', (error) => {
  console.error('[gemini-shell] failed to launch Electron:', error.message);
  process.exit(1);
});
child.on('exit', (code) => process.exit(code ?? 0));
