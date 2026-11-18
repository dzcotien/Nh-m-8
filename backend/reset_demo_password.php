<?php
declare(strict_types=1);
// Chỉ dùng trên localhost, cần chủ động chỉ định tài khoản và mật khẩu mới.
// php backend/reset_demo_password.php admin
if(PHP_SAPI!=='cli') {
    http_response_code(403);
    exit('CLI only');
}
if(!extension_loaded('pdo_mysql')) {
    fwrite(STDERR,"Thiếu pdo_mysql\n");
    exit(1);
}
$username=$argv[1]??'';
if(!preg_match('/^[A-Za-z0-9_.-]{4,50}$/',$username)) {
    fwrite(STDERR,"Cách dùng: php backend/reset_demo_password.php admin\n");
    exit(1);
}
require __DIR__.'/config/db.php';
$q=$pdo->prepare('SELECT id FROM nguoi_dung WHERE ten_dang_nhap=?');
$q->execute([$username]);
$id=$q->fetchColumn();
if(!$id) {
    fwrite(STDERR,"Không tìm thấy tài khoản.\n");
    exit(1);
}
echo "Nhập mật khẩu mới (ít nhất 8 ký tự): ";
$password=rtrim((string)fgets(STDIN),"\r\n");
if(strlen($password)<8) {
    fwrite(STDERR,"Mật khẩu quá ngắn.\n");
    exit(1);
}
$u=$pdo->prepare('UPDATE nguoi_dung SET mat_khau=? WHERE id=?');
$u->execute([password_hash($password,PASSWORD_DEFAULT),$id]);
echo "Đã cập nhật mật khẩu của $username. Không thay đổi tài khoản khác.\n";
