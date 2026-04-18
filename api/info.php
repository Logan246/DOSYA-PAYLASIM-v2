<?php
error_reporting(0);
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/auth_helper.php';

require_login();

// Disk and System Info
$disk_free = disk_free_space("C:") ?: disk_free_space("/");
$disk_total = disk_total_space("C:") ?: disk_total_space("/");
$disk_usage = round((($disk_total - $disk_free) / $disk_total) * 100, 2);

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
    'uptime' => $uptime
]);
