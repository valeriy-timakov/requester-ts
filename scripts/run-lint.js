#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['eslint', '.'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ESLINT_USE_FLAT_CONFIG: 'false'
  }
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
