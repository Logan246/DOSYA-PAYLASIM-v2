<?php
error_reporting(0);
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

require_login();
$user_id = get_user_id();

$file_id = $_GET['id'] ?? null;
$preview = isset($_GET['preview']) && $_GET['preview'] == 1;

if (!$file_id) {
    die("Dosya ID gerekli.");
}

$stmt = $pdo->prepare("SELECT filename, original_name, mime_type FROM files WHERE id = ? AND user_id = ?");
$stmt->execute([$file_id, $user_id]);
$file = $stmt->fetch();

if ($file) {
    $target_path = __DIR__ . '/../uploads/' . $file['filename'];
    if (file_exists($target_path)) {
        // Increment download count (only for actual downloads, not previews)
        if (!$preview) {
            $update_stmt = $pdo->prepare("UPDATE files SET download_count = download_count + 1 WHERE id = ?");
            $update_stmt->execute([$file_id]);
            
            // Log download
            log_action($pdo, $user_id, 'DOWNLOAD', "Dosya indirildi: " . $file['original_name']);
        }

        // Handle Preview vs Download
        if ($preview) {
            header('Content-Type: ' . ($file['mime_type'] ?: 'application/octet-stream'));
            header('Content-Disposition: inline; filename="' . $file['original_name'] . '"');
        } else {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream'); // Force download
            header('Content-Disposition: attachment; filename="' . $file['original_name'] . '"');
        }

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
