# Skills for Copilot Agent (examples)

This folder contains example skills and a manifest for integrating with a Copilot Agent or any tool that can invoke external scripts.

Files
- `manifest.json`: list of skills, entry points and minimal metadata.
- `search-repo.js`: Node script. Usage:

```
node skills/search-repo.js "some query"
```

It prints JSON with matches: `{ query, matches: [{file,line,text}] }`.

- `run-tests.js`: Node script. Usage:

```
node skills/run-tests.js
```

It runs `npm test` in the repository root and prints a JSON summary: `{ exitCode, stdout, stderr }`.

- `run-lint.js`: Run linters (prefers `npm run lint`, falls back to `npx eslint`).
- `test-unit.js`: Run unit tests (invokes `npm test`).
- `test-integration.js`: Run integration tests (prefers `npm run test:integration`, falls back to `npx mocha tests/integration`).
- `npm-audit.js`: Run `npm audit --json` and return parsed vulnerabilities.
- `deploy-cloud-run.js`: Invoke `deploy-cloud-run.sh` at repo root and return output.
- `start-dev.js`: Starts the dev server detached (`npm run dev` or `nodemon server.js`) and returns PID.
- `code-quality.js`: Run several static-analysis helpers (ESLint, depcheck, madge) and search for TODO/FIXME/DEPRECATED comments. Returns a consolidated JSON report with `eslint`, `depcheck`, `madge`, `todos` and `suggestions`.

How to configure in VS Code (manual steps)

1. Read the VS Code Copilot Agent Skills docs: https://code.visualstudio.com/docs/copilot/customization/agent-skills
2. Register these scripts as external skills in your Copilot Agent configuration. Example (conceptual):

```json
{
  "skills": {
    "search-repo": {
      "command": "node",
      "args": ["${workspaceFolder}/skills/search-repo.js"]
    },
    "run-tests": {
      "command": "node",
      "args": ["${workspaceFolder}/skills/run-tests.js"]
    }
    ,
    "run-lint": { "command": "node", "args": ["${workspaceFolder}/skills/run-lint.js"] },
    "test-unit": { "command": "node", "args": ["${workspaceFolder}/skills/test-unit.js"] },
    "test-integration": { "command": "node", "args": ["${workspaceFolder}/skills/test-integration.js"] },
    "npm-audit": { "command": "node", "args": ["${workspaceFolder}/skills/npm-audit.js"] },
    "deploy-cloud-run": { "command": "node", "args": ["${workspaceFolder}/skills/deploy-cloud-run.js"] },
    "start-dev": { "command": "node", "args": ["${workspaceFolder}/skills/start-dev.js"] }
  }
}
```

3. Provide the agent the skill input (CLI args or stdin) according to how you wire it.

Notes
- These are example implementations meant to be adapted to your agent integration method. The exact registration format depends on the agent/extension you use in VS Code.
- Scripts assume Node.js installed and are synchronous/simple for demo purposes.

CI integration
- A GitHub Actions workflow is provided at [/.github/workflows/code-quality.yml](.github/workflows/code-quality.yml) that installs devDependencies, runs `skills/code-quality.js` and uploads `code-quality-report.json` as an artifact.

If you prefer to run locally, install Node.js and run:

```bash
npm ci
node skills/code-quality.js > code-quality-report.json
```
