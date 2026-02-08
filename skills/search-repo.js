#!/usr/bin/env node
const { execSync } = require('child_process');

function usage() {
  console.error('Usage: node search-repo.js "search query"');
  process.exit(2);
}

const query = process.argv.slice(2).join(' ').trim();
if (!query) usage();

try {
  // Prefer git grep if repository, fallback to ripgrep if available
  let cmd;
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    cmd = `git grep -n --untracked -F "${query.replace(/"/g, '\"')}"`;
  } catch (e) {
    cmd = `rg --line-number --hidden --glob "!.git" "${query.replace(/"/g, '\"')}" || true`;
  }

  const out = execSync(cmd, { encoding: 'utf8' });
  const lines = out.split('\n').filter(Boolean);
  const matches = lines.map(line => {
    const m = line.match(/^([^:]+):(\d+):(.*)$/);
    if (m) return { file: m[1], line: Number(m[2]), text: m[3] };
    return { raw: line };
  });

  console.log(JSON.stringify({ query, matches }, null, 2));
} catch (err) {
  // If no matches, git grep exits non-zero; return empty matches
  if (err.status === 1 && err.stdout) {
    const out = (err.stdout || '').toString();
    const lines = out.split('\n').filter(Boolean);
    const matches = lines.map(line => {
      const m = line.match(/^([^:]+):(\d+):(.*)$/);
      if (m) return { file: m[1], line: Number(m[2]), text: m[3] };
      return { raw: line };
    });
    console.log(JSON.stringify({ query, matches }, null, 2));
    process.exit(0);
  }
  console.error(JSON.stringify({ error: String(err) }));
  process.exit(err.status || 1);
}
