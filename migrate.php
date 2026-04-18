<?php
try {
    $pdo = new PDO("sqlite:database.sqlite");
    $pdo->exec("ALTER TABLE files ADD COLUMN tags TEXT DEFAULT ''");
    echo "Column 'tags' added successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>