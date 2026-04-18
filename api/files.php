<?php
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

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
    if ($action === 'upload') {
        if (!isset($_FILES['file'])) {
            echo json_encode(['success' => false, 'message' => 'Lütfen bir dosya seçin.']);
            exit;
        }

        $file = $_FILES['file'];
        
        // PHP Upload Errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $error_code = $file['error'];
            $error_message = "Dosya yükleme hatası oluştu (Kod: $error_code). ";
            switch ($error_code) {
                case UPLOAD_ERR_INI_SIZE:
                    $error_message .= 'Dosya boyutu sunucu sınırını aşıyor (upload_max_filesize: ' . ini_get('upload_max_filesize') . ').';
                    break;
                case UPLOAD_ERR_FORM_SIZE:
                    $error_message .= 'Dosya boyutu HTML form sınırını aşıyor.';
                    break;
                case UPLOAD_ERR_PARTIAL:
                    $error_message .= 'Dosya sadece kısmen yüklenebildi.';
                    break;
                case UPLOAD_ERR_NO_FILE:
                    $error_message .= 'Dosya seçilmedi.';
                    break;
                case UPLOAD_ERR_NO_TMP_DIR:
                    $error_message .= 'Sunucuda geçici klasör bulunamadı.';
                    break;
                case UPLOAD_ERR_CANT_WRITE:
                    $error_message .= 'Dosya sunucu diskine yazılamadı (İzin hatası olabilir).';
                    break;
                case UPLOAD_ERR_EXTENSION:
                    $error_message .= 'Bir PHP eklentisi dosya yüklemesini durdurdu.';
                    break;
                default:
                    $error_message .= 'Bilinmeyen bir hata oluştu.';
                    break;
            }
            echo json_encode(['success' => false, 'message' => $error_message, 'error_code' => $error_code]);
            exit;
        }

        $original_name = $file['name'];
        $file_size = $file['size'];
        $mime_type = $file['type'];
        $temp_path = $file['tmp_name'];

        $path_parts = pathinfo($original_name);
        $ext = isset($path_parts['extension']) ? $path_parts['extension'] : '';
        $base_name = $path_parts['filename'];

        // Extension Whitelist
        $allowed_extensions = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', 'txt', 'bat', 'py'];
        if (!in_array(strtolower($ext), $allowed_extensions)) {
            echo json_encode(['success' => false, 'message' => "Güvenlik Engeli: .$ext uzantılı dosyalara izin verilmiyor. Sadece güvenli dosya türlerini yükleyebilirsiniz."]);
            exit;
        }

        // Clean filename and add unique ID (using uniqid for microsecond precision)
        $clean_name = slugify($base_name);
        $new_filename = uniqid() . '_' . $clean_name . ($ext ? '.' . $ext : '');
        
        $upload_dir = __DIR__ . '/../uploads/';
        $target_path = $upload_dir . $new_filename;

        if (move_uploaded_file($temp_path, $target_path)) {
            // Verify file exists after move
            if (!file_exists($target_path)) {
                echo json_encode(['success' => false, 'message' => 'Dosya taşındı ancak hedefte bulunamadı.']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO files (user_id, filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)");
            try {
                $stmt->execute([$user_id, $new_filename, $original_name, 'uploads/' . $new_filename, $file_size, $mime_type]);
                
                // Log upload
                require_once __DIR__ . '/logs.php';
                log_action($pdo, $user_id, 'UPLOAD', "Dosya yüklendi: $original_name");
                
                echo json_encode(['success' => true, 'message' => 'File uploaded successfully']);
            } catch (PDOException $e) {
                unlink($target_path);
                echo json_encode(['success' => false, 'message' => 'Database error']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file']);
        }
        exit;
    }

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
            $target_path = __DIR__ . '/../uploads/' . $file['filename'];
            if (file_exists($target_path)) {
                unlink($target_path);
            }
            $stmt = $pdo->prepare("DELETE FROM files WHERE id = ?");
            $stmt->execute([$file_id]);
            echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'File not found or access denied']);
        }
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT id, original_name, file_size, mime_type, created_at FROM files WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $files = $stmt->fetchAll();
        echo json_encode(['success' => true, 'files' => $files]);
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
