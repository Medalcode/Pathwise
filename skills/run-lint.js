#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

function runCommand(cmd, args) {
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
  if (pkg.scripts && pkg.scripts.lint) {
    const res = await runCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'lint', '--silent']);
    console.log(JSON.stringify({ method: 'npm run lint', result: res }, null, 2));
    return;
  }

  // fallback to npx eslint
  const res = await runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['eslint', '.', '--ext', '.js', '--no-color']);
  console.log(JSON.stringify({ method: 'npx eslint', result: res }, null, 2));
}

main().catch(e => { console.error(JSON.stringify({ error: String(e) })); process.exit(1); });
