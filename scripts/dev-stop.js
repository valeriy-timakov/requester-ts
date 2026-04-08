#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(process.cwd());
const currentPid = process.pid;
const parentPid = process.ppid;

function isTargetProcess(commandLine, pid) {
  if (!commandLine) {
    return false;
  }

  if (pid === currentPid || pid === parentPid) {
    return false;
  }

  const normalizedCmd = commandLine.toLowerCase();
  const normalizedRoot = projectRoot.toLowerCase();

  const isNodeOrElectron =
    normalizedCmd.includes('node') || normalizedCmd.includes('electron');

  return isNodeOrElectron && normalizedCmd.includes(normalizedRoot);
}

function collectPidsUnix() {
  const output = execFileSync('ps', ['-eo', 'pid=,args='], {
    encoding: 'utf8'
  });
  const pids = [];

  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(' ');
    if (separatorIndex === -1) {
      continue;
    }

    const pidText = trimmed.slice(0, separatorIndex).trim();
    const commandLine = trimmed.slice(separatorIndex + 1).trim();
    const pid = Number.parseInt(pidText, 10);

    if (!Number.isFinite(pid)) {
      continue;
    }

    if (isTargetProcess(commandLine, pid)) {
      pids.push(pid);
    }
  }

  return pids;
}

function collectPidsWindows() {
  const script =
    "$project=[System.IO.Path]::GetFullPath('.'); " +
    "Get-CimInstance Win32_Process | " +
    "Where-Object { ($_.Name -eq 'node.exe' -or $_.Name -eq 'electron.exe') -and $_.CommandLine -and $_.CommandLine.ToLower().Contains($project.ToLower()) } | " +
    'ForEach-Object { $_.ProcessId }';

  const output = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8' }
  );

  const pids = [];
  for (const line of output.split('\n')) {
    const pid = Number.parseInt(line.trim(), 10);
    if (Number.isFinite(pid) && pid !== currentPid && pid !== parentPid) {
      pids.push(pid);
    }
  }
  return pids;
}

function killPid(pid) {
  try {
    process.kill(pid, 'SIGKILL');
    return true;
  } catch {
    return false;
  }
}

function main() {
  let pids = [];
  try {
    pids = process.platform === 'win32' ? collectPidsWindows() : collectPidsUnix();
  } catch {
    process.exit(0);
  }

  const uniquePids = [...new Set(pids)];
  for (const pid of uniquePids) {
    killPid(pid);
  }
}

main();
