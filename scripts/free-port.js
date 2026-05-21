const { execFileSync } = require('child_process');

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

function killWindowsListener() {
  const command = [
    '$conn = Get-NetTCPConnection -LocalPort',
    String(port),
    '-State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;',
    'if ($conn) {',
    'Stop-Process -Id $conn.OwningProcess -Force;',
    'Write-Output "Stopped process $($conn.OwningProcess) on port',
    String(port),
    '"',
    '}'
  ].join(' ');

  return execFileSync('powershell.exe', ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function killUnixListener() {
  const pid = execFileSync('sh', ['-c', `lsof -ti tcp:${port} -sTCP:LISTEN || true`], {
    encoding: 'utf8'
  }).trim();

  if (!pid) return '';

  execFileSync('kill', ['-9', pid]);
  return `Stopped process ${pid} on port ${port}`;
}

try {
  const output = process.platform === 'win32' ? killWindowsListener() : killUnixListener();
  if (output.trim()) {
    console.log(output.trim());
  }
} catch (error) {
  console.warn(`Could not clear port ${port}: ${error.message}`);
}
