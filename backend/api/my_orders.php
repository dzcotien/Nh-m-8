<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/auth_guard.php';
requireActiveAccount($pdo,false);
if(empty($_SESSION['nguoi_dung_id'])) {
    http_response_code(401);
    echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Vui lòng đăng nhập.'],JSON_UNESCAPED_UNICODE);
    exit;
}
$q=$pdo->prepare('SELECT d.id,d.ma_don_hang,d.tong_tien,d.trang_thai,d.ngay_tao,a.nguoi_nhan,a.so_dien_thoai,a.dia_chi_chi_tiet,a.phuong_xa,a.quan_huyen,a.tinh_thanh FROM don_hang d LEFT JOIN dia_chi_giao_hang a ON a.id=d.id_dia_chi WHERE d.id_nguoi_dung=? ORDER BY d.id DESC');
$q->execute([$_SESSION['nguoi_dung_id']]);
$orders=$q->fetchAll();
$detail=$pdo->prepare('SELECT ct.so_luong,ct.don_gia,sp.ten_san_pham,sp.hinh_anh FROM chi_tiet_don_hang ct JOIN san_pham sp ON sp.id=ct.id_san_pham WHERE ct.id_don_hang=?');
foreach($orders as &$o) {
    $detail->execute([$o['id']]);
    $o['san_pham']=$detail->fetchAll();
}
echo json_encode(['thanh_cong'=>true,'data'=>$orders],JSON_UNESCAPED_UNICODE);
