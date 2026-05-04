<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

// Tabloyu kontrol et ve oluştur
$pdo->exec("CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    user_id INTEGER, 
    action TEXT, 
    details TEXT, 
    ip_address TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

require_login();

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    try {
        $stmt = $pdo->prepare("SELECT l.*, u.username FROM logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 50");
        $stmt->execute();
        $logs = $stmt->fetchAll() ?: [];
        echo json_encode(['success' => true, 'logs' => $logs]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'add') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action_name = $input['action'] ?? '';
    $details = $input['details'] ?? '';
    
    if ($action_name) {
        log_action($pdo, get_user_id(), $action_name, $details);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Action name required.']);
    }
    exit;
}