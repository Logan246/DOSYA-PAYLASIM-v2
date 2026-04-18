<?php
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

require_login();
$user_id = get_user_id();

$action = $_GET['action'] ?? 'list';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'add') {
        $content = trim($input['content'] ?? '');
        $priority = $input['priority'] ?? 'low';
        
        if (empty($content)) {
            echo json_encode(['success' => false, 'message' => 'Not içeriği boş olamaz.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO notes (user_id, content, priority) VALUES (?, ?, ?)");
        try {
            $stmt->execute([$user_id, $content, $priority]);
            echo json_encode(['success' => true, 'message' => 'Not kaydedildi.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Veritabanı hatası.']);
        }
        exit;
    }

    if ($action === 'delete') {
        $note_id = $input['id'] ?? null;
        if (!$note_id) {
            echo json_encode(['success' => false, 'message' => 'Not ID gerekli.']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ? AND user_id = ?");
        $stmt->execute([$note_id, $user_id]);
        echo json_encode(['success' => true, 'message' => 'Not silindi.']);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT id, content, priority, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $notes = $stmt->fetchAll();
        echo json_encode(['success' => true, 'notes' => $notes]);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Geçersiz işlem.']);
