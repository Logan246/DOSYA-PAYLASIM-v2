<?php
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/auth_helper.php';

require_login();

$action = $_GET['action'] ?? '';

if ($action === 'ping') {
    $input = json_decode(file_get_contents('php://input'), true);
    $ip = $input['ip'] ?? '';
    
    if (filter_var($ip, FILTER_VALIDATE_IP) || preg_match('/^[a-zA-Z0-9\.-]+$/', $ip)) {
        // Windows and Linux compatible ping (limited to 1 packet)
        $command = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') 
            ? "ping -n 1 -w 1000 " . escapeshellarg($ip)
            : "ping -c 1 -W 1 " . escapeshellarg($ip);
            
        exec($command, $output, $result);
        
        // Log tool usage
        require_once __DIR__ . '/../includes/db.php';
        log_action($pdo, get_user_id(), 'TOOL_PING', "IP: $ip, Sonuç: " . ($result === 0 ? 'Online' : 'Offline'));

        echo json_encode([
            'success' => true,
            'online' => ($result === 0),
            'output' => implode("\n", $output)
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Geçersiz IP veya Hostname.']);
    }
    exit;
}

if ($action === 'password') {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    $password = '';
    for ($i = 0; $i < 24; $i++) {
        $password .= $chars[rand(0, strlen($chars) - 1)];
    }
    echo json_encode(['success' => true, 'password' => $password]);
    exit;
}

if ($action === 'port_check') {
    $input = json_decode(file_get_contents('php://input'), true);
    $host = $input['host'] ?? '';
    $port = (int)($input['port'] ?? 0);

    if (empty($host) || $port <= 0 || $port > 65535) {
        echo json_encode(['success' => false, 'message' => 'Geçersiz host veya port.']);
        exit;
    }

    $connection = @fsockopen($host, $port, $errno, $errstr, 2);
    $is_open = is_resource($connection);
    if ($is_open) {
        fclose($connection);
    }

    // Log tool usage
    require_once __DIR__ . '/../includes/db.php';
    log_action($pdo, get_user_id(), 'TOOL_PORTCHECK', "Host: $host, Port: $port, Sonuç: " . ($is_open ? 'Açık' : 'Kapalı'));

    echo json_encode([
        'success' => true,
        'open' => $is_open,
        'message' => $is_open ? "Port $port açık." : "Port $port kapalı veya ulaşılamıyor."
    ]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Geçersiz işlem.']);
