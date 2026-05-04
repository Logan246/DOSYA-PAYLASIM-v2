<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

// Veritabanı dosyası yazılabilir mi kontrol et
if (!is_writable(__DIR__ . '/../database.sqlite')) {
    echo json_encode(['success' => false, 'message' => 'Veritabanı dosyası yazılabilir değil!']);
    exit;
}

// Veritabanı tablolarını kontrol et ve oluştur
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        user_id INTEGER, 
        content TEXT, 
        priority TEXT DEFAULT 'normal', 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Tablo oluşturma hatası: ' . $e->getMessage()]);
    exit;
}

// Oturum kontrolü
require_login();
$user_id = get_user_id();

$action = $_GET['action'] ?? 'list';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'add') {
        $content = trim($input['content'] ?? '');
        $priority = $input['priority'] ?? 'normal';
        
        if (empty($content)) {
            echo json_encode(['success' => false, 'message' => 'Not içeriği boş olamaz.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO notes (user_id, content, priority, created_at) VALUES (:user_id, :content, :priority, :created_at)");
        try {
            $now = date('Y-m-d H:i:s');
            $stmt->execute(['user_id' => $user_id, 'content' => $content, 'priority' => $priority, 'created_at' => $now]);
            
            // Log ekle
            log_action($pdo, $user_id, 'NOTE_ADD', "Yeni not eklendi: " . substr($content, 0, 30) . "...");
            
            echo json_encode(['success' => true, 'message' => 'Not kaydedildi.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Veritabanı kayıt hatası: ' . $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'delete') {
        $note_id = $input['id'] ?? null;
        if (!$note_id) {
            echo json_encode(['success' => false, 'message' => 'Not ID gerekli.']);
            exit;
        }

        // Silinmeden önce içeriği al (log için)
        $stmt = $pdo->prepare("SELECT content FROM notes WHERE id = ? AND user_id = ?");
        $stmt->execute([$note_id, $user_id]);
        $note = $stmt->fetch();

        $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ? AND user_id = ?");
        $stmt->execute([$note_id, $user_id]);

        if ($note) {
            log_action($pdo, $user_id, 'NOTE_DELETE', "Not silindi: " . substr($note['content'], 0, 30) . "...");
        }

        echo json_encode(['success' => true, 'message' => 'Not silindi.']);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        try {
            $stmt = $pdo->prepare("SELECT id, content, priority, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$user_id]);
            $notes = $stmt->fetchAll() ?: [];
            echo json_encode(['success' => true, 'notes' => $notes]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => 'Notlar listelenirken bir hata oluştu.']);
        }
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Geçersiz işlem.']);
