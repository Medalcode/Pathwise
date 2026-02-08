#!/usr/bin/env node
const { spawn } = require('child_process');

function run() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['test', '--silent'], { shell: false });
  let stdout = '';
  let stderr = '';

  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });

  child.on('close', code => {
    const result = { exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() };
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  });

  child.on('error', err => {
    console.error(JSON.stringify({ error: String(err) }));
    process.exit(1);
  });
}

run();
