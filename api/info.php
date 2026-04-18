<?php
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/auth_helper.php';

require_login();

echo json_encode([
    'success' => true,
    'ip' => $_SERVER['REMOTE_ADDR'],
    'user_agent' => $_SERVER['HTTP_USER_AGENT'],
    'server_time' => date('Y-m-d H:i:s'),
    'os' => PHP_OS,
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE']
]);
