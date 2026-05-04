<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_helper.php';

// Tabloları kontrol et
$pdo->exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, created_at DATETIME)");
$pdo->exec("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT, details TEXT, ip_address TEXT, created_at DATETIME)");

require_login();

// Disk and System Info
$disk_free = disk_free_space("C:") ?: disk_free_space("/");
$disk_total = disk_total_space("C:") ?: disk_total_space("/");
$disk_usage = round((($disk_total - $disk_free) / $disk_total) * 100, 2);

// RAM Usage (Windows specific for now as it's common on local setups)
$ram_usage = "Bilgi alınamadı";
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $cmd = 'wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value';
    $output = shell_exec($cmd);
    if ($output) {
        $lines = explode("\n", trim($output));
        $total_ram = 0;
        $free_ram = 0;
        foreach($lines as $line) {
            if (strpos($line, 'TotalVisibleMemorySize') !== false) $total_ram = (int)filter_var($line, FILTER_SANITIZE_NUMBER_INT);
            if (strpos($line, 'FreePhysicalMemory') !== false) $free_ram = (int)filter_var($line, FILTER_SANITIZE_NUMBER_INT);
        }
        if ($total_ram > 0) {
            $used_ram = $total_ram - $free_ram;
            $ram_pct = round(($used_ram / $total_ram) * 100, 2);
            $ram_usage = $ram_pct . "% (" . round($used_ram / 1024 / 1024, 2) . " GB / " . round($total_ram / 1024 / 1024, 2) . " GB)";
        }
    }
}

// Uptime calculation (cross-platform)
$uptime = "Bilgi alınamadı";
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $out = shell_exec('wmic path Win32_OperatingSystem get LastBootUpTime');
    if ($out) {
        $lines = explode("\n", trim($out));
        if (isset($lines[1])) {
            $boot_time_str = trim($lines[1]);
            // Format: YYYYMMDDHHMMSS.MMMMMM+UUU
            $year = substr($boot_time_str, 0, 4);
            $month = substr($boot_time_str, 4, 2);
            $day = substr($boot_time_str, 6, 2);
            $hour = substr($boot_time_str, 8, 2);
            $minute = substr($boot_time_str, 10, 2);
            $second = substr($boot_time_str, 12, 2);
            
            $boot_time = strtotime("$year-$month-$day $hour:$minute:$second");
            $diff = time() - $boot_time;
            
            $days = floor($diff / 86400);
            $hours = floor(($diff % 86400) / 3600);
            $minutes = floor(($diff % 3600) / 60);
            
            $uptime = "";
            if ($days > 0) $uptime .= "$days gün ";
            if ($hours > 0) $uptime .= "$hours saat ";
            $uptime .= "$minutes dk";
        }
    }
} else {
    $uptime = shell_exec('uptime -p');
}

echo json_encode([
    'success' => true,
    'ip' => $_SERVER['REMOTE_ADDR'],
    'user_agent' => $_SERVER['HTTP_USER_AGENT'],
    'server_time' => date('Y-m-d H:i:s'),
    'os' => PHP_OS,
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'],
    'disk' => [
        'total' => $disk_total,
        'free' => $disk_free,
        'usage' => $disk_usage
    ],
    'ram' => $ram_usage,
    'uptime' => $uptime
]);
