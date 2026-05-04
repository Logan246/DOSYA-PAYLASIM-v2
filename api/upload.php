<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
set_time_limit(0); // Büyük dosyalar için zaman aşımını engelle
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

// Disk Alanı Kontrolü
$free_space = disk_free_space(__DIR__ . '/../uploads/');
$file_size = $_POST['totalSize'] ?? 0;

if ($free_space < $file_size) {
    echo json_encode(['success' => false, 'message' => 'Yetersiz disk alanı.']);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'upload') {
    $fileName = $_POST['fileName'] ?? '';
    $chunkIndex = (int)($_POST['chunkIndex'] ?? 0);
    $totalChunks = (int)($_POST['totalChunks'] ?? 0);
    $fileUuid = $_POST['fileUuid'] ?? ''; // Parçaları gruplamak için

    if (!$fileName || !$fileUuid) {
        echo json_encode(['success' => false, 'message' => 'Geçersiz parametreler.']);
        exit;
    }

    $tempDir = __DIR__ . '/../uploads/temp/' . $fileUuid;
    if (!is_dir($tempDir)) {
        mkdir($tempDir, 0777, true);
    }

    $chunkFile = $tempDir . '/' . $chunkIndex;
    if (move_uploaded_file($_FILES['file']['tmp_name'], $chunkFile)) {
        
        // Eğer tüm parçalar yüklendiyse birleştir
        $uploadedChunks = count(glob("$tempDir/*"));
        if ($uploadedChunks === $totalChunks) {
            $path_parts = pathinfo($fileName);
            $ext = isset($path_parts['extension']) ? $path_parts['extension'] : '';
            $base_name = $path_parts['filename'];

            // Otomatik Versiyonlama
            $version = 0;
            $final_original_name = $fileName;
            while (true) {
                $stmt = $pdo->prepare("SELECT id FROM files WHERE user_id = ? AND original_name = ?");
                $stmt->execute([$user_id, $final_original_name]);
                if (!$stmt->fetch()) break;
                $version++;
                $final_original_name = $base_name . " (v$version)" . ($ext ? '.' . $ext : '');
            }

            $clean_name = slugify($base_name);
            $new_filename = uniqid() . '_' . $clean_name . ($ext ? '.' . $ext : '');
            $finalPath = __DIR__ . '/../uploads/' . $new_filename;

            $out = fopen($finalPath, "wb");
            if ($out) {
                for ($i = 0; $i < $totalChunks; $i++) {
                    $in = fopen("$tempDir/$i", "rb");
                    if ($in) {
                        while ($buff = fread($in, 4096)) {
                            fwrite($out, $buff);
                        }
                        fclose($in);
                        unlink("$tempDir/$i");
                    }
                }
                fclose($out);
                rmdir($tempDir);

                // Veritabanına Kaydet
                $md5 = md5_file($finalPath);
                $category = $_POST['category'] ?? 'Genel';
                
                $stmt = $pdo->prepare("INSERT INTO files (user_id, filename, original_name, file_path, file_size, mime_type, category, md5_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$user_id, $new_filename, $final_original_name, 'uploads/' . $new_filename, filesize($finalPath), $_POST['mimeType'] ?? '', $category, $md5, date('Y-m-d H:i:s')]);
                
                log_action($pdo, $user_id, 'UPLOAD', "Dosya yüklendi (Chunked): $final_original_name");
                
                echo json_encode(['success' => true, 'message' => 'Dosya başarıyla birleştirildi ve yüklendi.', 'merged' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Dosya birleştirme hatası.']);
            }
        } else {
            echo json_encode(['success' => true, 'chunk' => $chunkIndex, 'merged' => false]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Parça yükleme hatası.']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Geçersiz istek.']);
