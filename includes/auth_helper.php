<?php
session_start();
date_default_timezone_set('Europe/Istanbul');

function is_logged_in() {
    return isset($_SESSION['user_id']);
}

function require_login() {
    if (!is_logged_in()) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

function get_user_id() {
    return $_SESSION['user_id'] ?? null;
}

function login_user($user_id, $username) {
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;
}

function logout_user() {
    session_destroy();
}

function log_action($pdo, $user_id, $action, $details = '') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("INSERT INTO logs (user_id, action, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $action, $details, $ip, $now]);
}
