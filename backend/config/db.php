<?php
declare(strict_types=1);
$host = getenv('MAYSTORE_DB_HOST') ?: '127.0.0.1';
$db = getenv('MAYSTORE_DB_NAME') ?: 'maystore';
$user = getenv('MAYSTORE_DB_USER') ?: 'root';
$pass = getenv('MAYSTORE_DB_PASS') ?: '';
if (!preg_match('/^[a-zA-Z0-9_]+$/', $db)) {
    http_response_code(500);
    exit('Tên cơ sở dữ liệu không hợp lệ.');
}
try {
    $pdo = new PDO("mysql:host={$host};dbname={$db};charset=utf8mb4", $user, $pass, [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false, ]); } catch (Throwable $e) { if (PHP_SAPI === 'cli') { fwrite(STDERR, "Không kết nối được MySQL/database {$db}. Kiểm tra XAMPP và cấu hình.\n"); exit(1); } http_response_code(503); header('Content-Type: application/json; charset=utf-8'); echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Không thể kết nối MySQL. Kiểm tra XAMPP, tên database và cấu hình backend/config/db.php.'], JSON_UNESCAPED_UNICODE); exit; }
