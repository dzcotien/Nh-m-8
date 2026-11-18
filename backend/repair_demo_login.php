<?php
/** Chạy bằng PHP CLI: php backend/repair_demo_login.php */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/config/db.php';
try {
    $pdo->beginTransaction();
    $pdo->exec('ALTER TABLE nguoi_dung MODIFY COLUMN mat_khau VARCHAR(255) NOT NULL');
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fwrite(STDERR, "Không thể cập nhật cột mật khẩu: {$e->getMessage()}\n"); exit(1);
}
$accounts = [
    ['admin', 'Quản trị viên May Store', 'admin@maystore.local', 'quan_tri'],
    ['khachhang01', 'Khách hàng mẫu', 'khachhang01@maystore.local', 'khach_hang'],
];
foreach ($accounts as [$username,$name,$email,$role]) {
    // Mật khẩu demo được đặt lại bằng password_hash, không ảnh hưởng tài khoản khác.
    $hash = password_hash('password', PASSWORD_DEFAULT);
    $find = $pdo->prepare('SELECT id FROM nguoi_dung WHERE ten_dang_nhap=? OR email=? LIMIT 1');
    $find->execute([$username,$email]);
    $id = $find->fetchColumn();
    if ($id) {
        $update = $pdo->prepare("UPDATE nguoi_dung SET mat_khau=?, trang_thai='hoat_dong', vai_tro=? WHERE id=?");
        $update->execute([$hash,$role,$id]);
    } else {
        $insert = $pdo->prepare("INSERT INTO nguoi_dung(ho_ten,email,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES(?,?,?,?,?,'hoat_dong')");
        $insert->execute([$name,$email,$username,$hash,$role]);
    }
    echo "Đã khôi phục tài khoản demo: {$username}\n";
}
echo "Hoàn tất. Đăng nhập bằng mật khẩu demo 'password'. Đổi mật khẩu ngay trước khi triển khai công khai.\n";
