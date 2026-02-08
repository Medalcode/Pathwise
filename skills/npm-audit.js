#!/usr/bin/env node
const { spawn } = require('child_process');

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
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const res = await run(npm, ['audit', '--json']);
  // try to parse stdout into JSON if possible
  try {
    const parsed = res.stdout ? JSON.parse(res.stdout) : null;
    console.log(JSON.stringify({ method: 'npm audit --json', result: parsed || res }, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ method: 'npm audit --json', result: res }, null, 2));
  }
}

main().catch(e => { console.error(JSON.stringify({ error: String(e) })); process.exit(1); });
