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
  if (pkg.scripts && pkg.scripts.test) {
    // Try to pass a filter hint (many test runners accept args)
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const res = await run(npm, ['test', '--silent']);
    console.log(JSON.stringify({ method: 'npm test', result: res }, null, 2));
    return;
  }

  console.log(JSON.stringify({ error: 'No test script defined in package.json' }));
}

main().catch(e => { console.error(JSON.stringify({ error: String(e) })); process.exit(1); });
