<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/auth_guard.php';
requireActiveAccount($pdo,true);
function out(array $d,int $s=200):void {
    http_response_code($s);
    echo json_encode($d,JSON_UNESCAPED_UNICODE);
    exit;
}
if(($_SESSION['vai_tro']??'')!=='quan_tri')out(['thanh_cong'=>false,'thong_bao'=>'Bạn cần đăng nhập bằng tài khoản quản trị.'],403);
try {
    $stats=[];
    $stats['san_pham']=(int)$pdo->query('SELECT COUNT(*) FROM san_pham')->fetchColumn();
    $stats['khach_hang']=(int)$pdo->query("SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro='khach_hang'")->fetchColumn();
    $stats['don_hang']=(int)$pdo->query('SELECT COUNT(*) FROM don_hang')->fetchColumn();
    // Giá trị đơn: toàn bộ đơn chưa hủy. Doanh thu: chỉ đơn hoàn thành.
    $stats['gia_tri_don']=(float)$pdo->query("SELECT COALESCE(SUM(tong_tien),0) FROM don_hang WHERE trang_thai <> 'Đã hủy'")->fetchColumn();
    $stats['doanh_thu']=(float)$pdo->query("SELECT COALESCE(SUM(tong_tien),0) FROM don_hang WHERE trang_thai='Hoàn thành'")->fetchColumn();
    $stats['don_moi']=(int)$pdo->query("SELECT COUNT(*) FROM don_hang WHERE trang_thai IN ('Đang xử lý','Đã xác nhận')")->fetchColumn();
    $stats['sap_het_hang']=(int)$pdo->query('SELECT COUNT(*) FROM san_pham WHERE so_luong_ton<=5')->fetchColumn();
    $recent=$pdo->query('SELECT id,ma_don_hang,tong_tien,trang_thai,ngay_tao FROM don_hang ORDER BY id DESC LIMIT 8')->fetchAll();
    $low=$pdo->query('SELECT ma_san_pham,ten_san_pham,so_luong_ton FROM san_pham ORDER BY so_luong_ton ASC LIMIT 6')->fetchAll();
    out(['thanh_cong'=>true,'thong_ke'=>$stats,'don_hang_gan_day'=>$recent,'ton_kho_thap'=>$low]);
}catch(Throwable $e) {
    out(['thanh_cong'=>false,'thong_bao'=>'Không thể tải dữ liệu tổng quan.'],500);
}
