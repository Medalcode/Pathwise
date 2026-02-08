#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', code => resolve({ exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() }));
    child.on('error', err => resolve({ error: String(err) }));
  });
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  if (pkg.scripts && pkg.scripts['test:integration']) {
    const res = await run(npm, ['run', 'test:integration', '--silent']);
    console.log(JSON.stringify({ method: 'npm run test:integration', result: res }, null, 2));
    return;
  }

  // fallback: try running tests under tests/integration via mocha if available
  const res = await run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['mocha', 'tests/integration', '--reporter', 'spec']);
  console.log(JSON.stringify({ method: 'npx mocha tests/integration', result: res }, null, 2));
}

main().catch(e => { console.error(JSON.stringify({ error: String(e) })); process.exit(1); });
