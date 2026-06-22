<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

const DEFAULT_DASHBOARD_PASSWORD_HASH = 'd3a0f7d71b05d259a0d2d695014d114aceb5b8cdd26e91bfcb6b98544864bc99';

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
$password = is_array($input) && isset($input['password']) ? (string) $input['password'] : '';
$expectedHash = getenv('DASHBOARD_PASSWORD_HASH') ?: DEFAULT_DASHBOARD_PASSWORD_HASH;

if (!$password || !hash_equals($expectedHash, hash('sha256', $password))) {
    respond(401, ['ok' => false, 'error' => 'Invalid dashboard password']);
}

$projectRoot = getenv('DASHBOARD_PROJECT_ROOT') ?: realpath(__DIR__ . '/../..');
$refreshCommand = getenv('DASHBOARD_REFRESH_COMMAND') ?: 'npm run refresh:ads';

if (!$projectRoot || !is_dir($projectRoot)) {
    respond(500, ['ok' => false, 'error' => 'Dashboard project root is not configured']);
}

$command = 'cd ' . escapeshellarg($projectRoot) . ' && ' . $refreshCommand . ' 2>&1';
$output = [];
$exitCode = 1;
exec($command, $output, $exitCode);

respond($exitCode === 0 ? 200 : 500, [
    'ok' => $exitCode === 0,
    'exitCode' => $exitCode,
    'message' => $exitCode === 0 ? 'Ads dashboard data refreshed' : 'Ads dashboard refresh failed',
    'output' => array_slice($output, -12),
]);
