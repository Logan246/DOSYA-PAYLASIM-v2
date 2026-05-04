<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

// Tabloyu kontrol et
$pdo->exec("CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, filename TEXT, original_name TEXT, file_path TEXT, file_size INTEGER, mime_type TEXT, tags TEXT DEFAULT '', created_at DATETIME)");

require_login();
$user_id = get_user_id();

/**
 * Dosya ismini temizler (Slugify)
 */
function slugify($text) {
    $find = array('Ç', 'Ş', 'Ğ', 'Ü', 'İ', 'Ö', 'ç', 'ş', 'ğ', 'ü', 'ö', 'ı', '+', '#');
    $replace = array('C', 'S', 'G', 'U', 'I', 'O', 'c', 's', 'g', 'u', 'o', 'i', 'plus', 'sharp');
    $text = str_replace($find, $replace, $text);
    $text = preg_replace('/[^a-zA-Z0-9\._-]/', '_', $text);
    return $text;
}

$action = $_GET['action'] ?? 'list';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'delete') {
        $input = json_decode(file_get_contents('php://input'), true);
        $file_id = $input['id'] ?? null;

        if (!$file_id) {
            echo json_encode(['success' => false, 'message' => 'File ID required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, filename FROM files WHERE id = ? AND user_id = ?");
        $stmt->execute([$file_id, $user_id]);
        $file = $stmt->fetch();

        if ($file) {
            $original_name = $file['original_name'];
            $target_path = __DIR__ . '/../uploads/' . $file['filename'];
            if (file_exists($target_path)) {
                unlink($target_path);
            }
            $stmt = $pdo->prepare("DELETE FROM files WHERE id = ?");
            $stmt->execute([$file_id]);

            // Log deletion
            log_action($pdo, $user_id, 'DELETE', "Dosya silindi: $original_name");

            echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'File not found or access denied']);
        }
        exit;
    }

    if ($action === 'update_tags') {
        $input = json_decode(file_get_contents('php://input'), true);
        $file_id = $input['id'] ?? null;
        $tags = trim($input['tags'] ?? '');

        if (!$file_id) {
            echo json_encode(['success' => false, 'message' => 'File ID required']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE files SET tags = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$tags, $file_id, $user_id]);
        echo json_encode(['success' => true, 'message' => 'Etiketler güncellendi']);
        exit;
    }

    if ($action === 'save_content') {
        $input = json_decode(file_get_contents('php://input'), true);
        $file_id = $input['id'] ?? null;
        $content = $input['content'] ?? '';

        if (!$file_id) {
            echo json_encode(['success' => false, 'message' => 'File ID required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT filename, original_name FROM files WHERE id = ? AND user_id = ?");
        $stmt->execute([$file_id, $user_id]);
        $file = $stmt->fetch();

        if ($file) {
            $ext = strtolower(pathinfo($file['original_name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['txt', 'bat', 'py'])) {
                echo json_encode(['success' => false, 'message' => 'Bu dosya türü düzenlenemez.']);
                exit;
            }

            $target_path = __DIR__ . '/../uploads/' . $file['filename'];
            if (file_put_contents($target_path, $content) !== false) {
                log_action($pdo, $user_id, 'EDIT', "Dosya düzenlendi: " . $file['original_name']);
                echo json_encode(['success' => true, 'message' => 'Dosya kaydedildi']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Dosya yazılamadı']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Dosya bulunamadı']);
        }
        exit;
    }

    if ($action === 'rename') {
        $input = json_decode(file_get_contents('php://input'), true);
        $file_id = $input['id'] ?? null;
        $new_name = trim($input['new_name'] ?? '');

        if (!$file_id || empty($new_name)) {
            echo json_encode(['success' => false, 'message' => 'Dosya ID ve yeni isim gerekli.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT filename, original_name FROM files WHERE id = ? AND user_id = ?");
        $stmt->execute([$file_id, $user_id]);
        $file = $stmt->fetch();

        if ($file) {
            $old_filename = $file['filename'];
            $old_original_name = $file['original_name'];
            $ext = pathinfo($old_original_name, PATHINFO_EXTENSION);
            
            $new_base_name = pathinfo($new_name, PATHINFO_FILENAME);
            $new_original_name = $new_base_name . ($ext ? '.' . $ext : '');
            
            $clean_name = slugify($new_base_name);
            $new_physical_filename = uniqid() . '_' . $clean_name . ($ext ? '.' . $ext : '');
            
            $upload_dir = __DIR__ . '/../uploads/';
            $old_path = $upload_dir . $old_filename;
            $new_path = $upload_dir . $new_physical_filename;

            if (file_exists($old_path)) {
                if (rename($old_path, $new_path)) {
                    $stmt = $pdo->prepare("UPDATE files SET original_name = ?, filename = ?, file_path = ? WHERE id = ? AND user_id = ?");
                    $stmt->execute([$new_original_name, $new_physical_filename, 'uploads/' . $new_physical_filename, $file_id, $user_id]);
                    
                    log_action($pdo, $user_id, 'RENAME', "$old_original_name -> $new_original_name (Fiziksel: $new_physical_filename)");
                    echo json_encode(['success' => true, 'message' => 'Dosya ve kayıt başarıyla güncellendi.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Fiziksel dosya adı değiştirilemedi.']);
                }
            } else {
                $stmt = $pdo->prepare("UPDATE files SET original_name = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$new_original_name, $file_id, $user_id]);
                echo json_encode(['success' => true, 'message' => 'Dosya bulunamadı, sadece kayıt ismi güncellendi.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Dosya bulunamadı.']);
        }
        exit;
    }

    if ($action === 'bulk_delete') {
        $input = json_decode(file_get_contents('php://input'), true);
        $ids = $input['ids'] ?? [];

        if (empty($ids)) {
            echo json_encode(['success' => false, 'message' => 'Silinecek dosya seçilmedi.']);
            exit;
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT filename, original_name FROM files WHERE id IN ($placeholders) AND user_id = ?");
        $stmt->execute([...$ids, $user_id]);
        $files_to_delete = $stmt->fetchAll();

        $deleted_count = 0;
        foreach ($files_to_delete as $file) {
            $target_path = __DIR__ . '/../uploads/' . $file['filename'];
            if (file_exists($target_path)) {
                unlink($target_path);
            }
        }

        $stmt = $pdo->prepare("DELETE FROM files WHERE id IN ($placeholders) AND user_id = ?");
        $stmt->execute([...$ids, $user_id]);
        $deleted_count = $stmt->rowCount();

        log_action($pdo, $user_id, 'BULK_DELETE', "$deleted_count dosya silindi.");
        echo json_encode(['success' => true, 'message' => "$deleted_count dosya silindi."]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT id, original_name, file_size, mime_type, tags, category, md5_hash, download_count, created_at FROM files WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $files = $stmt->fetchAll();
        echo json_encode(['success' => true, 'files' => $files ?: []]);
        exit;
    }

    if ($action === 'get_content') {
        $file_id = $_GET['id'] ?? null;
        if (!$file_id) {
            echo json_encode(['success' => false, 'message' => 'File ID required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT filename, original_name FROM files WHERE id = ? AND user_id = ?");
        $stmt->execute([$file_id, $user_id]);
        $file = $stmt->fetch();

        if ($file) {
            $ext = strtolower(pathinfo($file['original_name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['txt', 'bat', 'py'])) {
                echo json_encode(['success' => false, 'message' => 'Bu dosya türü okunamaz.']);
                exit;
            }

            $target_path = __DIR__ . '/../uploads/' . $file['filename'];
            if (file_exists($target_path)) {
                $content = file_get_contents($target_path);
                echo json_encode(['success' => true, 'content' => $content]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Dosya bulunamadı']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Erişim engellendi']);
        }
        exit;
    }

    if ($action === 'download') {
        $file_id = $_GET['id'] ?? null;
        if (!$file_id) {
            die('File ID required');
        }

        $stmt = $pdo->prepare("SELECT filename, original_name, mime_type FROM files WHERE id = ? AND user_id = ?");
        $stmt->execute([$file_id, $user_id]);
        $file = $stmt->fetch();

        if ($file) {
            $target_path = __DIR__ . '/../uploads/' . $file['filename'];
            if (file_exists($target_path)) {
                header('Content-Description: File Transfer');
                header('Content-Type: ' . $file['mime_type']);
                header('Content-Disposition: attachment; filename="' . $file['original_name'] . '"');
                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . filesize($target_path));
                readfile($target_path);
                exit;
            }
        }
        die('File not found');
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid action or method']);
