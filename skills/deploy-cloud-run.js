#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', code => resolve({ exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() }));
    child.on('error', err => resolve({ error: String(err) }));
  });
}

async function main() {
  if (!fs.existsSync('deploy-cloud-run.sh')) {
    console.log(JSON.stringify({ error: 'deploy-cloud-run.sh not found at repository root' }));
    return;
  }
  const res = await run('bash', ['deploy-cloud-run.sh']);
  console.log(JSON.stringify({ method: 'bash deploy-cloud-run.sh', result: res }, null, 2));
}

main().catch(e => { console.error(JSON.stringify({ error: String(e) })); process.exit(1); });
