<?php
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

$action = $_GET['action'] ?? '';

// Public access for shared links
if ($action === 'get') {
    $token = $_GET['token'] ?? '';
    if (!$token) die("Token gerekli.");

    $stmt = $pdo->prepare("SELECT files.* FROM shares JOIN files ON shares.file_id = files.id WHERE shares.share_token = ?");
    $stmt->execute([$token]);
    $file = $stmt->fetch();

    if ($file) {
        $target_path = __DIR__ . '/../uploads/' . $file['filename'];
        if (file_exists($target_path)) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $file['original_name'] . '"');
            header('Content-Length: ' . filesize($target_path));
            readfile($target_path);
            exit;
        }
    }
    die("Dosya bulunamadı veya paylaşım süresi dolmuş.");
}

// Restricted actions
require_login();
$user_id = get_user_id();

if ($action === 'create') {
    $input = json_decode(file_get_contents('php://input'), true);
    $file_id = $input['file_id'] ?? null;

    if (!$file_id) {
        echo json_encode(['success' => false, 'message' => 'Dosya ID gerekli.']);
        exit;
    }

    // Verify ownership
    $stmt = $pdo->prepare("SELECT id FROM files WHERE id = ? AND user_id = ?");
    $stmt->execute([$file_id, $user_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Yetkisiz işlem.']);
        exit;
    }

    $token = bin2hex(random_bytes(16));
    $stmt = $pdo->prepare("INSERT INTO shares (file_id, share_token, created_at) VALUES (?, ?, ?)");
    try {
        $stmt->execute([$file_id, $token, date('Y-m-d H:i:s')]);
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $share_url = "$protocol://$_SERVER[HTTP_HOST]" . dirname($_SERVER['PHP_SELF']) . "/share.php?action=get&token=$token";
        echo json_encode(['success' => true, 'share_url' => $share_url]);
    } catch (PDOException $e) {
        // If token exists, try again once
        echo json_encode(['success' => false, 'message' => 'Paylaşım oluşturulamadı.']);
    }
    exit;
}
