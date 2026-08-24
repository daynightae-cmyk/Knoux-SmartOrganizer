const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const executable = process.env.KNOUX_VISUAL_EXECUTABLE ? path.resolve(process.env.KNOUX_VISUAL_EXECUTABLE) : path.join(root, 'release', 'win-unpacked', 'KNOuX SmartOrganizer.exe');
const evidencePath = path.join(root, 'docs', 'evidence', 'visual-acceptance.json');
const screenshotsPath = path.join(root, 'docs', 'evidence', 'visual-acceptance');

function launch(file, args) { return new Promise((resolve, reject) => { const child = spawn(file, args, { windowsHide: true, stdio: 'ignore' }); const timer = setTimeout(() => { child.kill(); reject(new Error('Visual acceptance timed out after 180 seconds.')); }, 180000); child.once('error', error => { clearTimeout(timer); reject(error); }); child.once('exit', code => { clearTimeout(timer); resolve(code); }); }); }
function assert(condition, message) { if (!condition) throw new Error(message); }

async function main() {
  await fs.access(executable);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-visual-acceptance-'));
  const output = path.join(temp, 'visual-evidence.json');
  const userData = path.join(temp, 'user-data');
  let completed = false;
  try {
    const code = await launch(executable, [`--user-data-dir=${userData}`, `--knoux-visual-smoke-output=${output}`]);
    assert(code === 0, `Visual acceptance exited with code ${code}.`);
    const evidence = JSON.parse(await fs.readFile(output, 'utf8'));
    assert(evidence.packaged === true, 'Visual acceptance did not run from a packaged application.');
    assert(Array.isArray(evidence.scenarios) && evidence.scenarios.length === 4, 'Expected all four visual acceptance scenarios.');
    for (const scenario of evidence.scenarios) {
      assert(scenario.focusable > 0, `${scenario.id} has no keyboard-focusable controls.`);
      assert(scenario.horizontalOverflow === false, `${scenario.id} has horizontal layout overflow.`);
      assert(scenario.dir === (scenario.locale === 'ar' ? 'rtl' : 'ltr'), `${scenario.id} did not apply its required direction.`);
      assert(scenario.lang === scenario.locale, `${scenario.id} did not apply its required locale.`);
    }
    await fs.rm(screenshotsPath, { recursive: true, force: true });
    await fs.mkdir(screenshotsPath, { recursive: true });
    for (const scenario of evidence.scenarios) await fs.copyFile(path.join(`${output}.screenshots`, scenario.screenshot), path.join(screenshotsPath, scenario.screenshot));
    await fs.writeFile(evidencePath, JSON.stringify({ ...evidence, scope: 'Packaged visual acceptance at fixed window sizes and in-app zoom factors. This is not a claim of native Windows DPI or clean-machine verification.' }, null, 2), 'utf8');
    console.log('Visual acceptance PASS: packaged RTL/LTR layout, focusable controls, and no horizontal overflow were verified.');
    completed = true;
  } finally { if (!completed) await fs.copyFile(output, path.join(root, 'docs', 'evidence', 'visual-acceptance-failure.json')).catch(() => {}); await fs.rm(temp, { recursive: true, force: true }); }
}
main().catch(error => { console.error(`Visual acceptance FAILED: ${error.message}`); process.exitCode = 1; });
