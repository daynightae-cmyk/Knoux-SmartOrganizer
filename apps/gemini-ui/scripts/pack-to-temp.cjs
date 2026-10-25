'use strict';
/** Packages with the same electron-builder config into a temp output. Useful
 *  when a workspace file watcher holds handles on newly extracted files. */
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const builder = path.join(__dirname, '..', 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js');
const output = path.join(os.tmpdir(), 'knoux-gemini-release');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
console.log(`[pack-to-temp] ${output}`);
const child = spawn(process.execPath, [builder, '--config', 'electron-builder.config.cjs', '--dir', '--publish', 'never', `--config.directories.output=${output}`], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env,
});
child.on('exit', (code) => {
  console.log(`PACKAGED_DIR=${path.join(output, 'win-unpacked')}`);
  process.exit(code ?? 1);
});
