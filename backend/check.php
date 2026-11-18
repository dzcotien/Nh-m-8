<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli') {
    http_response_code(403);
    exit('CLI only');
}
if(!extension_loaded('pdo_mysql')) {
    fwrite(STDERR,"THIẾU pdo_mysql. Hãy chạy bằng PHP trong XAMPP.\n");
    exit(1);
}
require __DIR__.'/config/db.php';
$failed=false;
foreach(['nguoi_dung','san_pham','don_hang','chi_tiet_don_hang','danh_muc_san_pham','khuyen_mai','dia_chi_giao_hang','danh_gia'] as $t) {
    try {
        $n=(int)$pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();echo "OK $t: $n\n";} catch(Throwable $e){echo "LỖI $t: ".$e->getMessage()."\n";$failed=true;} } if(!$failed){ $s=$pdo->query("SELECT COUNT(*) san_pham FROM san_pham")->fetch(); $orders=$pdo->query("SELECT COUNT(*) so_don,COALESCE(SUM(CASE WHEN trang_thai <> 'Đã hủy' THEN tong_tien ELSE 0 END),0) gia_tri FROM don_hang")->fetch(); echo "THỐNG KÊ TỪ MYSQL: ".$s['san_pham']." sản phẩm; ".$orders['so_don']." đơn; ".$orders['gia_tri']." VND.\n"; $q=$pdo->query('SELECT ten_dang_nhap,mat_khau,vai_tro,trang_thai FROM nguoi_dung'); foreach($q as $u){if(!password_get_info($u['mat_khau'])['algo']){echo "CẢNH BÁO: hash không hợp lệ cho ".$u['ten_dang_nhap']."\n";$failed=true;}} } exit($failed?1:0);
