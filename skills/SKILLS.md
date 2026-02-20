# 🛠️ Pathwise — Skills Reference

> This document describes all skills available to the **PathwiseAI** agent.  
> Skills are executable scripts located in the `skills/` directory and declared in `skills/manifest.json`.

---

## Skill Registry

| ID                  | Script                    | Permissions              | Description                                          |
|---------------------|---------------------------|--------------------------|------------------------------------------------------|
| `search-repo`       | `search-repo.js`          | filesystem, git          | Search text across repository (git grep / ripgrep)   |
| `run-tests`         | `run-tests.js`            | process                  | Run the full test suite via `npm test`               |
| `run-lint`          | `run-lint.js`             | process                  | Run ESLint across the codebase                       |
| `test-unit`         | `test-unit.js`            | process                  | Run unit tests only                                  |
| `test-integration`  | `test-integration.js`     | process                  | Run integration tests in `tests/integration/`        |
| `npm-audit`         | `npm-audit.js`            | process                  | Run `npm audit --json` vulnerability report          |
| `deploy-cloud-run`  | `deploy-cloud-run.js`     | process                  | Deploy backend to Google Cloud Run                   |
| `start-dev`         | `start-dev.js`            | process                  | Start the dev server in background, return PID       |
| `code-quality`      | `code-quality.js`         | filesystem, process      | Static analysis: cycles, unused deps, TODOs          |

---

## Skill Details

---

### 🔍 `search-repo` — Search Repository

**File**: `skills/search-repo.js`  
**Permissions**: `filesystem`, `git`

**Purpose**: Search for text patterns across the entire repository using `git grep` or `ripgrep`. Returns structured matches with file paths, line numbers, and matched content.

**Arguments**:
| Argument | Type   | Required | Description                    |
|----------|--------|----------|--------------------------------|
| `query`  | string | ✅       | Text or regex pattern to search |

**Output**:
```json
{
  "matches": [
    { "file": "backend/routes/profiles.js", "line": 42, "content": "userId = 1" }
  ],
  "count": 1,
  "query": "userId = 1"
}
```

**Example Use Cases**:
- Find all hardcoded `userId` occurrences
- Locate all usages of a deprecated function
- Find all TODO/FIXME comments

---

### 🧪 `run-tests` — Run All Tests

**File**: `skills/run-tests.js`  
**Permissions**: `process`

**Purpose**: Execute the full test suite (`npm test` from project root or `backend/`). Returns stdout, stderr, and exit code.

**Arguments**: None

**Output**:
```json
{
  "exitCode": 0,
  "stdout": "✓ 24 tests passed",
  "stderr": "",
  "duration_ms": 4210
}
```

**When to Use**: After any change to backend services, routes, or database layer. Required before any pull request or deployment.

---

### 🔎 `run-lint` — Run Linter

**File**: `skills/run-lint.js`  
**Permissions**: `process`

**Purpose**: Run ESLint (or `npm run lint`) across the codebase and return structured results.

**Arguments**: None

**Output**:
```json
{
  "exitCode": 0,
  "errors": 0,
  "warnings": 3,
  "files_checked": 47,
  "stdout": "..."
}
```

**When to Use**: Before committing any code. Use to identify style violations and potential bugs caught by static analysis.

---

### 🔬 `test-unit` — Unit Tests Only

**File**: `skills/test-unit.js`  
**Permissions**: `process`

**Purpose**: Run only unit tests (isolated, no I/O, no network). Faster than the full suite.

**Arguments**: None

**Output**: Same shape as `run-tests`.

**When to Use**: During development iterations to get fast feedback without waiting for integration tests.

---

### 🔗 `test-integration` — Integration Tests

**File**: `skills/test-integration.js`  
**Permissions**: `process`

**Purpose**: Run the integration test suite from `backend/tests/integration/`. Tests real database operations, API contracts, and external service mocks.

**Arguments**: None

**Output**: Same shape as `run-tests`.

**Key Test Scenarios Covered**:
- CV upload: invalid PDF, parser failure, AI fallback, DB partial-failure rollback
- Auth: register, login, token refresh, expired token
- Profile: create, update, delete with ownership validation

**When to Use**: Before deployment. After modifying any route, service, or database schema.

---

### 🛡️ `npm-audit` — Vulnerability Report

**File**: `skills/npm-audit.js`  
**Permissions**: `process`

**Purpose**: Run `npm audit --json` and return a structured vulnerability report for the project's dependencies.

**Arguments**: None

**Output**:
```json
{
  "vulnerabilities": {
    "info": 0,
    "low": 2,
    "moderate": 0,
    "high": 0,
    "critical": 0
  },
  "total": 2,
  "raw": { ... }
}
```

**When to Use**: Weekly, or before any production deployment. Escalate any `high` or `critical` finding immediately.

---

### 🚀 `deploy-cloud-run` — Deploy to Google Cloud Run

**File**: `skills/deploy-cloud-run.js`  
**Permissions**: `process`

**Purpose**: Execute `deploy-cloud-run.sh` to build the Docker image and deploy the backend to Google Cloud Run.

**Arguments**: None

**Prerequisites**:
- `gcloud` CLI authenticated and configured
- `backend/.env` variables set for production
- Docker available

**Output**:
```json
{
  "exitCode": 0,
  "service_url": "https://pathwise-xxxx-uc.a.run.app",
  "stdout": "...",
  "stderr": ""
}
```

**⚠️ Warning**: This skill deploys to production. Run `test-integration` first. Confirm with human before executing.

---

### ⚡ `start-dev` — Start Dev Server

**File**: `skills/start-dev.js`  
**Permissions**: `process`

**Purpose**: Start the Express development server (`npm run dev`) as a background process and return the PID for monitoring.

**Arguments**: None

**Output**:
```json
{
  "pid": 12345,
  "url": "http://localhost:8080",
  "status": "running"
}
```

**When to Use**: At the beginning of a development session or before running browser-based tests.

---

### 📊 `code-quality` — Static Analysis Report

**File**: `skills/code-quality.js`  
**Permissions**: `filesystem`, `process`

**Purpose**: Run a comprehensive static analysis pass over the codebase to detect:

- 🔄 **Circular dependencies** between modules
- 📦 **Unused dependencies** in `package.json`
- 🚩 **TODO / FIXME / HACK** markers
- ⚠️ **Deprecated API usage**
- 📏 **Large files** (>300 lines, indicating refactor candidates)

**Arguments**: None

**Output**:
```json
{
  "circular_deps": [],
  "unused_deps": ["lodash"],
  "todos": [
    { "file": "backend/routes/jobs.js", "line": 88, "text": "TODO: add pagination" }
  ],
  "large_files": [
    { "file": "backend/services/groqService.js", "lines": 410 }
  ],
  "score": 82
}
```

**When to Use**: Before planning a refactoring session. Weekly as part of a code health review.

---

## Adding a New Skill

To add a new skill to Pathwise:

1. **Create the script** in `skills/newSkill.js`:

```javascript
#!/usr/bin/env node
// skills/newSkill.js
const { execSync } = require('child_process');

try {
  const output = execSync('your-command --json', {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  console.log(JSON.stringify({ success: true, output }));
} catch (err) {
  console.log(JSON.stringify({ success: false, error: err.message, exitCode: err.status }));
  process.exit(1);
}
```

2. **Register in `skills/manifest.json`**:

```json
{
  "id": "new-skill",
  "name": "Human Readable Name",
  "description": "One-line description of what this skill does.",
  "entry": "newSkill.js",
  "permissions": ["process"],
  "args": []
}
```

3. **Document in this file** following the existing skill detail format.

4. **Reference in `agents.md`** under the "Skills Available" table.

---

## Skill Execution Protocol

When invoking a skill, the agent must:

1. ✅ **Validate prerequisites** (e.g., server running before `test-integration`)
2. ✅ **Log intent** before execution
3. ✅ **Parse JSON output** — all skills return structured JSON
4. ✅ **Handle non-zero exit codes** — surface errors clearly
5. ✅ **Report results** to the user with a concise summary

---

_Pathwise Skills Reference — v1.0 — MedalCode © 2026_
