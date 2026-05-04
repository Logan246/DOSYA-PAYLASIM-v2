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

    $stmt = $pdo->prepare("SELECT files.*, shares.expires_at FROM shares JOIN files ON shares.file_id = files.id WHERE shares.share_token = ?");
    $stmt->execute([$token]);
    $file = $stmt->fetch();

    if ($file) {
        // Check expiration
        if ($file['expires_at'] && strtotime($file['expires_at']) < time()) {
            die("Bu paylaşım linkinin süresi dolmuş (24 saatlik limit).");
        }

        $target_path = __DIR__ . '/../uploads/' . $file['filename'];
        if (file_exists($target_path)) {
            // Increment download count
            $update_stmt = $pdo->prepare("UPDATE files SET download_count = download_count + 1 WHERE id = ?");
            $update_stmt->execute([$file['id']]);

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

// Helper for UUID v4
function generate_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

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

    $token = generate_uuid();
    $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    $stmt = $pdo->prepare("INSERT INTO shares (file_id, share_token, expires_at, created_at) VALUES (?, ?, ?, ?)");
    try {
        $stmt->execute([$file_id, $token, $expires_at, date('Y-m-d H:i:s')]);
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $share_url = "$protocol://$_SERVER[HTTP_HOST]" . dirname($_SERVER['PHP_SELF']) . "/share.php?action=get&token=$token";
        echo json_encode(['success' => true, 'share_url' => $share_url, 'expires_at' => $expires_at]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Paylaşım oluşturulamadı: ' . $e->getMessage()]);
    }
    exit;
}
