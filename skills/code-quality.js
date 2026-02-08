#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, { shell: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', code => resolve({ exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() }));
    child.on('error', err => resolve({ error: String(err) }));
  });
}

async function runEslint() {
  const res = await run('npx eslint -f json . 2>/dev/null || true');
  if (!res.stdout) return { note: 'eslint not run or produced no JSON output', raw: res };
  try { return { parsed: JSON.parse(res.stdout) }; } catch (e) { return { error: 'eslint output not JSON', raw: res }; }
}

async function runDepcheck() {
  const res = await run('npx depcheck --json 2>/dev/null || true');
  if (!res.stdout) return { note: 'depcheck not available or produced no output', raw: res };
  try { return { parsed: JSON.parse(res.stdout) }; } catch (e) { return { error: 'depcheck output not JSON', raw: res }; }
}

async function runMadge() {
  const res = await run('npx madge --circular --json . 2>/dev/null || true');
  if (!res.stdout) return { note: 'madge not available or produced no output', raw: res };
  try { return { parsed: JSON.parse(res.stdout) }; } catch (e) { return { error: 'madge output not JSON', raw: res }; }
}

function searchTodos(dir, exts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.sh', '.md', '.json']) {
  const results = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build'].includes(e.name)) continue;
        walk(p);
      } else {
        if (!exts.includes(path.extname(e.name))) continue;
        try {
          const txt = fs.readFileSync(p, 'utf8');
          const lines = txt.split(/\r?\n/);
          lines.forEach((ln, idx) => {
            if (/\b(TODO|FIXME|DEPRECATED)\b/.test(ln)) {
              results.push({ file: p, line: idx + 1, text: ln.trim() });
            }
          });
        } catch (e) {
          /* ignore */
        }
      }
    }
  }
  try { walk(dir); } catch (e) { return { error: String(e) }; }
  return results;
}

async function main() {
  const cwd = process.cwd();
  const eslint = await runEslint();
  const depcheck = await runDepcheck();
  const madge = await runMadge();
  const todos = searchTodos(cwd);

  const summary = {
    eslint,
    depcheck,
    madge,
    todos,
    suggestions: []
  };

  // Simple heuristics for suggestions
  if (depcheck && depcheck.parsed && depcheck.parsed.dependencies && Object.keys(depcheck.parsed.dependencies).length) {
    summary.suggestions.push({ type: 'unused-dependencies', detail: Object.keys(depcheck.parsed.dependencies) });
  }
  if (madge && madge.parsed && Array.isArray(madge.parsed) && madge.parsed.length) {
    summary.suggestions.push({ type: 'circular-dependencies', detail: madge.parsed });
  }
  if (eslint && eslint.parsed) {
    // find high severity issues or complexity warnings
    const problems = [];
    for (const fileReport of eslint.parsed) {
      for (const msg of fileReport.messages || []) {
        if (msg.severity >= 2 || /complexity|max-lines|max-params|no-unused-vars/.test(msg.ruleId || '')) {
          problems.push({ file: fileReport.filePath, message: msg.message, ruleId: msg.ruleId, line: msg.line });
        }
      }
    }
    if (problems.length) summary.suggestions.push({ type: 'eslint-problems', detail: problems.slice(0, 50) });
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch(e => { console.error(JSON.stringify({ error: String(e) })); process.exit(1); });
