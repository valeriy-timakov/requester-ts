#!/usr/bin/env node

const { spawn } = require('node:child_process');

let electronCliPath;
try {
  electronCliPath = require.resolve('electron/cli.js');
} catch (error) {
  console.error('Cannot resolve Electron CLI. Did you run "npm ci"?');
  process.exit(1);
}

const rawArgs = process.argv.slice(2);
const appArgs = [];
const childEnv = { ...process.env };

for (const arg of rawArgs) {
  if (arg.startsWith('--dev-server-url=')) {
    childEnv.REQUESTER_DEV_SERVER_URL = arg.slice('--dev-server-url='.length);
    continue;
  }

  appArgs.push(arg);
}

const electronArgs = process.platform === 'linux' ? ['--no-sandbox'] : [];

const child = spawn(process.execPath, [electronCliPath, ...electronArgs, ...appArgs], {
  stdio: 'inherit',
  env: childEnv
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
