<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'register') {
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Username and password required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Username already exists']);
            exit;
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        try {
            $stmt->execute([$username, $hashed_password]);
            echo json_encode(['success' => true, 'message' => 'User registered successfully']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Registration failed']);
        }
        exit;
    }

    if ($action === 'login') {
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            login_user($user['id'], $user['username']);
            echo json_encode(['success' => true, 'message' => 'Login successful', 'username' => $user['username']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
        exit;
    }

    if ($action === 'logout') {
        logout_user();
        echo json_encode(['success' => true, 'message' => 'Logged out']);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'check') {
        if (is_logged_in()) {
            echo json_encode(['logged_in' => true, 'username' => $_SESSION['username']]);
        } else {
            echo json_encode(['logged_in' => false]);
        }
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid action or method']);
