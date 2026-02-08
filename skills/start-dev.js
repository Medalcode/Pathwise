#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

function detachStart(cmd, args) {
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore', shell: false });
    child.unref();
    return { pid: child.pid };
  } catch (e) {
    return { error: String(e) };
  }
}

function hasDevScript() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.scripts && pkg.scripts.dev;
  } catch (e) {
    return false;
  }
}

async function main() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  if (hasDevScript()) {
    const res = detachStart(npm, ['run', 'dev']);
    console.log(JSON.stringify({ method: 'npm run dev (detached)', result: res }, null, 2));
    return;
  }

  // fallback: try nodemon
  const res = detachStart(process.platform === 'win32' ? 'nodemon.cmd' : 'nodemon', ['server.js']);
  console.log(JSON.stringify({ method: 'nodemon server.js (detached)', result: res }, null, 2));
}

main();
