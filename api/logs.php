<?php
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

require_login();
$user_id = get_user_id();

$action = $_GET['action'] ?? 'list';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT logs.*, users.username FROM logs LEFT JOIN users ON logs.user_id = users.id ORDER BY logs.created_at DESC LIMIT 100");
        $stmt->execute();
        $logs = $stmt->fetchAll();
        echo json_encode(['success' => true, 'logs' => $logs]);
        exit;
    }
}
