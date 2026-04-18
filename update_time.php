<?php
require_once __DIR__ . '/includes/db.php';

$tables = ['users', 'files', 'notes', 'logs', 'shares'];

foreach ($tables as $table) {
    echo "Updating $table...\n";
    // SQLite datetime(column, '+3 hours') function
    $stmt = $pdo->prepare("UPDATE $table SET created_at = datetime(created_at, '+3 hours')");
    $stmt->execute();
    echo "Done.\n";
}
echo "All timestamps updated to UTC+3.\n";
?>