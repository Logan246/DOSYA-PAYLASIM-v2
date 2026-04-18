<?php
error_reporting(0);
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

require_login();
$user_id = get_user_id();

$file_id = $_GET['id'] ?? null;

if (!$file_id) {
    die("Dosya ID gerekli.");
}

$stmt = $pdo->prepare("SELECT filename, original_name, mime_type FROM files WHERE id = ? AND user_id = ?");
$stmt->execute([$file_id, $user_id]);
$file = $stmt->fetch();

if ($file) {
    $target_path = __DIR__ . '/../uploads/' . $file['filename'];
    if (file_exists($target_path)) {
        // Force download for security (preventing .php or .bat execution in browser)
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream'); // Force download
        header('Content-Disposition: attachment; filename="' . $file['original_name'] . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($target_path));
        
        // Clear buffer to prevent memory issues with large files
        ob_clean();
        flush();
        readfile($target_path);
        exit;
    }
}

die("Dosya bulunamadı veya erişim yetkiniz yok.");
